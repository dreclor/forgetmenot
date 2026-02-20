import { Stack } from 'expo-router';

export default function PersonLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Person', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
