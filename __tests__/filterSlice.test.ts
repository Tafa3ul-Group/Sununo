import filterReducer, { clearFilters, setFilters } from "@/store/filterSlice";
import type { FilterState } from "@/store/filterSlice";

const init = (): FilterState => filterReducer(undefined, { type: "@@INIT" });

const apply = (state: FilterState, payload: Partial<FilterState>): FilterState =>
  filterReducer(state, setFilters(payload));

/**
 * The payload the search sheet actually produces (search-filter-sheet.tsx ->
 * (tabs)/(customer)/_layout.tsx handleFilterApply): every field is spelled out
 * and `isActive: true` is passed explicitly by the caller.
 */
const sheetApply = (over: Partial<FilterState> = {}): Partial<FilterState> => ({
  cityId: null,
  cityName: null,
  search: null,
  checkIn: null,
  checkOut: null,
  period: null,
  maxGuests: null,
  adults: 2,
  children: 0,
  isActive: true,
  ...over,
});

const fullyPopulated = (): FilterState =>
  apply(
    init(),
    sheetApply({
      cityId: "city-1",
      cityName: "الرياض",
      search: "شاليه بمسبح",
      checkIn: "2026-08-20T00:00:00.000Z",
      checkOut: "2026-08-22T00:00:00.000Z",
      period: "overnight",
      maxGuests: 4,
      adults: 4,
      children: 2,
    }),
  );

describe("filterSlice — initial state", () => {
  it("starts with two adults, no children and no active filter", () => {
    expect(init()).toEqual({
      cityId: null,
      cityName: null,
      search: null,
      checkIn: null,
      checkOut: null,
      period: null,
      maxGuests: null,
      adults: 2,
      children: 0,
      isActive: false,
    });
  });

  it("returns the same state object for an unrelated action", () => {
    const state = init();
    expect(filterReducer(state, { type: "auth/logout" })).toBe(state);
  });
});

describe("filterSlice — setFilters merges partially", () => {
  it("sets cityId while keeping every other field untouched", () => {
    const state = apply(init(), { cityId: "city-1" });
    expect(state.cityId).toBe("city-1");
    expect(state.cityName).toBeNull();
    expect(state.search).toBeNull();
    expect(state.checkIn).toBeNull();
    expect(state.checkOut).toBeNull();
    expect(state.period).toBeNull();
    expect(state.maxGuests).toBeNull();
    expect(state.adults).toBe(2);
    expect(state.children).toBe(0);
  });

  it("sets cityName alone", () => {
    const state = apply(init(), { cityName: "جدة" });
    expect(state.cityName).toBe("جدة");
    expect(state.cityId).toBeNull();
  });

  it("sets search alone", () => {
    const state = apply(init(), { search: "chalet" });
    expect(state.search).toBe("chalet");
    expect(state.adults).toBe(2);
  });

  it("sets checkIn / checkOut alone", () => {
    const state = apply(init(), {
      checkIn: "2026-09-01T00:00:00.000Z",
      checkOut: "2026-09-03T00:00:00.000Z",
    });
    expect(state.checkIn).toBe("2026-09-01T00:00:00.000Z");
    expect(state.checkOut).toBe("2026-09-03T00:00:00.000Z");
    expect(state.period).toBeNull();
  });

  it("sets period alone", () => {
    const state = apply(init(), { period: "morning" });
    expect(state.period).toBe("morning");
  });

  it("accumulates across successive dispatches instead of replacing", () => {
    let state = apply(init(), { cityId: "city-1", cityName: "الرياض" });
    state = apply(state, { period: "evening" });
    state = apply(state, { adults: 5, maxGuests: 5 });
    expect(state).toMatchObject({
      cityId: "city-1",
      cityName: "الرياض",
      period: "evening",
      adults: 5,
      maxGuests: 5,
      children: 0,
    });
  });

  it("does not mutate the previous state object", () => {
    const before = init();
    const snapshot = { ...before };
    const after = apply(before, { cityId: "city-1" });
    expect(after).not.toBe(before);
    expect(before).toEqual(snapshot);
  });

  it("keeps very large guest counts as given", () => {
    const state = apply(init(), {
      adults: Number.MAX_SAFE_INTEGER,
      maxGuests: Number.MAX_SAFE_INTEGER,
    });
    expect(state.maxGuests).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.isActive).toBe(true);
  });

  it("survives an empty payload without changing anything but staying inactive", () => {
    const state = apply(init(), {});
    expect(state).toEqual(init());
  });

  it("survives a null payload (Object.assign ignores it) without throwing", () => {
    const populated = fullyPopulated();
    // Malformed dispatch: payload is not an object at all.
    const state = filterReducer(populated, setFilters(null as any));
    expect(state).toEqual(populated);
  });
});

