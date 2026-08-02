import type { AccountType, UserType } from '@/store/authSlice';

export type NotificationSection = 'owner' | 'customer';

/**
 * Which side of the app a notification should open in.
 *
 * A chalet owner and their tenant both get a BOOKING notification carrying the
 * same booking id, so `redirectType` alone can't say where to land — and since
 * an owner may be running the app in tenant mode, neither can the signed-in
 * account. The sender knows, and says so in `role` (`redirectRole` on the
 * in-app list, `data.role` on a push).
 *
 * Unset — an older notification, or one that reads the same either way, like a
 * payout confirmation — keeps the reader where they are. An owner destination
 * is only honoured for a provider account.
 */
export function resolveNotificationSection(
  role: string | undefined | null,
  activeMode: UserType,
  accountType: AccountType,
): NotificationSection {
  const current: NotificationSection = activeMode === 'owner' ? 'owner' : 'customer';
  const requested = role === 'owner' || role === 'customer' ? role : null;

  if (requested === 'owner' && accountType !== 'provider') return current;

  return requested ?? current;
}
