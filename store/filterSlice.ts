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
  isActive: false,
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      Object.assign(state, action.payload);
      // Mark as active if any meaningful filter is set
      state.isActive =
        !!state.cityId ||
        !!state.search ||
        !!state.checkIn ||
        !!state.period ||
        (state.maxGuests != null && state.maxGuests > 0);
    },
    clearFilters: () => initialState,
  },
});

export const { setFilters, clearFilters } = filterSlice.actions;
export default filterSlice.reducer;
