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

// Alexandria fonts will be loaded directly in useFonts below

// @ts-ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.style = { 
  fontFamily: 'Alexandria-Regular',
  includeFontPadding: false,
  textAlignVertical: 'center',
};

// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.style = { 
  fontFamily: 'Alexandria-Regular',
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
    'Alexandria-Bold': require('@expo-google-fonts/alexandria/700Bold/Alexandria_700Bold.ttf'),
    'Alexandria-SemiBold': require('@expo-google-fonts/alexandria/600SemiBold/Alexandria_600SemiBold.ttf'),
    'Alexandria-Regular': require('@expo-google-fonts/alexandria/400Regular/Alexandria_400Regular.ttf'),
    'Alexandria-Medium': require('@expo-google-fonts/alexandria/500Medium/Alexandria_500Medium.ttf'),
    'Alexandria-Black': require('@expo-google-fonts/alexandria/900Black/Alexandria_900Black.ttf'),
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
