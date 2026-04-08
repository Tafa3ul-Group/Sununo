import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function Index() {
  const { isAuthenticated, userType } = useSelector((state: RootState) => state.auth);

  if (!userType) {
    return <Redirect href="/(auth)/choose-type" />;
  }

  if (userType === 'owner' && !isAuthenticated) {
    return <Redirect href="/(auth)/choose-type" />;
  }

  // Customers and Guests land on customer tabs
  return <Redirect href="/(tabs)/(customer)" />;
}
