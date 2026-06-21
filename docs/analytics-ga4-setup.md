# Google Analytics 4 (Firebase Analytics) — دليل الإعداد

تم دمج GA4 عبر **Firebase Analytics** (`@react-native-firebase/analytics`). الكود جاهز بالكامل ويعمل
كـ **no-op آمن** حتى تكتمل الخطوات اليدوية أدناه (بفضل نمط safe dynamic require في
`services/analytics.ts`)، فلا يكسر التطبيق ولا الاختبارات قبل ربط Firebase.

## ✅ ما تم في الكود

- `services/analytics.ts` — غلاف آمن (logEvent / logScreenView / setAnalyticsUserId / setUserProps / setAnalyticsCollectionEnabled).
- `constants/analytics-events.ts` — ثوابت أسماء الأحداث والعملة (`IQD`).
- `app/_layout.tsx` — تتبع `screen_view` تلقائي عبر `usePathname`.
- `store/index.ts` — middleware يضبط `user_id` + خصائص المستخدم عند `setCredentials`، ويرسل `logout` ويمسح الهوية عند الخروج.
- نقاط الأحداث (انظر الجدول) عبر شاشات المصادقة والحجز والتقييم ولوحة المالك.
- `app.json` — إضافة `@react-native-firebase/app` + `@react-native-firebase/analytics` للـ plugins، ومسارات `googleServicesFile` لـ iOS/Android.
- `.gitignore` — تجاهل ملفّي إعداد Firebase.

## 🔧 الخطوات اليدوية المتبقية

### 1) إنشاء مشروع Firebase وربط GA4
1. افتح <https://console.firebase.google.com> وأنشئ مشروعاً جديداً (أو استخدم قائماً).
2. فعّل **Google Analytics** أثناء الإنشاء (يُنشئ خاصية GA4 تلقائياً).

### 2) تسجيل التطبيقين وتنزيل ملفات الإعداد
- **iOS**: أضف تطبيق iOS بـ bundle ID = `com.sununo.app` ← نزّل `GoogleService-Info.plist`.
- **Android**: أضف تطبيق Android بـ package = `com.sununo.app` ← نزّل `google-services.json`.
- ضع الملفين في **جذر المشروع** (بجانب `app.json`). هما متجاهلان في git مسبقاً.

### 3) بناء dev client (المكتبة native — Expo Go لن يعمل)
```bash
npx expo prebuild --clean
npx expo run:ios      # و/أو
npx expo run:android
```

### 4) البناء السحابي (EAS) — توفير الملفات كـ secrets
بما أن الملفين غير مُلتزَمين في git، ارفعهما لـ EAS كمتغيّرات بيئة من نوع file:
```bash
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
eas env:create --name GOOGLE_SERVICES_PLIST --type file --value ./GoogleService-Info.plist
```
> ملاحظة: عدّل `app.json` ليقرأ المسار من متغيّر البيئة عند البناء السحابي، أو استخدم
> `eas.json` env mapping حسب توثيق EAS. للبناء المحلي تكفي الملفات في الجذر.

### 5) الخصوصية والامتثال (إلزامي قبل النشر)
- **App Store Connect** → App Privacy: أعلن جمع *Analytics / Product Interaction*.
- **Google Play** → Data Safety: أعلن جمع بيانات التحليلات.
- **سياسة الخصوصية**: أضف ذكر استخدام Firebase/Google Analytics (مرتبط بمتطلب privacy URL المعلّق).
- **iOS ATT**: لا نجمع IDFA → لا حاجة لـ App Tracking Transparency. دالة
  `setAnalyticsCollectionEnabled` جاهزة لو رغبت بشاشة موافقة لاحقاً.

## 📊 الأحداث المُتتبَّعة

| الحدث | متى يُطلق | الملف |
|------|-----------|------|
| `screen_view` | كل تنقّل بين الشاشات | `app/_layout.tsx` |
| `login` / `sign_up` | نجاح OTP | `app/(auth)/login.tsx`، `register.tsx` |
| `logout` + مسح user_id | تسجيل الخروج | `store/index.ts` (middleware) |
| `view_item` | فتح تفاصيل شاليه | `app/(customer)/chalet-details/[id].tsx` |
| `search` + `view_search_results` | ظهور نتائج البحث | `app/(customer)/filter-results.tsx` |
| `add_to_wishlist` | إضافة للمفضلة (لا الإزالة) | `chalet-details/[id]`، `filter-results` |
| `begin_checkout` | الانتقال لتبويب الدفع | `app/(customer)/booking/complete.tsx` |
| `add_payment_info` | قبل إنشاء الحجز (غير المؤجل) | `booking/complete.tsx` |
| `purchase` | **دفع مؤكد فقط** (محفظة/فوري/نجاح polling) | `booking/complete.tsx` |
| `booking_request` | حجز مؤجل/قيد الموافقة (غير مدفوع) | `booking/complete.tsx` |
| `submit_review` | إرسال تقييم | `chalet-details/add-review/[id].tsx` |
| `create_chalet` | المالك يضيف شاليه | `app/(dashboard)/add-chalet.tsx` |

> **مهم:** `purchase` لا يُطلق عند فتح رابط الدفع، بل فقط عند تأكيد الدفع فعلياً
> (نجاح المحفظة، أو الحجز الفوري، أو نجاح polling) — لتجنّب عدّ المدفوعات الفاشلة.

## 🔍 التحقق (DebugView)
```bash
# Android
adb shell setprop debug.firebase.analytics.app com.sununo.app
# iOS: أضف وسيط التشغيل  -FIRDebugEnabled  في Xcode scheme
```
ثم راقب الأحداث لحظياً في **Firebase Console → Analytics → DebugView** و**GA4 Realtime**.
في وضع التطوير، تُطبع كل الأحداث أيضاً في الكونسول (`[Analytics] ...`).

## 🧪 الاختبارات
الاختبارات الحالية تمر دون تعديل (نمط safe-require يجعل المكتبة no-op). إن أضفت لاحقاً
اختباراً يستورد `@/store` أو `@/services/analytics`، أضف mock بسيط في
`__mocks__/@react-native-firebase/analytics.js` يصدّر دالة افتراضية ترجع كائناً بدوال فارغة.
