export const meta = {
  name: 'rtl-direction-migration',
  description: 'Migrate all RTL/direction code to the central useDirection() API, faithfully preserving behavior',
  phases: [
    { title: 'Migrate', detail: 'one agent per file-group rewrites to useDirection()' },
    { title: 'Review', detail: 'adversarial check per group: double-flips, leftover hardcoded left/right' },
  ],
}

// ── The central API the whole app must now consume ──────────────────────────
const API = `
The central direction API lives in i18n/direction.ts and is re-exported from "@/i18n":

  import { useDirection } from "@/i18n";
  // inside a function component / forwardRef render / hook body:
  const { isRTL, rowDirection, textAlign } = useDirection();
  //   isRTL: boolean              -> true when active language is Arabic
  //   rowDirection: 'row'|'row-reverse'  -> use for a content-direction flex row
  //   textAlign: 'right'|'left'   -> matches active language

Also available from "@/i18n" for the RARE case a row hardcodes a SPECIFIC content
direction different from the current language:
  import { resolveRowDirection } from "@/i18n"; // resolveRowDirection(contentRTL, I18nManager.isRTL)
`

// ── Behavior-preserving migration rules (shared by every agent) ─────────────
const RULES = `
You are migrating React Native (Expo, expo-router) screens to a single direction API.
${API}

GOLDEN RULE: PRESERVE BEHAVIOR EXACTLY. The app uses I18nManager.forceRTL, so RN
auto-flips 'flexDirection:row' and logical 'start/end'. Never introduce a double-flip.
When unsure whether something is directional or a fixed visual choice, LEAVE IT and
record it in "uncertain". Correctness over completeness.

APPLY THESE TRANSFORMS:

1) flexDirection helpers -> hook.
   Any local computation equivalent to "(X === I18nManager.isRTL) ? 'row' : 'row-reverse'"
   (named rowDirection / flexDir / getFlexDirection, or written inline with === or the
   inverted !== form "(X !== I18nManager.isRTL) ? 'row-reverse' : 'row'") where X is the
   current language RTL flag -> delete the local helper and use 'rowDirection' from useDirection().
   ONLY-IF the row's content direction is the CURRENT language (the overwhelmingly common case).
   If a row pins a DIFFERENT specific direction, keep that meaning via resolveRowDirection(thatRTL, I18nManager.isRTL).

2) RTL flag source -> hook.
   Replace these in-component sources of the current-language RTL flag with 'isRTL' from useDirection():
     - const isArabic = i18n.language === 'ar'   (keep useTranslation only if 't' is still used)
     - import { isRTL } from "@/i18n" used at module/component scope
     - direct reads of I18nManager.isRTL inside the component body
   Do NOT touch i18n/index.ts or i18n/direction.ts themselves.

3) textAlign.
   Dynamic "textAlign: isRTL ? 'right' : 'left'" (any equivalent) -> 'textAlign' from useDirection().
   A STATIC "textAlign: 'right'|'left'" in StyleSheet.create that is clearly meant to follow the
   reading language -> move it inline in JSX as { textAlign } from the hook. If a static textAlign
   is plainly a fixed design choice unrelated to language, LEAVE it and note in "uncertain".

4) left/right -> logical start/end (RN auto-flips these under forceRTL).
   In StyleSheet.create static styles AND inline styles, when the property is meant to follow
   reading direction: left->start, right->end, marginLeft->marginStart, marginRight->marginEnd,
   paddingLeft->paddingStart, paddingRight->paddingEnd.
   Collapse manual conditionals like "isRTL ? { left: X, right: 'auto' } : { right: X, left: 'auto' }"
   (absolute positioning) into a single static "{ start: X }" (start = left in LTR, right in RTL).
   Verify the conditional's intent matches start-mapping before collapsing; if it is the reverse
   mapping, use 'end' instead. Do NOT convert border-radius corners. Do NOT convert values that are
   genuinely fixed-visual (e.g. a shadow offset, an icon nudge unrelated to direction) -> note them.

5) Cleanup. Remove now-unused imports (I18nManager, module-level isRTL) and dead local helper
   declarations. Keep useTranslation import if 't' or i18n is still otherwise used.

CONSTRAINTS:
- StyleSheet.create runs at module scope -> you CANNOT call the hook there. Anything that must be
  dynamic (textAlign/flexDirection by language) goes inline in JSX using the hook's values.
- The hook must be called at the top level of a component/forwardRef/custom-hook body, never in loops,
  conditionals, or plain helper functions. If a render helper outside the component needs the value,
  pass it down as an argument.
- Do not reformat unrelated code. Make minimal, surgical edits.
- After editing, re-read each file you changed to confirm it is coherent.
`

