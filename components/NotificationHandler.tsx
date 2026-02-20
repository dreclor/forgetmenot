import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { addNotificationResponseListener, registerForPushNotificationsAsync, savePushToken } from '@/lib/push';

async function handleNotificationPersonId(personId: string): Promise<void> {
  const { data: person } = await supabase
    .from('person')
    .select('phone')
    .eq('id', personId)
    .single();
  if (person?.phone) {
    const url = `sms:${String(person.phone).replace(/\s/g, '')}`;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
  }
}

export function NotificationHandler() {
  const router = useRouter();
  const { session } = useAuth();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && !cancelled) await savePushToken(session.user.id, token);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) return;

    const handle = async (personId: string | null) => {
      if (!personId) return;
      await handleNotificationPersonId(personId);
      routerRef.current.push(`/person/${personId}`);
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification.request.content.data?.person_id) {
        handle(response.notification.request.content.data.person_id as string);
      }
    });

    const remove = addNotificationResponseListener(handle);
    return remove;
  }, [session?.user?.id]);

  return null;
}
