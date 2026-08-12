import { act, renderHook } from "@testing-library/react-native";

import { useCountdown } from "@/hooks/useCountdown";

// Frozen "now" so every remaining-time assertion below is exact.
const NOW = new Date("2026-01-01T00:00:00.000Z");
const NOW_MS = NOW.getTime();
const HOUR = 60 * 60 * 1000;

/** ISO string for a moment `ms` milliseconds before the frozen now. */
const agoISO = (ms: number) => new Date(NOW_MS - ms).toISOString();

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("treats a missing createdAt as already expired", () => {
    const { result } = renderHook(() => useCountdown(undefined));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it("treats an empty createdAt string as already expired", () => {
    const { result } = renderHook(() => useCountdown(""));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("never arms an interval when there is no createdAt", () => {
    const { result } = renderHook(() => useCountdown(undefined));

    expect(jest.getTimerCount()).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it("reports the exact remaining split for a booking created 30 minutes ago", () => {
    const { result } = renderHook(() => useCountdown(agoISO(30 * 60 * 1000), 1));

    expect(result.current.isExpired).toBe(false);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(30);
    expect(result.current.seconds).toBe(0);
    expect(result.current.formatted).toBe("00:30:00");
  });

  it("decrements every second as the interval fires", () => {
    const { result } = renderHook(() => useCountdown(agoISO(30 * 60 * 1000), 1));
    expect(result.current.formatted).toBe("00:30:00");

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.formatted).toBe("00:29:59");
    expect(result.current.minutes).toBe(29);
    expect(result.current.seconds).toBe(59);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.formatted).toBe("00:29:58");
    expect(result.current.isExpired).toBe(false);
  });

  it("zero-pads every component of the formatted string", () => {
    // 1h 2m 3s remaining -> "01:02:03", not "1:2:3".
    const createdAt = agoISO(0);
    const durationHours = (1 * HOUR + 2 * 60 * 1000 + 3 * 1000) / HOUR;
    const { result } = renderHook(() => useCountdown(createdAt, durationHours));

    expect(result.current.formatted).toBe("01:02:03");
    expect(result.current.hours).toBe(1);
    expect(result.current.minutes).toBe(2);
    expect(result.current.seconds).toBe(3);
  });

  it("flips to expired once the deadline passes and stays at 00:00:00", () => {
    const { result } = renderHook(() => useCountdown(agoISO(30 * 60 * 1000), 1));

    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
    });
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");

    // Well past the deadline it must not go negative or resume counting.
    act(() => {
      jest.advanceTimersByTime(10 * HOUR);
    });
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
    expect(result.current.hours).toBe(0);
  });

  it("is expired immediately for a createdAt that is already past its duration", () => {
    const { result } = renderHook(() => useCountdown(agoISO(2 * HOUR), 1));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("is expired at the exact instant the deadline is reached (diff === 0)", () => {
    const { result } = renderHook(() => useCountdown(agoISO(HOUR), 1));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("treats durationHours = 0 as expired", () => {
    const { result } = renderHook(() => useCountdown(agoISO(0), 0));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("treats a negative durationHours as expired", () => {
    const { result } = renderHook(() => useCountdown(agoISO(0), -5));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("supports a fractional durationHours (0.5h)", () => {
    const { result } = renderHook(() => useCountdown(agoISO(0), 0.5));

    expect(result.current.minutes).toBe(30);
    expect(result.current.formatted).toBe("00:30:00");

    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000);
    });
    expect(result.current.formatted).toBe("00:00:01");
    expect(result.current.isExpired).toBe(false);
  });

  it("supports a sub-second fractional duration by rounding down to 00:00:00 while still not expired", () => {
    // 0.5s left: diff > 0 so isExpired stays false, but the second-resolution
    // formatter floors to zero — the UI shows 00:00:00 for that last tick.
    const { result } = renderHook(() => useCountdown(agoISO(0), 500 / HOUR));

    expect(result.current.isExpired).toBe(false);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("renders hours beyond 24 without truncating (padStart only pads, never cuts)", () => {
    const { result } = renderHook(() => useCountdown(agoISO(0), 100));

    expect(result.current.hours).toBe(100);
    expect(result.current.formatted).toBe("100:00:00");
  });

  it("survives a very large duration without overflowing the hours field", () => {
    const { result } = renderHook(() => useCountdown(agoISO(0), 1_000_000));

    expect(result.current.hours).toBe(1_000_000);
    expect(result.current.formatted).toBe("1000000:00:00");
  });

  it("handles a non-UTC / offset ISO createdAt correctly", () => {
    // 2025-12-31T22:30:00-01:00 === 2025-12-31T23:30:00Z === 30 minutes ago.
    const { result } = renderHook(() =>
      useCountdown("2025-12-31T22:30:00-01:00", 1)
    );

    expect(result.current.formatted).toBe("00:30:00");
  });

  // An unparseable createdAt makes expiresAt NaN, and `diff <= 0` is false for
  // NaN — so the hook checks the deadline is finite up front and falls back to
  // expired rather than ticking "NaN:NaN:NaN" forever.
  it("falls back to expired for an unparseable createdAt", () => {
    const { result } = renderHook(() => useCountdown("not-a-date", 1));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formatted).toBe("00:00:00");
  });

  it("re-arms the interval when createdAt changes", () => {
    const { result, rerender } = renderHook(
      ({ createdAt }: { createdAt: string }) => useCountdown(createdAt, 1),
      { initialProps: { createdAt: agoISO(30 * 60 * 1000) } }
    );
    expect(result.current.formatted).toBe("00:30:00");

    rerender({ createdAt: agoISO(10 * 60 * 1000) });
    expect(result.current.formatted).toBe("00:50:00");
    // The old interval was torn down — exactly one is still running.
    expect(jest.getTimerCount()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.formatted).toBe("00:49:59");
  });

  it("re-arms the interval when durationHours changes", () => {
    const createdAt = agoISO(30 * 60 * 1000);
    const { result, rerender } = renderHook(
      ({ hours }: { hours: number }) => useCountdown(createdAt, hours),
      { initialProps: { hours: 1 } }
    );
    expect(result.current.formatted).toBe("00:30:00");

    rerender({ hours: 2 });
    expect(result.current.formatted).toBe("01:30:00");
    expect(jest.getTimerCount()).toBe(1);
  });

  it("clears the interval on unmount", () => {
    const { unmount } = renderHook(() => useCountdown(agoISO(30 * 60 * 1000), 1));

    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
    // And nothing keeps ticking afterwards.
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("defaults durationHours to 1 hour when omitted", () => {
    const { result } = renderHook(() => useCountdown(agoISO(15 * 60 * 1000)));

    expect(result.current.formatted).toBe("00:45:00");
  });
});
