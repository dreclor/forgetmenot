import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Linking } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;
  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    })
  ).data;
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  return token;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  await supabase.from('user_push_tokens').upsert(
    { user_id: userId, token },
    { onConflict: 'user_id,token' }
  );
}

export function addNotificationResponseListener(
  handler: (personId: string | null) => void | Promise<void>
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const personId = response.notification.request.content.data?.person_id as string | undefined;
    handler(personId ?? null);
  });
  return () => sub.remove();
}

