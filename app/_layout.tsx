// @@iconify-code-gen
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/i18n";
import { persistor, RootState, store } from "@/store";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// @ts-ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.style = {
  fontFamily: "Alexandria-Regular",
  includeFontPadding: false,
  textAlignVertical: "center",
};

// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.style = {
  fontFamily: "Alexandria-Regular",
  includeFontPadding: false,
  textAlignVertical: "center",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const segments = useSegments();
  const router = useRouter();
  const { language, isAuthenticated, userType, token: authToken } = useSelector(
    (state: RootState) => state.auth,
  );

  // Track whether we've already registered the token for this session
  const tokenRegistered = useRef(false);
  const [notificationRetryNonce, setNotificationRetryNonce] = useState(0);

  const [loaded, error] = useFonts({
    "Alexandria-Bold": require("@expo-google-fonts/alexandria/700Bold/Alexandria_700Bold.ttf"),
    "Alexandria-SemiBold": require("@expo-google-fonts/alexandria/600SemiBold/Alexandria_600SemiBold.ttf"),
    "Alexandria-Regular": require("@expo-google-fonts/alexandria/400Regular/Alexandria_400Regular.ttf"),
    "Alexandria-Medium": require("@expo-google-fonts/alexandria/500Medium/Alexandria_500Medium.ttf"),
    "Alexandria-Black": require("@expo-google-fonts/alexandria/900Black/Alexandria_900Black.ttf"),
  });

  // ── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    const isIndex =
      (segments as any).length === 0 ||
      (segments.length === 1 && segments[0] === "index");
    if (!isAuthenticated && userType !== "guest" && !inAuthGroup && !isIndex) {
      router.replace("/");
    }
  }, [isAuthenticated, userType, segments, loaded, router]);

  // ── Splash Screen ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // ── Language Sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // ── Push Notifications ────────────────────────────────────────────────────
  // يعمل عند تحميل الخطوط + عند تغيّر حالة المصادقة
  useEffect(() => {
    if (!loaded) return;

    let cleanup: (() => void) | undefined;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const {
          registerForPushNotificationsAsync,
          registerTokenWithBackend,
          addNotificationListeners,
        } = await import("@/services/notifications");

        // 1. الحصول على التوكن
        const token = await registerForPushNotificationsAsync();

        if (token) {
          // 2. إظهار التوكن للمطوّر في التيرمنل فقط
          console.log("[Layout] Expo Push Token:", token);

          // 3. تسجيل التوكن في الباكند
          const baseUrl =
            process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.167:3010";

          if (authToken && !tokenRegistered.current) {
            const registered = await registerTokenWithBackend(token, authToken, baseUrl);
            tokenRegistered.current = registered;
            if (!registered) {
              retryTimeout = setTimeout(() => {
                setNotificationRetryNonce((value) => value + 1);
              }, 15000);
            }
          } else if (!authToken) {
            console.warn("[Layout] لا يوجد authToken — المستخدم غير مسجّل دخول بعد");
          }
        }

        // 4. الاستماع للإشعارات الواردة
        cleanup = addNotificationListeners(
          // إشعار وصل والتطبيق مفتوح
          (notification) => {
            console.log(
              "[Notifications] وصل إشعار:",
              notification?.request?.content?.title,
            );
          },
          // المستخدم ضغط على الإشعار
          (response) => {
            const data = response?.notification?.request?.content
              ?.data as Record<string, string> | undefined;

            if (!data) return;

            // Deep linking بناءً على نوع الإشعار
            if (data.type === "booking" && data.id) {
              router.push(`/(customer)/booking/complete?id=${data.id}`);
            } else if (data.type === "chalet" && data.id) {
              router.push(`/chalet-details/${data.id}`);
            } else if (data.type === "payout") {
              router.push("/(tabs)/(dashboard)/home");
            }
          },
        );
      } catch (error) {
        console.warn("[Notifications] فشل إعداد الإشعارات:", error);
      }
    })();

    return () => {
      cleanup?.();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [loaded, isAuthenticated, authToken, notificationRetryNonce, router]);

  // ── إعادة تسجيل التوكن عند تسجيل الدخول ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      tokenRegistered.current = false;
    }
  }, [isAuthenticated]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
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
