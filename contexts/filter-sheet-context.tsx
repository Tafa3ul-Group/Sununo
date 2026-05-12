import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { createContext, useContext, useRef } from "react";

interface FilterSheetContextValue {
  filterSheetRef: React.RefObject<BottomSheetModal>;
  openFilterSheet: () => void;
}

const FilterSheetContext = createContext<FilterSheetContextValue | null>(null);

export function FilterSheetProvider({ children }: { children: React.ReactNode }) {
  const filterSheetRef = useRef<BottomSheetModal>(null);

  const openFilterSheet = () => {
    filterSheetRef.current?.present();
  };

  return (
    <FilterSheetContext.Provider value={{ filterSheetRef, openFilterSheet }}>
      {children}
    </FilterSheetContext.Provider>
  );
}

export function useFilterSheet() {
  const ctx = useContext(FilterSheetContext);
  if (!ctx) throw new Error("useFilterSheet must be used within FilterSheetProvider");
  return ctx;
}
