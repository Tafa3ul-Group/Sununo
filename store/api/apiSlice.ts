import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAppVersion, getDeviceId, getPlatform } from "@/utils/device";

// API base URL — reads from environment variable with fallback
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL
    ? `${process.env.EXPO_PUBLIC_API_URL}/api/v1`
    : "https://api.sununo.app/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    // If we have a token in the state, use it for authenticated requests
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    // Client context for backend logging + the version gate. Sent on EVERY
    // request so the server can attribute it to a device/version (guest or user).
    headers.set("X-App-Version", getAppVersion());
    headers.set("X-Platform", getPlatform());
    try {
      headers.set("X-Device-Id", await getDeviceId());
    } catch {
      // never block a request because the device id couldn't be read
    }
    return headers;
  },
});

// Endpoints where a 401 is the *answer to the attempt*, not a dead session:
// `/auth/verify` returns 401 INVALID_CODE for a mistyped OTP digit, and
// `/auth/login` + `/auth/register-provider` return 401 ACCOUNT_INACTIVE. Signing
// the user out there wipes `userType` — including the `'guest'` value — so a
// single typo used to kick a browsing guest back to onboarding mid-flow.
const AUTH_CHALLENGE_PATHS = [
  "auth/login",
  "auth/verify",
  "auth/register-provider",
];

/** The request path as written by the endpoint, without its leading slash. */
const getRequestPath = (args: any): string => {
  const url = typeof args === "string" ? args : args?.url;
  return typeof url === "string" ? url.replace(/^\/+/, "") : "";
};

/**
 * Is this 401 really "your session is gone"? Only if we actually sent a token
 * AND the endpoint isn't one that answers 401 to reject a credential. A public
 * endpoint replying 401 has no session to end, so it must not clear guest mode.
 */
const isExpiredSession = (args: any, api: any): boolean => {
  const path = getRequestPath(args);
  if (AUTH_CHALLENGE_PATHS.some((p) => path.startsWith(p))) return false;
  return !!(api.getState() as any)?.auth?.token;
};

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && isExpiredSession(args, api)) {
    // Force logout if 401 Unauthorized — the token we sent is no longer valid.
    // The root reducer (store/index.ts) also drops the whole RTK Query cache on
    // this action, so nothing of the dead session is left to read.
    const { logout } = require("../authSlice");
    api.dispatch(logout());
  }

  // Normalize error response shape so callers always have a message
  if (result.error && !(result.error as any).message && (result.error as any).data) {
    (result.error as any).message =
      (result.error as any).data?.message || "Request failed";
  }

  return result;
};

// Shape of GET /config's version gate (per platform).
export interface PlatformUpdateConfig {
  latestVersion: string | null;
  forceUpdate: boolean;
  storeUrl: string | null;
}
export interface AppConfigResponse {
  isWalletEnabled?: boolean;
  isSindiPayEnabled?: boolean;
  isWaylEnabled?: boolean;
  adminPhone?: string | null;
  update?: {
    android: PlatformUpdateConfig;
    ios: PlatformUpdateConfig;
  };
}

// ── Legal policies ──────────────────────────────────────────────────────────
// The three documents a user agrees to. `provider_agreement` is owner-only and
// must be read + accepted BEFORE the owner registration form is reachable.
export type PolicyType = "terms_of_use" | "privacy" | "provider_agreement";

export interface Policy {
  id: string;
  type: PolicyType;
  title: { ar: string; en: string };
  content: { ar: string; en: string };
  version: number;
  isActive: boolean;
  publishedAt?: string | null;
}

// What the client echoes back when the user agrees. The version is what makes
// the consent verifiable — the server rejects it if the wording has moved on.
export interface AcceptedPolicy {
  type: PolicyType;
  version: number;
}

// What the consent gate polls: the policies whose current version this user has
// not agreed to yet. `requiresConsent` is the single flag the gate reacts to.
export interface PendingPolicies {
  requiresConsent: boolean;
  policies: Policy[];
}

