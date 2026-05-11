/**
 * Expo Push Notifications Service
 *
 * ── الاستخدام ──────────────────────────────────────────────────────────────
 * 1. ثبّت المكتبة:  npx expo install expo-notifications
 * 2. شغّل Dev Build: npx expo run:ios  أو  npx expo run:android
 * 3. كل شيء يعمل تلقائياً — لا تعديلات إضافية مطلوبة
 * ──────────────────────────────────────────────────────────────────────────
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

// ── Safe dynamic require ──────────────────────────────────────────────────────
// يمنع الكراش إذا لم تُثبَّت expo-notifications بعد
let Notifications: typeof import("expo-notifications") | null = null;
try {
  Notifications = require("expo-notifications");
} catch {
  console.warn(
    "[Notifications] expo-notifications غير مثبّت.\n" +
    "شغّل: npx expo install expo-notifications",
  );
}

// ── إعداد سلوك الإشعارات في المقدمة ─────────────────────────────────────────
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ── قناة Android ─────────────────────────────────────────────────────────────
export async function setupAndroidChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "الإشعارات",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#035DF9",
    sound: "default",
  });
}

// ── طلب الإذن والحصول على التوكن ─────────────────────────────────────────────
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications) return null;

  // إعداد قناة Android
  await setupAndroidChannel();

  // التحقق من الإذن الحالي
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // طلب الإذن إذا لم يُمنح بعد
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] رُفض إذن الإشعارات");
    return null;
  }

  // الحصول على Expo Push Token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    console.log("[Notifications] Token:", token);
    return token;
  } catch (e: any) {
    console.warn("[Notifications] فشل الحصول على التوكن:", e?.message);
    return null;
  }
}

// ── إرسال التوكن للباكند ──────────────────────────────────────────────────────
export async function registerTokenWithBackend(
  token: string,
  authToken: string,
  baseUrl: string,
): Promise<void> {
  try {
    const url = `${baseUrl}/api/v1/notifications/firebase-token`;
    console.log("[Notifications] Registering token at:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    const body = await res.text();

    if (res.ok) {
      console.log("[Notifications] ✓ Token مسجّل في الباكند");
    } else {
      console.warn(
        `[Notifications] فشل تسجيل Token — status: ${res.status}`,
        body,
      );
    }
  } catch (e: any) {
    console.warn("[Notifications] خطأ في تسجيل Token:", e?.message ?? e);
  }
}

// ── الاستماع للإشعارات ────────────────────────────────────────────────────────
/**
 * يُستدعى مرة واحدة عند بدء التطبيق.
 * يرجع دالة cleanup لإزالة المستمعين.
 */
export function addNotificationListeners(
  onReceive?: (notification: any) => void,
  onResponse?: (response: any) => void,
): () => void {
  if (!Notifications) return () => {};

  const receivedSub = Notifications.addNotificationReceivedListener(
    (n) => onReceive?.(n),
  );

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (r) => onResponse?.(r),
  );

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
