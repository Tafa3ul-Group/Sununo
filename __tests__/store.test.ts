// Importing @/store boots redux-persist and the AppState listener for real, so
// the two side-effecting dependencies are mocked before the import: storage
// (so nothing touches the native module) and analytics (so the middleware's
// calls are observable).
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

// persistReducer arms a real 5s "persist timed out" timer on PERSIST that
// outlives the whole file and force-exits the Jest worker. `timeout: 0`
// disables only that watchdog (`timeout && setTimeout(...)`); rehydration and
// the storage writes this file asserts on are untouched.
jest.mock("redux-persist", () => {
  const actual = jest.requireActual("redux-persist");
  return {
    ...actual,
    __esModule: true,
    persistReducer: (config: any, reducer: any) =>
      actual.persistReducer({ ...config, timeout: 0 }, reducer),
  };
});

jest.mock("@/services/analytics", () => ({
  logEvent: jest.fn(),
  logScreenView: jest.fn(),
  setAnalyticsUserId: jest.fn(),
  setUserProps: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ANALYTICS_EVENTS, USER_PROPS } from "@/constants/analytics-events";
import {
  logEvent,
  setAnalyticsUserId,
  setUserProps,
} from "@/services/analytics";
import { persistor, store } from "@/store";
import { apiSlice } from "@/store/api/apiSlice";
import { logout, setCredentials, setLanguage } from "@/store/authSlice";
import { setFilters } from "@/store/filterSlice";

const mockLogEvent = logEvent as jest.Mock;
const mockSetUserId = setAnalyticsUserId as jest.Mock;
const mockSetUserProps = setUserProps as jest.Mock;

const signIn = (overrides: Record<string, any> = {}) =>
  store.dispatch(
    setCredentials({
      user: { id: "u1", type: "customer" },
      token: "tok",
      userType: "customer",
      ...overrides,
    }),
  );

/** Let redux-persist's flush interval run so the write reaches storage. */
const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 60));

/**
 * Seed the api cache with a private response. Timers are faked while the entry
 * is created because RTK Query arms a 60s cache-collection timer per entry,
 * and a real one outlives the Jest environment.
 */
const cacheGetMe = async (data: Record<string, any>) => {
  jest.useFakeTimers();
  try {
    await store.dispatch(apiSlice.util.upsertQueryData("getMe", undefined, data));
  } finally {
    jest.useRealTimers();
  }
};

const lastPersistedRoot = () => {
  const calls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
    ([key]) => key === "persist:root",
  );
  if (calls.length === 0) return null;
  return JSON.parse(calls[calls.length - 1][1]);
};

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Stop the persistoid's write loop so nothing runs past the environment.
  persistor.pause();
});

afterEach(() => {
  // The store is a module singleton shared by every test in this file.
  store.dispatch(logout());
  store.dispatch(apiSlice.util.resetApiState());
  store.dispatch(setLanguage("ar"));
});

describe("store — reducer tree", () => {
  it("mounts the api, auth and filter reducers", () => {
    expect(Object.keys(store.getState())).toEqual(
      expect.arrayContaining(["api", "auth", "filter"]),
    );
  });

  it("mounts the api reducer under the reducerPath the api slice declares", () => {
    expect(apiSlice.reducerPath).toBe("api");
    expect(store.getState().api).toBeDefined();
    expect(store.getState().api.queries).toEqual({});
  });

  it("starts from each slice's own initial state", () => {
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.language).toBe("ar");
    expect(state.filter.adults).toBe(2);
    expect(state.filter.isActive).toBe(false);
  });

  it("exposes the redux-persist bookkeeping key once rehydration has run", async () => {
    await flushPersist();
    expect((store.getState() as any)._persist).toEqual(
      expect.objectContaining({ version: expect.any(Number) }),
    );
  });
});

describe("store — persistence whitelist", () => {
  it("persists only auth and filter — the api cache never reaches storage", async () => {
    signIn();
    store.dispatch(setFilters({ cityId: "baghdad", search: "شاليه" }));
    await flushPersist();

    const persisted = lastPersistedRoot();
    expect(persisted).not.toBeNull();
    // `_persist` is redux-persist's own bookkeeping, not an app slice.
    expect(Object.keys(persisted!).sort()).toEqual(["_persist", "auth", "filter"]);
    expect(persisted).not.toHaveProperty("api");
  });

  it("writes the auth token and the Arabic filter text through unmangled", async () => {
    signIn({ token: "tok-42" });
    store.dispatch(setFilters({ search: "شاليه على النهر" }));
    await flushPersist();

    const persisted = lastPersistedRoot()!;
    // redux-persist stringifies each slice separately.
    expect(JSON.parse(persisted.auth).token).toBe("tok-42");
    expect(JSON.parse(persisted.filter).search).toBe("شاليه على النهر");
  });

  it("keeps api cache entries out of storage even when queries are cached", async () => {
    await cacheGetMe({ id: "u1", phone: "07700000000" });
    store.dispatch(setLanguage("en"));
    await flushPersist();

    const persisted = lastPersistedRoot()!;
    expect(JSON.stringify(persisted)).not.toContain("07700000000");
  });
});

