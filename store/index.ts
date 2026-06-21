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
import authReducer, { logout, setCredentials } from './authSlice';
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

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'filter'], // persist auth + filter
};

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  filter: filterReducer,
});

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
