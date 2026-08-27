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

/**
 * Every `type` the API can actually hand back (`UserTypeEnum` in
 * sununo-api/src/users/entities/user.entity.ts), plus 'customer' — the enum
 * calls a tenant 'user', but the word travels through enough of this app's own
 * payloads that refusing it would be a trap for no benefit.
 */
const KNOWN_USER_TYPES = ['admin', 'customer', 'employee', 'provider', 'user'];

/**
 * Anything outside that list — including a payload that simply doesn't carry
 * `type` — resolves to null, meaning "not known", NOT "tenant". Reading the
 * unknown case as a tenant is what let a partial profile response silently
 * demote a chalet owner into the customer app.
 */
const toAccountType = (user: any): AccountType => {
  const type = user?.type;
  if (type === 'provider') return 'provider';
  return KNOWN_USER_TYPES.includes(type) ? 'customer' : null;
};

/**
 * Where a session lands when nobody explicitly picked a side: a provider
 * account belongs in its own dashboard. The login toggle used to be the only
 * input here and it defaults to "مستأجر", so an owner who never touched it was
 * persisted as a tenant and relaunched into the customer app from then on.
 */
export const defaultSectionFor = (accountType: AccountType): 'owner' | 'customer' =>
  accountType === 'provider' ? 'owner' : 'customer';

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
  /**
   * Did a human actually pick this section, or is it just where we put them?
   * Only an explicit choice outranks the account's own default at cold start.
   * Sessions persisted before this existed rehydrate without the key, which
   * reads as false — i.e. "never chosen" — which is exactly right for them.
   */
  sectionChosen: boolean;
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
  sectionChosen: false,
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
        /** True only when the human moved the section toggle themselves. */
        chosenByUser?: boolean;
      }>
    ) => {
      const { user, token, userType, accountType, chosenByUser } = action.payload;
      // A different person signing in on this device must not inherit the last
      // one's working context. Every signed-in path goes through logout() first
      // today, which is the only reason this never bit us; a re-login by the
      // same account (token refresh) still keeps the chalet they were managing.
      if (!isSameAccount(state.user, user)) state.selectedChalet = null;
      state.user = user;
      state.token = token;
      // Derived from the server user when a caller doesn't pass it, so no sign-in
      // path can leave the account identity unset.
      const resolvedAccount = accountType ?? toAccountType(user);
      state.accountType = resolvedAccount;
      // `userType` is only authoritative when the human actually chose it. The
      // sign-in toggle defaults to "مستأجر" and most owners never touch it, so
      // trusting it unconditionally filed every one of them as a tenant.
      state.userType = chosenByUser ? userType : defaultSectionFor(resolvedAccount);
      state.sectionChosen = !!chosenByUser;
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
      //
      // Only a RECOGNISED type may move the identity, though. Several of these
      // payloads (an image upload, an envelope-shaped response) carry no `type`
      // at all, and resolving that to 'customer' demoted a live owner — the
      // second way an owner ended up relaunching into the tenant app.
      const resolvedAccount = toAccountType(state.user);
      if (!resolvedAccount) return;
      state.accountType = resolvedAccount;
      if (resolvedAccount !== 'provider' && state.userType === 'owner') {
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
      // 'guest' is the marker for a *signed-out* browser. Writing it over a live
      // session strands that account in a guest shell — the login screen's
      // "browse as guest" link is reachable while an owner is still signed in,
      // and every guard downstream then treats a real owner as a visitor.
      if (action.payload === 'guest' && state.isAuthenticated) return;
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
      // This one IS the user asking, so it outranks the account default at the
      // next cold start.
      state.sectionChosen = true;
    },
    /**
     * Follow a notification into the other section. Same gate as `switchMode`,
     * but deliberately does NOT record a choice: one tap on a customer-role push
     * used to move an owner to the tenant app permanently, because it wrote the
     * same persisted value the boot router reads. The next launch now puts them
     * back where the account belongs.
     */
    enterSection: (state, action: PayloadAction<'owner' | 'customer'>) => {
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
    /**
     * `reason: 'expired'` marks the involuntary sign-out the api slice fires on a
     * 401 — the session died under the user, they did not ask for this. Nothing
     * in the reducer branches on it; store/index.ts uses it to decide whether the
     * "this phone was an owner" hint should survive.
     */
    logout: (state, _action: PayloadAction<{ reason?: 'expired' } | undefined>) => {
      state.user = null;
      state.token = null;
      state.userType = null;
      state.accountType = null;
      state.sectionChosen = false;
      state.isAuthenticated = false;
      state.selectedChalet = null;
    },
  },
});

export const { setCredentials, updateUser, setUserType, switchMode, enterSection, setLanguage, setSelectedChalet, logout } = authSlice.actions;

/**
 * Account identity, with a fallback for sessions persisted before `accountType`
 * existed — those rehydrate with it undefined but still carry the server user,
 * so an already-signed-in owner gets the switcher without re-authenticating.
 */
export const selectAccountType = (state: { auth: AuthState }): AccountType =>
  state.auth.accountType ?? toAccountType(state.auth.user);

/**
 * The section a cold start should open. An explicit choice wins; otherwise the
 * account decides, so an owner who never touched the sign-in toggle — or who was
 * moved by a notification tap — still opens their dashboard.
 */
export const selectLandingSection = (state: { auth: AuthState }): UserType => {
  const { userType, sectionChosen } = state.auth;
  // A guest is a signed-out browser, not a section anyone chose.
  if (userType === 'guest') return 'guest';
  if (sectionChosen && userType) return userType;
  return defaultSectionFor(selectAccountType(state));
};

export default authSlice.reducer;
