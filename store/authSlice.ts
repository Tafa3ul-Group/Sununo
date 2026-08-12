import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * The section of the app the user is currently in — NOT what the account is.
 * A chalet owner may run in 'customer' mode to browse and book like any tenant.
 * Every route guard keys off this.
 */
export type UserType = 'owner' | 'customer' | 'guest' | null;

/**
 * What the account actually IS on the server (`user.type`). Fixed for the
 * session; only a `provider` account is allowed into owner mode. Keeping it
 * apart from `userType` is what makes mode switching possible without letting a
 * plain tenant walk into the dashboard.
 */
export type AccountType = 'provider' | 'customer' | null;

const toAccountType = (user: any): AccountType =>
  user ? (user?.type === 'provider' ? 'provider' : 'customer') : null;

/**
 * Whether two server users are the same person. Ids come back as a number from
 * some endpoints and a string from others, so they are compared as text. A
 * missing id is never "the same" — otherwise a malformed response would let the
 * previous account's data survive a sign-in.
 */
export const isSameAccount = (a: any, b: any): boolean =>
  a?.id != null && b?.id != null && String(a.id) === String(b.id);

interface AuthState {
  user: any | null;
  token: string | null;
  userType: UserType;
  accountType: AccountType;
  isAuthenticated: boolean;
  language: 'ar' | 'en';
  selectedChalet: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  userType: null,
  accountType: null,
  isAuthenticated: false,
  language: 'ar',
  selectedChalet: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: any;
        token: string;
        userType: UserType;
        accountType?: AccountType;
      }>
    ) => {
      const { user, token, userType, accountType } = action.payload;
      // A different person signing in on this device must not inherit the last
      // one's working context. Every signed-in path goes through logout() first
      // today, which is the only reason this never bit us; a re-login by the
      // same account (token refresh) still keeps the chalet they were managing.
      if (!isSameAccount(state.user, user)) state.selectedChalet = null;
      state.user = user;
      state.token = token;
      state.userType = userType;
      // Derived from the server user when a caller doesn't pass it, so no sign-in
      // path can leave the account identity unset.
      state.accountType = accountType ?? toAccountType(user);
      state.isAuthenticated = true;
    },
    /**
     * Refresh the persisted copy of the server user after a profile change.
     *
     * `setCredentials` used to be the ONLY writer of `state.user`, which made
     * `auth.user` a sign-in snapshot: editing the name/photo/phone refetched
     * `getMe` but never wrote the result back, so the drawer, the tab-bar
     * avatar and the booking screens kept rendering the old values — and
     * because `auth` is persisted, the stale copy survived restarts until the
     * next sign-in.
     *
     * Merges rather than replaces: the payload comes from several endpoints
     * (`GET /auth/me`, `PUT /users/profile`, `PUT /users/profile/image`) whose
     * user objects don't all carry the same keys, and a key that is simply
     * absent must not erase what we already know. A key that IS present wins,
     * including when it's null — that's the server clearing a field.
     *
     * Two guards, both about identity rather than freshness:
     *  - no session, no write. A `getMe` still in flight when the user logs
     *    out (or deletes the account) would otherwise resurrect the user
     *    object next to a null token.
     *  - a payload for a different account is dropped, so a response that
     *    lands after someone else signs in can't overwrite the new session.
     *    A payload with no id at all is trusted, since it can only have been
     *    fetched with the current token.
     */
    updateUser: (state, action: PayloadAction<any>) => {
      const incoming = action.payload;
      if (!incoming || !state.isAuthenticated || !state.user) return;
      if (incoming.id != null && !isSameAccount(state.user, incoming)) return;
      state.user = { ...state.user, ...incoming };
      // The server's word on what this account is, so an account that becomes a
      // provider gets the mode switcher without signing out and back in. If it
      // stops being one, owner mode goes with it — `switchMode` would refuse to
      // re-enter it anyway, and the tab layout routes off `userType`, so
      // leaving that alone would strand a non-provider in the dashboard.
      state.accountType = toAccountType(state.user);
      if (state.accountType !== 'provider' && state.userType === 'owner') {
        state.userType = 'customer';
      }
    },
    /**
     * Set the active section directly. The tab layout routes purely off
     * `userType`, so this carries the same authorization weight as switchMode
     * and gets the same gate: a signed-in account that is not a provider is
     * never moved into owner mode. The gate is scoped to a live session because
     * the login screen dispatches 'owner' *before* anyone is authenticated — it
     * only remembers which side of the toggle to show — and that state can't
     * reach the dashboard, since the root layout bounces an unauthenticated
     * user back to /login.
     */
    setUserType: (state, action: PayloadAction<UserType>) => {
      const account = state.accountType ?? toAccountType(state.user);
      if (action.payload === 'owner' && state.isAuthenticated && account !== 'provider') return;
      state.userType = action.payload;
    },
    /**
     * Move between the tenant and owner sections of the app. Owner mode is
     * refused for anything but a provider account — this is the client-side
     * gate, and it reads `accountType`, which only ever comes from the server.
     */
    switchMode: (state, action: PayloadAction<'owner' | 'customer'>) => {
      const account = state.accountType ?? toAccountType(state.user);
      if (action.payload === 'owner' && account !== 'provider') return;
      state.userType = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'ar' | 'en'>) => {
      state.language = action.payload;
    },
    setSelectedChalet: (state, action: PayloadAction<AuthState['selectedChalet']>) => {
      state.selectedChalet = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userType = null;
      state.accountType = null;
      state.isAuthenticated = false;
      state.selectedChalet = null;
    },
  },
});

export const { setCredentials, updateUser, setUserType, switchMode, setLanguage, setSelectedChalet, logout } = authSlice.actions;

/**
 * Account identity, with a fallback for sessions persisted before `accountType`
 * existed — those rehydrate with it undefined but still carry the server user,
 * so an already-signed-in owner gets the switcher without re-authenticating.
 */
export const selectAccountType = (state: { auth: AuthState }): AccountType =>
  state.auth.accountType ?? toAccountType(state.auth.user);

export default authSlice.reducer;
