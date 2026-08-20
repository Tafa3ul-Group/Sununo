import { apiSlice, unwrapListResponse } from "./apiSlice";

// ─────────────────────────────────────────────────────────────────────────────
// Customer-specific API endpoints — injected into the shared apiSlice.
// This keeps the customer backend logically separated from the provider backend
// while sharing the same base URL, auth token, and cache infrastructure.
// ─────────────────────────────────────────────────────────────────────────────

/** The slice of `onQueryStarted`'s api object the optimistic helpers below use. */
type OptimisticApi = {
  dispatch: (action: any) => any;
  queryFulfilled: Promise<unknown>;
};

/**
 * Optimistically flip a chalet id inside the cached `getFavoriteIds` array so
 * the heart responds on tap instead of after the round trip, and undo the patch
 * if the server rejects the write.
 *
 * `apiSlice.util` — not `customerApi.util` — because an injected slice cannot be
 * referenced from inside its own initializer; both point at the same cache.
 */
async function patchFavoriteIds(
  chaletId: string,
  op: "toggle" | "add" | "remove",
  { dispatch, queryFulfilled }: OptimisticApi,
) {
  const patch = dispatch(
    (apiSlice.util.updateQueryData as any)(
      "getFavoriteIds",
      undefined,
      (draft: string[]) => {
        if (!Array.isArray(draft)) return;
        const index = draft.indexOf(chaletId);
        const remove = op === "remove" || (op === "toggle" && index >= 0);
        if (remove) {
          if (index >= 0) draft.splice(index, 1);
        } else if (index < 0) {
          draft.push(chaletId);
        }
      },
    ),
  );
  try {
    await queryFulfilled;
  } catch {
    patch.undo();
  }
}

