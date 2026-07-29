import { useCallback } from "react";
import { Linking } from "react-native";

import { SUPPORT_WHATSAPP, toWhatsAppNumber } from "@/constants/links";
import { useGetAppConfigQuery } from "@/store/api/apiSlice";

export interface SupportContact {
  /** Support number in wa.me format (digits only, no leading "+"). */
  phone: string;
  /** Open WhatsApp with support, falling back to a phone call. */
  openSupport: () => void;
}

/**
 * Single source of truth for the "contact support" number.
 *
 * The number is managed by the admin in the portal (الإعدادات العامة → رقم
 * التواصل), stored on `Setting.adminPhone` and served publicly by GET /config —
 * so changing it never needs an app release. `constants/links` only supplies a
 * fallback for the window before /config resolves (or if it fails).
 *
 * refetchOnFocus (set on the apiSlice) keeps this fresh when the app
 * foregrounds, so a number changed in the portal reaches already-open apps.
 */
export function useSupportContact(): SupportContact {
  const { data } = useGetAppConfigQuery();

  const phone = toWhatsAppNumber(data?.adminPhone || SUPPORT_WHATSAPP);

  const openSupport = useCallback(() => {
    Linking.openURL(`https://wa.me/${phone}`).catch(() => {
      Linking.openURL(`tel:+${phone}`).catch(() => {});
    });
  }, [phone]);

  return { phone, openSupport };
}
