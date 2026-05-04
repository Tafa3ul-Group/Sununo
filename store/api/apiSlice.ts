import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL for the API
const BASE_URL = 'https://k4wwso0cwg480c480oo0owg4.rakiza.dev/api/v1';
// const BASE_URL = 'http://192.168.0.167:4646/api/v1';

// Force reload hooks

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // If we have a token in the state, use it for authenticated requests
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Force logout if 401 Unauthorized
    const { logout } = require('../authSlice');
    api.dispatch(logout());
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Chalet', 'User', 'Booking', 'Favorite', 'Review', 'Notification', 'Wallet'],
  endpoints: (builder) => ({
    // Example endpoint for getting chalets
    getChalets: builder.query({
      query: (params) => ({
        url: '/customer/chalets',
        params: {
          ...params,
          amenityIds: params?.amenityIds ? params.amenityIds.join(',') : undefined
        },
      }),
      providesTags: ['Chalet'],
    }),

    // Get chalets optimized for map display
    getChaletsMap: builder.query({
      query: (params) => ({
        url: '/customer/chalets/map',
        params,
      }),
      providesTags: ['Chalet'],
    }),

    // Example endpoint for user info
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Example mutation for login (requests OTP)
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Example mutation for verifying OTP
    verifyPhone: builder.mutation({
      query: (data) => ({
        url: '/auth/verify',
        method: 'POST',
        body: data,
      }),
    }),
    // Mutation for registering as a provider
    registerProvider: builder.mutation({
      query: (data) => ({
        url: '/auth/register-provider',
        method: 'POST',
        body: data,
      }),
    }),
    // Mutation for creating a new chalet (multipart/form-data)
    createChalet: builder.mutation({
      query: (formData) => ({
        url: '/provider/chalets',
        method: 'POST',
        body: formData,
        // Don't set Content-Type — FormData adds it automatically with boundary
        headers: {},
      }),
      invalidatesTags: ['Chalet'],
    }),

    // Mutation for uploading chalet image
    uploadChaletImage: builder.mutation({
      query: ({ chaletId, formData }) => ({
        url: `/provider/chalets/${chaletId}/images`,
        method: 'POST',
        body: formData,
      }),
    }),

    // Get amenity categories for image categorization
    getAmenityCategories: builder.query<any[], void>({
      query: () => '/provider/chalets/amenity-categories',
    }),


    // Query for getting owner's chalets
    getOwnerChalets: builder.query({
      query: () => '/provider/chalets',
      providesTags: ['Chalet'],
    }),

    // Query for getting specific owners chalet details
    getOwnerChaletDetails: builder.query({
      query: (id) => `/provider/chalets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Chalet' as const, id }],
    }),

    // Mutation for updating a chalet
    updateChalet: builder.mutation({
      query: ({ id, data }) => ({
        url: `/provider/chalets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => ['Chalet', { type: 'Chalet' as const, id }],
    }),

    // Get shifts for a specific chalet
    getChaletShifts: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/shifts`,
      providesTags: ['Chalet'],
    }),

    // Get pricing matrix for a specific shift
    getShiftPricing: builder.query({
      query: (shiftId) => `/provider/shifts/${shiftId}/pricing`,
      providesTags: ['Chalet'],
    }),

    // Get cancellation policies for a chalet
    getChaletCancellationPolicies: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/cancellation-policies`,
      providesTags: ['Chalet'],
    }),

    // Get all cities
    getCities: builder.query<any[], void>({
      query: () => '/cities/names',
    }),

    // Get default shift templates
    getShiftDefaults: builder.query<any[], void>({
      query: () => '/shifts/defaults',
    }),

    // Get regions for a specific city
    getChaletRegions: builder.query<any[], string>({
      query: (cityId) => `/cities/${cityId}/regions`,
    }),


    // Shift Mutations
    createShift: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/shifts`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    updateShift: builder.mutation({
      query: ({ chaletId, shiftId, data }) => ({
        url: `/provider/chalets/${chaletId}/shifts/${shiftId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    deleteShift: builder.mutation({
      query: ({ chaletId, shiftId }) => ({
        url: `/provider/chalets/${chaletId}/shifts/${shiftId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet'],
    }),

    // Pricing Matrix Mutation
    setShiftPricing: builder.mutation({
      query: ({ shiftId, data }) => ({
        url: `/provider/shifts/${shiftId}/pricing`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    // Policies Mutation
    setChaletPolicies: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/cancellation-policies`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    createChaletPolicy: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/cancellation-policies`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    deleteChaletPolicy: builder.mutation({
      query: ({ chaletId, policyId }) => ({
        url: `/provider/chalets/${chaletId}/cancellation-policies/${policyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet'],
    }),

    updateShiftPricingDay: builder.mutation({
      query: ({ shiftId, pricingId, price }) => ({
        url: `/provider/shifts/${shiftId}/pricing/${pricingId}`,
        method: 'PATCH',
        body: { price },
      }),
      invalidatesTags: ['Chalet'],
    }),

    // Amenities
    getAmenities: builder.query<any[], void>({
      query: () => '/provider/chalets/amenities/all',
    }),

    getChaletAmenities: builder.query<any[], string>({
      query: (chaletId) => `/provider/chalets/${chaletId}/amenities`,
      providesTags: ['Chalet'],
    }),

    // Get specific chalet details for customer
    getChaletDetails: builder.query({
      query: (id) => `/customer/chalets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Chalet' as const, id }],
    }),

    setChaletAmenities: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/amenities`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    // Get provider profile
    getProviderProfile: builder.query({
      query: () => '/provider/profile',
      providesTags: ['User'],
    }),

    // Get provider stats
    getProviderStats: builder.query({
      query: () => '/provider/profile/stats',
      providesTags: ['Booking', 'Chalet'],
    }),

    // Update provider profile
    updateProviderProfile: builder.mutation({
      query: (data) => ({
        url: '/provider/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Get provider bookings
    getProviderBookings: builder.query({
      query: (params) => ({
        url: '/provider/bookings',
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
        const uniqueNewItems = newData.filter((item: any) => !existingIds.has(item.id));

        return {
          ...newItems,
          data: [...existingData, ...uniqueNewItems],
          meta: newItems.meta,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: ['Booking'],
    }),

    // Get provider booking details
    getProviderBookingDetails: builder.query({
      query: (id) => `/provider/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Booking' as const, id }],
    }),

    // Get shift availability
    getShiftAvailability: builder.query({
      query: ({ chaletId, ...params }) => ({
        url: `/provider/chalets/${chaletId}/shifts/availability`,
        params,
      }),
      providesTags: ['Chalet'],
    }),

    // Mark booking as completed
    markBookingCompleted: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/complete`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => ['Booking', { type: 'Booking' as const, id }],
    }),

    // Delete chalet
    deleteChalet: builder.mutation({
      query: (id) => ({
        url: `/provider/chalets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet'],
    }),

    // Create external booking
    createExternalBooking: builder.mutation({
      query: ({ chaletId, ...data }) => ({
        url: `/provider/chalets/${chaletId}/external-bookings`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Booking', 'Chalet'],
    }),

    // Delete external booking
    deleteExternalBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/external`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking', 'Chalet'],
    }),

    // Cancel booking
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => ['Booking', { type: 'Booking' as const, id }],
    }),

    // Reject booking (usually for providers) - maps to cancel endpoint with reason
    rejectBooking: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/provider/bookings/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => ['Booking', { type: 'Booking' as const, id }],
    }),

    // Get payouts/withdrawals
    getPayouts: builder.query({
      query: (params) => ({
        url: '/provider/payouts',
        params,
      }),
      providesTags: ['User'],
    }),

    // Request payout/withdrawal
    requestPayout: builder.mutation({
      query: (data) => ({
        url: '/provider/payouts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetChaletsQuery,
  useGetChaletsMapQuery,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLoginMutation,
  useVerifyPhoneMutation,
  useRegisterProviderMutation,
  useCreateChaletMutation,
  useUpdateChaletMutation,
  useUploadChaletImageMutation,
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
  useGetChaletAmenitiesQuery,
  useSetChaletAmenitiesMutation,
  useGetAmenityCategoriesQuery,

  useGetProviderProfileQuery,
  useGetProviderStatsQuery,
  useUpdateProviderProfileMutation,
  useGetProviderBookingsQuery,
  useGetProviderBookingDetailsQuery,
  useGetShiftAvailabilityQuery,
  useMarkBookingCompletedMutation,
  useCreateExternalBookingMutation,
  useDeleteExternalBookingMutation,
  useCancelBookingMutation,
  useRejectBookingMutation,
  useDeleteChaletMutation,
  useGetPayoutsQuery,
  useRequestPayoutMutation,
} = apiSlice;
