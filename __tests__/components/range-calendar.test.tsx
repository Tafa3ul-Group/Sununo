import { fireEvent, render, screen } from "@testing-library/react-native";
import i18next, { type i18n as I18nInstance } from "i18next";
import React from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

// The `@/i18n` barrel boots i18next against AsyncStorage on import; these tests
// drive their own instance, so swap it for the pure direction module.
jest.mock("@/i18n", () => jest.requireActual("@/i18n/direction"));

import { RangeCalendar } from "@/components/user/range-calendar";

function makeI18n(lng: "ar" | "en"): I18nInstance {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    lng,
    fallbackLng: lng,
    resources: { ar: { translation: ar }, en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  return instance;
}
const enI18n = makeI18n("en");

const renderCalendar = (ui: React.ReactElement) =>
  render(<I18nextProvider i18n={enI18n}>{ui}</I18nextProvider>);

// A fixed "today" keeps the past-day rule deterministic: the whole month under
// test is in the future, so every day in it is pressable unless the component
// says otherwise.
const FIXED_NOW = new Date(2026, 4, 10, 12, 0, 0); // 10 May 2026
const JUNE = new Date(2026, 5, 1); // the month the tests navigate over

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});
afterEach(() => {
  jest.useRealTimers();
});

/** Presses the day cell labelled `day` inside the grid. */
const pressDay = (day: number) => {
  fireEvent.press(screen.getAllByText(String(day))[0]);
};

describe("RangeCalendar — single selection mode", () => {
  it("reports the picked day with a null end and never builds a range", () => {
    const onSelect = jest.fn();
    renderCalendar(
      <RangeCalendar
        selectionMode="single"
        initialStartDate={JUNE}
        onSelect={onSelect}
      />,
    );

    pressDay(12);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual(new Date(2026, 5, 12));
    expect(onSelect.mock.calls[0][1]).toBeNull();

    // A second press replaces the selection instead of closing a range —
    // the booking API books exactly one date.
    pressDay(15);
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect.mock.calls[1][0]).toEqual(new Date(2026, 5, 15));
    expect(onSelect.mock.calls[1][1]).toBeNull();
  });

  it("still closes a range in range mode (default behaviour is untouched)", () => {
    const onSelect = jest.fn();
    // `initialStartDate` seeds both the viewed month AND an open range start,
    // so the first press onward closes the range.
    renderCalendar(<RangeCalendar initialStartDate={JUNE} onSelect={onSelect} />);

    pressDay(12);

    expect(onSelect).toHaveBeenLastCalledWith(
      new Date(2026, 5, 1),
      new Date(2026, 5, 12),
    );
  });
});

describe("RangeCalendar — month navigation", () => {
  it("reports the new month so the parent can refetch its availability", () => {
    const onMonthChange = jest.fn();
    renderCalendar(
      <RangeCalendar initialStartDate={JUNE} onMonthChange={onMonthChange} />,
    );

    // Header is [prev, title, next]; the last touchable in it is "next month".
    fireEvent.press(screen.getByText("June 2026"));
    // Year picker opened — pick a different year and expect a report.
    fireEvent.press(screen.getByText("2027"));

    expect(onMonthChange).toHaveBeenCalledWith(new Date(2027, 5, 1));
  });
});

describe("RangeCalendar — unknown availability", () => {
  it("refuses day presses while the month's occupancy is loading", () => {
    const onSelect = jest.fn();
    renderCalendar(
      <RangeCalendar
        selectionMode="single"
        initialStartDate={JUNE}
        onSelect={onSelect}
        loading
      />,
    );

    pressDay(12);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("refuses reserved days", () => {
    const onSelect = jest.fn();
    renderCalendar(
      <RangeCalendar
        selectionMode="single"
        initialStartDate={JUNE}
        onSelect={onSelect}
        reservedDates={["2026-06-12"]}
      />,
    );

    pressDay(12);
    expect(onSelect).not.toHaveBeenCalled();

    pressDay(13);
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 5, 13), null);
  });
});
