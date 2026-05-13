# Bugfix Requirements Document

## Introduction

تطبيق Sununo (React Native / Expo) يعاني من مشاكل في صفحتَي تسجيل الدخول (`login.tsx`) والتسجيل (`register.tsx`). المشاكل تشمل: تدفق تسجيل الدخول لا يتحقق من تطابق نوع الحساب المختار مع ما هو مخزّن في قاعدة البيانات بشكل صحيح في جميع الحالات، خطوة TYPE في صفحة التسجيل منفصلة وغير ضرورية، أحجام النصوص والمسافات مضخّمة وغير متوافقة مع معايير تطبيقات الجوال، وغياب مؤشر التقدم في تدفق التسجيل. هذه المشاكل مجتمعةً تُضعف تجربة المستخدم وتُسبب سلوكاً غير متوقع عند تسجيل الدخول.

---

## Bug Analysis

### Current Behavior (Defect)

**تدفق تسجيل الدخول (login.tsx)**

1.1 WHEN يختار المستخدم نوع الحساب "مالك" من الـ toggle ثم يُدخل رقم هاتف غير مرتبط بحساب مالك في قاعدة البيانات THEN النظام يعرض رسالة خطأ صحيحة، لكن `userType` يُقرأ من Redux وليس من حالة محلية، مما يعني أن أي تغيير سابق في Redux يؤثر على سلوك الصفحة بشكل غير متوقع

1.2 WHEN يكون المستخدم في خطوة OTP ويضغط زر الرجوع THEN النظام لا يعود إلى خطوة إدخال رقم الهاتف بل يخرج من الصفحة كلياً (لا يوجد تعامل مع زر الرجوع في خطوة OTP)

1.3 WHEN يُدخل المستخدم رقم هاتف ويحصل على OTP في بيئة التطوير (يُعاد في الـ response) THEN النظام يملأ حقل OTP تلقائياً بالكود المُعاد، لكن لا يوجد أي مؤشر مرئي يُعلم المستخدم بذلك

1.4 WHEN تكون شاشة تسجيل الدخول معروضة على أجهزة بشاشات صغيرة THEN النصوص تظهر بأحجام مضخّمة (العنوان `normalize.font(24)` والـ toggle margin `normalize.height(50)`) مما يُسبب تداخلاً في العناصر أو تمريراً زائداً

1.5 WHEN يختار المستخدم نوع "مالك" من الـ toggle THEN النظام يُخفي رابط "سجّل الآن" ورابط "تصفح كضيف" وهو سلوك صحيح، لكن لا يوجد أي توجيه بديل للمالك الجديد غير المسجّل

**تدفق التسجيل (register.tsx)**

1.6 WHEN يفتح المستخدم صفحة التسجيل THEN النظام يعرض خطوة TYPE منفصلة تحتوي فقط على الـ toggle وزر "التالي"، وهي خطوة زائدة لا تضيف قيمة لأن الـ toggle موجود بالفعل في صفحة تسجيل الدخول ويمكن تمرير النوع كـ param

1.7 WHEN يكون المستخدم في خطوة TYPE ويضغط "التالي" THEN النظام ينتقل إلى خطوة INFO دون أن يُظهر أي مؤشر تقدم (Progress Indicator) يُعلم المستخدم بعدد الخطوات المتبقية

1.8 WHEN يُكمل المستخدم (مالك) خطوة BUSINESS ويضغط "إرسال الطلب" THEN النظام يستدعي `registerProvider` لكن لا يُرسل `commercialRegNo` إذا كان فارغاً بشكل صريح (يُرسل string فارغ بدلاً من حذف الحقل)

1.9 WHEN تكون شاشة التسجيل معروضة THEN أحجام النصوص في `stepTitle` (22px) والمسافات بين عناصر الـ inputGroup (`normalize.height(20)`) غير متناسقة مع معايير تطبيقات الجوال

1.10 WHEN يفشل استدعاء `registerProvider` بسبب وجود حساب مالك مسبق THEN النظام يعرض رسالة الخطأ الخام من الـ API (`Provider account already exists`) دون ترجمة أو توجيه المستخدم للذهاب إلى صفحة تسجيل الدخول

---

### Expected Behavior (Correct)

