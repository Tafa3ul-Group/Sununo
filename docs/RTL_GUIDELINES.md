# React Native RTL Layout Guidelines (Sununo Project)

This document outlines the standard engineering guidelines for handling dynamic Right-to-Left (RTL) layout consistency in the Sununo application.

---

## The Core Challenge: React Native's Native Mirroring

React Native features a native layout engine (`I18nManager.isRTL`) that automatically mirrors UI components under the hood when a user's phone is set to an RTL language (like Arabic).

This mirroring automatically flips:
- `flexDirection: "row"` $\rightarrow$ behaves as `"row-reverse"`
- `textAlign: "left"` $\rightarrow$ behaves as `"right"`
- `alignItems: "flex-start"` $\rightarrow$ behaves as `"flex-end"`
- `left: 20` $\rightarrow$ behaves as `right: 20`
- `marginLeft` $\rightarrow$ behaves as `marginRight`

### The Bug: Double Mirroring & Language Discrepancy
If you write hardcoded logic such as:
```tsx
const textAlignment = isArabic ? "right" : "left";
```
1. **If Native RTL is True (e.g. system is in Arabic):** `isArabic` is true, so `textAlignment` is `"right"`. React Native's native engine mirrors this `"right"` value to the **LEFT**. The user sees English alignment for Arabic text!
2. **If Native RTL is False (e.g. system in English, app manually set to Arabic):** `isArabic` is true, so `textAlignment` is `"right"`. No mirroring occurs, so it shows on the **RIGHT** (correct).

This creates an inconsistent layout that changes depending on the system settings.

---

## The Solution: Dynamic Mirroring-Aware Constants

To achieve 100% layout consistency regardless of whether Native RTL mirroring is active or inactive, **always** define and use the following mirroring-aware constants inside your components:

```typescript
import { I18nManager } from "react-native";
import { useTranslation } from "react-i18next";

// Inside your screen/component:
const { i18n } = useTranslation();
const isArabic = i18n.language ? i18n.language.startsWith("ar") : true;

// 1. Text Alignment
const textStart: "left" | "right" = isArabic === I18nManager.isRTL ? "left" : "right";
const textEnd: "left" | "right" = isArabic === I18nManager.isRTL ? "right" : "left";

// 2. Flex Alignments
const alignStart: "flex-start" | "flex-end" = isArabic === I18nManager.isRTL ? "flex-start" : "flex-end";
const alignEnd: "flex-start" | "flex-end" = isArabic === I18nManager.isRTL ? "flex-end" : "flex-start";

// 3. Flex Direction (for rows)
const flexDir: "row" | "row-reverse" = isArabic === I18nManager.isRTL ? "row" : "row-reverse";
```

### Truth Table (How it works)

| User Language (`isArabic`) | System Native RTL (`I18nManager.isRTL`) | Math Equivalence (`isArabic === isRTL`) | Calculated `textStart` | Native Engine Mirroring Applied? | Final Visual Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Arabic (true)** | **Arabic (true)** | **TRUE** | `"left"` | **YES** (flips `"left"` to right) | **RIGHT** (Correct!) |
| **Arabic (true)** | **English (false)** | **FALSE** | `"right"` | **NO** (remains `"right"`) | **RIGHT** (Correct!) |
| **English (false)** | **Arabic (true)** | **FALSE** | `"right"` | **YES** (flips `"right"` to left) | **LEFT** (Correct!) |
| **English (false)** | **English (false)** | **TRUE** | `"left"` | **NO** (remains `"left"`) | **LEFT** (Correct!) |

---

## Guidelines for UI Elements

### 1. Simple Text Alignment
Always apply the dynamic `textStart` to all headings, paragraphs, and description texts:
```tsx
<Text style={{ textAlign: textStart }}>{title}</Text>
```

### 2. Header and Title Containers
When aligning parent containers holding titles and meta text, use `alignStart` or `alignEnd`:
```tsx
<View style={{ alignItems: alignStart }}>
  <Text style={{ textAlign: textStart }}>{title}</Text>
</View>
```

### 3. Absolute Positioned Elements (Left/Right)
For elements like avatars, close buttons, or badges positioned absolutely, calculate their position:
```tsx
const avatarPosition = isArabic === I18nManager.isRTL
  ? { left: 12, right: "auto" }
  : { right: 12, left: "auto" };

<View style={[styles.avatar, avatarPosition]} />
```

### 4. Dynamic Margins and Padding (Spacers)
If you have asymmetrical spacing (e.g. margin to prevent text overlapping an icon):
```tsx
const infoMargins = isArabic === I18nManager.isRTL
  ? { marginLeft: 85, marginRight: 15 }
  : { marginRight: 85, marginLeft: 15 };

<View style={[styles.infoContainer, infoMargins]} />
```

### 5. Layout Flows (Rows)
For layouts containing lists of specs, tabs, footers, or contact details, use `flexDir`:
```tsx
<View style={{ flexDirection: flexDir }}>
  <Text>Icon</Text>
  <Text>Label</Text>
</View>
```

*(Note: Never hardcode `direction: 'rtl'` or `direction: 'ltr'` inline style as React Native does not support it consistently across both platforms; rely on the math above).*
