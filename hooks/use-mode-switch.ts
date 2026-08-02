import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { apiSlice } from '@/store/api/apiSlice';
import { selectAccountType, switchMode } from '@/store/authSlice';

/**
 * Moving a chalet owner between the tenant and owner sections of the app.
 *
 * The account is one identity on the server (`user.type`) — what changes here is
 * only which section of the app is active, so nothing is re-authenticated and
 * the token stays the same.
 *
 * `canSwitch` is true only for a provider account: a plain tenant has no owner
 * side to switch to, and `switchMode` in the reducer refuses it regardless.
 */
export function useModeSwitch() {
  const dispatch = useDispatch();
  const router = useRouter();
  const accountType = useSelector(selectAccountType);
  const activeMode = useSelector((state: RootState) => state.auth.userType);

  const canSwitch = accountType === 'provider';

  const switchTo = useCallback(
    (mode: 'owner' | 'customer') => {
      dispatch(switchMode(mode));
      // Both sections hit endpoints that key off the same account, so a cached
      // owner response can otherwise surface on a tenant screen (and back) until
      // it goes stale. `selectedChalet` lives in authSlice and survives this.
      dispatch(apiSlice.util.resetApiState());
      router.replace(
        mode === 'owner' ? '/(tabs)/(dashboard)/home' : '/(tabs)/(customer)',
      );
    },
    [dispatch, router],
  );

  return { canSwitch, activeMode, switchTo };
}
