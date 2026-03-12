import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index'; // import the RootState from index.ts to prevent circular dependency issues

// Define the base URL for the API
const BASE_URL = 'https://k4wwso0cwg480c480oo0owg4.rakiza.dev/api/v1';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // If we have a token in the state, use it for authenticated requests
      const token = (getState() as RootState).auth.token;
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

    // Query for getting owner's chalets
    getOwnerChalets: builder.query({
      query: () => '/provider/chalets',
      providesTags: ['Chalet'],
    }),

    // Get all cities
    getCities: builder.query<any[], void>({
      query: () => '/cities/names',
    }),

    // Get regions for a specific city
    getRegions: builder.query<any[], string>({
      query: (cityId) => `/cities/${cityId}/regions`,
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
  useGetOwnerChaletsQuery,
  useGetCitiesQuery,
  useGetRegionsQuery,
  useLazyGetRegionsQuery,
} = apiSlice;
