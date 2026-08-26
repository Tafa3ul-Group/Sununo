import { useCallback, useMemo } from "react";
import { useGetChaletAvailabilityQuery } from "@/store/api/customerApiSlice";

/** "YYYY-MM-DD" in the device's own timezone — never `toISOString`, which is UTC. */
export const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

type Params = {
  chaletId: string;
  /** Month the picked date lives in. */
  selectionMonth: Date;
  /** Month the calendar sheet is currently showing. */
  calendarMonth: Date;
  /** Shifts the chalet offers, already filtered to the ones on screen. */
  availableShifts: any[];
  /** Resolves a day-of-month to the real Date the rest of the screen uses. */
  getDateForDay: (day: number) => Date;
};

/**
 * Which (day, shift) cells a chalet cannot take, for the two months this screen
 * cares about.
 *
 * Occupancy is fetched for BOTH the month the selection lives in and the month
 * the calendar sheet is showing. Querying only the selection's month drew the
 * next month with the previous month's occupancy, so a fully booked day rendered
 * as selectable.
 */
export function useChaletAvailability({
  chaletId,
  selectionMonth,
  calendarMonth,
  availableShifts,
  getDateForDay,
}: Params) {
  const { data: selectionMonthAvailability } = useGetChaletAvailabilityQuery(
    {
      id: chaletId,
      month: selectionMonth.getMonth() + 1,
      year: selectionMonth.getFullYear(),
    },
    { skip: !chaletId },
  );

  const {
    data: calendarMonthAvailability,
    isFetching: isCalendarMonthFetching,
    isError: isCalendarMonthError,
  } = useGetChaletAvailabilityQuery(
    {
      id: chaletId,
      month: calendarMonth.getMonth() + 1,
      year: calendarMonth.getFullYear(),
    },
    { skip: !chaletId },
  );

  const availabilityData = useMemo(
    () => [
      ...(Array.isArray(selectionMonthAvailability) ? selectionMonthAvailability : []),
      ...(Array.isArray(calendarMonthAvailability) ? calendarMonthAvailability : []),
    ],
    [selectionMonthAvailability, calendarMonthAvailability],
  );

  // Until the viewed month's occupancy has actually arrived, no day in it may be
  // picked — an un-fetched month would otherwise render every day as free.
  // An outright FAILURE deliberately unlocks the calendar again: the
  // create-booking call re-checks availability server-side and refuses a taken
  // slot before any money moves, so a dead availability endpoint should not make
  // the chalet unbookable.
  const isCalendarMonthLoading =
    !!chaletId &&
    !isCalendarMonthError &&
    (isCalendarMonthFetching || calendarMonthAvailability === undefined);

  /**
   * Which shift ids are taken on each "YYYY-MM-DD", as resolved by the backend.
   *
   * Every entry carries `blocks`: the exact (date, shift) cells it occupies.
   * Counting entries per day and matching `entry.shift.id` — what this did before
   * — showed occupied slots as free whenever a booking no longer pointed at the
   * shift being drawn: a deleted shift row, a duplicate row covering the same
   * hours, or an overnight booking running into the next morning.
   */
  const blockedShiftsByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    availabilityData.forEach((entry: any) => {
      const blocks: { date: string; shiftId: string }[] = Array.isArray(entry.blocks)
        ? entry.blocks
        : // Older API responses have no `blocks`; fall back to the entry's own
          // date + shift so the calendar degrades instead of showing everything free.
          entry.shift?.id
          ? [{ date: entry.bookingDate?.split("T")[0], shiftId: entry.shift.id }]
          : [];

      blocks.forEach(({ date, shiftId }) => {
        if (!date || !shiftId) return;
        (map[date] ??= new Set()).add(shiftId);
      });
    });

    return map;
  }, [availabilityData]);

  /**
   * Of those blocked cells, the ones blocked because their start time has passed
   * rather than because somebody booked them. They are already unselectable via
   * `blockedShiftsByDate`; this only decides whether the row reads "the time has
   * passed" or the misleading "booked".
   */
  const pastShiftsByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    availabilityData.forEach((entry: any) => {
      if (!entry?.isPast || !Array.isArray(entry.blocks)) return;
      entry.blocks.forEach(({ date, shiftId }: { date: string; shiftId: string }) => {
        if (!date || !shiftId) return;
        (map[date] ??= new Set()).add(shiftId);
      });
    });

    return map;
  }, [availabilityData]);

  // The availability key of a SELECTED day. It must be resolved through
  // `getDateForDay` (the same source the pricing and the submitted payload use),
  // not rebuilt from the month + day-of-month: the two disagree for any day that
  // belongs to a different month, and the shift rows then read the availability
  // of the wrong date entirely.
  const dateKeyForDay = useCallback(
    (day: number) => getLocalDateKey(getDateForDay(day)),
    [getDateForDay],
  );

  // A day is fully booked when every shift the chalet offers is taken on it.
  // Keyed off the month the CALENDAR is showing (not the selection's month),
  // because this is what paints the calendar grid.
  const bookedDates = useMemo(() => {
    if (availableShifts.length === 0) return [];

    const daysInMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    ).getDate();

    const days: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const key = getLocalDateKey(
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day),
      );
      const blocked = blockedShiftsByDate[key];
      if (blocked && availableShifts.every((s: any) => blocked.has(s.id))) {
        days.push(day);
      }
    }
    return days;
  }, [blockedShiftsByDate, availableShifts, calendarMonth]);

  const bookedDateStrings = useMemo(
    () =>
      bookedDates.map((day) =>
        getLocalDateKey(
          new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day),
        ),
      ),
    [bookedDates, calendarMonth],
  );

  const isShiftBookedForDay = useCallback(
    (day: number, shiftId: string) =>
      blockedShiftsByDate[dateKeyForDay(day)]?.has(shiftId) ?? false,
    [blockedShiftsByDate, dateKeyForDay],
  );

  const isShiftPastForDay = useCallback(
    (day: number, shiftId: string) =>
      pastShiftsByDate[dateKeyForDay(day)]?.has(shiftId) ?? false,
    [pastShiftsByDate, dateKeyForDay],
  );

  /**
   * A shift is "closed" on a given day when it has no valid pricing for that
   * weekday (price missing or <= 1). This mirrors the backend availability rule —
   * a shift with no ShiftPricing for the day cannot be booked — so a stopped
   * shift renders disabled and non-clickable.
   */
  const isShiftClosedForDay = useCallback(
    (day: number, shift: any) => {
      const dow = getDateForDay(day).getDay();
      const dayPricing = shift?.pricing?.find((p: any) => p.dayOfWeek === dow);
      return !dayPricing || Number(dayPricing.price) <= 1;
    },
    [getDateForDay],
  );

  /**
   * Same question as `isShiftBookedForDay`, but keyed by an explicit date rather
   * than a day-of-month. Callers picking a NEW date need this: the day-of-month
   * form resolves through the current selection, which is still the previous one
   * at the moment the pick is being handled.
   */
  const isShiftBookedOnDate = useCallback(
    (date: Date, shiftId: string) =>
      blockedShiftsByDate[getLocalDateKey(date)]?.has(shiftId) ?? false,
    [blockedShiftsByDate],
  );

  return {
    isCalendarMonthLoading,
    bookedDates,
    bookedDateStrings,
    isShiftBookedForDay,
    isShiftBookedOnDate,
    isShiftPastForDay,
    isShiftClosedForDay,
  };
}
