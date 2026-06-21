import { apiSlice, unwrapListResponse } from "./apiSlice";

// ─────────────────────────────────────────────────────────────────────────────
// Customer-specific API endpoints — injected into the shared apiSlice.
// This keeps the customer backend logically separated from the provider backend
// while sharing the same base URL, auth token, and cache infrastructure.
// ─────────────────────────────────────────────────────────────────────────────

export const customerApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ── Chalets (Customer) ─────────────────────────────────────────────────

    /** Browse approved & active chalets (public) */
    browseCustomerChalets: builder.query({
      query: (params) => {
        const { amenityIds, categoryIds, ...rest } = params || {};
        return {
          url: "/customer/chalets",
          params: {
            ...rest,
            // Send as comma-separated strings: amenityIds=id1,id2 & categoryIds=id1,id2
            ...(amenityIds && amenityIds.length > 0
              ? { amenityIds: amenityIds.join(",") }
              : {}),
            ...(categoryIds && categoryIds.length > 0
              ? { categoryIds: categoryIds.join(",") }
              : {}),
          },
        };
      },
      providesTags: ["Chalet"],
    }),

    /** Elasticsearch-powered search with fallback */
    searchChalets: builder.query({
      query: (params) => ({
        url: "/customer/chalets/search",
        params,
      }),
      providesTags: ["Chalet"],
    }),

    /** Full chalet detail (shifts, pricing, images, amenities) */
    getCustomerChaletDetails: builder.query({
      query: (id: string) => `/customer/chalets/${id}`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    getSimilarChalets: builder.query({
      query: (id: string) => `/customer/chalets/${id}/similar`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    getChaletAddons: builder.query({
      query: (id: string) => `/customer/chalets/${id}/addons`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    getChaletTerms: builder.query({
      query: (id: string) => `/customer/chalets/${id}/terms`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    getChaletPolicies: builder.query({
      query: (id: string) => `/customer/chalets/${id}/policies`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    getChaletRules: builder.query({
      query: (id: string) => `/customer/chalets/${id}/policies`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    /** Get chalet occupancy by month */
    getChaletAvailability: builder.query({
      query: ({ id, month, year }: { id: string; month: number; year: number }) => ({
        url: `/customer/chalets/${id}/availability`,
        params: { month, year },
      }),
      providesTags: (result: any, error: any, arg: { id: string; month: number; year: number }) => [
        { type: "Chalet" as const, id: arg.id },
      ],
    }),

    /** Get chalet images (public) */
    getChaletImages: builder.query({
      query: (id: string) => `/chalets/${id}/images`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Chalet" as const, id },
      ],
    }),

    // ── Bookings (Customer) ────────────────────────────────────────────────

    /** Create a new booking and initiate payment */
    createCustomerBooking: builder.mutation({
      query: (data: {
        chaletId: string;
        shiftId: string;
        bookingDate: string;
        adultsCount?: number;
        childrenCount?: number;
        guestsCount?: number;
        addonIds?: string[];
        paymentModel: "DEPOSIT" | "FULL";
        paymentMethod?: "wayl" | "wallet";
        useWalletBalance?: boolean;
        notes?: string;
        audienceType?: "FAMILY" | "YOUTH";
        cardHolderName?: string;
        cardNumber?: string;
        expiry?: string;
        cvv?: string;
      }) => ({
        url: "/customer/bookings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Booking", "Chalet"],
    }),

    /** List my bookings (paginated, filterable by status) */
    getCustomerBookings: builder.query({
      query: (params?: {
        status?:
        | "pending_payment"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "refunded";
        page?: number;
        limit?: number;
      }) => ({
        url: "/customer/bookings",
        params,
      }),
      // Support for infinite scrolling
      serializeQueryArgs: ({ queryArgs }: { queryArgs: any }) => {
        const { page, ...rest } = queryArgs || {};
        return rest;
      },
      merge: (currentCache: any, newItems: any, { arg }: { arg: any }) => {
        if (!arg?.page || arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache.data || []), ...(newItems.data || [])],
        };
      },
      forceRefetch({
        currentArg,
        previousArg,
      }: {
        currentArg: any;
        previousArg: any;
      }) {
        return currentArg !== previousArg;
      },
      providesTags: ["Booking"],
    }),

    /** Get the customer's latest bookings (home "recent bookings" section) */
    getLatestBookings: builder.query({
      query: (limit: number = 5) => ({
        url: "/customer/bookings/latest",
        params: { limit },
      }),
      providesTags: ["Booking"],
    }),

    /** Get booking detail with chalet, shift, and payment info */
    getCustomerBookingDetails: builder.query({
      query: (id: string) => `/customer/bookings/${id}`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "Booking" as const, id },
      ],
    }),

    /** Preview cancellation penalty and refund amounts */
    getCancellationPreview: builder.query({
      query: (id: string) => `/customer/bookings/${id}/cancellation-preview`,
    }),

    /** Cancel booking with reason, process refund to wallet */
    cancelCustomerBooking: builder.mutation({
      query: ({ id, reason }: { id: string; reason?: string }) => ({
        url: `/customer/bookings/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result: any, error: any, { id }: { id: string }) => [
        "Booking",
        { type: "Booking" as const, id },
      ],
    }),

    payDelayedBooking: builder.mutation<any, { id: string; paymentMethod: "wayl" | "wallet"; paymentModel?: string }>({
      query: ({ id, ...data }) => ({
        url: `/customer/bookings/${id}/pay`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result: any, error: any, { id }: { id: string }) => [
        "Booking",
        { type: "Booking" as const, id },
      ],
    }),

    // ── Favorites (Customer) ───────────────────────────────────────────────

    /** Toggle chalet in favorites */
    toggleFavorite: builder.mutation({
      query: (chaletId: string) => ({
        url: `/customer/favorites/toggle/${chaletId}`,
        method: "POST",
      }),
      invalidatesTags: ["Chalet", "Favorite"],
    }),

    /** Add chalet to favorites */
    addFavorite: builder.mutation({
      query: (chaletId: string) => ({
        url: `/customer/favorites/${chaletId}`,
        method: "POST",
      }),
      invalidatesTags: ["Chalet", "Favorite"],
    }),

    /** Remove chalet from favorites */
    removeFavorite: builder.mutation({
      query: (chaletId: string) => ({
        url: `/customer/favorites/${chaletId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chalet", "Favorite"],
    }),

    /** Get list of favorited chalet IDs */
    getFavoriteIds: builder.query<string[], void>({
      query: () => "/customer/favorites/ids",
      providesTags: ["Chalet", "Favorite"],
    }),

    /** List my favorite chalets (paginated) */
    getCustomerFavorites: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: "/customer/favorites",
        params,
      }),
      providesTags: ["Chalet"],
    }),

    // ── Reviews (Customer) ─────────────────────────────────────────────────

    /** Create a review for a completed booking or chalet */
    createReview: builder.mutation({
      query: (data: {
        bookingId?: string;
        chaletId?: string;
        rating: number;
        comment?: string;
      }) => ({
        url: "/customer/reviews",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chalet"],
    }),

    /** Update own review */
    updateReview: builder.mutation({
      query: ({
        id,
        ...data
      }: {
        id: string;
        rating?: number;
        comment?: string;
      }) => ({
        url: `/customer/reviews/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Chalet"],
    }),

    /** Delete own review */
    deleteReview: builder.mutation({
      query: (id: string) => ({
        url: `/customer/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chalet"],
    }),

    /** Get paginated reviews for a chalet */
    getChaletReviews: builder.query({
      query: ({
        chaletId,
        ...params
      }: {
        chaletId: string;
        page?: number;
        limit?: number;
      }) => ({
        url: `/customer/chalets/${chaletId}/reviews`,
        params,
      }),
      providesTags: ["Chalet"],
    }),

    /** Check if user can review a specific chalet */
    checkCanReview: builder.query({
      query: (chaletId: string) => `/customer/chalets/${chaletId}/can-review`,
    }),

    // ── Wallet (Customer) ──────────────────────────────────────────────────

    /** View customer wallet balance */
    getCustomerWallet: builder.query({
      query: () => "/customer/wallet",
      providesTags: ["User"],
    }),

    /** View customer wallet transaction history */
    getCustomerTransactions: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: "/customer/wallet/transactions",
        params,
      }),
      providesTags: ["User"],
    }),

    /** Get my wallet (shared endpoint) */
    getMyWallet: builder.query({
      query: () => "/wallet/my-wallet",
      providesTags: ["User"],
    }),

    /** Get platform settings (includes admin/support contact phone) */
    getSettings: builder.query({
      query: () => "/settings",
    }),

    // ── Account (Customer) ─────────────────────────────────────────────────

    /** Delete my account (Apple/Google compliance) */
    deleteCustomerAccount: builder.mutation({
      query: () => ({
        url: "/customer/account",
        method: "DELETE",
      }),
    }),

    // ── Profile (User) ─────────────────────────────────────────────────────

    /** Update my profile information */
    updateUserProfile: builder.mutation({
      // The backend route is @FormDataRequest() (multipart), so send FormData.
      query: (data: { name?: string; email?: string; birthday?: string }) => {
        const formData = new FormData();
        if (data.name != null) formData.append("name", data.name);
        if (data.email != null) formData.append("email", data.email);
        if (data.birthday != null) formData.append("birthday", data.birthday);
        return {
          url: "/users/profile",
          method: "PUT",
          body: formData,
          headers: {},
        };
      },
      invalidatesTags: ["User"],
    }),

    /** Update my profile image */
    updateProfileImage: builder.mutation({
      query: (formData: FormData) => ({
        url: "/users/profile/image",
        method: "PUT",
        body: formData,
        headers: {},
      }),
      invalidatesTags: ["User"],
    }),

    /** Request phone number change */
    changePhoneNumber: builder.mutation({
      query: (data: { phone: string }) => ({
        url: "/users/change-phone",
        method: "POST",
        body: data,
      }),
    }),

    /** Verify and complete phone number change */
    verifyPhoneNumberChange: builder.mutation({
      query: (data: { code: string }) => ({
        url: "/users/verify-phone",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // ── Notifications ──────────────────────────────────────────────────────

    /** Get all notifications (paginated) */
    getNotifications: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: "/notifications",
        params,
      }),
      providesTags: ["Notification"],
    }),

    /** Mark notification as read */
    markNotificationAsRead: builder.mutation({
      query: (id: string) => ({
        url: `/notifications/${id}/mark-as-read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),

    /** Get notification settings */
    getNotificationSettings: builder.query({
      query: () => "/notifications/settings",
      providesTags: ["Notification"],
    }),

    /** Update notification settings */
    updateNotificationSettings: builder.mutation({
      query: (data: any) => ({
        url: "/notifications/settings",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Notification"],
    }),

    /** Register Firebase token */
    registerFirebaseToken: builder.mutation({
      query: (data: { token: string; platform?: string }) => ({
        url: "/notifications/expo-token",
        method: "POST",
        body: data,
      }),
    }),

    // ── Auth (shared but customer-relevant) ────────────────────────────────

    /** Logout */
    logoutUser: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    // ── Location ───────────────────────────────────────────────────────────

    /** Get list of all city names */
    getCityNames: builder.query({
      query: () => "/cities/names",
      transformResponse: unwrapListResponse,
      providesTags: ["Chalet"],
    }),

    /** Get regions for a specific city */
    getRegionsByCity: builder.query({
      query: (cityId: string) => `/cities/${cityId}/regions`,
    }),

    // ── Banners ───────────────────────────────────────────────────────────

    /** Get active banners for home screen */
    getBanners: builder.query({
      query: () => "/banners",
    }),
    /** Get plateforme configuration */
    getPlatformConfig: builder.query({
      query: () => "/config",
    }),

    /** Get payment status for a transaction */
    getPaymentStatus: builder.query({
      query: (transactionId: string) => `/transactions/payment-status/${transactionId}`,
      providesTags: (result: any, error: any, id: string) => [{ type: "Booking" as const, id }],
    }),
  }),
});

// Export all generated hooks
export const {
  // Chalets
  useBrowseCustomerChaletsQuery,
  useLazyBrowseCustomerChaletsQuery,
  useSearchChaletsQuery,
  useLazySearchChaletsQuery,
  useGetCustomerChaletDetailsQuery,
  useGetSimilarChaletsQuery,
  useGetChaletAddonsQuery,
  useGetChaletTermsQuery,
  useGetChaletPoliciesQuery,
  useGetChaletRulesQuery,
  useLazyGetChaletRulesQuery,
  useGetChaletImagesQuery,
  useGetChaletAvailabilityQuery,

  // Bookings
  useCreateCustomerBookingMutation,
  useGetCustomerBookingsQuery,
  useLazyGetCustomerBookingsQuery,
  useGetCustomerBookingDetailsQuery,
  useGetLatestBookingsQuery,
  useGetCancellationPreviewQuery,
  useLazyGetCancellationPreviewQuery,
  useCancelCustomerBookingMutation,
  usePayDelayedBookingMutation,

  // Favorites
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useToggleFavoriteMutation,
  useGetCustomerFavoritesQuery,
  useGetFavoriteIdsQuery,

  // Reviews
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetChaletReviewsQuery,
  useCheckCanReviewQuery,

  // Wallet
  useGetCustomerWalletQuery,
  useGetCustomerTransactionsQuery,
  useGetMyWalletQuery,
  useGetSettingsQuery,

  // Account
  useDeleteCustomerAccountMutation,

  // Profile
  useUpdateUserProfileMutation,
  useUpdateProfileImageMutation,
  useChangePhoneNumberMutation,
  useVerifyPhoneNumberChangeMutation,

  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useRegisterFirebaseTokenMutation,

  // Auth
  useLogoutUserMutation,

  // Location
  useGetCityNamesQuery,
  useGetRegionsByCityQuery,
  useLazyGetRegionsByCityQuery,

  // Banners
  useGetBannersQuery,

  // Config
  useGetPlatformConfigQuery,

  // Payment Status
  useGetPaymentStatusQuery,
  useLazyGetPaymentStatusQuery,
} = customerApi;
