import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PersonRow {
  id: string;
  user_id: string;
  name: string;
}

Deno.serve(async () => {
  const log: string[] = [];
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();
  log.push(`running at ${now}`);

  const { data: people, error: peopleError } = await supabase
    .from('person')
    .select('id, user_id, name')
    .lte('next_reminder_at', now);

  if (peopleError) {
    log.push(`person query error: ${peopleError.message}`);
    return new Response(JSON.stringify({ error: peopleError.message, log }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const duePeople = (people ?? []) as PersonRow[];
  log.push(`found ${duePeople.length} people due`);

  if (!duePeople.length) {
    return new Response(JSON.stringify({ sent: 0, dueCount: 0, log }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userIds = [...new Set(duePeople.map((p) => p.user_id))];
  const { data: tokens, error: tokensError } = await supabase
    .from('user_push_tokens')
    .select('user_id, token')
    .in('user_id', userIds);

  if (tokensError) {
    log.push(`tokens query error: ${tokensError.message}`);
    return new Response(JSON.stringify({ error: tokensError.message, log }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tokenByUser = new Map<string, string[]>();
  for (const row of tokens ?? []) {
    const arr = tokenByUser.get(row.user_id) ?? [];
    arr.push(row.token);
    tokenByUser.set(row.user_id, arr);
  }
  const totalTokens = (tokens ?? []).length;
  log.push(`found ${totalTokens} push token(s) for ${userIds.length} user(s)`);

  let sent = 0;
  for (const person of duePeople) {
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
      if (res.ok) {
        sent++;
      } else {
        const text = await res.text();
        log.push(`Expo push failed ${res.status}: ${text.slice(0, 200)}`);
      }
    }
  }

  log.push(`sent ${sent} notification(s)`);
  return new Response(JSON.stringify({ sent, dueCount: duePeople.length, log }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
