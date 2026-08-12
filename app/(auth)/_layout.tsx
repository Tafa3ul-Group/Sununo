import { Stack } from 'expo-router';
import { useDirection } from '@/i18n';

export default function AuthLayout() {
  const { direction, isRTL } = useDirection();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
