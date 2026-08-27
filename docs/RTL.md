# RTL / الاتجاهات — The One True Guide

> هذا هو المرجع الوحيد للاتجاهات في التطبيق. الوثيقتان السابقتان
> (`RTL_GUIDELINES.md` و`rtl-direction-rules.md`) حُذفتا لأنهما بُنيتا على
> فرضيات خاطئة ومتناقضة. كل قاعدة هنا مُتحقَّق منها من الكود المصدري لـ
> React Native 0.81 (Fabric).
>
> ⚠️ **هذه الوثيقة v3.** ما قبلها (v2 — "native RTL is permanently OFF" و
> `ltrScroller`/`ltrScrollContent` على كل قائمة أفقية) صار **غلطاً**، وهو الذي
> سبّب فتح أول صورة بالشاليه من اليسار بالعربي. `i18n/direction.ts:1-45` هو
> المصدر التنفيذي لهذه القواعد.

## The model — v3, NATIVE RTL

- **Native RTL is ON.** `i18n/index.ts` (`syncNativeRTL`) runs
  `I18nManager.allowRTL(true); forceRTL(true)` for Arabic, and
  `swapLeftAndRightInRTL` is left at its default **ON**. The OPERATING SYSTEM
  mirrors the app — scroll offsets, native headers, the iOS back-swipe, text
  selection handles, the date picker.
- **`I18nManager.isRTL` tracks the language.** It is `true` in Arabic. (v2 said
  it "is always false and must never be read" — that is no longer true.)
- **You do NOT apply `direction` on ordinary containers.** The OS already
  mirrored the tree; adding `direction: 'rtl'` double-flips.
- **Changing language requires a native RESTART.** `I18nManager` only takes
  effect on a fresh start, so `changeLanguage` prompts for one. That is the
  price of v3, and it buys back the ~93 hand-written workarounds v2 needed.

## The API — `useDirection()` from `@/i18n`

```ts
const { isRTL, direction, textAlign, textAlignEnd, inputTextAlign } = useDirection();
```

| Field | Value | Use for |
|---|---|---|
| `isRTL` | `boolean` | content pick, glyph mirroring, physical exceptions |
| `direction` | `'rtl' \| 'ltr'` | **only** RN `<Modal>` roots (a new native root) and web |
| `textAlign` | constant `'left'` | **`<Text>` start-alignment** (logical — see below) |
| `textAlignEnd` | constant `'right'` | **`<Text>` end-alignment** |
| `inputTextAlign` | `'right'` in ar, `'left'` in en | **`<TextInput>` alignment** (physical) |

## The five laws

### 1. Layout is written natural-LTR, always
Plain `flexDirection: 'row'`. Logical edges only: `start`/`end`,
`marginStart`/`marginEnd`, `paddingStart`/`paddingEnd`, `borderStart*`,
`borderTopStartRadius`… Yoga mirrors all of them under native RTL.

❌ Never: `row-reverse`, `isRTL ? 'row-reverse' : 'row'`,
`isRTL ? 'flex-end' : 'flex-start'`, `isRTL ? {right: X} : {left: X}`,
`marginLeft`/`paddingRight`/absolute `left:`/`right:` for directional intent.
Each of these is a **double-flip**: the OS already mirrors.

### 2. `<Text>` alignment is LOGICAL (the law everyone gets wrong)
Verified in RN source (iOS `RCTAttributedTextUtils.mm`, Android
`TextLayoutManager.kt`): when a text node resolves to an RTL layout direction,
React Native **swaps `textAlign` left↔right**. Under v3 that direction comes
from `I18nManager` + `swapLeftAndRightInRTL`.

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

### 4. Horizontal scrollers need NOTHING — and carousels must never be pinned
Native RTL mirrors a horizontal list for you: in Arabic item 0 sits at the
physical RIGHT and the strip advances right-to-left, exactly as a guest expects.

- ❌ **Do not** add `ltrScroller` / `ltrScrollContent` / `useRtlListOrder` /
  `pinLTR`. The first three are retained as **no-ops** only so the ~80 v2 call
  sites keep compiling — delete them opportunistically. `pinLTR` is a real
  opt-out and pinning a carousel with it actively **un-mirrors** a strip the OS
  had already mirrored correctly.
