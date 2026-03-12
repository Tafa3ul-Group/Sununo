import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function Index() {
  const { isAuthenticated, userType } = useSelector((state: RootState) => state.auth);

  if (!userType) {
    return <Redirect href="/(auth)/choose-type" />;
  }

  if (userType === 'owner' && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Customers and Guests land on (tabs) directly
  return <Redirect href="/(tabs)" />;
}
