#!/usr/bin/env node
/**
 * تشخيص إشعارات Expo Push — يتجاوز السيرفر بالكامل
 * ──────────────────────────────────────────────────────────────────────────
 * يرسل إشعاراً مباشرة من Expo إلى جهازك، ثم يقرأ الإيصال (receipt) ليكشف
 * السبب الحقيقي لعدم الوصول (FCM/APNs/توكن غير صالح…).
 *
 * الخطوات:
 *   1. شغّل التطبيق على جهاز حقيقي وسجّل الدخول.
 *   2. انسخ التوكن من سجل الـ Metro/console:
 *        [Notifications] Token: ExponentPushToken[xxxxxxxx]
 *   3. شغّل:
 *        node scripts/test-expo-push.mjs "ExponentPushToken[xxxxxxxx]"
 *
 * يحتاج Node 18+ (يستخدم fetch المدمج).
 * ──────────────────────────────────────────────────────────────────────────
 */

const token = process.argv[2];

if (!token) {
  console.error("\n❌ مرّر توكن الجهاز:\n   node scripts/test-expo-push.mjs \"ExponentPushToken[...]\"\n");
  process.exit(1);
}

if (!/^Expo(nent)?PushToken\[.+\]$/.test(token)) {
  console.error(`\n❌ التوكن لا يبدو صالحاً: ${token}\n   يجب أن يكون بصيغة ExponentPushToken[...]\n`);
  process.exit(1);
}

const SEND_URL = "https://exp.host/--/api/v2/push/send";
const RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts";

const message = {
  to: token,
  title: "تجربة سنونو 🔔",
  body: "إذا وصلك هذا الإشعار فإن إعدادات Expo سليمة.",
  sound: "default",
  channelId: "default",
  priority: "high",
  data: { type: "test" },
};

console.log("\n→ إرسال إشعار تجريبي مباشرة عبر Expo…\n");

const sendRes = await fetch(SEND_URL, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(message),
});

const sendBody = await sendRes.json();
console.log("ردّ الإرسال (ticket):");
console.log(JSON.stringify(sendBody, null, 2));

const ticket = sendBody?.data;
if (!ticket || ticket.status !== "ok" || !ticket.id) {
  console.error(
    "\n❌ فشل الإرسال عند مرحلة الـ ticket. السبب أعلاه (مثلاً DeviceNotRegistered = التوكن قديم/غير مسجّل).\n",
  );
  process.exit(1);
}

console.log(`\n✓ تم قبول الإشعار (ticket id: ${ticket.id}). بانتظار الإيصال (receipt)…`);

// الإيصال يحتاج بضع ثوانٍ حتى يجهز
await new Promise((r) => setTimeout(r, 4000));

const receiptRes = await fetch(RECEIPT_URL, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ ids: [ticket.id] }),
});

const receiptBody = await receiptRes.json();
console.log("\nردّ الإيصال (receipt):");
console.log(JSON.stringify(receiptBody, null, 2));

const receipt = receiptBody?.data?.[ticket.id];
console.log("\n──────────────── الخلاصة ────────────────");
if (!receipt) {
  console.log("⏳ الإيصال غير جاهز بعد — أعد المحاولة بعد قليل، لكن الـ ticket نجح.");
} else if (receipt.status === "ok") {
  console.log("✅ سلّمت Expo الإشعار إلى FCM/APNs بنجاح.");
  console.log("   إن لم يظهر على الجهاز: تحقق من أذونات الإشعارات في إعدادات الجهاز،");
  console.log("   أو أنّ التطبيق في المقدمة (foreground handler).");
  console.log("   وبما أن Expo سليمة → المشكلة في السيرفر (الطابور/حفظ التوكن) وليست في الـ credentials.");
} else {
  console.log(`❌ خطأ في التسليم: ${receipt.status}`);
  console.log(`   التفاصيل: ${receipt.message || JSON.stringify(receipt.details)}`);
  const err = receipt.details?.error;
  if (err === "DeviceNotRegistered") {
    console.log("   → التوكن غير صالح/قديم. أعد تثبيت التطبيق واحصل على توكن جديد.");
  } else if (err === "MismatchSenderId") {
    console.log("   → مشكلة FCM: حزمة google-services.json لا تطابق مشروع Firebase المرفوع في Expo credentials.");
  } else if (err === "InvalidCredentials") {
    console.log("   → بيانات اعتماد الدفع غير مهيّأة في Expo: FCM V1 (Android) أو مفتاح APNs (iOS).");
    console.log("   → نفّذ: eas credentials  ثم أضف FCM V1 service account و/أو APNs key.");
  }
}
console.log("─────────────────────────────────────────\n");