const GROUPS = [
  { key: 'G1-tabs-customer', files: [
    'app/(tabs)/(customer)/booking-success.tsx',
    'app/(tabs)/(customer)/bookings.tsx',
    'app/(tabs)/(customer)/explore.tsx',
    'app/(tabs)/(customer)/index.tsx',
    'app/(tabs)/(customer)/profile.tsx',
  ]},
  { key: 'G2-tabs-dashboard', files: [
    'app/(tabs)/(dashboard)/_layout.tsx',
    'app/(tabs)/(dashboard)/bookings.tsx',
    'app/(tabs)/(dashboard)/customers.tsx',
    'app/(tabs)/(dashboard)/home.tsx',
    'app/(tabs)/(dashboard)/notifications.tsx',
    'app/(tabs)/(dashboard)/profile.tsx',
    'app/(tabs)/(dashboard)/revenue.tsx',
    'app/(tabs)/(dashboard)/shifts.tsx',
    'app/(tabs)/(dashboard)/transactions.tsx',
  ]},
  { key: 'G3-customer-stack', files: [
    'app/(customer)/booking/complete.tsx',
    'app/(customer)/chalet-details/[id].tsx',
    'app/(customer)/chalet-details/add-review/[id].tsx',
    'app/(customer)/chalet-details/description/[id].tsx',
    'app/(customer)/chalet-details/facilities/[id].tsx',
    'app/(customer)/chalet-details/gallery.tsx',
    'app/(customer)/chalet-details/info/[id].tsx',
    'app/(customer)/chalet-details/reviews/[id].tsx',
    'app/(customer)/favorites.tsx',
    'app/(customer)/filter-results.tsx',
    'app/(customer)/notifications.tsx',
    'app/(customer)/reviews.tsx',
    'app/(customer)/search.tsx',
  ]},
  { key: 'G4-dashboard-stack', files: [
    'app/(dashboard)/add-chalet.tsx',
    'app/(dashboard)/booking-details.tsx',
    'app/(dashboard)/chalet-details.tsx',
    'app/(dashboard)/edit-business.tsx',
    'app/(dashboard)/edit-profile.tsx',
  ]},
  { key: 'G5-auth-root', files: [
    'app/(auth)/login.tsx',
    'app/(auth)/register.tsx',
    'app/_layout.tsx',
    'app/profile-edit.tsx',
  ]},
  { key: 'G6-user-part1', files: [
    'components/user/MainTabs.tsx',
    'components/user/advanced-segment-tab.tsx',
    'components/user/app-button.tsx',
    'components/user/app-drawer.tsx',
    'components/user/app-map.tsx',
    'components/user/auth-toggle.tsx',
    'components/user/banner-swiper.tsx',
    'components/user/category-tabs.tsx',
    'components/user/colored-card.tsx',
    'components/user/custom-tab-bar.tsx',
    'components/user/delete-account-sheet.tsx',
    'components/user/filter-input.tsx',
    'components/user/guest-counter.tsx',
    'components/user/horizontal-card.tsx',
    'components/user/horizontal-swiper.tsx',
  ]},
  { key: 'G7-user-part2', files: [
    'components/user/host-contact-card.tsx',
    'components/user/language-sheet.tsx',
    'components/user/location-picker-modal.tsx',
    'components/user/login-prompt-modal.tsx',
    'components/user/logout-sheet.tsx',
    'components/user/map-card.tsx',
    'components/user/primary-button.tsx',
    'components/user/range-calendar.tsx',
    'components/user/review-card.tsx',
    'components/user/review-submission-sheet.tsx',
    'components/user/search-filter-sheet.tsx',
    'components/user/secondary-button.tsx',
    'components/user/secondary-select.tsx',
    'components/user/wallet-card.tsx',
  ]},
  { key: 'G8-dashboard-ui', files: [
    'components/dashboard/amenities-modal.tsx',
    'components/dashboard/countdown-badge.tsx',
    'components/dashboard/dashboard-calendar.tsx',
    'components/dashboard/dashboard-header.tsx',
    'components/dashboard/dashboard-tab-bar.tsx',
    'components/dashboard/pending-approval.tsx',
    'components/dashboard/provider-chalet-card.tsx',
    'components/dashboard/shift-action-sheet.tsx',
    'components/ui/collapsible.tsx',
    'components/ui/confirmation-dialog.tsx',
    'components/ui/empty-state.tsx',
    'components/ui/error-state.tsx',
    'components/ui/loading-overlay.tsx',
    'components/ui/shift-circular-clock.tsx',
    'components/ui/status-modal.tsx',
    'components/ui/toast-config.tsx',
  ]},
  { key: 'G9-components-root', files: [
    'components/booking-cancellation-modal.tsx',
    'components/booking-details-modal-content.tsx',
    'components/chalet-card.tsx',
    'components/chalet-progress-tabs.tsx',
    'components/header-section.tsx',
    'components/payment-confirmation-modal.tsx',
    'components/themed-text.tsx',
    'hooks/useFormatTime.ts',
  ]},
]

