import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import {
    FLUSH,
    PAUSE,
    PERSIST,
    persistReducer,
    persistStore,
    PURGE,
    REGISTER,
    REHYDRATE,
} from 'redux-persist';
import type { Middleware } from '@reduxjs/toolkit';
import { ANALYTICS_EVENTS, USER_PROPS } from '@/constants/analytics-events';
import { logEvent, setAnalyticsUserId, setUserProps } from '@/services/analytics';
import { apiSlice } from './api/apiSlice';
import './api/customerApiSlice';
import authReducer, { isSameAccount, logout, setCredentials } from './authSlice';
import filterReducer from './filterSlice';

// Use AsyncStorage directly — no dynamic require needed
// Safeguard storage for SSR environments
const storage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return AsyncStorage.getItem(key);
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      return AsyncStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return AsyncStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

// KNOWN GAP — the bearer token rides along here in PLAINTEXT. `auth` holds
// `token`, which apiSlice sends as the Authorization header on every request,
// and this storage adapter is plain AsyncStorage: an unencrypted SQLite row on
// Android, an unprotected file on iOS, both readable on a rooted/jailbroken
// device or out of an unencrypted backup. The token is long-lived — the API
// only invalidates it on an explicit POST /auth/logout, there is no rotation —
// so a copied one is replayable as that user.
//
// The fix is a nested persistConfig on the `auth` slice that routes `token`
// through expo-secure-store. It is NOT applied here because that package is
// not a dependency yet and adding it needs a new native build; see the release
// notes / needs_human_decision. Until then, do not widen this whitelist, and
// keep anything more sensitive than the session out of the persisted slices.
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'filter'], // persist auth + filter
};

const combinedReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  filter: filterReducer,
});

type CombinedState = ReturnType<typeof combinedReducer>;

// Every private response the app has fetched — profile, bookings, wallet,
// notifications — sits in the api slice's cache, and nothing used to clear it,
// so the next person to open the app could still read the previous account's
// data out of the store before a refetch landed.
//
// Dropping it here, above combineReducers, covers EVERY logout at once: the
// profile screens, the account-deletion flow and the 401 auto-logout inside
// baseQueryWithReauth all go through the same action, and none of them has to
// remember to reset the cache. An account switch that skips logout is handled
// too — signing in as someone else over a live session wipes it just the same.
// Handing the api slice `undefined` makes combineReducers rebuild it from the
// slice's own initial state. Nothing to clean up in storage: the persist
// whitelist is auth + filter, so the cache never reaches AsyncStorage.
const rootReducer = ((state: CombinedState | undefined, action: any) => {
  const switchesAccount =
    setCredentials.match(action) &&
    !!state?.auth.isAuthenticated &&
    !isSameAccount(state.auth.user, action.payload.user);

  if (state && (logout.match(action) || switchesAccount)) {
    state = { ...state, [apiSlice.reducerPath]: undefined as any };
  }
  return combinedReducer(state, action);
}) as typeof combinedReducer;

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Analytics middleware: centralizes GA4 user identity. Setting user_id + user
// properties here (on setCredentials) avoids duplicating identity code in the
// login/register screens. The login/sign_up events themselves are fired in
// those screens, since both dispatch setCredentials and can't be distinguished
// here. All calls are fire-and-forget and wrapped so analytics never breaks the
// store.
const analyticsMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  try {
    if (setCredentials.match(action)) {
      const { user, userType } = action.payload;
      if (user?.id != null) setAnalyticsUserId(String(user.id));
      setUserProps({
        [USER_PROPS.USER_TYPE]: userType ?? undefined,
        [USER_PROPS.LANGUAGE]: (api.getState() as RootState).auth.language,
      });
    } else if (logout.match(action)) {
      logEvent(ANALYTICS_EVENTS.LOGOUT);
      setAnalyticsUserId(null);
    }
  } catch {
    // Analytics must never break the store.
  }
  return result;
};

export const store = configureStore({
  reducer: persistedReducer,
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware, analyticsMiddleware),
});

export const persistor = persistStore(store);

// Required for refetchOnFocus/refetchOnReconnect to work in React Native.
// The default setupListeners attaches to web `window` focus/online events, which
// don't exist in RN — so we wire RTK Query's onFocus/onFocusLost to AppState.
// This makes subscribed/stale queries refetch whenever the app returns to the
// foreground, so the customer sees the owner's edits without a long delay.
setupListeners(store.dispatch, (dispatch, { onFocus, onFocusLost }) => {
  const subscription = AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      dispatch(onFocus());
    } else {
      dispatch(onFocusLost());
    }
  });
  return () => subscription.remove();
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