export const customerApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ── Chalets (Customer) ─────────────────────────────────────────────────

    /** Browse approved & active chalets (public) */
    browseCustomerChalets: builder.query({
      query: (params) => {
        const { amenityIds, categoryIds, sortBy, lat, lng, ...rest } = params || {};
        return {
          url: "/customer/chalets",
          params: {
            ...rest,
            // Sorting: the default ("newest"/null) is omitted entirely so the
            // cache key and the server's cached URL stay identical to the
            // pre-sorting behaviour.
            ...(sortBy && sortBy !== "newest" ? { sortBy } : {}),
            // Coordinates ride along only for "nearest" — the server rejects
            // sortBy=nearest without them.
            ...(sortBy === "nearest" && lat != null && lng != null
              ? { lat, lng }
              : {}),
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

    /** Featured chalets shown below the home banner (admin-curated, ordered) */
    getFeaturedChalets: builder.query({
      query: () => "/customer/chalets/featured",
      providesTags: ["Chalet"],
    }),

    /**
     * Elasticsearch-powered search with PostgreSQL fallback.
     *
     * Returns the same `{ data, meta }` page shape as the browse endpoint
     * (plus `meta.searchEngine`), so screens can swap between the two without
     * a transformResponse. Results arrive in ES relevance order.
     */
    searchChalets: builder.query({
      query: (params: {
        q: string;
        page?: number;
        limit?: number;
        cityId?: string;
        maxAdults?: number;
        checkIn?: string;
        period?: string;
      }) => ({
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
        /**
         * Optional PAID amenities the guest chose, as `chaletAmenityId` values
         * from the chalet payload. Mandatory paid amenities are applied by the
         * server on their own and must never be sent here.
         */
        amenityIds?: string[];
        paymentModel: "DEPOSIT" | "FULL";
        paymentMethod?: "wayl" | "wallet";
        useWalletBalance?: boolean;
        notes?: string;
        audienceType?: "FAMILY" | "YOUTH";
        /** Discount code typed by the customer; re-validated server-side. */
        couponCode?: string;
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
    //
    // Favoriting touches ONLY the favorites data — no chalet field changes — so
    // these mutations invalidate the "Favorite" tag alone. Invalidating the bare
    // "Chalet" tag flattened the whole tag bucket, so one heart tap refetched the
    // browse list, the map (up to 300 rows), featured, detail and reviews.
    // Every favorite-aware screen renders off `getFavoriteIds`, which is patched
    // optimistically below so the heart flips on tap instead of after the round
    // trip (and rolls back if the request fails).

    /** Toggle chalet in favorites */
    toggleFavorite: builder.mutation<any, string>({
      query: (chaletId: string) => ({
        url: `/customer/favorites/toggle/${chaletId}`,
        method: "POST",
      }),
      invalidatesTags: ["Favorite"],
      onQueryStarted: (chaletId, api) =>
        patchFavoriteIds(chaletId, "toggle", api),
    }),

    /** Add chalet to favorites */
    addFavorite: builder.mutation<any, string>({
      query: (chaletId: string) => ({
        url: `/customer/favorites/${chaletId}`,
        method: "POST",
      }),
      invalidatesTags: ["Favorite"],
      onQueryStarted: (chaletId, api) => patchFavoriteIds(chaletId, "add", api),
    }),

    /** Remove chalet from favorites */
    removeFavorite: builder.mutation<any, string>({
      query: (chaletId: string) => ({
        url: `/customer/favorites/${chaletId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Favorite"],
      onQueryStarted: (chaletId, api) =>
        patchFavoriteIds(chaletId, "remove", api),
    }),

    /** Get list of favorited chalet IDs */
    getFavoriteIds: builder.query<string[], void>({
      query: () => "/customer/favorites/ids",
      providesTags: ["Favorite"],
    }),

    /** List my favorite chalets (paginated) */
    getCustomerFavorites: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: "/customer/favorites",
        params,
      }),
      providesTags: ["Favorite"],
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
      // "Review" covers `checkCanReview` — without it the eligibility flag stays
      // at its pre-submission value and the star row stays on screen, inviting a
      // duplicate review the server then rejects.
      invalidatesTags: ["Chalet", "Review"],
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
      invalidatesTags: ["Chalet", "Review"],
    }),

    /** Delete own review */
    deleteReview: builder.mutation({
      query: (id: string) => ({
        url: `/customer/reviews/${id}`,
        method: "DELETE",
      }),
      // Deleting makes the user eligible again, so the eligibility flag has to
      // be refetched here too.
      invalidatesTags: ["Chalet", "Review"],
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
      providesTags: (result: any, error: any, chaletId: string) => [
        { type: "Review" as const, id: chaletId },
      ],
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

    /** Request a wallet payout (withdraw balance to a payment destination) */
    createCustomerPayout: builder.mutation({
      query: (data: {
        amount: number;
        method: "zaincash" | "qi" | "other";
        account: string;
      }) => ({
        url: "/customer/payouts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    /** List my wallet payout requests */
    getCustomerPayouts: builder.query({
      query: (params?: { page?: number; limit?: number; status?: string }) => ({
        url: "/customer/payouts",
        params,
      }),
      providesTags: ["User"],
    }),

    /** Get a single payout request (for the in-app confirmation screen) */
    getCustomerPayout: builder.query({
      query: (id: string) => `/customer/payouts/${id}`,
      providesTags: (result: any, error: any, id: string) => [
        { type: "User" as const, id: `payout-${id}` },
      ],
    }),

    /** Confirm payout details are correct (نعم) */
    confirmCustomerPayout: builder.mutation({
      query: (id: string) => ({
        url: `/customer/payouts/${id}/confirm`,
        method: "PATCH",
      }),
      invalidatesTags: (result: any, error: any, id: string) => [
        "User",
        { type: "User" as const, id: `payout-${id}` },
      ],
    }),

    /** Decline / deny the payout request (لا) */
    declineCustomerPayout: builder.mutation({
      query: (id: string) => ({
        url: `/customer/payouts/${id}/decline`,
        method: "PATCH",
      }),
      invalidatesTags: (result: any, error: any, id: string) => [
        "User",
        { type: "User" as const, id: `payout-${id}` },
      ],
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

    // ── Complaints (Customer) ──────────────────────────────────────────────

    /** Report a problem («تبليغ عن مشكلة») — free-form title + description */
    createComplaint: builder.mutation({
      query: (data: { title?: string; description: string }) => ({
        url: "/complaints",
        method: "POST",
        // `title` is optional server-side; omit it entirely when empty so the
        // DTO's EmptyToNull/IsOptional pair never sees a blank string.
        body: data.title ? data : { description: data.description },
      }),
    }),

    /** My submitted reports, with follow-up status + admin note (paginated) */
    getMyComplaints: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: "/complaints/my",
        params,
      }),
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

    /**
     * Upload the customer's ID-card photos to their profile.
     * The booking API requires customer.idCardFrontImage/idCardBackImage to be
     * set, so the booking form must persist them here before creating a booking.
     */
    uploadIdCardImages: builder.mutation({
      // Receives a PRE-BUILT FormData. Web FormData only accepts a real
      // Blob/File (an RN {uri,name,type} object gets stringified to
      // "[object Object]" → the backend sees no file). The blob conversion is
      // async, so the caller builds the FormData (web→blob, native→object) and
      // passes it here ready to send.
      query: (formData: FormData) => ({
        url: "/users/profile",
        method: "PUT",
        body: formData,
        headers: {},
      }),
      invalidatesTags: ["User"],
    }),

    /**
     * Request phone number change (step 1 — sends the OTP).
     *
     * The field is `newPhone`: `ChangePhoneDto` declares only that, and the API
     * runs its ValidationPipe with `whitelist: true`, so anything else is
     * stripped before validation and the request 400s. The server normalizes the
     * number itself (GET_PHONE), so the local `07XXXXXXXXX` form is fine.
     */
    changePhoneNumber: builder.mutation<any, { newPhone: string }>({
      query: ({ newPhone }) => ({
        url: "/users/change-phone",
        method: "POST",
        body: { newPhone },
      }),
    }),

    /**
     * Verify and complete phone number change (step 2).
     *
     * `UpdateVerifyPhoneDto` requires BOTH fields — the server reads `newPhone`
     * to write the new number, so the OTP alone is not enough — and types `code`
     * as a number, hence the explicit cast.
     */
    verifyPhoneNumberChange: builder.mutation<
      any,
      { newPhone: string; code: string }
    >({
      query: ({ newPhone, code }) => ({
        url: "/users/verify-phone",
        method: "POST",
        body: { newPhone, code: Number(code) },
      }),
      invalidatesTags: ["User"],
    }),

    // ── Notifications ──────────────────────────────────────────────────────

    /**
     * Get all notifications (paginated).
     *
     * This is the ONLY definition of the endpoint that survives — the slice is
     * injected with `overrideExisting: true`, so it replaces the identically
     * named one in apiSlice.ts. The infinite-scroll behaviour therefore lives
     * here: `page` is stripped from the cache key and later pages are appended
     * (deduped by id) instead of replacing the visible list.
     *
     * `role` is accepted so the call sites can keep passing the section they are
     * rendering, but it is NOT sent and NOT part of the cache key. The server
     * DOES scope by role now (NotificationsQuery), and mark-all-as-read takes
     * the same optional scope — this endpoint just deliberately doesn't send it
     * yet, so one unscoped cache entry serves both owner and tenant mode
     * instead of two identical lists polling in parallel. If `role` ever
     * starts being sent here, send it to mark-all-as-read too, and add it to
     * the cache key — the two must stay in lockstep so "mark all" only ever
     * touches the rows the list showed.
     */
    getNotifications: builder.query({
      query: (params?: { page?: number; limit?: number; role?: "owner" | "customer" }) => {
        const { role, ...rest } = params || {};
        return {
          url: "/notifications",
          params: rest,
        };
      },
      serializeQueryArgs: ({ queryArgs }: { queryArgs: any }) => {
        const { page, role, ...rest } = queryArgs || {};
        return rest;
      },
      merge: (currentCache: any, newItems: any, { arg }: { arg: any }) => {
        if (!arg?.page || arg.page === 1 || !currentCache) {
          return newItems;
        }
        const existingData = currentCache.data || [];
        const newData = newItems.data || [];
        const existingIds = new Set(existingData.map((item: any) => item?.id));
        const uniqueNewItems = newData.filter(
          (item: any) => !existingIds.has(item?.id),
        );
        return {
          ...newItems,
          data: [...existingData, ...uniqueNewItems],
          meta: newItems.meta,
        };
      },
      forceRefetch({ currentArg, previousArg }: { currentArg: any; previousArg: any }) {
        return currentArg !== previousArg;
      },
      providesTags: ["Notification"],
    }),

    /**
     * Mark notification as read.
     *
     * The server now looks the row up by the Notification id the list returns
     * (it used to match the UserNotification primary key and silently no-op).
     * The local cache patch below stays anyway: the row and the bell badge
     * settle instantly instead of waiting on the round-trip, and taps keep
     * working against servers that predate the fix.
     */
    markNotificationAsRead: builder.mutation<any, string>({
      query: (id: string) => ({
        url: `/notifications/${id}/mark-as-read`,
        method: "PUT",
      }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const readAt = new Date().toISOString();
        const cachedArgs: any[] = (apiSlice.util.selectCachedArgsForQuery as any)(
          getState(),
          "getNotifications",
        );
        const patches = cachedArgs.map((args) =>
          dispatch(
            (apiSlice.util.updateQueryData as any)(
              "getNotifications",
              args,
              (draft: any) => {
                const item = draft?.data?.find((n: any) => n?.id === id);
                if (item && !item.readAt) item.readAt = readAt;
              },
            ),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch: any) => patch.undo());
        }
      },
    }),

    /**
     * Mark every notification as read in one tap. Same cache strategy as the
     * single-row mutation above: patch every cached notifications page so the
     * dots and the bell badge clear immediately, undo if the server rejects.
     */
    markAllNotificationsAsRead: builder.mutation<any, void>({
      query: () => ({
        url: "/notifications/mark-all-as-read",
        method: "PUT",
      }),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const readAt = new Date().toISOString();
        const cachedArgs: any[] = (apiSlice.util.selectCachedArgsForQuery as any)(
          getState(),
          "getNotifications",
        );
        const patches = cachedArgs.map((args) =>
          dispatch(
            (apiSlice.util.updateQueryData as any)(
              "getNotifications",
              args,
              (draft: any) => {
                draft?.data?.forEach((item: any) => {
                  if (item && !item.readAt) item.readAt = readAt;
                });
              },
            ),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch: any) => patch.undo());
          // A row the user marked individually while this was in flight left no
          // inverse patch of its own (it was already read in the draft), so the
          // undo above wrongly resurrects its dot. Refetch settles the list on
          // server truth instead of guessing.
          dispatch((apiSlice.util as any).invalidateTags(["Notification"]));
        }
      },
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

    /** Active platform terms & conditions shown to customers (public, no auth) */
    getPlatformTerms: builder.query({
      query: () => "/customer/terms",
      transformResponse: unwrapListResponse,
    }),

    /**
     * The discount campaign running on a chalet, if any.
     *
     * These campaigns are funded by the platform's commission — the owner is paid
     * the same either way — so the rate the customer actually gets can be lower
     * than the campaign's headline rate on chalets with a smaller commission.
     * Passing `price` makes the server resolve the exact amount rather than a rate,
     * which is what the checkout summary shows. The booking endpoint applies the
     * discount server-side regardless; this is purely for display.
     */
    /**
     * Price a coupon code against a specific booking BEFORE committing.
     *
     * Never mutates — it only previews. The real redemption happens inside booking
     * creation, which re-validates everything, so a stale preview can never buy a
     * discount the server would not grant.
     */
    validateCoupon: builder.mutation({
      query: (body: { code: string; chaletId: string; price?: number }) => ({
        url: "/customer/coupons/validate",
        method: "POST",
        body,
      }),
    }),

    getChaletDiscount: builder.query({
      query: ({ chaletId, price }: { chaletId: string; price?: number }) => ({
        url: `/discounts/for-chalet/${chaletId}`,
        params: price != null && price > 0 ? { price } : undefined,
      }),
      providesTags: (result: any, error: any, arg: { chaletId: string; price?: number }) => [
        { type: "Chalet" as const, id: arg.chaletId },
      ],
    }),
  }),
});

// Export all generated hooks
export const {
  // Chalets
  useBrowseCustomerChaletsQuery,
  useLazyBrowseCustomerChaletsQuery,
  useGetFeaturedChaletsQuery,
  useSearchChaletsQuery,
  useLazySearchChaletsQuery,
  useGetCustomerChaletDetailsQuery,
  useGetSimilarChaletsQuery,
  useGetChaletAddonsQuery,
  useGetChaletTermsQuery,
  useGetPlatformTermsQuery,
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
  useCreateCustomerPayoutMutation,
  useGetCustomerPayoutsQuery,
  useGetCustomerPayoutQuery,
  useConfirmCustomerPayoutMutation,
  useDeclineCustomerPayoutMutation,
  useGetMyWalletQuery,
  useGetSettingsQuery,

  // Complaints
  useCreateComplaintMutation,
  useGetMyComplaintsQuery,

  // Account
  useDeleteCustomerAccountMutation,

  // Profile
  useUpdateUserProfileMutation,
  useUpdateProfileImageMutation,
  useUploadIdCardImagesMutation,
  useChangePhoneNumberMutation,
  useVerifyPhoneNumberChangeMutation,

  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
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

  // Discounts
  useGetChaletDiscountQuery,

  // Coupons
  useValidateCouponMutation,
} = customerApi;
