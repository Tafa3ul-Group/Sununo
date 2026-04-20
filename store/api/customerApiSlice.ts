import { apiSlice } from './apiSlice';

// ─────────────────────────────────────────────────────────────────────────────
// Customer-specific API endpoints — injected into the shared apiSlice.
// This keeps the customer backend logically separated from the provider backend
// while sharing the same base URL, auth token, and cache infrastructure.
// ─────────────────────────────────────────────────────────────────────────────

export const customerApi = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({

    // ── Chalets (Customer) ─────────────────────────────────────────────────

    /** Browse approved & active chalets (public) */
    browseCustomerChalets: builder.query({
      query: (params) => ({
        url: '/customer/chalets',
        params,
      }),
      providesTags: ['Chalet'],
    }),

    /** Elasticsearch-powered search with fallback */
    searchChalets: builder.query({
      query: (params) => ({
        url: '/customer/chalets/search',
        params,
      }),
      providesTags: ['Chalet'],
    }),

    /** Full chalet detail (shifts, pricing, images, amenities) */
    getCustomerChaletDetails: builder.query({
      query: (id: string) => `/customer/chalets/${id}`,
      providesTags: (result: any, error: any, id: string) => [{ type: 'Chalet' as const, id }],
    }),
    
    getSimilarChalets: builder.query({
      query: (id: string) => `/customer/chalets/${id}/similar`,
      providesTags: (result: any, error: any, id: string) => [{ type: 'Chalet' as const, id }],
    }),

    getChaletAddons: builder.query({
      query: (id: string) => `/customer/chalets/${id}/addons`,
      providesTags: (result: any, error: any, id: string) => [{ type: 'Chalet' as const, id }],
    }),

    /** Get chalet images (public) */
    getChaletImages: builder.query({
      query: (id: string) => `/chalets/${id}/images`,
    }),

    // ── Bookings (Customer) ────────────────────────────────────────────────

    /** Create a new booking and initiate payment */
    createCustomerBooking: builder.mutation({
      query: (data: {
        chaletId: string;
        shiftId: string;
        bookingDate: string;
        useWalletBalance?: boolean;
      }) => ({
        url: '/customer/bookings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Booking', 'Chalet'],
    }),

    /** List my bookings (paginated, filterable by status) */
    getCustomerBookings: builder.query({
      query: (params?: {
        status?: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
        page?: number;
        limit?: number;
      }) => ({
        url: '/customer/bookings',
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
      forceRefetch({ currentArg, previousArg }: { currentArg: any; previousArg: any }) {
        return currentArg !== previousArg;
      },
      providesTags: ['Booking'],
    }),

    /** Get booking detail with chalet, shift, and payment info */
    getCustomerBookingDetails: builder.query({
      query: (id: string) => `/customer/bookings/${id}`,
      providesTags: (result: any, error: any, id: string) => [{ type: 'Booking' as const, id }],
    }),

    /** Preview cancellation penalty and refund amounts */
    getCancellationPreview: builder.query({
      query: (id: string) => `/customer/bookings/${id}/cancellation-preview`,
    }),

    /** Cancel booking with reason, process refund to wallet */
    cancelCustomerBooking: builder.mutation({
      query: ({ id, reason }: { id: string; reason?: string }) => ({
        url: `/customer/bookings/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result: any, error: any, { id }: { id: string }) => [
        'Booking',
        { type: 'Booking' as const, id },
      ],
    }),

    // ── Favorites (Customer) ───────────────────────────────────────────────

    /** Add chalet to favorites */
    addFavorite: builder.mutation({
      query: (chaletId: string) => ({
        url: `/customer/favorites/${chaletId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Chalet'],
    }),

    /** Remove chalet from favorites */
    removeFavorite: builder.mutation({
      query: (chaletId: string) => ({
        url: `/customer/favorites/${chaletId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet'],
    }),

    /** List my favorite chalets (paginated) */
    getCustomerFavorites: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: '/customer/favorites',
        params,
      }),
      providesTags: ['Chalet'],
    }),

    // ── Reviews (Customer) ─────────────────────────────────────────────────

    /** Create a review for a completed booking */
    createReview: builder.mutation({
      query: (data: { bookingId: string; rating: number; comment?: string }) => ({
        url: '/customer/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    /** Update own review */
    updateReview: builder.mutation({
      query: ({ id, ...data }: { id: string; rating?: number; comment?: string }) => ({
        url: `/customer/reviews/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    /** Delete own review */
    deleteReview: builder.mutation({
      query: (id: string) => ({
        url: `/customer/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet'],
    }),

    /** Get paginated reviews for a chalet */
    getChaletReviews: builder.query({
      query: ({ chaletId, ...params }: { chaletId: string; page?: number; limit?: number }) => ({
        url: `/customer/chalets/${chaletId}/reviews`,
        params,
      }),
      providesTags: ['Chalet'],
    }),

    // ── Wallet (Customer) ──────────────────────────────────────────────────

    /** View customer wallet balance */
    getCustomerWallet: builder.query({
      query: () => '/customer/wallet',
      providesTags: ['User'],
    }),

    /** View customer wallet transaction history */
    getCustomerTransactions: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: '/customer/wallet/transactions',
        params,
      }),
      providesTags: ['User'],
    }),

    /** Get my wallet (shared endpoint) */
    getMyWallet: builder.query({
      query: () => '/wallet/my-wallet',
      providesTags: ['User'],
    }),

    // ── Account (Customer) ─────────────────────────────────────────────────

    /** Delete my account (Apple/Google compliance) */
    deleteCustomerAccount: builder.mutation({
      query: () => ({
        url: '/customer/account',
        method: 'DELETE',
      }),
    }),

    // ── Profile (User) ─────────────────────────────────────────────────────

    /** Update my profile information */
    updateUserProfile: builder.mutation({
      query: (data: { name?: string; email?: string }) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    /** Update my profile image */
    updateProfileImage: builder.mutation({
      query: (formData: FormData) => ({
        url: '/users/profile/image',
        method: 'PUT',
        body: formData,
        headers: {},
      }),
      invalidatesTags: ['User'],
    }),

    /** Request phone number change */
    changePhoneNumber: builder.mutation({
      query: (data: { phone: string }) => ({
        url: '/users/change-phone',
        method: 'POST',
        body: data,
      }),
    }),

    /** Verify and complete phone number change */
    verifyPhoneNumberChange: builder.mutation({
      query: (data: { code: string }) => ({
        url: '/users/verify-phone',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // ── Notifications ──────────────────────────────────────────────────────

    /** Get all notifications (paginated) */
    getNotifications: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: '/notifications',
        params,
      }),
    }),

    /** Mark notification as read */
    markNotificationAsRead: builder.mutation({
      query: (id: string) => ({
        url: `/notifications/${id}/mark-as-read`,
        method: 'PUT',
      }),
    }),

    /** Get notification settings */
    getNotificationSettings: builder.query({
      query: () => '/notifications/settings',
    }),

    /** Update notification settings */
    updateNotificationSettings: builder.mutation({
      query: (data: any) => ({
        url: '/notifications/settings',
        method: 'PUT',
        body: data,
      }),
    }),

    /** Register Firebase token */
    registerFirebaseToken: builder.mutation({
      query: (data: { token: string; platform?: string }) => ({
        url: '/notifications/firebase-token',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Auth (shared but customer-relevant) ────────────────────────────────

    /** Logout */
    logoutUser: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // ── Location ───────────────────────────────────────────────────────────

    /** Get list of all city names */
    getCityNames: builder.query({
      query: () => '/cities/names',
    }),

    /** Get regions for a specific city */
    getRegionsByCity: builder.query({
      query: (cityId: string) => `/cities/${cityId}/regions`,
    }),

    // ── Banners ───────────────────────────────────────────────────────────

    /** Get active banners for home screen */
    getBanners: builder.query({
      query: () => '/banners',
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
  useGetChaletImagesQuery,

  // Bookings
  useCreateCustomerBookingMutation,
  useGetCustomerBookingsQuery,
  useLazyGetCustomerBookingsQuery,
  useGetCustomerBookingDetailsQuery,
  useGetCancellationPreviewQuery,
  useLazyGetCancellationPreviewQuery,
  useCancelCustomerBookingMutation,

  // Favorites
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetCustomerFavoritesQuery,

  // Reviews
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetChaletReviewsQuery,

  // Wallet
  useGetCustomerWalletQuery,
  useGetCustomerTransactionsQuery,
  useGetMyWalletQuery,

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
} = customerApi;
