import { Stack } from 'expo-router';

export default function ImportLayout() {
  return (
    <Stack>
      <Stack.Screen name="swipe" options={{ title: 'Import contacts', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
