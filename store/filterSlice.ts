import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FilterState {
  /** City ID selected in WHERE tab */
  cityId: string | null;
  /** City name for display */
  cityName: string | null;
  /** Free-text search */
  search: string | null;
  /** Check-in date ISO string */
  checkIn: string | null;
  /** Check-out date ISO string */
  checkOut: string | null;
  /** Shift period: "morning" | "evening" | "overnight" | null */
  period: string | null;
  /** Total guests (adults + children) */
  maxGuests: number | null;
  /** Adults count */
  adults: number;
  /** Children count */
  children: number;
  /** Result ordering; null means the server default ("newest") */
  sortBy: "newest" | "rating" | "nearest" | null;
  /** Device coordinates captured when sortBy="nearest" was chosen */
  lat: number | null;
  lng: number | null;
  /** Whether any filter has been applied */
  isActive: boolean;
}

const initialState: FilterState = {
  cityId: null,
  cityName: null,
  search: null,
  checkIn: null,
  checkOut: null,
  period: null,
  maxGuests: null,
  adults: 2,
  children: 0,
  sortBy: null,
  lat: null,
  lng: null,
  isActive: false,
};

/**
 * The only keys setFilters is allowed to write. Callers spread their own local
 * filter objects into the payload (explore.tsx keeps minPrice/maxPrice in local
 * state, screens spread `...activeFilters`), and this slice is persisted, so an
 * unknown key would otherwise be written to disk and rehydrated forever.
 */
const FILTER_KEYS = [
  "cityId",
  "cityName",
  "search",
  "checkIn",
  "checkOut",
  "period",
  "maxGuests",
  "adults",
  "children",
  "sortBy",
  "lat",
  "lng",
  "isActive",
] as const satisfies readonly (keyof FilterState)[];

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      const payload = action.payload;
      if (payload) {
        for (const key of FILTER_KEYS) {
          const value = payload[key];
          // `undefined` means "this key was never meant to be sent" (a partial
          // payload, or a spread of an object that lacks the field) and must
          // leave the stored value alone. Clearing a filter is done with an
          // explicit `null`, which still writes through.
          if (value !== undefined) {
            (state[key] as FilterState[typeof key]) = value;
          }
        }
      }
      // Mark as active if any meaningful filter is set
      state.isActive =
        !!state.cityId ||
        !!state.search ||
        !!state.checkIn ||
        !!state.period ||
        (state.maxGuests != null && state.maxGuests > 0) ||
        (state.sortBy != null && state.sortBy !== "newest");
    },
    clearFilters: () => initialState,
  },
});

export const { setFilters, clearFilters } = filterSlice.actions;
export default filterSlice.reducer;
