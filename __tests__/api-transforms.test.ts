// AsyncStorage has no native module under Jest and `@/utils/device` (pulled in
// by apiSlice) imports it at module scope.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { configureStore } from "@reduxjs/toolkit";
import { apiSlice, unwrapListResponse } from "@/store/api/apiSlice";
import { customerApi } from "@/store/api/customerApiSlice";

// ─────────────────────────────────────────────────────────────────────────────
// The endpoint-level transforms are inline arrow functions and RTK Query does
// not re-expose them on `api.endpoints.<name>` (only select/initiate/matchers).
// So they are exercised the only honest way: run the real endpoint on a real
// store with `fetch` stubbed to return the body under test, and read back the
// transformed `data`. Nothing is re-declared here — this is the shipped code.
// ─────────────────────────────────────────────────────────────────────────────

// RTK Query schedules a `keepUnusedDataFor` (60s) cleanup timer per cache entry.
// Left pending, those timers fire after Jest tears the environment down and fail
// the run, so the suite drives fake timers and clears them between tests.
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

/** Stub fetch so the endpoint receives `body` verbatim, then return the transformed data. */
const runEndpoint = async (endpoint: any, arg: any, body: unknown) => {
  (global as any).fetch = jest.fn(async () => ({
    status: 200,
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
    clone() {
      return this;
    },
  }));

  const store = makeStore();
  const promise = store.dispatch(endpoint.initiate(arg));
  const result: any = await promise;
  promise.unsubscribe?.();
  store.dispatch(apiSlice.util.resetApiState());

  if (result.error) {
    throw new Error(`endpoint rejected: ${JSON.stringify(result.error)}`);
  }
  return result.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// unwrapListResponse — the shared "give me an array no matter what" unwrapper
// ─────────────────────────────────────────────────────────────────────────────

describe("unwrapListResponse", () => {
  it("passes a bare array straight through", () => {
    const list = [{ id: "1" }, { id: "2" }];
    expect(unwrapListResponse(list)).toBe(list); // same reference, not a copy
  });

  it("unwraps { data: [] }", () => {
    expect(unwrapListResponse({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it("unwraps the paginated { data: { data: [] } } envelope", () => {
    expect(
      unwrapListResponse({ data: { data: ["a"], meta: { total: 1 } } }),
    ).toEqual(["a"]);
  });

  it("unwraps { data: { items: [] } }", () => {
    expect(unwrapListResponse({ data: { items: ["x"] } })).toEqual(["x"]);
  });

  it("unwraps { data: { cities: [] } }", () => {
    expect(unwrapListResponse({ data: { cities: ["بغداد"] } })).toEqual([
      "بغداد",
    ]);
  });

  it("unwraps a top-level { items: [] }", () => {
    expect(unwrapListResponse({ items: [{ id: 7 }] })).toEqual([{ id: 7 }]);
  });

  it("unwraps a top-level { cities: [] }", () => {
    expect(unwrapListResponse({ cities: ["كربلاء", "أربيل"] })).toEqual([
      "كربلاء",
      "أربيل",
    ]);
  });

  it("keeps an empty array as an empty array instead of falling through", () => {
    // `Array.isArray` — not truthiness — so an empty page is not mistaken for
    // "no list here" and re-searched further down the ladder.
    const empty: any[] = [];
    expect(unwrapListResponse({ data: empty })).toBe(empty);
    expect(unwrapListResponse({ data: { data: empty } })).toBe(empty);
  });

  it("returns [] for null, undefined and an empty object", () => {
    expect(unwrapListResponse(null)).toEqual([]);
    expect(unwrapListResponse(undefined)).toEqual([]);
    expect(unwrapListResponse({})).toEqual([]);
  });

  it("returns [] for primitives (string, empty string, number, zero, boolean)", () => {
    expect(unwrapListResponse("not json at all")).toEqual([]);
    expect(unwrapListResponse("")).toEqual([]);
    expect(unwrapListResponse(42)).toEqual([]);
    expect(unwrapListResponse(0)).toEqual([]);
    expect(unwrapListResponse(-1)).toEqual([]);
    expect(unwrapListResponse(false)).toEqual([]);
  });

  it("returns [] when data is present but not a list", () => {
    expect(unwrapListResponse({ data: null })).toEqual([]);
    expect(unwrapListResponse({ data: {} })).toEqual([]);
    expect(unwrapListResponse({ data: "oops" })).toEqual([]);
    expect(unwrapListResponse({ data: { data: null, items: null } })).toEqual(
      [],
    );
  });

  it("prefers data over every deeper branch when both are present", () => {
    expect(
      unwrapListResponse({ data: ["outer"], items: ["top-level"] }),
    ).toEqual(["outer"]);
    expect(
      unwrapListResponse({ items: ["top-level"], cities: ["city"] }),
    ).toEqual(["top-level"]);
  });

  it("prefers data.data over data.items over data.cities", () => {
    const body = {
      data: { data: ["nested-data"], items: ["nested-items"], cities: ["nested-cities"] },
    };
    expect(unwrapListResponse(body)).toEqual(["nested-data"]);
    expect(
      unwrapListResponse({ data: { items: ["nested-items"], cities: ["c"] } }),
    ).toEqual(["nested-items"]);
  });

  it("prefers the nested envelope over a same-named top-level key", () => {
    expect(
      unwrapListResponse({ data: { items: ["nested"] }, items: ["top"] }),
    ).toEqual(["nested"]);
    expect(
      unwrapListResponse({ data: { cities: ["nested"] }, cities: ["top"] }),
    ).toEqual(["nested"]);
  });

  it("survives a very large list and unicode payloads", () => {
    const big = Array.from({ length: 10_000 }, (_, i) => ({ id: i }));
    expect(unwrapListResponse({ data: { data: big } })).toHaveLength(10_000);
    expect(unwrapListResponse({ items: ["🏖️ شاليه", "الحلة"] })).toEqual([
      "🏖️ شاليه",
      "الحلة",
    ]);
  });

  it("always hands the caller something .map()-able", () => {
    const junk = [
      null,
      undefined,
      0,
      "",
      "string",
      NaN,
      true,
      {},
      { data: undefined },
      { data: { data: "x" } },
      { cities: null },
      { items: 5 },
      new Date(),
      () => {},
    ];
    junk.forEach((input) => {
      const out = unwrapListResponse(input);
      expect(Array.isArray(out)).toBe(true);
      expect(() => out.map((x: any) => x)).not.toThrow();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// unwrapListResponse as it is actually wired into endpoints
// ─────────────────────────────────────────────────────────────────────────────

describe("endpoints that transform with unwrapListResponse", () => {
  it("getCities unwraps the { data: { cities } } envelope", async () => {
    const data = await runEndpoint(apiSlice.endpoints.getCities, undefined, {
      data: { cities: [{ id: "1", name: "بغداد" }] },
    });
    expect(data).toEqual([{ id: "1", name: "بغداد" }]);
  });

  it("getPolicies unwraps the paginated envelope", async () => {
    const data = await runEndpoint(apiSlice.endpoints.getPolicies, undefined, {
      data: { data: [{ id: "p1", type: "privacy" }], meta: { total: 1 } },
    });
    expect(data).toEqual([{ id: "p1", type: "privacy" }]);
  });

  it("getProviderTerms returns [] for a malformed body instead of throwing", async () => {
    const data = await runEndpoint(
      apiSlice.endpoints.getProviderTerms,
      undefined,
      { unexpected: "shape" },
    );
    expect(data).toEqual([]);
  });

  it("getCityNames (customer) accepts a bare array", async () => {
    const data = await runEndpoint(
      customerApi.endpoints.getCityNames,
      undefined,
      [{ id: "c1", name: { ar: "النجف", en: "Najaf" } }],
    );
    expect(data).toEqual([{ id: "c1", name: { ar: "النجف", en: "Najaf" } }]);
  });

  it("getPlatformTerms falls back to [] on an empty response body", async () => {
    const data = await runEndpoint(
      customerApi.endpoints.getPlatformTerms,
      undefined,
      undefined, // empty body -> fetchBaseQuery yields null
    );
    expect(data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPolicy — transformResponse: res?.data ?? res
// ─────────────────────────────────────────────────────────────────────────────

describe("getPolicy transformResponse", () => {
  const policy = {
    id: "pol-1",
    type: "privacy",
    title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    content: { ar: "المحتوى", en: "Content" },
    version: 3,
    isActive: true,
  };

  it("unwraps the { data } envelope", async () => {
    const data = await runEndpoint(apiSlice.endpoints.getPolicy, "privacy", {
      data: policy,
    });
    expect(data).toEqual(policy);
  });

  it("passes an already-unwrapped policy through untouched", async () => {
    const data = await runEndpoint(apiSlice.endpoints.getPolicy, "terms_of_use", policy);
    expect(data).toEqual(policy);
  });

  it("keeps a falsy-but-present data value (?? not ||)", async () => {
    // An empty-string body must not be re-read as "no envelope"; `??` only
    // falls back on null/undefined.
    const data = await runEndpoint(apiSlice.endpoints.getPolicy, "privacy", {
      data: "",
    });
    expect(data).toBe("");
  });

  it("hands back the envelope itself when data is null", async () => {
    const data = await runEndpoint(apiSlice.endpoints.getPolicy, "privacy", {
      data: null,
    });
    expect(data).toEqual({ data: null });
  });

  it("returns null for an empty response body", async () => {
    const data = await runEndpoint(
      apiSlice.endpoints.getPolicy,
      "provider_agreement",
      undefined,
    );
    expect(data).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPendingPolicies — the consent gate's only input
// ─────────────────────────────────────────────────────────────────────────────

describe("getPendingPolicies transformResponse", () => {
  const p = (id: string) => ({
    id,
    type: "terms_of_use",
    title: { ar: "الشروط", en: "Terms" },
    content: { ar: "نص عربي ✅", en: "text" },
    version: 2,
    isActive: true,
  });

  it("derives requiresConsent from the number of pending policies", async () => {
    const data = await runEndpoint(
      apiSlice.endpoints.getPendingPolicies,
      undefined,
      { policies: [p("a"), p("b")] },
    );
    expect(data.requiresConsent).toBe(true);
    expect(data.policies).toHaveLength(2);
    expect(data.policies[0].content.ar).toBe("نص عربي ✅");
  });

  it("unwraps { data: { policies } }", async () => {
    const data = await runEndpoint(
      apiSlice.endpoints.getPendingPolicies,
      undefined,
      { data: { policies: [p("a")] } },
    );
    expect(data).toEqual({ requiresConsent: true, policies: [p("a")] });
  });

  it("reports no consent needed for an empty policies array", async () => {
    const data = await runEndpoint(
      apiSlice.endpoints.getPendingPolicies,
      undefined,
      { requiresConsent: false, policies: [] },
    );
    expect(data).toEqual({ requiresConsent: false, policies: [] });
  });

  it("ignores the server's requiresConsent flag and trusts the array", async () => {
    // The gate must never open on a flag alone — there would be nothing to show.
    const data = await runEndpoint(
      apiSlice.endpoints.getPendingPolicies,
      undefined,
      { requiresConsent: true, policies: [] },
    );
    expect(data.requiresConsent).toBe(false);
  });

  it("treats a non-array policies field as no pending policies", async () => {
    for (const policies of [null, undefined, "terms", 5, { 0: p("a") }]) {
      const data = await runEndpoint(
        apiSlice.endpoints.getPendingPolicies,
        undefined,
        { policies },
      );
      expect(data).toEqual({ requiresConsent: false, policies: [] });
    }
  });

  it("never blocks the app on a null / empty / junk body", async () => {
    for (const body of [null, undefined, {}, "unexpected", 0]) {
      const data = await runEndpoint(
        apiSlice.endpoints.getPendingPolicies,
        undefined,
        body,
      );
      expect(data).toEqual({ requiresConsent: false, policies: [] });
      expect(Array.isArray(data.policies)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getHomeFilterAmenities — two accepted server shapes, one chip list out
// ─────────────────────────────────────────────────────────────────────────────

describe("getHomeFilterAmenities transformResponse", () => {
  const run = (body: unknown) =>
    runEndpoint(apiSlice.endpoints.getHomeFilterAmenities, undefined, body);

  it("Shape A: emits categories first, then features, each tagged with its kind", async () => {
    const data = await run({
      categories: [
        { id: "c1", name: { ar: "المسابح", en: "Pools" }, icon: "cat.png" },
      ],
      features: [{ id: "f1", name: { ar: "مسبح", en: "Pool" }, categoryId: "c1" }],
    });
    expect(data).toEqual([
      { id: "c1", name: { ar: "المسابح", en: "Pools" }, icon: "cat.png", kind: "category" },
      { id: "f1", name: { ar: "مسبح", en: "Pool" }, icon: "cat.png", kind: "feature" },
    ]);
  });

  it("Shape A: a feature's own icon wins over its category's", async () => {
    const data = await run({
      categories: [{ id: "c1", name: { en: "Pools" }, icon: "cat.png" }],
      features: [
        { id: "f1", name: { en: "Pool" }, icon: "own.png", categoryId: "c1" },
      ],
    });
    expect(data[1].icon).toBe("own.png");
  });

  it("Shape A: icon is null when neither the feature nor its category has one", async () => {
    const data = await run({
      categories: [{ id: "c1", name: { en: "Pools" }, icon: "" }],
      features: [
        { id: "f1", name: { en: "Pool" }, categoryId: "c1" },
        { id: "f2", name: { en: "Orphan" }, categoryId: "does-not-exist" },
        { id: "f3", name: { en: "No category at all" } },
      ],
    });
    expect(data[0].icon).toBeNull(); // empty-string category icon normalizes to null
    expect(data.slice(1).map((o: any) => o.icon)).toEqual([null, null, null]);
  });

  it("Shape A: works with only categories, or only features", async () => {
    const onlyCats = await run({
      categories: [{ id: "c1", name: { en: "Pools" }, icon: "cat.png" }],
    });
    expect(onlyCats).toEqual([
      { id: "c1", name: { en: "Pools" }, icon: "cat.png", kind: "category" },
    ]);

    const onlyFeats = await run({
      features: [{ id: "f1", name: { en: "Pool" }, categoryId: "c1" }],
    });
    expect(onlyFeats).toEqual([
      { id: "f1", name: { en: "Pool" }, icon: null, kind: "feature" },
    ]);
  });

  it("Shape A: an explicitly empty categories+features body yields []", async () => {
    expect(await run({ categories: [], features: [] })).toEqual([]);
  });

  it("Shape A: unwraps the { data } envelope and keeps Arabic names intact", async () => {
    const data = await run({
      data: {
        categories: [{ id: "c1", name: { ar: "مرافق ✨", en: "Amenities" }, icon: null }],
        features: [{ id: "f1", name: { ar: "شواء 🔥", en: "BBQ" }, categoryId: "c1" }],
      },
    });
    expect(data.map((o: any) => o.name.ar)).toEqual(["مرافق ✨", "شواء 🔥"]);
    expect(data.map((o: any) => o.kind)).toEqual(["category", "feature"]);
  });

  it("Shape B: flattens a grouped array into feature chips inheriting the group icon", async () => {
    const data = await run([
      {
        id: "c1",
        name: { en: "Pools" },
        icon: "cat.png",
        features: [
          { id: "f1", name: { en: "Pool" } },
          { id: "f2", name: { en: "Jacuzzi" }, icon: "own.png" },
        ],
      },
      { id: "c2", name: { en: "Food" }, features: [{ id: "f3", name: { en: "BBQ" } }] },
    ]);
    expect(data).toEqual([
      { id: "f1", name: { en: "Pool" }, icon: "cat.png", kind: "feature" },
      { id: "f2", name: { en: "Jacuzzi" }, icon: "own.png", kind: "feature" },
      { id: "f3", name: { en: "BBQ" }, icon: null, kind: "feature" },
    ]);
    // The grouped shape carries no category chips — only its features survive.
    expect(data.some((o: any) => o.kind === "category")).toBe(false);
  });

  it("Shape B: skips groups with no, empty, or null features", async () => {
    const data = await run([
      { id: "c1", name: { en: "Empty" }, features: [] },
      { id: "c2", name: { en: "Missing" } },
      { id: "c3", features: null },
      null,
      { id: "c4", icon: "i.png", features: [{ id: "f1", name: { en: "Pool" } }] },
    ]);
    expect(data).toEqual([
      { id: "f1", name: { en: "Pool" }, icon: "i.png", kind: "feature" },
    ]);
  });

  it("returns [] for an empty array, an empty object, and a body matching neither shape", async () => {
    expect(await run([])).toEqual([]);
    expect(await run({})).toEqual([]);
    expect(await run({ amenities: [{ id: "f1" }] })).toEqual([]);
    expect(await run({ categories: "not-an-array" })).toEqual([]);
    expect(await run("unexpected string")).toEqual([]);
    expect(await run(0)).toEqual([]);
    expect(await run(null)).toEqual([]);
    expect(await run(undefined)).toEqual([]);
  });

  it("never returns a non-array, so the home screen can always .map() the chips", async () => {
    for (const body of [null, undefined, {}, [], "x", 7, { features: null }]) {
      const data = await run(body);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  // The category->icon Map only accepts categories that actually have an id, so
  // an id-less category can no longer register an `undefined` key that any
  // feature with no `categoryId` would inherit.
  it(
    "Shape A: a feature with no categoryId must not inherit an id-less category's icon",
    async () => {
      const data = await run({
        categories: [{ name: { en: "Broken" }, icon: "broken.png" }],
        features: [{ id: "f1", name: { en: "Uncategorized" } }],
      });
      expect(data[1].icon).toBeNull();
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Request shaping, cache invalidation and the 401 rule.
//
// These exercise the shipped endpoint definitions the same way as above — a
// real store with `fetch` stubbed — but read back the REQUEST (url/method) and
// the store's invalidation index instead of the transformed body.
// ─────────────────────────────────────────────────────────────────────────────

/** Stub fetch, recording every request, and answer with `status` + `body`. */
const stubFetch = (
  { status = 200, body = {} as unknown }: { status?: number; body?: unknown } = {},
) => {
  const calls: { url: string; method: string }[] = [];
  (global as any).fetch = jest.fn(async (request: any) => {
    calls.push({ url: request.url, method: request.method });
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(body),
      clone() {
        return this;
      },
    };
  });
  return calls;
};

/**
 * Store whose `auth` slice holds the given token and records every action type
 * it sees — enough to assert whether the 401 handler forced a logout.
 */
const makeAuthStore = (token: string | null) => {
  const seen: string[] = [];
  const store = configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: (state = { token }, action: any) => {
        seen.push(action.type);
        return state;
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
  return { store, seen };
};

/** Run one endpoint on `store` and hand back the settled result. */
const dispatchEndpoint = async (store: any, endpoint: any, arg?: any) => {
  const promise = store.dispatch(endpoint.initiate(arg));
  const result: any = await promise;
  promise.unsubscribe?.();
  return result;
};

describe("request shaping", () => {
  it("getOwnerChalets asks for the DTO's maximum page size", async () => {
    // The server paginates at limit=10 and no screen pages, so an owner with
    // more than ten chalets used to lose the rest from the picker.
    const calls = stubFetch({ body: { data: [] } });
    const store = makeStore();
    await dispatchEndpoint(store, apiSlice.endpoints.getOwnerChalets, {});
    store.dispatch(apiSlice.util.resetApiState());

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/provider/chalets?");
    expect(calls[0].url).toContain("limit=100");
  });

  it("getOwnerChalets still honours an explicit limit from the caller", async () => {
    const calls = stubFetch({ body: { data: [] } });
    const store = makeStore();
    await dispatchEndpoint(store, apiSlice.endpoints.getOwnerChalets, {
      limit: 5,
      page: 2,
    });
    store.dispatch(apiSlice.util.resetApiState());

    expect(calls[0].url).toContain("limit=5");
    expect(calls[0].url).toContain("page=2");
  });

  it("getProviderStats forwards period/from/to/chaletId to the server", async () => {
    // Without this the revenue screen's period selector only changed the cache
    // key, so every period re-rendered the same current-month numbers.
    const calls = stubFetch({ body: {} });
    const store = makeStore();
    await dispatchEndpoint(store, apiSlice.endpoints.getProviderStats, {
      from: "2026-01-01",
      to: "2026-12-31",
      period: "year",
      chaletId: "chalet-1",
    });
    store.dispatch(apiSlice.util.resetApiState());

    expect(calls[0].url).toContain("from=2026-01-01");
    expect(calls[0].url).toContain("to=2026-12-31");
    expect(calls[0].url).toContain("period=year");
    expect(calls[0].url).toContain("chaletId=chalet-1");
  });

  it("getProviderStats omits an unset chaletId instead of sending 'undefined'", async () => {
    const calls = stubFetch({ body: {} });
    const store = makeStore();
    await dispatchEndpoint(store, apiSlice.endpoints.getProviderStats, {
      period: "week",
      chaletId: undefined,
    });
    store.dispatch(apiSlice.util.resetApiState());

    expect(calls[0].url).toContain("period=week");
    expect(calls[0].url).not.toContain("chaletId");
  });

  it("getAmenities answers locally — no request to the route that 404s", async () => {
    // `/provider/chalets/amenities/all` matches nothing on the server; the call
    // is answered with an empty list until a public amenities route exists.
    const calls = stubFetch({ body: [] });
    const store = makeStore();
    const result = await dispatchEndpoint(
      store,
      apiSlice.endpoints.getAmenities,
      undefined,
    );
    store.dispatch(apiSlice.util.resetApiState());

    expect(result.data).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe("Chalet tag scoping", () => {
  // RTK Query files a bare-tag provider under `__internal_without_id`, which an
  // `{ type, id }` invalidation never reads — so a chalet-scoped query that
  // provided the bare tag was invisible to the shift/policy mutations.
  const invalidatedBy = (store: any, tag: any) =>
    apiSlice.util
      .selectInvalidatedBy(store.getState(), [tag])
      .map((e: any) => e.endpointName);

  const cases: [string, any, any][] = [
    ["getChaletShifts", () => apiSlice.endpoints.getChaletShifts, "chalet-1"],
    [
      "getChaletCancellationPolicies",
      () => apiSlice.endpoints.getChaletCancellationPolicies,
      "chalet-1",
    ],
    [
      "getChaletAmenities",
      () => apiSlice.endpoints.getChaletAmenities,
      "chalet-1",
    ],
    [
      "getShiftAvailability",
      () => apiSlice.endpoints.getShiftAvailability,
      { chaletId: "chalet-1", from: "2026-01-01", to: "2026-01-31" },
    ],
    [
      "getFullyBookedStatus",
      () => apiSlice.endpoints.getFullyBookedStatus,
      { chaletId: "chalet-1", from: "2026-01-01", to: "2026-01-31" },
    ],
  ];

  it.each(cases)(
    "%s is invalidated by { type: 'Chalet', id: chaletId }",
    async (name, endpoint, arg) => {
      stubFetch({ body: { data: [] } });
      const store = makeStore();
      const promise = store.dispatch((endpoint as any)().initiate(arg));
      await promise;

      expect(invalidatedBy(store, { type: "Chalet", id: "chalet-1" })).toContain(
        name,
      );
      // A different chalet's edits must NOT nuke this entry.
      expect(
        invalidatedBy(store, { type: "Chalet", id: "chalet-2" }),
      ).not.toContain(name);
      // …and the bare tag still reaches it: the mutations that invalidate
      // "Chalet" without an id (setShiftPricing, setChaletAmenities, …) flatten
      // every id bucket, so scoping the providers did not orphan them.
      expect(invalidatedBy(store, "Chalet")).toContain(name);

      promise.unsubscribe?.();
      store.dispatch(apiSlice.util.resetApiState());
    },
  );

  it("getShiftPricing is keyed by shift id, so it keeps the bare tag", async () => {
    stubFetch({ body: { data: [] } });
    const store = makeStore();
    const promise = store.dispatch(
      apiSlice.endpoints.getShiftPricing.initiate("shift-1"),
    );
    await promise;

    // Its writers (setShiftPricing / updateShiftPricingDay) invalidate the bare
    // tag, which reaches it.
    expect(invalidatedBy(store, "Chalet")).toContain("getShiftPricing");

    promise.unsubscribe?.();
    store.dispatch(apiSlice.util.resetApiState());
  });
});

describe("401 handling", () => {
  const LOGOUT = "auth/logout";

  it("does not sign the user out when the OTP is wrong", async () => {
    // /auth/verify answers 401 INVALID_CODE for a mistyped digit. Logging out
    // there cleared `userType` — including 'guest' — and bounced a browsing
    // guest to onboarding over a typo.
    stubFetch({ status: 401, body: { message: "Invalid code", code: "INVALID_CODE" } });
    const { store, seen } = makeAuthStore(null);
    const result = await dispatchEndpoint(store, apiSlice.endpoints.verifyPhone, {
      phone: "07700000000",
      code: "123456",
    });
    store.dispatch(apiSlice.util.resetApiState());

    expect(result.error).toBeTruthy();
    expect(seen).not.toContain(LOGOUT);
  });

  it("does not sign the user out when login is refused", async () => {
    stubFetch({ status: 401, body: { message: "Account is inactive" } });
    const { store, seen } = makeAuthStore(null);
    await dispatchEndpoint(store, apiSlice.endpoints.login, {
      phone: "07700000000",
    });
    store.dispatch(apiSlice.util.resetApiState());

    expect(seen).not.toContain(LOGOUT);
  });

  it("signs the user out when a request that carried a token is rejected", async () => {
    stubFetch({ status: 401, body: { message: "Unauthorized" } });
    const { store, seen } = makeAuthStore("a-live-token");
    await dispatchEndpoint(store, apiSlice.endpoints.getMe, undefined);
    store.dispatch(apiSlice.util.resetApiState());

    expect(seen).toContain(LOGOUT);
  });

  it("does not sign out a guest when a public endpoint answers 401", async () => {
    // No token was attached, so there is no session for this 401 to have ended.
    stubFetch({ status: 401, body: { message: "Unauthorized" } });
    const { store, seen } = makeAuthStore(null);
    await dispatchEndpoint(store, apiSlice.endpoints.getChalets, {});
    store.dispatch(apiSlice.util.resetApiState());

    expect(seen).not.toContain(LOGOUT);
  });
});

describe("cancelBooking error translation", () => {
  const run = async (status: number, body: unknown) => {
    stubFetch({ status, body });
    const store = makeStore();
    const result = await dispatchEndpoint(
      store,
      apiSlice.endpoints.cancelBooking,
      { id: "booking-1", reason: "test" },
    );
    store.dispatch(apiSlice.util.resetApiState());
    return result.error as any;
  };

  it("turns the missing provider cancel route's 404 into an honest message", async () => {
    // There is no POST provider/bookings/:id/cancel on the server, so the raw
    // body is Fastify's routing error — which reads to the owner as if the
    // booking vanished. Say what actually happened instead.
    const error = await run(404, {
      message: "Route POST:/api/v1/provider/bookings/booking-1/cancel not found",
      statusCode: 404,
    });

    expect(error.data.code).toBe("PROVIDER_CANCEL_UNSUPPORTED");
    expect(error.data.message).toContain("تعذّر إلغاء الحجز");
    expect(error.data.message).toContain("nothing was cancelled or refunded");
    // The server's own text survives for debugging.
    expect(error.data.serverMessage).toContain("not found");
    expect(error.message).toBe(error.data.message);
  });

  it("leaves every other failure untouched", async () => {
    const error = await run(400, { message: "Booking already cancelled" });
    expect(error.data.message).toBe("Booking already cancelled");
    expect(error.data.code).toBeUndefined();
  });
});