describe("store — analytics middleware", () => {
  it("identifies the user and sets the user properties on setCredentials", () => {
    store.dispatch(setLanguage("en"));
    signIn({ user: { id: 77, type: "provider" }, userType: "owner" });

    expect(mockSetUserId).toHaveBeenCalledWith("77");
    expect(mockSetUserProps).toHaveBeenCalledWith({
      [USER_PROPS.USER_TYPE]: "owner",
      [USER_PROPS.LANGUAGE]: "en",
    });
  });

  it("reads the language from the state as it is AFTER the action landed", () => {
    store.dispatch(setLanguage("ar"));
    signIn();
    expect(mockSetUserProps).toHaveBeenCalledWith(
      expect.objectContaining({ [USER_PROPS.LANGUAGE]: "ar" }),
    );
  });

  it("sends a numeric id 0 as \"0\" rather than dropping it", () => {
    // 0 is falsy but a legitimate id — the guard is `!= null`, not truthiness.
    signIn({ user: { id: 0, type: "customer" } });
    expect(mockSetUserId).toHaveBeenCalledWith("0");
  });

  it("still sets the user properties when the user carries no id", () => {
    signIn({ user: { type: "customer" }, userType: "customer" });
    expect(mockSetUserId).not.toHaveBeenCalled();
    expect(mockSetUserProps).toHaveBeenCalledWith(
      expect.objectContaining({ [USER_PROPS.USER_TYPE]: "customer" }),
    );
  });

  it("does not identify anyone when the user object itself is null", () => {
    signIn({ user: null, userType: "guest" });
    expect(mockSetUserId).not.toHaveBeenCalled();
    expect(mockSetUserProps).toHaveBeenCalledWith(
      expect.objectContaining({ [USER_PROPS.USER_TYPE]: "guest" }),
    );
  });

  it("reports an absent userType as undefined instead of null", () => {
    signIn({ userType: null });
    expect(mockSetUserProps).toHaveBeenCalledWith({
      [USER_PROPS.USER_TYPE]: undefined,
      [USER_PROPS.LANGUAGE]: "ar",
    });
  });

  it("logs the logout event and clears the analytics identity", () => {
    signIn();
    mockLogEvent.mockClear();
    store.dispatch(logout());

    expect(mockLogEvent).toHaveBeenCalledWith(ANALYTICS_EVENTS.LOGOUT);
    expect(mockSetUserId).toHaveBeenLastCalledWith(null);
  });

  it("ignores actions it does not care about", () => {
    store.dispatch(setLanguage("en"));
    store.dispatch(setFilters({ cityId: "c1" }));
    expect(mockSetUserId).not.toHaveBeenCalled();
    expect(mockSetUserProps).not.toHaveBeenCalled();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it("lets the action reach the reducer even when analytics throws", () => {
    mockSetUserId.mockImplementationOnce(() => {
      throw new Error("firebase not linked");
    });
    mockSetUserProps.mockImplementationOnce(() => {
      throw new Error("firebase not linked");
    });

    expect(() => signIn({ user: { id: "u9", type: "provider" } })).not.toThrow();
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.token).toBe("tok");
  });

  it("lets logout complete even when analytics throws", () => {
    signIn();
    mockLogEvent.mockImplementationOnce(() => {
      throw new Error("firebase not linked");
    });

    expect(() => store.dispatch(logout())).not.toThrow();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });
});

describe("store — api cache lifetime across sessions", () => {
  const cacheMe = () =>
    cacheGetMe({ id: "u1", phone: "07700000000", name: "حسن" });

  it("keeps the cache populated while the session is live", async () => {
    await cacheMe();
    expect(
      apiSlice.endpoints.getMe.select(undefined)(store.getState() as any).data,
    ).toEqual(expect.objectContaining({ phone: "07700000000" }));
  });

  it("resetApiState does drop the cached private data", async () => {
    await cacheMe();
    store.dispatch(apiSlice.util.resetApiState());
    expect(store.getState().api.queries).toEqual({});
  });

  // The root reducer drops the api slice on logout, so no logout call site has
  // to remember to reset the cache itself.
  it("logout drops the signed-out user's cached private data", async () => {
    await cacheMe();
    store.dispatch(logout());

    const cached = apiSlice.endpoints.getMe.select(undefined)(
      store.getState() as any,
    ).data;
    expect(cached).toBeUndefined();
  });

  // Same guarantee from the account-switch angle — B never reads A's cached
  // profile, whether or not the switch went through logout.
  it("a second account signing in does not inherit the first one's cache", async () => {
    await cacheMe();
    store.dispatch(logout());
    signIn({ user: { id: "u2", type: "customer" }, token: "tok-b" });

    expect(store.getState().api.queries).toEqual({});
  });
});
