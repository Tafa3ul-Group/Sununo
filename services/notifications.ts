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

import i18n from "@/i18n";

// ── Safe dynamic require ──────────────────────────────────────────────────────
// يمنع الكراش إذا لم تُثبَّت expo-notifications بعد
let Notifications: typeof import("expo-notifications") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
// اسم القناة هو ما يظهر في إعدادات النظام (Settings > Apps > Sununo >
// Notifications)، لذلك يجب أن يتبع لغة التطبيق لا أن يكون عربياً دائماً.
// المفاتيح غير موجودة في i18n/*.json بعد، لذا نمرّر defaultValue حتى يعمل الآن
// وينتقل تلقائياً للترجمة إذا أُضيف المفتاح لاحقاً.
const CHANNEL_NAME_FALLBACK: Record<string, string> = {
  ar: "الإشعارات",
  en: "Notifications",
};

const resolveChannelName = (): string => {
  const lang = (i18n.language || "ar").split("-")[0];
  return i18n.t("notifications.channelName", {
    defaultValue: CHANNEL_NAME_FALLBACK[lang] ?? CHANNEL_NAME_FALLBACK.ar,
  });
};

export async function setupAndroidChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: resolveChannelName(),
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#035DF9",
    sound: "default",
  });
}

// أندرويد يقرأ اسم القناة مرة واحدة عند إنشائها، لكنه يحدّثه إذا أُعيد استدعاء
// setNotificationChannelAsync بنفس الـ id — فنعيد الكتابة عند تغيّر اللغة حتى
// يتبع اسم القناة في إعدادات النظام لغة التطبيق.
i18n.on("languageChanged", () => {
  void setupAndroidChannel().catch(() => {
    // القناة ستُحدَّث في التشغيل التالي — لا داعي لإزعاج المستخدم.
  });
});

// ── طلب الإذن والحصول على التوكن ─────────────────────────────────────────────
// آخر توكن حصلنا عليه لهذا الجهاز. نحتفظ به حتى يستطيع مسار تسجيل الخروج
// إبلاغ الباكند بحذفه دون إعادة تشغيل مسار الأذونات كاملاً.
let lastIssuedToken: string | null = null;

/** آخر Expo push token صدر لهذا الجهاز في هذه الجلسة (null إن لم يصدر بعد). */
export function getLastIssuedPushToken(): string | null {
  return lastIssuedToken;
}

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

    // التوكن نفسه صلاحية إرسال: من يملكه يستطيع دفع إشعارات لهذا الجهاز عبر
    // exp.host بلا أي اعتماد آخر — لذلك لا يُطبع إلا في وضع التطوير.
    if (__DEV__) {
      console.log("[Notifications] Token:", token);
    }
    lastIssuedToken = token;
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
): Promise<boolean> {
  try {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${normalizedBaseUrl}/api/v1/notifications/expo-token`;
    if (__DEV__) {
      console.log("[Notifications] Registering token at:", url);
    }

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
      if (__DEV__) {
        console.log("[Notifications] ✓ Token مسجّل في الباكند");
      }
      return true;
    } else {
      console.warn(
        `[Notifications] فشل تسجيل Token — status: ${res.status}`,
        body,
      );
      return false;
    }
  } catch (e: any) {
    console.warn("[Notifications] خطأ في تسجيل Token:", e?.message ?? e);
    return false;
  }
}

// ── حذف التوكن من الباكند عند تسجيل الخروج ───────────────────────────────────
/**
 * الجهاز يحتفظ بنفس Expo push token عبر الحسابات، والباكند يضيف التوكن إلى
 * `expoTokens` الخاصة بالمستخدم ولا يحذفه أبداً. فإذا خرج المستخدم (أ) ودخل
 * المستخدم (ب) على نفس الهاتف، تبقى إشعارات (أ) — باسم النزيل وتفاصيل الحجز —
 * تصل لجهاز يحمله (ب). لذلك نطلب من الباكند نسيان التوكن قبل انتهاء الجلسة.
 *
 * ملاحظة: مسار DELETE غير موجود في الباكند بعد
 * (sununo-api/src/notifications/controllers/notifications.controller.ts يوفّر
 * POST/GET فقط)، لذلك يعامَل 404/405 كفشل صامت — الاستدعاء آمن اليوم ويبدأ
 * بالعمل فور نشر المسار دون أي تغيير في التطبيق.
 *
 * يجب استدعاؤها بـ authToken الخاص بالجلسة التي على وشك الانتهاء، أي **قبل**
 * مسح بيانات الاعتماد من الـ store.
 */
export async function unregisterTokenWithBackend(
  token: string,
  authToken: string,
  baseUrl: string,
): Promise<boolean> {
  try {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${normalizedBaseUrl}/api/v1/notifications/expo-token`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    if (res.ok) {
      if (__DEV__) {
        console.log("[Notifications] ✓ Token محذوف من الباكند");
      }
      return true;
    }

    if (__DEV__) {
      console.warn(
        `[Notifications] فشل حذف Token — status: ${res.status}`,
        await res.text(),
      );
    }
    return false;
  } catch (e: any) {
    if (__DEV__) {
      console.warn("[Notifications] خطأ في حذف Token:", e?.message ?? e);
    }
    return false;
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