const MIGRATE_SCHEMA = {
  type: 'object',
  required: ['group', 'filesChanged', 'summary'],
  properties: {
    group: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    filesSkipped: { type: 'array', items: { type: 'string' }, description: 'files needing no change' },
    summary: { type: 'string', description: 'what was changed across the group' },
    transformCounts: {
      type: 'object',
      properties: {
        flexDirection: { type: 'number' },
        rtlFlag: { type: 'number' },
        textAlign: { type: 'number' },
        leftRightToLogical: { type: 'number' },
      },
    },
    uncertain: { type: 'array', items: { type: 'string' }, description: 'file:line spots left unchanged on purpose, with reason' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['group', 'issues'],
  properties: {
    group: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'severity', 'description'],
        properties: {
          file: { type: 'string' },
          line: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          description: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
    clean: { type: 'boolean', description: 'true if no behavior-changing issues found' },
  },
}

log(`Migrating ${GROUPS.length} groups (${GROUPS.reduce((n, g) => n + g.files.length, 0)} files) to useDirection()`)

const results = await pipeline(
  GROUPS,
  // Stage 1: migrate
  (g) => agent(
    `${RULES}\n\nYour group is "${g.key}". Migrate EXACTLY these files and no others:\n${g.files.map((f) => '  - ' + f).join('\n')}\n\n` +
    `Work file by file: read it, apply the transforms that genuinely apply, re-read to confirm coherence. ` +
    `Return the structured report. Be conservative — anything ambiguous goes in "uncertain", left unchanged.`,
    { label: `migrate:${g.key}`, phase: 'Migrate', schema: MIGRATE_SCHEMA }
  ),
  // Stage 2: adversarial review of the same group; carry migration forward
  async (mig, g) => {
    const review = await agent(
      `You are an adversarial RTL reviewer. The following files in group "${g.key}" were just migrated to the useDirection() API:\n` +
      `${g.files.map((f) => '  - ' + f).join('\n')}\n\n${API}\n\n` +
      `Re-read each file and hunt specifically for BEHAVIOR-CHANGING mistakes introduced by the migration:\n` +
      `  (a) DOUBLE-FLIP: a row that now uses both rowDirection AND sits under forceRTL such that it reverses twice; or a left/right that was converted to start/end with the WRONG mapping (start vs end swapped).\n` +
      `  (b) LEFTOVER: remaining in-component reads of I18nManager.isRTL, leftover "import { isRTL } from '@/i18n'", or local flexDir/rowDirection helpers that should have been replaced.\n` +
      `  (c) HOOK MISUSE: useDirection() called conditionally, in a loop, or outside a component/hook body; or missing for a component that uses isRTL/rowDirection/textAlign.\n` +
      `  (d) BROKEN: obviously broken JSX/imports, or a static StyleSheet textAlign that was wrongly moved/dropped.\n` +
      `Migration agent's own notes: ${JSON.stringify(mig?.uncertain || [])}.\n` +
      `Report concrete issues with file and line. If the group is clean, set clean=true with an empty issues array. Do NOT edit anything — only report.`,
      { label: `review:${g.key}`, phase: 'Review', schema: REVIEW_SCHEMA }
    )
    return { group: g.key, migration: mig, review }
  }
)

return { groups: results.filter(Boolean) }