- ❌ **Never derive the active index from `contentOffset.x`.** Under native RTL
  both platforms report `x = (n - 1 - index) * pageWidth` — reversed, so
  `Math.round(x / pageWidth)` names the mirrored page. (The old comment claiming
  iOS and Android diverge here is false on RN 0.81: iOS re-normalises the offset
  it reports and accepts in `RCTScrollViewComponentView.mm`, Android emits raw
  scrollX, and in JS space both come out simply reversed.)
- ✅ **The recipe**, on a plain RTL `FlatList`:
  - active index ← `onViewableItemsChanged` + `viewabilityConfig`
    (`{ itemVisiblePercentThreshold: 55 }`). **Both must be stable refs**
    (`useRef(...).current`) or VirtualizedList throws *"Changing
    onViewableItemsChanged on the fly is not supported"*.
  - programmatic movement (autoplay, open-at-photo-k) ← `scrollToIndex`, never
    `scrollTo({ x })` / `scrollToOffset`.
  - 🚨 **no `getItemLayout`.** Omitting it is load-bearing: supplied frames are
    LOGICAL and *override* the measured, mirrored ones, so `scrollToIndex` and
    `initialScrollIndex` land on item `n-1-k`. Handle
    `onScrollToIndexFailed` instead (hop to `highestMeasuredFrameIndex`, retry
    on the next frame).
  - dots: plain `flexDirection: 'row'`, **no** `direction: 'ltr'` — dot[0]
    belongs at the right in Arabic, beside photo[0].
- 📖 Reference implementations: `components/user/map-result-card.tsx`,
  `app/(customer)/chalet-details/[id].tsx` (header strip + gallery link),
  `components/user/banner-swiper.tsx`.

### 5. Physical exceptions exist — mark them
Some mechanisms are inherently physical and legitimately branch on `isRTL`:
- `transform: [{ translateX }]` (drawers, slide animations),
- RNGH `Swipeable` action panes,
- measured window/`onLayout` x-coordinates,
- directional glyphs: mirror with `transform: [{ scaleX: isRTL ? -1 : 1 }]`
  or a glyph swap (chevrons, back arrows, asymmetric SVGs).
Add a one-line comment (`// Physical exception: …`) so a future sweep doesn't
"fix" them.

### 5b. Genuinely-LTR content is pinned with `pinLTR`
`pinLTR` (`{ direction: 'ltr' }`) is for content that reads left-to-right in
every language: phone numbers, OTP boxes, IBANs and payout destinations,
booking/receipt codes, and the Mapbox subtree. Not carousels — see law 4.

`components/user/app-map.tsx` sets `direction: 'ltr'` on the Mapbox `MapView`
style. This is not cosmetic: on Android, Fabric pushes `rtl` down as a real
`View.setLayoutDirection(LAYOUT_DIRECTION_RTL)` onto `RNMBXMapView`, and
Mapbox's internal view-annotation `FrameLayout` inherits it. `MarkerView`s are
placed with `setTranslationX/Y` **on top of** that FrameLayout's own layout
pass, whose default child gravity (`TOP|START`) resolves to `TOP|RIGHT` under
RTL — so every marker is displaced horizontally by ~(mapWidth − markerWidth).
Y/latitude stays right, X/longitude does not. Any new native view that
positions its own children (maps, charts, camera overlays) needs the same
treatment.

## Navigation

- Native headers are mirrored by the OS under v3, but the app still sets
  `headerShown: false` globally and screens draw their own headers.
- Push/pop animation is mirrored natively — do **not** hand-swap it with
  `isRTL ? 'slide_from_left' : 'slide_from_right'` any more; that double-flips.
- The iOS back-swipe comes from the correct edge on its own, because the OS owns
  the gesture under native RTL.

## Known platform limits (accepted)

- `Alert.alert` renders in the OS locale, not the app language (replace with
  `ConfirmationDialogProvider` where it matters).
- An RN `<Modal>` is a new native root and does not inherit the app direction in
  every case — re-apply `{ direction }` on its top content view.
- `<Text>` with **no** `textAlign` on iOS aligns by the string's first strong
  character — Latin/digit strings inside Arabic UI lean left. Android is
  correct automatically. Explicit `{ textAlign }` (or `ThemedText`) closes it.

## Testing

`__tests__/direction.test.ts` + `__tests__/useDirection.test.tsx` pin the
contract. On-device sanity: open `/rtl-spike`, switch to Arabic, let the app
restart, and confirm `I18nManager.isRTL === isRTL` plus mirrored rows, logical
edges, text alignment and the bottom-sheet portal. Then open any chalet: the
first photo must be the one on the **right**.
