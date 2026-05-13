# Design Document — login-register-fix

## Overview

إصلاح صفحتَي تسجيل الدخول (`login.tsx`) والتسجيل (`register.tsx`) في تطبيق Sununo. التغييرات تشمل: نقل `userType` إلى حالة محلية، إضافة تعامل مع زر الرجوع في خطوة OTP، تحسين أحجام النصوص والمسافات، دمج خطوة TYPE مع INFO في التسجيل، إضافة مؤشر تقدم، وإصلاح payload الـ `registerProvider`.

---

## Architecture

لا تغييرات على البنية العامة. الإصلاحات محصورة في ملفَي:
- `Sununo/app/(auth)/login.tsx`
- `Sununo/app/(auth)/register.tsx`

لا تغييرات على الـ API، Redux store، أو أي مكوّن مشترك.

---

## Component Design

### 1. login.tsx — التغييرات

#### 1.1 نقل `userType` إلى حالة محلية

```typescript
// قبل: يقرأ من Redux
const userType = useSelector((state: RootState) => state.auth.userType) || "customer";
const isOwner = userType === "owner";

// بعد: حالة محلية مستقلة
const reduxUserType = useSelector((state: RootState) => state.auth.userType);
const [localUserType, setLocalUserType] = useState<"owner" | "customer">(
  reduxUserType === "owner" ? "owner" : "customer"
);
const isOwner = localUserType === "owner";

function handleTypeChange(type: "owner" | "customer") {
  setLocalUserType(type);
  dispatch(setUserType(type)); // نحافظ على مزامنة Redux للتوافق
}
```

#### 1.2 تعامل مع زر الرجوع في خطوة OTP

```typescript
import { useEffect } from "react";
import { BackHandler } from "react-native";

useEffect(() => {
  const onBackPress = () => {
    if (step === "otp") {
      setStep("phone");
      return true; // منع الخروج من الصفحة
    }
    return false;
  };
  const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
  return () => sub.remove();
}, [step]);
```

#### 1.3 مؤشر OTP التلقائي في بيئة التطوير

```typescript
// في handleAction عند step === "phone":
if (res?.code) {
  setCode(String(res.code));
  setDevAutoFilled(true); // حالة جديدة
}

// في JSX عند step === "otp":
{devAutoFilled && (
  <ThemedText style={styles.devHint}>
    {isRTL ? "تم ملء الكود تلقائياً للاختبار" : "Code auto-filled for testing"}
  </ThemedText>
)}
```

#### 1.4 أحجام النصوص والمسافات المُصلَحة

| العنصر | قبل | بعد |
|--------|-----|-----|
| `title` fontSize | `normalize.font(24)` | `20` (ثابت) |
| `toggleWrapper` marginBottom | `normalize.height(50)` | `24` |
| `headerRow` marginBottom | `normalize.height(45)` | `28` |
| `loginBtn` marginTop | `normalize.height(20)` | `16` |
| `guestLink` marginTop | `normalize.height(35)` | `24` |

#### 1.5 توجيه المالك الجديد

```typescript
// عند isOwner === true، إضافة نص توجيهي تحت الـ toggle:
{isOwner && (
  <View style={styles.ownerHintRow}>
    <ThemedText style={styles.ownerHintText}>
      {isRTL ? "مالك جديد؟" : "New owner?"}
    </ThemedText>
    <TouchableOpacity onPress={() => router.push(`/register?type=owner`)}>
      <ThemedText style={styles.ownerHintLink}>
        {isRTL ? "سجّل شاليهك" : "Register your chalet"}
      </ThemedText>
    </TouchableOpacity>
  </View>
)}
```

---

### 2. register.tsx — التغييرات

#### 2.1 دمج خطوة TYPE مع INFO

```typescript
// قبل: Step = "TYPE" | "INFO" | "BUSINESS" | "OTP"
// بعد: Step = "INFO" | "BUSINESS" | "OTP"

// الـ toggle ينتقل إلى أعلى خطوة INFO
// الـ initial state يبدأ من "INFO" مباشرة
const [step, setStep] = useState<Step>("INFO");
```

