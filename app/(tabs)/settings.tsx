import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { registerForPushNotificationsAsync, savePushToken } from '@/lib/push';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const [pushLoading, setPushLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token && session?.user?.id) {
        await savePushToken(session.user.id, token);
        Alert.alert('Done', 'Push reminders are enabled. You\'ll get notified when it\'s time to check in.');
        return;
      }
      // No token: either no permission or something failed. Always offer Settings.
      const appName = Constants.appOwnership === 'expo' ? 'Expo Go' : 'Forget Me Not';
      Alert.alert(
        'Enable notifications in Settings',
        `You didn't get an Allow prompt because the system only shows it once. To get reminder pushes:\n\n1. Tap "Open Settings" below.\n2. Find "${appName}" in the list.\n3. Turn on Notifications.\n\nThen come back and tap "Enable push reminders" again.`,
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong. Try opening Settings and enabling notifications for this app.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        await signOut();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        onPress={handleEnablePush}
        disabled={pushLoading}
      >
        <Text style={styles.primaryButtonText}>
          {pushLoading ? '...' : 'Enable push reminders'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.hint, { color: colors.tabIconDefault }]}>
        Tap to allow notifications so we can remind you to check in.
      </Text>
      <TouchableOpacity
        style={[styles.button, { borderColor: colors.tint }]}
        onPress={handleSignOut}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    marginBottom: 24,
  },
  button: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