**تدفق تسجيل الدخول (login.tsx)**

2.1 WHEN يختار المستخدم نوع الحساب من الـ toggle THEN النظام SHALL يحفظ الاختيار في حالة محلية (`useState`) بدلاً من Redux، ويستخدم هذه الحالة المحلية للتحقق عند الـ verify

2.2 WHEN يكون المستخدم في خطوة OTP ويضغط زر الرجوع THEN النظام SHALL يعود إلى خطوة إدخال رقم الهاتف مع الحفاظ على الرقم المُدخل

2.3 WHEN يحصل المستخدم على OTP في بيئة التطوير THEN النظام SHALL يملأ الحقل تلقائياً ويعرض نصاً توضيحياً صغيراً (مثل "تم ملء الكود تلقائياً للاختبار")

2.4 WHEN تكون شاشة تسجيل الدخول معروضة THEN النظام SHALL يعرض العنوان بحجم 20px، والـ toggle margin بـ 24px كحد أقصى، بما يتوافق مع معايير تطبيقات الجوال

2.5 WHEN يختار المستخدم نوع "مالك" من الـ toggle THEN النظام SHALL يعرض نصاً توجيهياً يُرشد المالك الجديد غير المسجّل إلى صفحة التسجيل

**تدفق التسجيل (register.tsx)**

2.6 WHEN يفتح المستخدم صفحة التسجيل THEN النظام SHALL يبدأ مباشرةً من خطوة INFO (دمج TYPE مع INFO)، مع إبقاء الـ toggle في أعلى خطوة INFO لتغيير نوع الحساب

2.7 WHEN يكون المستخدم في أي خطوة من خطوات التسجيل THEN النظام SHALL يعرض مؤشر تقدم مرئي (Progress Bar أو Step Dots) يُظهر الخطوة الحالية والإجمالية

2.8 WHEN يُكمل المستخدم (مالك) خطوة BUSINESS ويضغط "إرسال الطلب" THEN النظام SHALL يُرسل `commercialRegNo` فقط إذا كانت قيمته غير فارغة (حذف الحقل من الـ payload إذا كان فارغاً)

2.9 WHEN تكون شاشة التسجيل معروضة THEN النظام SHALL يعرض `stepTitle` بحجم 20px والـ inputGroup margin بـ 16px، بما يتوافق مع معايير تطبيقات الجوال

2.10 WHEN يفشل استدعاء `registerProvider` بسبب وجود حساب مالك مسبق THEN النظام SHALL يعرض رسالة مترجمة وواضحة مع زر/رابط يوجّه المستخدم إلى صفحة تسجيل الدخول

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN يُدخل المستخدم رقم هاتف صحيح ويضغط "تسجيل الدخول" THEN النظام SHALL CONTINUE TO استدعاء `POST /auth/login` بـ `{ phone }` وإرسال OTP

3.2 WHEN يُدخل المستخدم كود OTP صحيح في صفحة تسجيل الدخول THEN النظام SHALL CONTINUE TO استدعاء `POST /auth/verify` والحصول على `{ token, user }` والتوجيه حسب `user.type`

3.3 WHEN يكون `user.type === "provider"` في الـ response THEN النظام SHALL CONTINUE TO توجيه المستخدم إلى `/(tabs)/(dashboard)/home`

3.4 WHEN يكون `user.type === "customer"` في الـ response THEN النظام SHALL CONTINUE TO توجيه المستخدم إلى `/(tabs)/(customer)`

3.5 WHEN يختار المستخدم "تصفح كضيف" THEN النظام SHALL CONTINUE TO تعيين `userType` إلى `"guest"` والتوجيه إلى `/(tabs)/(customer)`

3.6 WHEN يُكمل المستخدم (عميل) خطوة INFO في التسجيل THEN النظام SHALL CONTINUE TO استدعاء `POST /auth/login` للحصول على OTP ثم الانتقال إلى خطوة OTP

3.7 WHEN يُكمل المستخدم (مالك) خطوة BUSINESS في التسجيل THEN النظام SHALL CONTINUE TO استدعاء `POST /auth/register-provider` بالبيانات الكاملة ثم الانتقال إلى خطوة OTP

