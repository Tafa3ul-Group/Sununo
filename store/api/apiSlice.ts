import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL for the API
const BASE_URL = 'https://k4wwso0cwg480c480oo0owg4.rakiza.dev/api/v1';
// Force reload hooks

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // If we have a token in the state, use it for authenticated requests
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Chalet', 'User', 'Booking'],
  endpoints: (builder) => ({
    // Example endpoint for getting chalets
    getChalets: builder.query({
      query: (params) => ({
        url: '/customer/chalets',
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
    // Mutation for creating a new chalet
    createChalet: builder.mutation({
      query: (data) => ({
        url: '/provider/chalets',
        method: 'POST',
        body: data,
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

    updateShiftPricingDay: builder.mutation({
      query: ({ shiftId, pricingId, price }) => ({
        url: `/provider/shifts/${shiftId}/pricing/${pricingId}`,
        method: 'PATCH',
        body: { price },
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

    // Amenities
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

    // Provider Bookings
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

    // Shift availability for a chalet on a date range
    getShiftAvailability: builder.query({
      query: ({ chaletId, from, to }: { chaletId: string; from: string; to: string }) => ({
        url: `/provider/chalets/${chaletId}/shifts/availability`,
        params: { from, to },
      }),
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
} = apiSlice;