export const unwrapListResponse = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.cities)) return response.data.cities;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.cities)) return response.cities;
  return [];
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  // ── Freshness policy ──────────────────────────────────────────────────────
  // Data edited by the owner on one device cannot be cache-invalidated on the
  // customer's device (tags don't cross devices, and there's no realtime push).
  // So we keep client data fresh by refetching when a screen subscribes and when
  // the app regains focus / network — instead of serving long-lived stale cache.
  keepUnusedDataFor: 60, // keep cache 60s after last use
  // Refetch on mount only when the cached data is older than 30s — keeps owner
  // edits fresh on re-open without refetching on every rapid navigation (which
  // felt slow). Focus/reconnect below still refresh on foreground.
  refetchOnMountOrArgChange: 30,
  refetchOnFocus: true, // refetch when the app returns to the foreground
  refetchOnReconnect: true, // refetch after network reconnects
  tagTypes: [
    "Chalet",
    "User",
    "Booking",
    "Favorite",
    "Review",
    "Notification",
    "Wallet",
    "Policy",
  ],
  endpoints: (builder) => ({
    // Example endpoint for getting chalets
    getChalets: builder.query({
      query: (params) => ({
        url: "/customer/chalets",
        params: {
          ...params,
          amenityIds: params?.amenityIds
            ? params.amenityIds.join(",")
            : undefined,
        },
      }),
      providesTags: ["Chalet"],
    }),

    // Get chalets optimized for map display
    getChaletsMap: builder.query({
      query: (params) => ({
        url: "/customer/chalets/map",
        params,
      }),
      // The Explore screen keys this on the raw search box text, so every
      // keystroke mints a new cache key (and, at high zoom, a response of up to
      // 300 chalets). Hold abandoned prefixes for a fraction of the global 60s
      // so "بغداد" doesn't leave five dead entries — "ب", "بغ", "بغد", … — in
      // memory. The real fix is debouncing the arg on the screen itself.
      keepUnusedDataFor: 30,
      providesTags: ["Chalet"],
    }),

    // Example endpoint for user info
    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    // Public platform config — includes the per-platform version gate consumed
    // by the in-app update sheet. No auth required.
    getAppConfig: builder.query<AppConfigResponse, void>({
      query: () => "/config",
    }),

    // Example mutation for login (requests OTP)
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // Example mutation for verifying OTP
    verifyPhone: builder.mutation({
      query: (data) => ({
        url: "/auth/verify",
        method: "POST",
        body: data,
      }),
    }),
    // Mutation for registering as a provider
    registerProvider: builder.mutation({
      query: (data) => ({
        url: "/auth/register-provider",
        method: "POST",
        body: data,
      }),
    }),
    // Mutation for creating a new chalet (multipart/form-data)
    createChalet: builder.mutation({
      query: (formData) => ({
        url: "/provider/chalets",
        method: "POST",
        body: formData,
        // Don't set Content-Type — FormData adds it automatically with boundary
        headers: {},
      }),
      invalidatesTags: ["Chalet"],
    }),

    // Mutation for uploading chalet image
    uploadChaletImage: builder.mutation({
      query: ({ chaletId, formData }) => ({
        url: `/provider/chalets/${chaletId}/images`,
        method: "POST",
        body: formData,
        // Don't set Content-Type — FormData adds it automatically with boundary
        headers: {},
      }),
      invalidatesTags: (result, error, { chaletId }) => [{ type: 'Chalet', id: chaletId }],
    }),

    updateChaletImage: builder.mutation({
      query: ({ chaletId, imageId, data }) => ({
        url: `/provider/chalets/${chaletId}/images/${imageId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { chaletId }) => [{ type: 'Chalet', id: chaletId }],
    }),

    deleteChaletImage: builder.mutation({
      query: ({ chaletId, imageId }) => ({
        url: `/provider/chalets/${chaletId}/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { chaletId }) => [{ type: 'Chalet', id: chaletId }],
    }),

    // Get amenity categories for image categorization
    getAmenityCategories: builder.query<any[], void>({
      query: () => "/provider/chalets/amenity-categories",
    }),

    // Query for getting owner's chalets.
    // The server paginates this (PaginationDto defaults to limit=10) but every
    // consumer here — the chalet picker, the dashboard tab bar, onboarding —
    // treats the first page as the owner's COMPLETE list and never pages. Ask
    // for the DTO's maximum instead, so an owner with more than ten chalets
    // doesn't silently lose the rest from the picker.
    getOwnerChalets: builder.query({
      query: (params) => ({
        url: "/provider/chalets",
        params: { ...(params || {}), limit: params?.limit ?? 100 },
      }),
      providesTags: ["Chalet"],
    }),

    // Query for getting specific owners chalet details
    getOwnerChaletDetails: builder.query({
      query: (id) => `/provider/chalets/${id}`,
      providesTags: (result, error, id) => [{ type: "Chalet" as const, id }],
    }),

    // Mutation for updating a chalet
    updateChalet: builder.mutation({
      query: ({ id, data }) => ({
        url: `/provider/chalets/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Chalet",
        { type: "Chalet" as const, id },
      ],
    }),

    // ── Chalet tag scoping ────────────────────────────────────────────────────
    // Anything fetched FOR one chalet provides `{ type: 'Chalet', id: chaletId }`,
    // never the bare tag. RTK Query files a bare-tag provider under an
    // `__internal_without_id` bucket that an `{ type, id }` invalidation never
    // reads (selectInvalidatedBy only looks at `provided[tag.id]`), so a bare
    // provider is invisible to the shift/policy mutations below — which is why
    // a deleted shift used to stay on screen. The reverse direction is safe: a
    // bare invalidation (setShiftPricing, setChaletAmenities, deleteChalet…)
    // flattens every id bucket, so it still reaches these id-scoped entries.

    // Get shifts for a specific chalet
    getChaletShifts: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/shifts`,
      providesTags: (result, error, chaletId) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    // Get pricing matrix for a specific shift. Keyed by SHIFT id, not chalet id,
    // so it keeps the bare tag — its two writers (setShiftPricing,
    // updateShiftPricingDay) invalidate the bare tag and reach it.
    getShiftPricing: builder.query({
      query: (shiftId) => `/provider/shifts/${shiftId}/pricing`,
      providesTags: ["Chalet"],
    }),

    // Get cancellation policies for a chalet
    getChaletCancellationPolicies: builder.query({
      query: (chaletId) =>
        `/provider/chalets/${chaletId}/cancellation-policies`,
      providesTags: (result, error, chaletId) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    // Get all cities
    getCities: builder.query<any[], void>({
      query: () => "/cities/names",
      transformResponse: unwrapListResponse,
    }),

    // Get default shift templates
    getShiftDefaults: builder.query<any[], void>({
      query: () => "/shifts/defaults",
    }),

    // Get regions for a specific city
    getChaletRegions: builder.query<any[], string>({
      query: (cityId) => `/cities/${cityId}/regions`,
    }),

    // Shift Mutations
    createShift: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/shifts`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    updateShift: builder.mutation({
      query: ({ chaletId, shiftId, data }) => ({
        url: `/provider/chalets/${chaletId}/shifts/${shiftId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    deleteShift: builder.mutation({
      query: ({ chaletId, shiftId }) => ({
        url: `/provider/chalets/${chaletId}/shifts/${shiftId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    // Pricing Matrix Mutation
    setShiftPricing: builder.mutation({
      query: ({ shiftId, data }) => ({
        url: `/provider/shifts/${shiftId}/pricing`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Chalet"],
    }),

    // Policies Mutation
    setChaletPolicies: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/cancellation-policies`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    createChaletPolicy: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/cancellation-policies`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    deleteChaletPolicy: builder.mutation({
      query: ({ chaletId, policyId }) => ({
        url: `/provider/chalets/${chaletId}/cancellation-policies/${policyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    updateShiftPricingDay: builder.mutation({
      query: ({ shiftId, pricingId, price }) => ({
        url: `/provider/shifts/${shiftId}/pricing/${pricingId}`,
        method: "PATCH",
        body: { price },
      }),
      invalidatesTags: ["Chalet"],
    }),

    // Amenities — the flat "every amenity" list used to resolve the built-in
    // pool/bbq/garden chip slugs to real feature UUIDs.
    //
    // There is NO public route for this. The old URL
    // (`/provider/chalets/amenities/all`) matches nothing on the server: under
    // the `provider/chalets` prefix only `amenity-categories` and
    // `:chaletId/amenities` exist, so every home-tab mount fired a request that
    // 404'd — and the guest calling it has no provider token either. The only
    // public amenity route is `/customer/amenities/filter`, which returns just
    // the admin-flagged chips (already fetched by `getHomeFilterAmenities`, and
    // empty in exactly the case where the default chips are shown).
    //
    // So: answer locally with an empty list — identical to what the failed
    // request produced, minus the doomed round-trip and the 404 noise — until
    // the backend exposes `GET /customer/amenities` (all active features).
    // Until it does, the built-in chips resolve to no UUID; see
    // app/(tabs)/(customer)/index.tsx.
    getAmenities: builder.query<any[], void>({
      queryFn: () => ({ data: [] as any[] }),
    }),

    // Predefined (ready-made) terms the owner can pick from when building a
    // chalet's rules. Admin-managed master list; only active terms are returned.
    getProviderTerms: builder.query<any[], void>({
      query: () => "/provider/terms",
      transformResponse: unwrapListResponse,
    }),

    // ── Legal policies ──────────────────────────────────────────────────────
    // Public (no auth) — the register screen must show these BEFORE an account
    // exists. `version` is echoed back on consent so the server can reject
    // agreement to wording that is no longer live.
    getPolicies: builder.query<Policy[], void>({
      query: () => "/policies",
      transformResponse: unwrapListResponse,
    }),

    getPolicy: builder.query<Policy, PolicyType>({
      query: (type) => `/policies/${type}`,
      transformResponse: (res: any) => res?.data ?? res,
    }),

    // Auth-only. The documents this user still owes consent for — a version the
    // admin bumped, or one the account never accepted. Drives the app-wide
    // consent gate, so it carries the full text and is tagged to refetch the
    // moment consent is recorded.
    getPendingPolicies: builder.query<PendingPolicies, void>({
      query: () => "/policies/me/pending",
      transformResponse: (res: any): PendingPolicies => {
        const payload = res?.data ?? res;
        const policies: Policy[] = Array.isArray(payload?.policies)
          ? payload.policies
          : [];
        return { requiresConsent: policies.length > 0, policies };
      },
      providesTags: ["Policy"],
    }),

    // Re-consent for an already-signed-in user (used when a version is bumped).
    acceptPolicies: builder.mutation<{ message: string }, AcceptedPolicy[]>({
      query: (policies) => ({
        url: "/policies/accept",
        method: "POST",
        body: { policies },
      }),
      invalidatesTags: ["Policy"],
    }),

    // Admin-flagged (showInFilter) amenity filter options. The endpoint returns
    // BOTH top-level categories and individual features; both are shown as chips.
    // Each option carries `kind` so the screen filters categories via categoryIds
    // and features via amenityIds. Categories come first.
    getHomeFilterAmenities: builder.query<any[], void>({
      query: () => "/customer/amenities/filter",
      transformResponse: (res: any) => {
        const body = res?.data ?? res;

        // Shape A — { categories: [...], features: [{ ..., categoryId }] }
        if (body && (Array.isArray(body.features) || Array.isArray(body.categories))) {
          // Single pass over categories: build the chip list and the
          // id->icon lookup at the same time (previously two map passes).
          const catIcon = new Map<string, any>();
          const cats = (body.categories || []).map((c: any) => {
            // Only categories with a real id may seed the lookup: an id-less
            // category would register the key `undefined`, which every feature
            // missing `categoryId` would then "match" and inherit a stranger's
            // icon from.
            if (c?.id != null) catIcon.set(c.id, c.icon);
            return {
              id: c.id,
              name: c.name,
              icon: c.icon || null,
              kind: "category" as const,
            };
          });
          const feats = (body.features || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            icon: f?.icon || catIcon.get(f?.categoryId) || null,
            kind: "feature" as const,
          }));
          return [...cats, ...feats];
        }

        // Shape B — [ { ...category, features: [...] } ] (grouped by category)
        if (Array.isArray(body)) {
          return body.flatMap((cat: any) =>
            (cat?.features || []).map((f: any) => ({
              id: f.id,
              name: f.name,
              icon: f?.icon || cat?.icon || null,
              kind: "feature" as const,
            })),
          );
        }

        return [];
      },
    }),

    getChaletAmenities: builder.query<any[], string>({
      query: (chaletId) => `/provider/chalets/${chaletId}/amenities`,
      providesTags: (result, error, chaletId) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    // Get specific chalet details for customer
    getChaletDetails: builder.query({
      query: (id) => `/customer/chalets/${id}`,
      providesTags: (result, error, id) => [{ type: "Chalet" as const, id }],
    }),

    setChaletAmenities: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/amenities`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Chalet"],
    }),

    // Update user profile
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/users/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Delete user profile
    deleteProfile: builder.mutation({
      query: () => ({
        url: "/users/profile",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // Update user profile image
    updateProfileImage: builder.mutation({
      query: (data) => ({
        url: "/users/profile/image",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Get provider profile
    getProviderProfile: builder.query({
      query: () => "/provider/profile",
      providesTags: ["User"],
    }),

    // Get provider stats. The revenue screen passes { from, to, period, chaletId }
    // and the controller binds all four (@Query on provider/profile/stats) — they
    // have to reach the URL, not just the cache key, or every period ends up
    // showing the same current-month numbers under a different label.
    getProviderStats: builder.query({
      query: (params) => ({
        url: "/provider/profile/stats",
        params,
      }),
      providesTags: ["Booking", "Chalet"],
    }),

    // Get provider chalet stats
    getProviderChaletStats: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/stats`,
      providesTags: ["Booking", "Chalet"],
    }),

    // Update provider profile
    updateProviderProfile: builder.mutation({
      query: (data) => ({
        url: "/provider/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Get provider bookings
    getProviderBookings: builder.query({
      query: (params) => ({
        url: "/provider/bookings",
        params,
      }),
      // Support for infinite scrolling
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1 || !currentCache) {
          return newItems;
        }

        // Ensure data exists before mapping
        const existingData = currentCache.data || [];
        const newData = newItems.data || [];

        // Deduplicate items by ID
        const existingIds = new Set(existingData.map((item: any) => item.id));
        const uniqueNewItems = newData.filter(
          (item: any) => !existingIds.has(item.id),
        );

        return {
          ...newItems,
          data: [...existingData, ...uniqueNewItems],
          meta: newItems.meta,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: ["Booking"],
    }),

    // Get provider booking details
    getProviderBookingDetails: builder.query({
      query: (id) => `/provider/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: "Booking" as const, id }],
    }),

    // Get shift availability
    getShiftAvailability: builder.query({
      query: ({ chaletId, ...params }) => ({
        url: `/provider/chalets/${chaletId}/shifts/availability`,
        params,
      }),
      providesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    // Get fully booked status for days
    getFullyBookedStatus: builder.query<
      { date: string; isFullyBooked: boolean; bookings: { type: 'internal' | 'external' }[] }[],
      { chaletId: string; from: string; to: string }
    >({
      query: ({ chaletId, ...params }) => ({
        url: `/provider/chalets/${chaletId}/shifts/days-status`,
        params,
      }),
      providesTags: (result, error, { chaletId }) => [
        { type: "Chalet" as const, id: chaletId },
      ],
    }),

    // Mark booking as completed
    markBookingCompleted: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/complete`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        "Booking",
        { type: "Booking" as const, id },
      ],
    }),

    // Approve booking
    approveBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "Booking",
        { type: "Booking" as const, id },
      ],
    }),

    // Delete chalet
    deleteChalet: builder.mutation({
      query: (id) => ({
        url: `/provider/chalets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chalet"],
    }),

    // Create external booking
    createExternalBooking: builder.mutation({
      query: ({ chaletId, ...data }) => ({
        url: `/provider/chalets/${chaletId}/external-bookings`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Booking", "Chalet"],
    }),

    // Delete external booking
    deleteExternalBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/external`,
        method: "DELETE",
      }),
      invalidatesTags: ["Booking", "Chalet"],
    }),

    // Cancel an already-secured booking (pending_payment / confirmed). A confirmed
    // booking refunds the customer in full — the owner cancelled, so no policy
    // penalty applies. Requests still awaiting approval use `rejectBooking`.
    //
    // ⚠ THE SERVER HAS NO SUCH ROUTE YET. BookingsProviderController declares
    // only bookings/:id/{complete,approve,reject,external} — the sole cancel
    // routes in the API are customer/bookings/:id/cancel (customer-scoped) and
    // admin/bookings/:id/force-cancel. So this POST 404s today. It is left
    // pointing at the route the server SHOULD expose (adding it server-side is
    // the fix; nothing else can refund the customer) and the 404 is translated
    // below into an honest message, because the raw Fastify body would show the
    // owner a "Route POST:/api/v1/... not found" string that reads like the
    // booking itself is gone.
    cancelBooking: builder.mutation<
      { message: string; refundAmount: number },
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/provider/bookings/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      // Callers read `error.data.message`; keep the server's own text under
      // `serverMessage` so a real "booking not found" is still debuggable.
      transformErrorResponse: (error: any) => {
        if (error?.status !== 404) return error;
        const original =
          typeof error?.data === "object" && error.data ? error.data : {};
        const message =
          "تعذّر إلغاء الحجز: إلغاء الحجوزات من حساب المالك غير متاح على الخادم بعد، ولم يُسترجع أي مبلغ. يرجى التواصل مع الدعم. — Owner-side cancellation is not available on the server yet; nothing was cancelled or refunded. Please contact support.";
        return {
          ...error,
          // baseQueryWithReauth already copied the server's text up here.
          message,
          data: {
            ...original,
            code: "PROVIDER_CANCEL_UNSUPPORTED",
            serverMessage: (original as any)?.message,
            message,
          },
        };
      },
      invalidatesTags: (result, error, { id }) => [
        "Booking",
        "Chalet",
        { type: "Booking" as const, id },
      ],
    }),

    // Reject a request still awaiting the owner's decision (pending_approval).
    rejectBooking: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/provider/bookings/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        "Booking",
        { type: "Booking" as const, id },
      ],
    }),

    // Get payouts/withdrawals
    getPayouts: builder.query({
      query: (params) => ({
        url: "/provider/payouts",
        params,
      }),
      providesTags: ["User"],
    }),

    // Request payout/withdrawal
    requestPayout: builder.mutation({
      query: (data) => ({
        url: "/provider/payouts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // ── Discounts (provider) ───────────────────────────────────────────────
    // A discount the owner funds out of their OWN share — the platform's
    // commission is worked out on the price before the discount and is not
    // touched. Requests wait for admin approval before they discount anything.

    /** The owner's own requests plus any discount the platform imposed on them. */
    getProviderDiscounts: builder.query({
      query: () => "/provider/discounts",
      providesTags: ["Chalet"],
    }),

    requestProviderDiscount: builder.mutation({
      query: (data) => ({
        url: "/provider/discounts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chalet"],
    }),

    /**
     * Pause/resume — only works on campaigns the owner requested themselves. The
     * server rejects it for platform-imposed ones, which is why the list ships a
     * `canToggle` flag per row rather than leaving the app to guess.
     */
    toggleProviderDiscount: builder.mutation({
      query: ({ id, isActive }: { id: string; isActive: boolean }) => ({
        url: `/provider/discounts/${id}/toggle`,
        method: "PATCH",
        params: { isActive },
      }),
      invalidatesTags: ["Chalet"],
    }),

    // Get a single payout request (for the in-app confirmation screen)
    getPayout: builder.query({
      query: (id: string) => `/provider/payouts/${id}`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "User" as const, id: `payout-${id}` },
      ],
    }),

    // Confirm payout details are correct (نعم)
    confirmPayout: builder.mutation({
      query: (id: string) => ({
        url: `/provider/payouts/${id}/confirm`,
        method: "PATCH",
      }),
      invalidatesTags: (result: any, error: any, id: string) => [
        "User",
        { type: "User" as const, id: `payout-${id}` },
      ],
    }),

    // Decline / deny the payout request (لا)
    declinePayout: builder.mutation({
      query: (id: string) => ({
        url: `/provider/payouts/${id}/decline`,
        method: "PATCH",
      }),
      invalidatesTags: (result: any, error: any, id: string) => [
        "User",
        { type: "User" as const, id: `payout-${id}` },
      ],
    }),

    // Get notifications
    getNotifications: builder.query({
      query: (params) => ({
        url: "/notifications",
        params,
      }),
      // Support for infinite scrolling
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs;
        return rest;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1 || !currentCache) {
          return newItems;
        }

        const existingData = currentCache.data || [];
        const newData = newItems.data || [];

        const existingIds = new Set(existingData.map((item: any) => item.id));
        const uniqueNewItems = newData.filter(
          (item: any) => !existingIds.has(item.id),
        );

        return {
          ...newItems,
          data: [...existingData, ...uniqueNewItems],
          meta: newItems.meta,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: ["Notification"],
    }),

    // Logout
    logoutUser: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetChaletsQuery,
  useGetChaletsMapQuery,
  useGetMeQuery,
  useLazyGetMeQuery,
  useGetAppConfigQuery,
  useLoginMutation,
  useVerifyPhoneMutation,
  useRegisterProviderMutation,
  useGetPoliciesQuery,
  useGetPolicyQuery,
  useGetPendingPoliciesQuery,
  useAcceptPoliciesMutation,
  useCreateChaletMutation,
  useUpdateChaletMutation,
  useUploadChaletImageMutation,
  useUpdateChaletImageMutation,
  useDeleteChaletImageMutation,
  useGetOwnerChaletsQuery,
  useGetOwnerChaletDetailsQuery,
  useGetChaletDetailsQuery,

  useGetChaletShiftsQuery,
  useGetShiftPricingQuery,
  useGetChaletCancellationPoliciesQuery,

  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useSetShiftPricingMutation,
  useSetChaletPoliciesMutation,
  useCreateChaletPolicyMutation,
  useDeleteChaletPolicyMutation,
  useUpdateShiftPricingDayMutation,

  useGetCitiesQuery,
  useGetShiftDefaultsQuery,
  useGetChaletRegionsQuery,
  useLazyGetChaletRegionsQuery,

  useGetAmenitiesQuery,
  useGetProviderTermsQuery,
  useGetHomeFilterAmenitiesQuery,
  useGetChaletAmenitiesQuery,
  useSetChaletAmenitiesMutation,
  useGetAmenityCategoriesQuery,

  useGetProviderProfileQuery,
  useGetProviderStatsQuery,
  useGetProviderChaletStatsQuery,
  useUpdateProviderProfileMutation,
  useUpdateProfileMutation,
  useUpdateProfileImageMutation,
  useDeleteProfileMutation,
  useGetProviderBookingsQuery,
  useGetProviderBookingDetailsQuery,
  useGetShiftAvailabilityQuery,
  useGetFullyBookedStatusQuery,
  useMarkBookingCompletedMutation,
  useApproveBookingMutation,
  useCreateExternalBookingMutation,
  useDeleteExternalBookingMutation,
  useCancelBookingMutation,
  useRejectBookingMutation,
  useDeleteChaletMutation,
  useGetPayoutsQuery,
  useRequestPayoutMutation,
  useGetPayoutQuery,
  useConfirmPayoutMutation,
  useDeclinePayoutMutation,
  useGetNotificationsQuery,
  useLogoutUserMutation,

  // Provider discounts
  useGetProviderDiscountsQuery,
  useRequestProviderDiscountMutation,
  useToggleProviderDiscountMutation,
} = apiSlice;

// Force Metro cache reload - Updated at 2026-05-05T14:55
