// @@iconify-code-gen
import { ConfirmationDialogProvider } from "@/components/ui/confirmation-dialog";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { persistor, RootState, store } from "@/store";
import { logScreenView } from "@/services/analytics";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/toast-config";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// @ts-ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.style = {
  fontFamily: "Alexandria-Medium",
  includeFontPadding: false,
  textAlignVertical: "center",
};

// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.style = {
  fontFamily: "Alexandria-Medium",
  includeFontPadding: false,
  textAlignVertical: "center",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const { language, isAuthenticated, userType, token: authToken } = useSelector(
    (state: RootState) => state.auth,
  );

  // Track whether we've already registered the token for this session
  const tokenRegistered = useRef(false);
  const [notificationRetryNonce, setNotificationRetryNonce] = useState(0);

  const [loaded, error] = useFonts({
    "Alexandria-Medium": require("@expo-google-fonts/alexandria/500Medium/Alexandria_500Medium.ttf")
  });

  // ── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    const isIndex = (segments as string[]).length === 0;
    if (!isAuthenticated && userType !== "guest" && !inAuthGroup && !isIndex) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, userType, segments, loaded, router]);

  // ── Splash Screen ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // ── Analytics: auto screen_view ───────────────────────────────────────────
  // screen_class is the route group (auth / customer / dashboard / tabs) so
  // screens group sensibly in GA4; screen_name is the full pathname.
  useEffect(() => {
    if (!loaded || !pathname) return;
    const group = segments[0]?.replace(/[()]/g, "") || "root";
    logScreenView(pathname, group);
  }, [pathname, loaded, segments]);



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
          addNotificationListeners } = await import("@/services/notifications");

        // 1. الحصول على التوكن
        const token = await registerForPushNotificationsAsync();

        if (token) {
          // 2. إظهار التوكن للمطوّر في التيرمنل فقط (وضع التطوير فقط)
          if (__DEV__) {
            console.log("[Layout] Expo Push Token:", token);
          }

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

            // Deep linking بناءً على نوع الإشعار + نوع المستخدم
            if (data.type === "booking" && data.id) {
              if (userType === "owner") {
                router.push({ pathname: "/(dashboard)/booking-details", params: { id: data.id } });
              } else {
                router.push({ pathname: "/(tabs)/(customer)/booking-success", params: { id: data.id } });
              }
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
  }, [loaded, isAuthenticated, userType, authToken, notificationRetryNonce, router]);

  // ── إعادة تسجيل التوكن عند تسجيل الدخول ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      tokenRegistered.current = false;
    }
  }, [isAuthenticated]);

  if (!loaded && !error) return null;

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#FFFFFF",
      card: "#FFFFFF",
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
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
            <ConfirmationDialogProvider>
              <RootLayoutNav />
              <Toast config={toastConfig} topOffset={60} />
            </ConfirmationDialogProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
