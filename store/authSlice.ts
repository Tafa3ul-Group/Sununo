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
      state.user = user;
      state.token = token;
      state.userType = userType;
      // Derived from the server user when a caller doesn't pass it, so no sign-in
      // path can leave the account identity unset.
      state.accountType = accountType ?? toAccountType(user);
      state.isAuthenticated = true;
    },
    setUserType: (state, action: PayloadAction<UserType>) => {
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

export const { setCredentials, setUserType, switchMode, setLanguage, setSelectedChalet, logout } = authSlice.actions;

/**
 * Account identity, with a fallback for sessions persisted before `accountType`
 * existed — those rehydrate with it undefined but still carry the server user,
 * so an already-signed-in owner gets the switcher without re-authenticating.
 */
export const selectAccountType = (state: { auth: AuthState }): AccountType =>
  state.auth.accountType ?? toAccountType(state.auth.user);

export default authSlice.reducer;
