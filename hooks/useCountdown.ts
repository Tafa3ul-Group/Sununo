import { useEffect, useState } from 'react';

/**
 * A countdown hook that calculates the remaining time from a given createdAt
 * timestamp and a duration in hours.
 *
 * @param createdAt - ISO date string when the booking was created
 * @param durationHours - Number of hours until expiry (default: chalet's dailyHours or 1)
 * @returns { hours, minutes, seconds, isExpired, formatted }
 */
export function useCountdown(createdAt: string | undefined, durationHours: number = 1) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, isExpired: false, formatted: '' });

  useEffect(() => {
    if (!createdAt) {
      setRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' });
      return;
    }

    const expiresAt = new Date(createdAt).getTime() + durationHours * 60 * 60 * 1000;

    // An unparseable createdAt (or a non-numeric duration) makes expiresAt NaN,
    // and every comparison against NaN is false — including the `diff <= 0`
    // guard below — so without this the user would be shown "NaN:NaN:NaN" on a
    // countdown that never ends. A deadline we cannot compute is treated as
    // already passed, which is the safe direction for an approval window.
    if (!Number.isFinite(expiresAt)) {
      setRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' });
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' });
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      setRemaining({ hours: h, minutes: m, seconds: s, isExpired: false, formatted });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, durationHours]);

  return remaining;
}