3.8 WHEN يُدخل المستخدم كود OTP صحيح في صفحة التسجيل THEN النظام SHALL CONTINUE TO استدعاء `POST /auth/verify` وحفظ الـ credentials في Redux والتوجيه حسب نوع الحساب

3.9 WHEN يختار المستخدم "مالك" ويتحقق بنجاح لكن `user.type` في الـ response ليس `"provider"` THEN النظام SHALL CONTINUE TO عرض رسالة خطأ ومنع الدخول

3.10 WHEN يُدخل المستخدم رقم هاتف فارغاً أو كود OTP غير مكتمل THEN النظام SHALL CONTINUE TO عرض رسالة تحقق مناسبة ومنع إرسال الطلب

---

## Bug Condition Pseudocode

### Bug Condition Functions

```pascal
FUNCTION isBugCondition_LoginState(X)
  INPUT: X of type LoginScreenState
  OUTPUT: boolean
  // Bug: userType مقروء من Redux بدلاً من حالة محلية
  RETURN X.userType_source = "redux_global" AND X.screen = "login"
END FUNCTION

FUNCTION isBugCondition_OTPBackNavigation(X)
  INPUT: X of type LoginScreenState
  OUTPUT: boolean
  // Bug: لا يوجد تعامل مع الرجوع في خطوة OTP
  RETURN X.step = "otp" AND X.back_pressed = true AND X.screen = "login"
END FUNCTION

FUNCTION isBugCondition_RegisterTypeStep(X)
  INPUT: X of type RegisterScreenState
  OUTPUT: boolean
  // Bug: خطوة TYPE منفصلة وزائدة
  RETURN X.step = "TYPE" AND X.screen = "register"
END FUNCTION

FUNCTION isBugCondition_OversizedTypography(X)
  INPUT: X of type ScreenRenderState
  OUTPUT: boolean
  // Bug: أحجام نصوص ومسافات مضخّمة
  RETURN (X.title_font_size > 20 OR X.toggle_margin_bottom > 24) AND X.screen IN ["login", "register"]
END FUNCTION

FUNCTION isBugCondition_EmptyCommercialReg(X)
  INPUT: X of type RegisterProviderPayload
  OUTPUT: boolean
  // Bug: إرسال commercialRegNo فارغ بدلاً من حذفه
  RETURN X.commercialRegNo = "" AND X.screen = "register" AND X.accountType = "owner"
END FUNCTION
```

### Fix Checking Properties

```pascal
// Property: Fix Checking - Local State for userType
FOR ALL X WHERE isBugCondition_LoginState(X) DO
  result ← LoginScreen'(X)
  ASSERT result.userType_source = "local_state"
END FOR

// Property: Fix Checking - OTP Back Navigation
FOR ALL X WHERE isBugCondition_OTPBackNavigation(X) DO
  result ← LoginScreen'(X)
  ASSERT result.step = "phone" AND result.phone_preserved = true
END FOR

// Property: Fix Checking - Register TYPE Step Removed
FOR ALL X WHERE isBugCondition_RegisterTypeStep(X) DO
  result ← RegisterScreen'(X)
  ASSERT result.initial_step = "INFO" AND result.toggle_visible_in_INFO = true
END FOR

// Property: Fix Checking - Typography Sizes
FOR ALL X WHERE isBugCondition_OversizedTypography(X) DO
  result ← Screen'(X)
  ASSERT result.title_font_size <= 20 AND result.toggle_margin_bottom <= 24
END FOR

// Property: Fix Checking - Empty CommercialRegNo
FOR ALL X WHERE isBugCondition_EmptyCommercialReg(X) DO
  result ← RegisterScreen'(X)
  ASSERT "commercialRegNo" NOT IN result.api_payload
END FOR
```

### Preservation Checking

```pascal
// Property: Preservation - All non-buggy inputs behave identically before and after fix
FOR ALL X WHERE NOT (
  isBugCondition_LoginState(X) OR
  isBugCondition_OTPBackNavigation(X) OR
  isBugCondition_RegisterTypeStep(X) OR
  isBugCondition_OversizedTypography(X) OR
  isBugCondition_EmptyCommercialReg(X)
) DO
  ASSERT F(X) = F'(X)
END FOR
```
