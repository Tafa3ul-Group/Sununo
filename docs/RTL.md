# RTL / الاتجاهات — The One True Guide

> هذا هو المرجع الوحيد للاتجاهات في التطبيق. الوثيقتان السابقتان
> (`RTL_GUIDELINES.md` و`rtl-direction-rules.md`) حُذفتا لأنهما بُنيتا على
> فرضيات خاطئة ومتناقضة. كل قاعدة هنا مُتحقَّق منها من الكود المصدري لـ
> React Native 0.81 (Fabric).

## The model

- **Native RTL is permanently OFF.** `i18n/index.ts` runs
  `I18nManager.allowRTL(false); forceRTL(false); swapLeftAndRightInRTL(false)`
  on every launch. `I18nManager.isRTL` is always `false` and must never be read.
- **Direction is a style.** A single `direction: 'rtl' | 'ltr'` (derived from
  `i18n.language`) is applied at container roots and inherited by Yoga down the
  whole tree:
  - `GestureHandlerRootView` in `app/_layout.tsx` (covers bottom-sheets + toasts),
  - every `Stack` `contentStyle` / `Tabs` `sceneStyle`,
  - **every RN `<Modal>`'s top content view** (a Modal is a NEW native root —
    it inherits nothing; forgetting this renders the whole dialog LTR).
- Language switching is a pure re-render — no reload, ever.

## The API — `useDirection()` from `@/i18n`

```ts
const { isRTL, direction, textAlign, textAlignEnd, inputTextAlign } = useDirection();
```

| Field | Value | Use for |
|---|---|---|
| `isRTL` | `boolean` | content pick, glyph mirroring, physical exceptions |
| `direction` | `'rtl' \| 'ltr'` | container/portal/Modal roots, list-item roots inside LTR-forced strips |
| `textAlign` | constant `'left'` | **`<Text>` start-alignment** (logical — see below) |
| `textAlignEnd` | constant `'right'` | **`<Text>` end-alignment** |
| `inputTextAlign` | `'right'` in ar, `'left'` in en | **`<TextInput>` alignment** (physical) |

## The five laws

### 1. Layout is written natural-LTR, always
Plain `flexDirection: 'row'`. Logical edges only: `start`/`end`,
`marginStart`/`marginEnd`, `paddingStart`/`paddingEnd`, `borderStart*`,
`borderTopStartRadius`… Yoga mirrors all of them under the container direction.

❌ Never: `row-reverse`, `isRTL ? 'row-reverse' : 'row'`,
`isRTL ? 'flex-end' : 'flex-start'`, `isRTL ? {right: X} : {left: X}`,
`marginLeft`/`paddingRight`/absolute `left:`/`right:` for directional intent.
Each of these is a **double-flip**: the container already mirrors.

### 2. `<Text>` alignment is LOGICAL (the law everyone gets wrong)
Verified in RN source (iOS `RCTAttributedTextUtils.mm`, Android
`TextLayoutManager.kt`): when a text node's Yoga direction is RTL, React Native
**swaps `textAlign` left↔right**. The swap is keyed on the container
`direction` style — *not* on `I18nManager`.

