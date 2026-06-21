/**
 * Google Analytics 4 (Firebase Analytics) event + parameter names.
 *
 * Centralizing these as typed constants prevents typos and keeps event naming
 * consistent across the app. Standard GA4 event names are used where one exists
 * (login, sign_up, view_item, search, add_to_wishlist, begin_checkout,
 * add_payment_info, purchase); the rest are custom to Sununo.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */

export const ANALYTICS_EVENTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  LOGIN: "login",
  SIGN_UP: "sign_up",
  LOGOUT: "logout",
  // ── Ecommerce funnel ──────────────────────────────────────────────────────
  VIEW_ITEM: "view_item",
  SEARCH: "search",
  VIEW_SEARCH_RESULTS: "view_search_results",
  ADD_TO_WISHLIST: "add_to_wishlist",
  BEGIN_CHECKOUT: "begin_checkout",
  ADD_PAYMENT_INFO: "add_payment_info",
  PURCHASE: "purchase",
  // ── Custom ────────────────────────────────────────────────────────────────
  /** Fired for delayed / pending-approval bookings (a request, not a paid purchase). */
  BOOKING_REQUEST: "booking_request",
  SUBMIT_REVIEW: "submit_review",
  CREATE_CHALET: "create_chalet",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** User property names (also register these in GA4 → Admin → Custom definitions). */
export const USER_PROPS = {
  /** "owner" | "customer" | "guest" */
  USER_TYPE: "user_type",
  /** "ar" | "en" */
  LANGUAGE: "app_language",
} as const;

/** App-wide currency for all monetary GA4 events (ISO 4217). */
export const ANALYTICS_CURRENCY = "IQD";
