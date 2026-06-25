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

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Force logout if 401 Unauthorized
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

    // Query for getting owner's chalets
    getOwnerChalets: builder.query({
      query: () => "/provider/chalets",
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

    // Get shifts for a specific chalet
    getChaletShifts: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/shifts`,
      providesTags: ["Chalet"],
    }),

    // Get pricing matrix for a specific shift
    getShiftPricing: builder.query({
      query: (shiftId) => `/provider/shifts/${shiftId}/pricing`,
      providesTags: ["Chalet"],
    }),

    // Get cancellation policies for a chalet
    getChaletCancellationPolicies: builder.query({
      query: (chaletId) =>
        `/provider/chalets/${chaletId}/cancellation-policies`,
      providesTags: ["Chalet"],
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

    // Amenities
    getAmenities: builder.query<any[], void>({
      query: () => "/provider/chalets/amenities/all",
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
            catIcon.set(c.id, c.icon);
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
      providesTags: ["Chalet"],
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

    // Get provider stats
    getProviderStats: builder.query({
      query: () => "/provider/profile/stats",
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
      providesTags: ["Chalet"],
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
      providesTags: ["Chalet"],
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

    // Cancel booking
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "Booking",
        { type: "Booking" as const, id },
      ],
    }),

    // Reject booking (usually for providers) - maps to cancel endpoint with reason
    rejectBooking: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/provider/bookings/${id}/cancel`,
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
} = apiSlice;

// Force Metro cache reload - Updated at 2026-05-05T14:55
