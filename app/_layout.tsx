// @@iconify-code-gen
import { persistor, store } from '@/store';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import '@/i18n';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// @ts-ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.style = { 
  fontFamily: 'Tajawal-Regular',
  includeFontPadding: false,
  textAlignVertical: 'center',
};

// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.style = { 
  fontFamily: 'Tajawal-Regular',
  includeFontPadding: false,
  textAlignVertical: 'center',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const segments = useSegments();
  const router = useRouter();
  const { language, isAuthenticated, userType } = useSelector((state: RootState) => state.auth);

  const [loaded, error] = useFonts({
    'Tajawal-Bold': require('../assets/fonts/Tajawal/Tajawal-Bold.ttf'),
    'Tajawal-SemiBold': require('../assets/fonts/Tajawal/Tajawal-Bold.ttf'),
    'Tajawal-Regular': require('../assets/fonts/Tajawal/Tajawal-Regular.ttf'),
    'Tajawal-Medium': require('../assets/fonts/Tajawal/Tajawal-Medium.ttf'),
    'Tajawal-Black': require('../assets/fonts/Tajawal/Tajawal-Black.ttf'),
    'Tajawal-Light': require('../assets/fonts/Tajawal/Tajawal-Light.ttf'),
  });

  // Global Auth Guard: Redirect to index if auth is lost
  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isIndex = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!isAuthenticated && userType !== 'guest' && !inAuthGroup && !isIndex) {
      router.replace('/');
    }
  }, [isAuthenticated, userType, segments, loaded]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Sync language with persisted Redux state
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <RootLayoutNav />
            <Toast />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