describe("filterSlice — isActive derivation, contributing fields", () => {
  it("cityId alone activates", () => {
    expect(apply(init(), { cityId: "city-1" }).isActive).toBe(true);
  });

  it("search alone activates", () => {
    expect(apply(init(), { search: "بحر" }).isActive).toBe(true);
  });

  it("checkIn alone activates", () => {
    expect(apply(init(), { checkIn: "2026-09-01T00:00:00.000Z" }).isActive).toBe(
      true,
    );
  });

  it("period alone activates", () => {
    expect(apply(init(), { period: "overnight" }).isActive).toBe(true);
  });

  it("a positive maxGuests activates", () => {
    expect(apply(init(), { maxGuests: 1 }).isActive).toBe(true);
  });

  it("the real sheet payload activates because maxGuests defaults to the adult count", () => {
    // search-filter-sheet always sends maxGuests: adults (>= 1), even when the
    // user picked nothing else.
    const state = apply(init(), sheetApply({ maxGuests: 2 }));
    expect(state.isActive).toBe(true);
  });
});

describe("filterSlice — isActive derivation, non-contributing fields", () => {
  it("checkOut alone does not activate", () => {
    const state = apply(init(), { checkOut: "2026-09-03T00:00:00.000Z" });
    expect(state.checkOut).toBe("2026-09-03T00:00:00.000Z");
    expect(state.isActive).toBe(false);
  });

  it("adults alone does not activate", () => {
    const state = apply(init(), { adults: 8 });
    expect(state.adults).toBe(8);
    expect(state.isActive).toBe(false);
  });

  it("children alone does not activate", () => {
    const state = apply(init(), { children: 3 });
    expect(state.children).toBe(3);
    expect(state.isActive).toBe(false);
  });

  it("cityName without cityId does not activate", () => {
    const state = apply(init(), { cityName: "الدمام" });
    expect(state.cityName).toBe("الدمام");
    expect(state.isActive).toBe(false);
  });

  it("ignores an explicit isActive:true in the payload when nothing meaningful is set", () => {
    // (tabs)/(customer)/_layout.tsx passes isActive: true; the reducer always
    // re-derives it, so the caller's value never survives.
    const state = apply(init(), { isActive: true, checkOut: "2026-09-03" });
    expect(state.isActive).toBe(false);
  });

  it("ignores an explicit isActive:false in the payload when a real filter is set", () => {
    const state = apply(init(), { isActive: false, cityId: "city-1" });
    expect(state.isActive).toBe(true);
  });
});

describe("filterSlice — maxGuests edge values", () => {
  it("zero guests does not activate", () => {
    const state = apply(init(), { maxGuests: 0 });
    expect(state.maxGuests).toBe(0);
    expect(state.isActive).toBe(false);
  });

  it("null guests does not activate", () => {
    const state = apply(init(), { maxGuests: null });
    expect(state.maxGuests).toBeNull();
    expect(state.isActive).toBe(false);
  });

  it("a negative guest count does not activate", () => {
    const state = apply(init(), { maxGuests: -3 });
    expect(state.maxGuests).toBe(-3);
    expect(state.isActive).toBe(false);
  });

  it("dropping guests from a positive value back to zero deactivates", () => {
    const active = apply(init(), { maxGuests: 4, adults: 4 });
    expect(active.isActive).toBe(true);
    const state = apply(active, { maxGuests: 0 });
    expect(state.isActive).toBe(false);
  });
});

describe("filterSlice — search string edge cases", () => {
  it("an empty-string search does not activate, unlike a real term", () => {
    const empty = apply(init(), { search: "" });
    expect(empty.search).toBe("");
    expect(empty.isActive).toBe(false);

    const filled = apply(init(), { search: "شاليه" });
    expect(filled.isActive).toBe(true);
  });

  it("clearing a search back to an empty string deactivates, same as null", () => {
    const active = apply(init(), { search: "بيت" });
    expect(apply(active, { search: "" }).isActive).toBe(false);
    expect(apply(active, { search: null }).isActive).toBe(false);
  });

  it("keeps unicode and emoji search terms verbatim", () => {
    const state = apply(init(), { search: "شاليه 🏖️ مع مسبح" });
    expect(state.search).toBe("شاليه 🏖️ مع مسبح");
    expect(state.isActive).toBe(true);
  });

  it("treats a whitespace-only search as a set filter (no trimming happens)", () => {
    const state = apply(init(), { search: "   " });
    expect(state.search).toBe("   ");
    expect(state.isActive).toBe(true);
  });
});

