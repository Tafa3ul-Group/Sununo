import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MotionIcon } from '@/components/icons/motion-icons';

export default function Index() {
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const { isAuthenticated, userType } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Show splash animation for 3 seconds
    const timer = setTimeout(() => {
      setIsAnimationDone(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isAnimationDone) {
    return (
      <View style={styles.container}>
        <MotionIcon 
          name="splash" 
          size={300}
          loop={false}
        />
      </View>
    );
  }

  if (!userType) {
    return <Redirect href="/(auth)/choose-type" />;
  }

  if (userType === 'owner' && !isAuthenticated) {
    return <Redirect href="/(auth)/choose-type" />;
  }

  // Customers and Guests land on customer tabs
  return <Redirect href="/(tabs)/(customer)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
