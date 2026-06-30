import { Stack } from 'expo-router';
import { useDirection } from '@/i18n';

export default function AuthLayout() {
  const { direction } = useDirection();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { direction } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