describe("filterSlice — removing one filter while others remain", () => {
  it("removing the city pill keeps isActive because the dates are still set", () => {
    // filter-results.tsx city pill: setFilters({ ...activeFilters, cityId: null, cityName: null })
    const populated = fullyPopulated();
    const state = apply(populated, {
      ...populated,
      cityId: null,
      cityName: null,
    });
    expect(state.cityId).toBeNull();
    expect(state.cityName).toBeNull();
    expect(state.checkIn).toBe("2026-08-20T00:00:00.000Z");
    expect(state.isActive).toBe(true);
  });

  it("removing the date pill clears both dates and keeps isActive", () => {
    const populated = fullyPopulated();
    const state = apply(populated, {
      ...populated,
      checkIn: null,
      checkOut: null,
    });
    expect(state.checkIn).toBeNull();
    expect(state.checkOut).toBeNull();
    expect(state.isActive).toBe(true);
  });

  it("removing the guests pill restores the default counts and keeps isActive", () => {
    // filter-results.tsx guests pill also resets adults/children to defaults.
    const populated = fullyPopulated();
    const state = apply(populated, {
      ...populated,
      maxGuests: null,
      adults: 2,
      children: 0,
    });
    expect(state.maxGuests).toBeNull();
    expect(state.adults).toBe(2);
    expect(state.children).toBe(0);
    expect(state.isActive).toBe(true);
  });

  it("removing the last meaningful filter falls back to isActive false", () => {
    // Only a period was applied, then its pill is removed.
    const onlyPeriod = apply(init(), { period: "evening" });
    expect(onlyPeriod.isActive).toBe(true);
    const state = apply(onlyPeriod, { ...onlyPeriod, period: null });
    expect(state.isActive).toBe(false);
  });

  it("removing pills one by one only deactivates after the last contributing field is gone", () => {
    let state = fullyPopulated();
    state = apply(state, { ...state, cityId: null, cityName: null });
    expect(state.isActive).toBe(true);
    state = apply(state, { ...state, checkIn: null, checkOut: null });
    expect(state.isActive).toBe(true);
    state = apply(state, { ...state, period: null });
    expect(state.isActive).toBe(true); // search + maxGuests still set
    state = apply(state, { ...state, search: null });
    expect(state.isActive).toBe(true); // maxGuests still set
    state = apply(state, { ...state, maxGuests: null, adults: 2, children: 0 });
    expect(state.isActive).toBe(false);
  });

  it("leaves the non-contributing checkOut behind when only the check-in is cleared", () => {
    const populated = fullyPopulated();
    const state = apply(populated, {
      ...populated,
      cityId: null,
      cityName: null,
      search: null,
      checkIn: null,
      period: null,
      maxGuests: null,
    });
    // A dangling checkOut survives and, by design, does not keep filters active.
    expect(state.checkOut).toBe("2026-08-22T00:00:00.000Z");
    expect(state.isActive).toBe(false);
  });
});

describe("filterSlice — clearFilters", () => {
  it("resets a fully populated state to the exact initial state", () => {
    const state = filterReducer(fullyPopulated(), clearFilters());
    expect(state).toEqual(init());
    expect(state.adults).toBe(2);
    expect(state.children).toBe(0);
    expect(state.isActive).toBe(false);
  });

  it("is a no-op-looking reset when the state is already initial", () => {
    expect(filterReducer(init(), clearFilters())).toEqual(init());
  });

  it("is idempotent", () => {
    const once = filterReducer(fullyPopulated(), clearFilters());
    expect(filterReducer(once, clearFilters())).toEqual(init());
  });

  it("ignores whatever payload it is handed", () => {
    const state = filterReducer(
      fullyPopulated(),
      (clearFilters as any)({ cityId: "city-9", isActive: true }),
    );
    expect(state).toEqual(init());
  });

  it("does not leak the cleared state into later reducer calls", () => {
    // clearFilters returns the module-level initialState object; a later
    // setFilters must not write through to it.
    const cleared = filterReducer(fullyPopulated(), clearFilters());
    apply(cleared, { cityId: "city-2", search: "بحر", maxGuests: 9 });
    expect(init()).toEqual({
      cityId: null,
      cityName: null,
      search: null,
      checkIn: null,
      checkOut: null,
      period: null,
      maxGuests: null,
      adults: 2,
      children: 0,
      isActive: false,
    });
    expect(cleared).toEqual(init());
  });

  it("can be filtered again right after clearing", () => {
    const cleared = filterReducer(fullyPopulated(), clearFilters());
    const state = apply(cleared, { cityId: "city-3" });
    expect(state.cityId).toBe("city-3");
    expect(state.isActive).toBe(true);
    expect(state.adults).toBe(2);
  });
});

describe("filterSlice — known defects", () => {
  // setFilters merges only defined values, so an explicitly `undefined` key in
  // the Partial payload is skipped instead of overwriting the stored value —
  // fields declared as `string | null` / `number` never end up holding
  // undefined in the (persisted) state. An explicit `null` still clears.
  it("keeps the previous value when a partial payload carries undefined", () => {
    const populated = fullyPopulated();
    const state = apply(populated, { cityId: undefined, adults: undefined });
    expect(state.cityId).toBe("city-1");
    expect(state.adults).toBe(4);
  });

  // Unknown keys in the payload are dropped instead of being copied into the
  // slice; the filter slice is redux-persist'ed, so junk from a malformed
  // dispatch would otherwise be written to disk and rehydrated forever.
  it("ignores keys that are not part of FilterState", () => {
    const state = apply(init(), { minPrice: 100, foo: "bar" } as any);
    expect(state).toEqual(init());
  });
});
