# قواعد الاتجاه (RTL/LTR) في مشروع Sununo

## المشكلة الجذرية

التطبيق يعمل على iOS/Android مع `I18nManager.isRTL = true` (مثبّت عند أول تشغيل بالعربية).
عند تغيير اللغة للإنجليزية **بدون إعادة تشغيل**، يبقى `I18nManager.isRTL = true` لكن `i18n.language = "en"`.
هذا يسبب تعارضاً إذا استخدمنا `flexDirection: "row"` لأن React Native يعكسه تلقائياً.

---

## القاعدة الذهبية

```ts
// ✅ الطريقة الصحيحة — دائماً داخل الـ component
const { i18n } = useTranslation();
const isRTL = i18n.language === "ar";
```

```ts
// ❌ خاطئ — قيمة ثابتة لا تتغير
import { isRTL } from "@/i18n"; // هذه لا تتحدث عند تغيير اللغة
```

---

## قواعد الـ flexDirection

### المشكلة
React Native يعكس `flexDirection: "row"` تلقائياً عندما `I18nManager.isRTL = true`.
إذا غيّرنا اللغة للإنجليزية بدون reload، `I18nManager.isRTL` لا يزال `true`،
فيصبح `"row"` معكوساً مرتين.

### الحل — استخدم `direction` بدلاً من `flexDirection`

```tsx
// ✅ صحيح — يتجاوز I18nManager تماماً
<View style={{ flexDirection: 'row', direction: isRTL ? 'rtl' : 'ltr' }}>
```

```tsx
// ❌ خاطئ — يتأثر بـ I18nManager.isRTL
<View style={{ flexDirection: isRTL ? 'row' : 'row-reverse' }}>
```

---

## قواعد النصوص

```tsx
// ✅ صحيح
<Text style={{ textAlign: isRTL ? 'right' : 'left' }}>

// ✅ صحيح — للـ View الحاوي
<View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
```

---

## قواعد كل صفحة

### صفحة تفاصيل الشاليه (`chalet-details/[id].tsx`)

| العنصر | عربي | إنجليزي |
|--------|------|---------|
| اسم الشاليه | يمين | يسار |
| التقييم (نجمة + رقم) | يسار | يمين |
| الموقع | يمين | يسار |
| الفوتر: السعر + الشفت | يمين | يسار |
| الفوتر: زر الحجز | يسار | يمين |
| زر الرجوع | يمين الشاشة | يسار الشاشة |

### صفحة البروفايل (`profile.tsx`)

| العنصر | عربي | إنجليزي |
|--------|------|---------|
| بطاقة المستخدم: صورة | يمين | يسار |
| بطاقة المستخدم: نص | يسار الصورة | يمين الصورة |
| عناصر القائمة: أيقونة | يمين | يسار |
| عناصر القائمة: نص | بجانب الأيقونة | بجانب الأيقونة |

### صفحة تسجيل الدخول/التسجيل

| العنصر | عربي | إنجليزي |
|--------|------|---------|
| الحقول | يمين | يسار |
| الأزرار | كاملة العرض | كاملة العرض |
| زر الرجوع | يمين | يسار |

---

## مكونات مشتركة

### PrimaryButton
- يستخدم `direction: isRTL ? 'rtl' : 'ltr'` على الـ container
- الـ SVG يتغير بناءً على `isRTL` من `useTranslation`

### SecondaryButton
- يستخدم `isRTL` من `useTranslation` داخل المكون

### CircleBackButton
- عربي: سهم يشير لليسار (AR_BACK_PATH)
- إنجليزي: سهم يشير لليمين (EN_BACK_PATH)

### WalletCard
- يستخدم `isRTL` من `useTranslation` داخل المكون
- `direction: isRTL ? 'rtl' : 'ltr'` على الـ rows

---

## نمط موحد للمكونات

```tsx
export function MyComponent() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <View style={{ flexDirection: 'row', direction: isRTL ? 'rtl' : 'ltr' }}>
      <Text style={{ textAlign: isRTL ? 'right' : 'left' }}>
        {isRTL ? 'نص عربي' : 'English text'}
      </Text>
    </View>
  );
}
```

---

## ما يجب تجنبه

```tsx
// ❌ لا تستخدم I18nManager.isRTL للمقارنة مع isRTL الديناميكي
const flexDir = isRTL === I18nManager.isRTL ? "row" : "row-reverse"; // خاطئ

// ❌ لا تستخدم isRTL المستورد من @/i18n مباشرة في المكونات
import { isRTL } from "@/i18n"; // هذا ثابت لا يتحدث

// ❌ لا تضع منطق الاتجاه في StyleSheet.create
const styles = StyleSheet.create({
  row: { flexDirection: isRTL ? 'row' : 'row-reverse' } // خاطئ — يُحسب مرة واحدة
});
```