Therefore, for `<Text>` / `ThemedText`:
- start-align → `textAlign` from the hook (it's the constant `'left'`),
- end-align → `textAlignEnd` (constant `'right'`),
- `'center'` is `'center'`.

❌ Never `isRTL ? 'right' : 'left'` on a `<Text>` — in Arabic that computes
`'right'`, RN swaps it, and the text renders on the **left**. This exact
pattern was the app-wide bug of 2026-07.

`ThemedText` already applies start-alignment + `writingDirection` — prefer it;
raw `<Text>` holding translatable copy should get `{ textAlign }` explicitly.

### 3. `<TextInput>` alignment is PHYSICAL
Inputs do **not** get the logical swap (verified: Android maps left/right
straight to gravity; iOS input attributes never carry the paragraph
direction). Use `inputTextAlign` on every `TextInput` /
`BottomSheetTextInput`. Multiline inputs also need
`textAlignVertical: 'top'`. Exceptions: OTP/code fields stay `'center'`;
phone/number LTR-islands keep `writingDirection: 'ltr'`.

### 4. Horizontal scrollers need the recipe
Scroll offsets are physical-LTR even inside an RTL container, so an inherited
`direction:'rtl'` breaks mount position, paging, `scrollTo`, `getItemLayout`,
and `round(x / width)` math. Fix per site:

```ts
import { ltrScrollContent, useRtlListOrder } from "@/i18n";
```
- **Every** horizontal ScrollView/FlatList/FlashList: spread
  `ltrScrollContent` into `contentContainerStyle` (offset math becomes true).
- Chip/filter strips where item[0] ("الكل") must stay visible and read
  right-to-left in Arabic: feed the list `useRtlListOrder(data)`.
- Carousels with offset math (paging, autoplay, dots): keep data order —
  `ltrScrollContent` only. Force `direction:'ltr'` on the dots row too, so dot
  motion matches page motion.
- ⚠️ Items with internal rows/aligned text/`end`-positioned badges now sit in
  an LTR subtree — re-apply `{ direction }` on the **item root**.

### 5. Physical exceptions exist — mark them
Some mechanisms are inherently physical and legitimately branch on `isRTL`:
- `transform: [{ translateX }]` (drawers, slide animations),
- RNGH `Swipeable` action panes,
- measured window/`onLayout` x-coordinates,
- directional glyphs: mirror with `transform: [{ scaleX: isRTL ? -1 : 1 }]`
  or a glyph swap (chevrons, back arrows, asymmetric SVGs).
Add a one-line comment (`// Physical exception: …`) so a future sweep doesn't
"fix" them.

### 5b. Native map views must be pinned to LTR
`components/user/app-map.tsx` sets `direction: 'ltr'` on the Mapbox `MapView`
style. This is not cosmetic: on Android, Fabric pushes the inherited `rtl` down
as a real `View.setLayoutDirection(LAYOUT_DIRECTION_RTL)` onto `RNMBXMapView`,
and Mapbox's internal view-annotation `FrameLayout` inherits it. `MarkerView`s
are placed with `setTranslationX/Y` **on top of** that FrameLayout's own layout
pass, whose default child gravity (`TOP|START`) resolves to `TOP|RIGHT` under
RTL — so every marker is displaced horizontally by ~(mapWidth − markerWidth).
Y/latitude stays right, X/longitude does not. Any new native view that
positions its own children (maps, charts, camera overlays) needs the same
treatment.

## Navigation

- Native headers render OUTSIDE the direction container → `headerShown: false`
  globally; screens draw their own headers.
- Push animation follows the language:
  `animation: isRTL ? 'slide_from_left' : 'slide_from_right'` in every Stack's
  `screenOptions` (Android mirrors correctly; iOS falls back to its default
  right-slide — a known platform limit of native-stack).
- `fullScreenGestureEnabled: true` so the back-swipe also works from the right
  edge, where Arabic users reach for it.

## Known platform limits (accepted)

- iOS push/pop animation direction cannot be mirrored with native-stack.
- `Alert.alert` renders in the OS locale, not the app language (replace with
  `ConfirmationDialogProvider` where it matters).
- `<Text>` with **no** `textAlign` on iOS aligns by the string's first strong
  character — Latin/digit strings inside Arabic UI lean left. Android is
  correct automatically. Explicit `{ textAlign }` (or `ThemedText`) closes it.

## Testing

`__tests__/direction.test.ts` + `__tests__/useDirection.test.tsx` pin the
contract. On-device sanity: open `/rtl-spike` and flip languages — rows,
logical edges, text alignment, and the bottom-sheet portal must all mirror
instantly with no reload.
