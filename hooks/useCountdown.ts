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
