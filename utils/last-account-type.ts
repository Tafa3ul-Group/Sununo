import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A one-word hint — 'provider' or 'customer' — about what the account on this
 * phone was, kept OUTSIDE the redux session so it survives the involuntary
 * sign-out the api slice fires on a 401.
 *
 * That sign-out is the reason the "owner keeps landing in the tenant app" report
 * was intermittent: it wipes the whole auth slice, the owner signs in again
 * without touching the section toggle, and before this the toggle's default
 * decided where they landed. The hint only pre-selects the right side of that
 * toggle — nothing routes off it and nothing trusts it, so a stale one is
 * cosmetic. Deliberately not the user id, the phone or anything else
 * identifying: this file must never hold something worth reading off the device.
 */
const LAST_ACCOUNT_TYPE_KEY = 'sununo:lastAccountType';

export type LastAccountType = 'provider' | 'customer';

export async function rememberLastAccountType(type: LastAccountType): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACCOUNT_TYPE_KEY, type);
  } catch {
    // A hint that can't be written just means the toggle shows its default.
  }
}

export async function readLastAccountType(): Promise<LastAccountType | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_ACCOUNT_TYPE_KEY);
    return value === 'provider' || value === 'customer' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Called on a sign-out the user asked for, so the next person to use this phone
 * doesn't inherit the previous owner's toggle. An expired-session sign-out must
 * NOT clear it — that is the exact case the hint exists for.
 */
export async function forgetLastAccountType(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ACCOUNT_TYPE_KEY);
  } catch {
    // Nothing to recover from; the hint is advisory.
  }
}
