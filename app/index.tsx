import { MotionIcon } from '@/components/icons/motion-icons';
import { RootState } from '@/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const { isAuthenticated, userType } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAnimationDone) {
      let targetPath: any;

      if (!isAuthenticated && userType !== 'guest') {
        targetPath = "/(auth)/login";
      } else if (userType === 'owner') {
        targetPath = "/(tabs)/(dashboard)/home";
      } else {
        targetPath = "/(tabs)/(customer)";
      }

      const navTimer = setTimeout(() => {
        router.replace(targetPath);
      }, 100);

      return () => clearTimeout(navTimer);
    }
  }, [isAnimationDone, isAuthenticated, userType]);

  return (
    <View style={styles.container}>
      <MotionIcon
        name="splash"
        size={Math.max(width, height)}
        loop={false}
        autoPlay={true}
        resizeMode="cover"
        onAnimationFinish={() => setIsAnimationDone(true)}
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: width,
    height: height,
  }
});