خطوة INFO المُحدَّثة:
```tsx
{step === "INFO" && (
  <View style={styles.stepContainer}>
    {/* Toggle في الأعلى */}
    <View style={styles.toggleInInfo}>
      <AuthToggle activeType={accountType} onChange={setAccountType} />
    </View>

    <ThemedText style={styles.stepTitle}>
      {isRTL ? "المعلومات الأساسية" : "Basic Information"}
    </ThemedText>

    {/* حقول الاسم والهاتف */}
    ...
  </View>
)}
```

#### 2.2 مؤشر التقدم (Step Progress)

```typescript
// حساب الخطوة الحالية والإجمالية
const getStepInfo = () => {
  if (accountType === "owner") {
    // INFO → BUSINESS → OTP  (3 خطوات)
    const map = { INFO: 1, BUSINESS: 2, OTP: 3 };
    return { current: map[step] || 1, total: 3 };
  } else {
    // INFO → OTP  (2 خطوات)
    const map = { INFO: 1, OTP: 2 };
    return { current: map[step] || 1, total: 2 };
  }
};
```

مكوّن مؤشر التقدم (inline داخل register.tsx):
```tsx
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.dot,
            i + 1 === current && progressStyles.activeDot,
            i + 1 < current && progressStyles.doneDot,
          ]}
        />
      ))}
    </View>
  );
}
```

#### 2.3 إصلاح payload الـ `registerProvider`

```typescript
// قبل:
await registerProvider({
  ...
  commercialRegNo: formData.commercialRegNo, // يُرسل "" إذا كان فارغاً
}).unwrap();

// بعد:
const payload: any = {
  phone: formData.phone,
  name: formData.name,
  businessName: {
    ar: formData.businessNameAr,
    en: formData.businessNameEn || formData.businessNameAr,
  },
};
if (formData.commercialRegNo.trim()) {
  payload.commercialRegNo = formData.commercialRegNo.trim();
}
await registerProvider(payload).unwrap();
```

#### 2.4 أحجام النصوص والمسافات المُصلَحة

| العنصر | قبل | بعد |
|--------|-----|-----|
| `stepTitle` fontSize | `22` | `20` |
| `inputGroup` marginBottom | `normalize.height(20)` | `16` |
| `mainBtn` marginTop | `normalize.height(20)` | `16` |
| `stepSubtitle` marginBottom | `30` | `20` |

#### 2.5 رسالة خطأ مترجمة لحساب المالك المكرر

```typescript
} catch (err: any) {
  const rawMsg = err?.data?.message || "";
  const isDuplicate =
    rawMsg.toLowerCase().includes("already exists") ||
    err?.status === 409;

  if (isDuplicate) {
    Alert.alert(
      isRTL ? "حساب موجود مسبقاً" : "Account Already Exists",
      isRTL
        ? "يوجد حساب مالك مرتبط بهذا الرقم. هل تريد تسجيل الدخول؟"
        : "An owner account already exists for this number. Would you like to log in?",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "تسجيل الدخول" : "Log In",
          onPress: () => router.replace("/login"),
        },
      ],
    );
  } else {
    Alert.alert(t("common.error"), rawMsg || "Failed to register");
  }
}
```

---

## Data Flow

```
login.tsx:
  localUserType (useState) ──► handleTypeChange ──► dispatch(setUserType) [للتوافق]
                                                  └──► setLocalUserType [للتحقق المحلي]

  step: "phone" ──► POST /auth/login ──► step: "otp"
  step: "otp"   ──► POST /auth/verify ──► dispatch(setCredentials) ──► router.replace

register.tsx:
  step: "INFO" ──► (customer) POST /auth/login ──► step: "OTP"
  step: "INFO" ──► (owner)    step: "BUSINESS"
  step: "BUSINESS" ──► POST /auth/register-provider ──► step: "OTP"
  step: "OTP"  ──► POST /auth/verify ──► dispatch(setCredentials) ──► router.replace
```

---

## Correctness Properties

```
P1: localUserType مصدره useState وليس Redux مباشرة
P2: BackHandler يعترض الرجوع في خطوة OTP ويعود إلى خطوة phone
P3: initial step في register هو "INFO" وليس "TYPE"
P4: title fontSize ≤ 20 في كلا الصفحتين
P5: toggleWrapper marginBottom ≤ 24 في login
P6: commercialRegNo لا يُرسل في الـ payload إذا كان فارغاً
P7: StepProgress يعرض العدد الصحيح من النقاط حسب accountType
P8: خطأ 409 من registerProvider يعرض Alert مع خيار الانتقال لتسجيل الدخول
```
