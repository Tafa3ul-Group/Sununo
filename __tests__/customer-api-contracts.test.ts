// AsyncStorage has no native module under Jest and `@/utils/device` (pulled in
// by apiSlice) imports it at module scope.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/store/api/apiSlice";
import { customerApi } from "@/store/api/customerApiSlice";

// ─────────────────────────────────────────────────────────────────────────────
// These lock the wire format of the endpoints whose payload the API validates
// strictly (ValidationPipe `whitelist: true` drops anything the DTO does not
// declare, so a renamed field is a guaranteed 400), plus the cache behaviour
// that decides what the notification and favourites screens render.
//
// Nothing is re-declared here: the real endpoints run on a real store with
// `fetch` stubbed, and the captured Request is read back.
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const makeStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      // prepareHeaders reads state.auth.token
      auth: (state = { token: null }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

/** Stub fetch, returning the queue of bodies in order, and record every request. */
const stubFetch = (bodies: unknown[]) => {
  let call = 0;
  (global as any).fetch = jest.fn(async () => {
    const body = bodies[Math.min(call++, bodies.length - 1)];
    return {
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => (body === undefined ? "" : JSON.stringify(body)),
      clone() {
        return this;
      },
    };
  });
};

/** The Request object handed to `fetch` on the nth call. */
const requestAt = (n: number): any => (global as any).fetch.mock.calls[n][0];

describe("phone-change payloads match the API DTOs", () => {
  it("change-phone sends `newPhone` (ChangePhoneDto declares only that field)", async () => {
    stubFetch([{ message: "Code sent" }]);
    const store = makeStore();

    await store.dispatch(
      customerApi.endpoints.changePhoneNumber.initiate({
        newPhone: "07701234567",
      }) as any,
    );

    const req = requestAt(0);
    expect(req.url).toContain("/users/change-phone");
    expect(req.method).toBe("POST");
    await expect(req.text()).resolves.toBe(
      JSON.stringify({ newPhone: "07701234567" }),
    );
  });

  it("verify-phone sends BOTH `newPhone` and a numeric `code`", async () => {
    stubFetch([{ id: "u1" }]);
    const store = makeStore();

    await store.dispatch(
      customerApi.endpoints.verifyPhoneNumberChange.initiate({
        newPhone: "07701234567",
        code: "123456",
      }) as any,
    );

    const req = requestAt(0);
    expect(req.url).toContain("/users/verify-phone");
    await expect(req.text()).resolves.toBe(
      JSON.stringify({ newPhone: "07701234567", code: 123456 }),
    );
  });
});

describe("getNotifications", () => {
  const page = (ids: string[], meta: any) => ({
    data: ids.map((id) => ({ id, title: id, text: id, readAt: null })),
    meta,
  });

  it("does not send the `role` param — the API strips it, so it only forks the cache", async () => {
    stubFetch([page(["a"], { total: 1, page: 1, limit: 15, totalPages: 1 })]);
    const store = makeStore();

    await store.dispatch(
      customerApi.endpoints.getNotifications.initiate({
        page: 1,
        limit: 15,
        role: "owner",
      }) as any,
    );

    expect(requestAt(0).url).not.toContain("role");
  });

  it("owner and tenant mode share one cache entry instead of holding two copies", async () => {
    stubFetch([page(["a"], { total: 1, page: 1, limit: 50, totalPages: 1 })]);
    const store = makeStore();

    const owner = store.dispatch(
      customerApi.endpoints.getNotifications.initiate({
        page: 1,
        limit: 50,
        role: "owner",
      }) as any,
    );
    const customer = store.dispatch(
      customerApi.endpoints.getNotifications.initiate({
        page: 1,
        limit: 50,
        role: "customer",
      }) as any,
    );
    await Promise.all([owner, customer]);

    const entries = Object.keys(
      (store.getState() as any).api.queries,
    ).filter((key) => key.startsWith("getNotifications("));
    expect(entries).toHaveLength(1);
  });

  it("appends later pages (deduped) instead of replacing the visible list", async () => {
    const meta = { total: 3, limit: 1, totalPages: 3 };
    stubFetch([
      page(["a"], { ...meta, page: 1 }),
      // 'a' repeats — the API can shift rows between pages; it must not double up
      page(["a", "b"], { ...meta, page: 2 }),
    ]);
    const store = makeStore();

    await store.dispatch(
      customerApi.endpoints.getNotifications.initiate({
        page: 1,
        limit: 1,
      }) as any,
    );
    const second: any = await store.dispatch(
      customerApi.endpoints.getNotifications.initiate({
        page: 2,
        limit: 1,
      }) as any,
    );

    expect(second.data.data.map((n: any) => n.id)).toEqual(["a", "b"]);
  });
});

describe("markNotificationAsRead", () => {
  const list = {
    data: [
      { id: "n1", title: "n1", text: "n1", readAt: null },
      { id: "n2", title: "n2", text: "n2", readAt: null },
    ],
    meta: { total: 2, page: 1, limit: 50, totalPages: 1 },
  };

  it("marks the row read locally so the badge clears (the API's write never lands)", async () => {
    stubFetch([list, { message: "NOTIFICATION_MARKED_AS_READ" }]);
    const store = makeStore();
    const args = { page: 1, limit: 50, role: "customer" as const };

    await store.dispatch(customerApi.endpoints.getNotifications.initiate(args) as any);
    await store.dispatch(
      customerApi.endpoints.markNotificationAsRead.initiate("n1") as any,
    );

    const rows = customerApi.endpoints.getNotifications.select(args)(
      store.getState() as any,
    ).data.data;
    expect(rows.find((n: any) => n.id === "n1").readAt).toEqual(expect.any(String));
    expect(rows.find((n: any) => n.id === "n2").readAt).toBeNull();
  });
});

describe("favourites", () => {
  it("toggling patches the cached id list immediately", async () => {
    stubFetch([["chalet-1"], { favorited: false }]);
    const store = makeStore();

    await store.dispatch(customerApi.endpoints.getFavoriteIds.initiate() as any);
    await store.dispatch(
      customerApi.endpoints.toggleFavorite.initiate("chalet-1") as any,
    );

    const ids = customerApi.endpoints.getFavoriteIds.select()(
      store.getState() as any,
    ).data;
    expect(ids).toEqual([]);
  });

  it("rolls the patch back when the server rejects the toggle", async () => {
    const store = makeStore();
    // Keyed by URL, not by call order: a failed toggle can still trigger a
    // follow-up read, and an unmatched call would look like a rollback.
    (global as any).fetch = jest.fn(async (request: any) => {
      const failing = String(request.url).includes("/toggle/");
      return {
        status: failing ? 500 : 200,
        ok: !failing,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () =>
          failing ? JSON.stringify({ message: "boom" }) : JSON.stringify(["chalet-1"]),
        clone() {
          return this;
        },
      };
    });

    await store.dispatch(customerApi.endpoints.getFavoriteIds.initiate() as any);
    await store.dispatch(
      customerApi.endpoints.toggleFavorite.initiate("chalet-1") as any,
    );

    const ids = customerApi.endpoints.getFavoriteIds.select()(
      store.getState() as any,
    ).data;
    expect(ids).toEqual(["chalet-1"]);
  });
});
