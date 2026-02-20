import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PersonRow {
  id: string;
  user_id: string;
  name: string;
}

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();

  const { data: people, error: peopleError } = await supabase
    .from('person')
    .select('id, user_id, name')
    .lte('next_reminder_at', now);

  if (peopleError) {
    return new Response(JSON.stringify({ error: peopleError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!people?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: tokens } = await supabase
    .from('user_push_tokens')
    .select('user_id, token')
    .in('user_id', [...new Set((people as PersonRow[]).map((p) => p.user_id))]);

  const tokenByUser = new Map<string, string[]>();
  for (const row of tokens ?? []) {
    const arr = tokenByUser.get(row.user_id) ?? [];
    arr.push(row.token);
    tokenByUser.set(row.user_id, arr);
  }

  let sent = 0;
  for (const person of people as PersonRow[]) {
    const userTokens = tokenByUser.get(person.user_id) ?? [];
    for (const token of userTokens) {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title: 'Forget Me Not',
          body: `Time to check in with ${person.name}`,
          data: { person_id: person.id },
          sound: 'default',
        }),
      });
      if (res.ok) sent++;
    }
  }

  return new Response(JSON.stringify({ sent, dueCount: people.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
