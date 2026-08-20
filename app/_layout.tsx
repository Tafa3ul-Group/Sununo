// @@iconify-code-gen
import { AppUpdateGate } from "@/components/app-update-gate";
import { ConfirmationDialogProvider } from "@/components/ui/confirmation-dialog";
import { PolicyConsentGate } from "@/components/user/policy-consent-gate";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDirection } from "@/i18n";
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
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { selectAccountType, switchMode } from "@/store/authSlice";
import { resolveNotificationSection } from "@/utils/notification-section";

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

// Expo Router renders this instead of the tree when a render throws. Without it
// a release build shows the bare window background — a blank, frozen screen
// with no error to trace.
export { RootErrorBoundary as ErrorBoundary } from "@/components/root-error-boundary";

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const { direction, isRTL } = useDirection();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { language, isAuthenticated, userType, token: authToken } = useSelector(
    (state: RootState) => state.auth,
  );
  const accountType = useSelector(selectAccountType);

  // Track whether we've already registered the token for this session
  const tokenRegistered = useRef(false);
  const [notificationRetryNonce, setNotificationRetryNonce] = useState(0);

  const [loaded, error] = useFonts({
    "Alexandria-Regular": require("@expo-google-fonts/alexandria/400Regular/Alexandria_400Regular.ttf"),
    "Alexandria-Medium": require("@expo-google-fonts/alexandria/500Medium/Alexandria_500Medium.ttf"),
    "Alexandria-SemiBold": require("@expo-google-fonts/alexandria/600SemiBold/Alexandria_600SemiBold.ttf"),
    "Alexandria-Bold": require("@expo-google-fonts/alexandria/700Bold/Alexandria_700Bold.ttf"),
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
  // مقسومة إلى تأثيرين متعمّدين:
  //   (أ) تسجيل المستمعين — مرة واحدة فقط طوال عمر التطبيق.
  //   (ب) الحصول على التوكن وإرساله للباكند — يعتمد على حالة المصادقة.
  // دمجهما سابقاً كان يعيد تركيب المستمعين مع كل تغيّر في المصادقة، وبما أن
  // دالة الـ cleanup تُسند بعد await فإن التنظيف كان يعمل قبل إسنادها ويُترك
  // اشتراك قديم حيّاً — فيُنفَّذ معالج الضغط على الإشعار N مرة ويُدفع نفس
  // الشاشة N مرة على الـ stack.

  // معالج الضغط يحتاج الوضع/الحساب الحاليين، لكن المستمع يُركَّب مرة واحدة —
  // لذا نحتفظ بأحدث نسخة منه في ref ويستدعيها المستمع الوحيد.
  const handleNotificationTap = useRef<(response: any) => void>(() => { });
  useEffect(() => {
    handleNotificationTap.current = (response: any) => {
      const data = response?.notification?.request?.content
        ?.data as Record<string, string> | undefined;

      if (!data) return;

      const target = resolveNotificationSection(data.role, userType, accountType);

      // Land them in the right section first, or the destination screen's
      // own guard would bounce them straight back out.
      if (target !== userType && userType !== "guest") {
        dispatch(switchMode(target));
      }

      // Deep linking بناءً على نوع الإشعار + القسم المقصود
      if (data.type === "booking" && data.id) {
        if (target === "owner") {
          router.push({ pathname: "/(dashboard)/booking-details", params: { id: data.id } });
        } else {
          router.push({ pathname: "/(tabs)/(customer)/booking-success", params: { id: data.id } });
        }
      } else if (data.type === "chalet" && data.id) {
        router.push(`/chalet-details/${data.id}`);
      } else if (data.type === "review" && data.id) {
        // اكتمل الحجز → صفحة الشاليه مع فتح ورقة التقييم تلقائياً (id = الشاليه).
        router.push(`/chalet-details/${data.id}?openReview=1`);
      } else if (data.type === "payout") {
        // Payout confirmation (نعم/لا) — same screen for customers and owners.
        if (data.id) {
          router.push(`/payout-confirm/${data.id}`);
        } else {
          router.push(target === "owner" ? "/(tabs)/(dashboard)/home" : "/(tabs)/(customer)/profile");
        }
      }
    };
  }); // بلا مصفوفة اعتماديات — يجب أن يبقى المعالج محدّثاً بعد كل رندر.

  // (أ) المستمعون — يُركَّبون مرة واحدة عند اكتمال التحميل ويُزالون عند التفكيك.
  useEffect(() => {
    if (!loaded) return;

    let disposed = false;
    let removeListeners: (() => void) | undefined;

    (async () => {
      try {
        const { addNotificationListeners } = await import("@/services/notifications");

        const remove = addNotificationListeners(
          // إشعار وصل والتطبيق مفتوح
          (notification) => {
            if (__DEV__) {
              console.log(
                "[Notifications] وصل إشعار:",
                notification?.request?.content?.title,
              );
            }
          },
          // المستخدم ضغط على الإشعار
          (response) => handleNotificationTap.current?.(response),
        );

        // قد يكون التأثير فُكِّك أثناء انتظار الـ import — نزيل فوراً بدل ترك
        // اشتراك يتيم لا يملك أحد إزالته.
        if (disposed) {
          remove();
          return;
        }
        removeListeners = remove;
      } catch (error) {
        console.warn("[Notifications] فشل تركيب مستمعي الإشعارات:", error);
      }
    })();

    return () => {
      disposed = true;
      removeListeners?.();
    };
  }, [loaded]);

  // (ب) الحصول على التوكن وتسجيله في الباكند عند تغيّر جلسة المستخدم.
  useEffect(() => {
    if (!loaded) return;

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const {
          registerForPushNotificationsAsync,
          registerTokenWithBackend } = await import("@/services/notifications");

        // 1. الحصول على التوكن
        const token = await registerForPushNotificationsAsync();
        if (cancelled || !token) return;

        // 2. إظهار التوكن للمطوّر في التيرمنل فقط (وضع التطوير فقط)
        if (__DEV__) {
          console.log("[Layout] Expo Push Token:", token);
        }

        // 3. تسجيل التوكن في الباكند
        const baseUrl =
          process.env.EXPO_PUBLIC_API_URL ?? "https://api.sununo.app";

        if (authToken && !tokenRegistered.current) {
          const registered = await registerTokenWithBackend(token, authToken, baseUrl);
          if (cancelled) return;
          tokenRegistered.current = registered;
          if (!registered) {
            retryTimeout = setTimeout(() => {
              setNotificationRetryNonce((value) => value + 1);
            }, 15000);
          }
        } else if (!authToken && __DEV__) {
          console.warn("[Layout] لا يوجد authToken — المستخدم غير مسجّل دخول بعد");
        }
      } catch (error) {
        console.warn("[Notifications] فشل إعداد الإشعارات:", error);
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [loaded, authToken, notificationRetryNonce]);

  // ── إلغاء تسجيل التوكن عند تسجيل الخروج ─────────────────────────────────
  // الجهاز يحتفظ بنفس Expo push token عبر الحسابات، والباكند يضيف التوكن ولا
  // يحذفه — فلو لم نطلب حذفه لبقيت إشعارات المستخدم السابق (باسم النزيل
  // وتفاصيل الحجز) تصل لمن يسجّل الدخول بعده على نفس الهاتف.
  // نحتفظ بآخر authToken معروف لأن الخروج يمسحه من الـ store قبل أن يعمل هذا
  // التأثير، والطلب يحتاج جلسة صاحبه لا الجلسة الجديدة.
  const lastAuthTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (authToken) lastAuthTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    if (isAuthenticated) return;

    tokenRegistered.current = false;

    const previousAuthToken = lastAuthTokenRef.current;
    if (!previousAuthToken) return; // لم تكن هناك جلسة أصلاً (ضيف/أول تشغيل)
    lastAuthTokenRef.current = null;

    (async () => {
      try {
        const {
          getLastIssuedPushToken,
          unregisterTokenWithBackend } = await import("@/services/notifications");

        const pushToken = getLastIssuedPushToken();
        if (!pushToken) return;

        const baseUrl =
          process.env.EXPO_PUBLIC_API_URL ?? "https://api.sununo.app";
        await unregisterTokenWithBackend(pushToken, previousAuthToken, baseUrl);
      } catch (error) {
        if (__DEV__) {
          console.warn("[Notifications] فشل إلغاء تسجيل التوكن:", error);
        }
      }
    })();
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
      <Stack
        screenOptions={{
          // Native headers render OUTSIDE the direction container — never show
          // them; screens draw their own headers.
          headerShown: false,
          // No `direction` and no animation/gesture mirroring: under native RTL
          // (i18n/index.ts) the OS mirrors the push transition AND the
          // back-swipe edge itself. Re-adding either here double-flips them.
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(dashboard)" />
        <Stack.Screen name="payout-confirm/[id]" />
      </Stack>
      <StatusBar style="auto" />
      {/* App-wide version gate: shows the update sheet when out of date. */}
      <AppUpdateGate />
      {/* App-wide consent gate: blocks the app when a policy the user agreed to
          has been updated (or was never accepted) until they accept it. */}
      <PolicyConsentGate />
    </ThemeProvider>
  );
}

// No `direction` style here any more. Under native RTL (i18n/index.ts) the OS
// mirrors the entire tree — including the bottom-sheet host, Toast, native
// headers and Alert, none of which the old container-`direction` model could
// reach. Setting it here would mirror an already-mirrored tree back to LTR.
function AppProviders() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ConfirmationDialogProvider>
          <RootLayoutNav />
          <Toast config={toastConfig} topOffset={60} />
        </ConfirmationDialogProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppProviders />
      </PersistGate>
    </Provider>
  );
}
