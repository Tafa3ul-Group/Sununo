import { RootState } from '@/store';
import { selectAccountType } from '@/store/authSlice';
import { openNotificationTarget } from '@/utils/notification-navigation';
import { setPendingLink } from '@/utils/pending-link';
import type { Router } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Where `+native-intent.ts` sends a WhatsApp button link (sununo.app/b/…,
 * /tx/…, /manage/…): `?type=&id=&role=`, the same shape a push carries, so it
 * lands exactly where the matching push would.
 *
 * Opened while the app was running, it replaces itself with the destination,
 * so Back returns to whatever was on screen. Opened from cold there is nothing
 * underneath, so it hands the link to the root layout and goes through the
 * splash instead — the splash picks the section, and the layout opens the link
 * on top of home once it has.
 */
export default function LinkScreen() {
  const { type, id, role } = useLocalSearchParams<{ type?: string; id?: string; role?: string }>();
  const router = useRouter();
  const dispatch = useDispatch();
  const userType = useSelector((s: RootState) => s.auth.userType);
  const accountType = useSelector(selectAccountType);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const target = { type, id, role };

    if (!router.canGoBack()) {
      setPendingLink(target);
      router.replace('/');
      return;
    }

    // openNotificationTarget pushes; here the destination takes this screen's place.
    const replacing = { push: (href: any) => router.replace(href) } as unknown as Router;
    const opened = openNotificationTarget(target, { router: replacing, dispatch, userType, accountType });
    if (!opened) router.back();
  }, [type, id, role, router, dispatch, userType, accountType]);

  return <View style={{ flex: 1 }} />;
}
