import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/types/database';

export function usePeople(userId: string | undefined) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error: e } = await supabase
        .from('person')
        .select('*')
        .eq('user_id', userId)
        .order('next_reminder_at', { ascending: true });
      if (e) {
        setError(e);
        setPeople([]);
      } else {
        setPeople((data as Person[]) ?? []);
      }
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel('person-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'person', filter: `user_id=eq.${userId}` },
        () => {
          fetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { people, loading, error };
}
