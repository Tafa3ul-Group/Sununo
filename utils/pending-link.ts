import type { NotificationTarget } from '@/utils/notification-navigation';

/**
 * A link that opened the app from cold, held until the splash has picked the
 * section and landed on home — the root layout then opens it on top, the same
 * way a cold-start push tap is handled, so Back returns home rather than out
 * of the app.
 */
let pending: NotificationTarget | null = null;

export function setPendingLink(target: NotificationTarget) {
  pending = target;
}

/** The held link, once: reading it clears it. */
export function takePendingLink(): NotificationTarget | null {
  const target = pending;
  pending = null;
  return target;
}
