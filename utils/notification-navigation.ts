import type { Router } from 'expo-router';
import { enterSection, type AccountType, type UserType } from '@/store/authSlice';
import { notificationNeedsSection, resolveNotificationSection } from '@/utils/notification-section';

/** What a notification carries about where it leads — the push `data` or an in-app row. */
export interface NotificationTarget {
  type?: string | null;
  id?: string | null;
  role?: string | null;
}

interface NavigationContext {
  router: Router;
  dispatch: (action: any) => void;
  userType: UserType;
  accountType: AccountType;
}

/**
 * Open whatever a notification points at. Shared by the push-tap handler and
 * both in-app lists so a tap lands in the same place from anywhere.
 *
 * Returns false when the notification has nowhere to go (a plain dashboard
 * announcement), so the caller can leave the reader where they are.
 */
export function openNotificationTarget(
  { type, id, role }: NotificationTarget,
  { router, dispatch, userType, accountType }: NavigationContext,
): boolean {
  const target = resolveNotificationSection(role, userType, accountType);

  // Land them in the right section first, or the destination screen's own guard
  // bounces the tap straight back — but only where a guard actually stands, and
  // only for this trip: `enterSection` records no choice.
  const inSection = userType === 'owner' || userType === 'customer';
  if (target !== userType && inSection && notificationNeedsSection(type, target, !!id)) {
    dispatch(enterSection(target));
  }

  const isOwner = target === 'owner';

  switch (type) {
    case 'booking':
      if (!id) break;
      if (isOwner) router.push({ pathname: '/(dashboard)/booking-details', params: { id } });
      else router.push({ pathname: '/(tabs)/(customer)/booking-success', params: { id } });
      return true;

    case 'chalet':
      if (!id) break;
      // An owner's chalet notice (approved / rejected) opens its settings — a
      // rejected chalet has no public page to show.
      if (isOwner) router.push({ pathname: '/(dashboard)/chalet-details', params: { id } });
      else router.push(`/chalet-details/${id}`);
      return true;

    case 'review':
      if (!id) break;
      // Owner: someone reviewed their chalet → its reviews. Tenant: the stay
      // ended → chalet page with the review sheet open. Both carry the CHALET id.
      if (isOwner) router.push(`/chalet-details/reviews/${id}`);
      else router.push(`/chalet-details/${id}?openReview=1`);
      return true;

    case 'payout':
      // The withdrawal confirmation (نعم/لا) screen, same for both sides.
      if (id) router.push(`/payout-confirm/${id}`);
      else router.push(isOwner ? '/(tabs)/(dashboard)/home' : '/(tabs)/(customer)/profile');
      return true;

    case 'wallet':
      router.push(isOwner ? '/(tabs)/(dashboard)/transactions' : '/(tabs)/(customer)/profile');
      return true;
  }

  return false;
}
