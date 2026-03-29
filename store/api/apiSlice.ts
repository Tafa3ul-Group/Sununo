import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL for the API
const BASE_URL = 'https://k4wwso0cwg480c480oo0owg4.rakiza.dev/api/v1';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Chalet', 'User', 'Booking', 'ProviderProfile', 'Payout', 'Availability'],
  endpoints: (builder) => ({
    getChalets: builder.query({
      query: (params) => ({
        url: '/customer/chalets',
        params,
      }),
      providesTags: ['Chalet'],
    }),
    
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    verifyPhone: builder.mutation({
      query: (data) => ({
        url: '/auth/verify',
        method: 'POST',
        body: data,
      }),
    }),

    createChalet: builder.mutation({
      query: (data) => ({
        url: '/provider/chalets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    uploadChaletImage: builder.mutation({
      query: ({ chaletId, formData }) => ({
        url: `/provider/chalets/${chaletId}/images`,
        method: 'POST',
        body: formData,
      }),
    }),

    getOwnerChalets: builder.query({
      query: () => '/provider/chalets',
      providesTags: ['Chalet'],
    }),

    getOwnerChaletDetails: builder.query({
      query: (id) => `/provider/chalets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Chalet' as const, id }],
    }),

    updateChalet: builder.mutation({
      query: ({ id, data }) => ({
        url: `/provider/chalets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => ['Chalet', { type: 'Chalet' as const, id }],
    }),

    getChaletShifts: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/shifts`,
      providesTags: ['Chalet'],
    }),

    getShiftPricing: builder.query({
      query: (shiftId) => `/provider/shifts/${shiftId}/pricing`,
      providesTags: ['Chalet'],
    }),

    getChaletCancellationPolicies: builder.query({
      query: (chaletId) => `/provider/chalets/${chaletId}/cancellation-policies`,
      providesTags: ['Chalet'],
    }),

    getCities: builder.query<any[], void>({
      query: () => '/cities/names',
    }),

    getChaletRegions: builder.query<any[], string>({
      query: (cityId) => `/cities/${cityId}/regions`,
    }),
    
    createShift: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/shifts`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chalet', 'Availability'],
    }),

    updateShift: builder.mutation({
      query: ({ chaletId, shiftId, data }) => ({
        url: `/provider/chalets/${chaletId}/shifts/${shiftId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Chalet', 'Availability'],
    }),

    deleteShift: builder.mutation({
      query: ({ chaletId, shiftId }) => ({
        url: `/provider/chalets/${chaletId}/shifts/${shiftId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet', 'Availability'],
    }),

    setShiftPricing: builder.mutation({
      query: ({ shiftId, data }) => ({
        url: `/provider/shifts/${shiftId}/pricing`,
        method: 'PUT',
        body: data,
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

    getAmenities: builder.query<any[], void>({
      query: () => '/provider/chalets/amenities/all',
    }),

    getChaletAmenities: builder.query<any[], string>({
      query: (chaletId) => `/provider/chalets/${chaletId}/amenities`,
      providesTags: ['Chalet'],
    }),

    setChaletAmenities: builder.mutation({
      query: ({ chaletId, data }) => ({
        url: `/provider/chalets/${chaletId}/amenities`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Chalet'],
    }),

    getProviderBookings: builder.query({
      query: (params) => ({
        url: '/provider/bookings',
        params,
      }),
      providesTags: ['Booking'],
    }),

    getProviderBookingDetails: builder.query({
      query: (id) => `/provider/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Booking' as const, id }],
    }),

    getShiftAvailability: builder.query({
      query: ({ chaletId, from, to }: { chaletId: string; from: string; to: string }) => ({
        url: `/provider/chalets/${chaletId}/shifts/availability`,
        params: { from, to },
      }),
      providesTags: ['Availability'],
    }),
    
    getProviderProfile: builder.query({
      query: () => '/provider/profile',
      providesTags: ['ProviderProfile'],
    }),

    updateProviderProfile: builder.mutation({
      query: (data) => ({
        url: '/provider/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['ProviderProfile'],
    }),

    deleteChalet: builder.mutation({
      query: (id) => ({
        url: `/provider/chalets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chalet'],
    }),

    requestPayout: builder.mutation({
      query: (data) => ({
        url: '/provider/payouts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payout'],
    }),

    getPayouts: builder.query({
      query: (params) => ({
        url: '/provider/payouts',
        params,
      }),
      providesTags: ['Payout'],
    }),

    getPayoutDetails: builder.query({
      query: (id) => `/provider/payouts/${id}`,
      providesTags: (result: any, error: any, id: string) => [{ type: 'Payout' as const, id }],
    }),

    markBookingCompleted: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/complete`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => ['Booking', 'Availability', { type: 'Booking' as const, id }],
    }),

    createExternalBooking: builder.mutation({
      query: ({ chaletId, ...body }) => ({
        url: `/provider/chalets/${chaletId}/external-bookings`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Booking', 'Availability'],
    }),

    deleteExternalBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/external`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Booking', 'Availability'],
    }),

    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/provider/bookings/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Booking', 'Availability'],
    }),
  }),
});

export const {
  useGetChaletsQuery,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLoginMutation,
  useVerifyPhoneMutation,
  useCreateChaletMutation,
  useUpdateChaletMutation,
  useUploadChaletImageMutation,
  useGetOwnerChaletsQuery,
  useGetOwnerChaletDetailsQuery,
  useGetChaletShiftsQuery,
  useGetShiftPricingQuery,
  useGetChaletCancellationPoliciesQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useSetShiftPricingMutation,
  useUpdateShiftPricingDayMutation,
  useSetChaletPoliciesMutation,
  useCreateChaletPolicyMutation,
  useDeleteChaletPolicyMutation,
  useGetCitiesQuery,
  useGetChaletRegionsQuery,
  useLazyGetChaletRegionsQuery,
  useGetAmenitiesQuery,
  useGetChaletAmenitiesQuery,
  useSetChaletAmenitiesMutation,
  useGetProviderBookingsQuery,
  useGetProviderBookingDetailsQuery,
  useGetShiftAvailabilityQuery,
  useLazyGetShiftAvailabilityQuery,
  useGetProviderProfileQuery,
  useUpdateProviderProfileMutation,
  useDeleteChaletMutation,
  useRequestPayoutMutation,
  useGetPayoutsQuery,
  useGetPayoutDetailsQuery,
  useMarkBookingCompletedMutation,
  useCreateExternalBookingMutation,
  useDeleteExternalBookingMutation,
  useCancelBookingMutation,
} = apiSlice;
