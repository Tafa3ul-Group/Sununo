import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import {
  SolarAddCircleBold,
  SolarInfoCircleBold,
  SolarTrashBinMinimalisticLinear,
} from '@/components/icons/solar-icons';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import { describeCancellationTiers } from '@/utils/cancellation-policy-text';
import {
  useDeleteChaletPolicyMutation,
  useGetChaletCancellationPoliciesQuery,
  useSetChaletPoliciesMutation,
} from '@/store/api/apiSlice';

/**
 * The owner's cancellation policy: tiers of "cancelled N or more days before the
 * booking → fee P% of the booking price".
 *
 * How the API applies it (CancellationProcessingService) — and so what this
 * screen has to describe truthfully:
 *  - the tier used is the one with the largest N that is still <= the days left;
 *  - no tier applies (cancelled closer than the smallest N, or no tiers at all)
 *    → the fee is 100%, nothing comes back;
 *  - the fee is a share of the FULL booking price, capped at what the customer
 *    actually paid. A deposit booking therefore loses its deposit to any fee that
 *    reaches the deposit's share of the price — which is why each tier shows a
 *    worked example in dinars instead of a bare "refund %".
 *  - a same-day (N = 0) tier must charge 100% (the API refuses anything else).
 */

export type CancellationPolicySheetRef = { present: () => void; dismiss: () => void };

interface Props {
  chaletId: string;
  /** The chalet's deposit settings, so the worked example shows its real deposit. */
  depositType?: string | null;
  depositPercentage?: number | string | null;
  depositFixedAmount?: number | string | null;
}

/**
 * Prices live per shift and per weekday, so there is no single "chalet price" to
 * quote. The worked example uses a round, clearly-labelled amount instead.
 */
const EXAMPLE_PRICE = 100_000;

type ServerTier = { id: string; daysBeforeBooking: number; penaltyPercentage: number | string };
type Row = { key: string; days: string; fee: string };

const PRESETS: { key: string; ar: string; en: string; rows: { days: number; fee: number }[] }[] = [
  { key: 'flexible', ar: 'مرنة', en: 'Flexible', rows: [{ days: 7, fee: 0 }, { days: 3, fee: 50 }] },
  { key: 'moderate', ar: 'متوسطة', en: 'Moderate', rows: [{ days: 14, fee: 0 }, { days: 7, fee: 50 }] },
  { key: 'strict', ar: 'بدون استرجاع', en: 'No refunds', rows: [] },
];

let rowSeq = 0;
const newRow = (days = '', fee = ''): Row => ({ key: `row-${rowSeq++}`, days, fee });

const toArray = (res: unknown): ServerTier[] => {
  if (Array.isArray(res)) return res as ServerTier[];
  const data = (res as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as ServerTier[]) : [];
};

const money = (n: number) => `${Math.round(n).toLocaleString('en-US')}`;

/** Valid tiers, sorted farthest-first, or the first reason they aren't. */
function validate(rows: Row[], isRTL: boolean): { tiers: { days: number; fee: number }[] } | { error: string } {
  const tiers: { days: number; fee: number }[] = [];
  for (const r of rows) {
    const days = Number(r.days);
    const fee = Number(r.fee);
    if (r.days === '' || !Number.isInteger(days) || days < 0) {
      return { error: isRTL ? 'اكتب عدد الأيام لكل شريحة (رقم صحيح).' : 'Enter the number of days for every tier.' };
    }
    if (r.fee === '' || !Number.isFinite(fee) || fee < 0 || fee > 100) {
      return { error: isRTL ? 'نسبة الرسوم يجب أن تكون بين 0 و 100.' : 'The fee must be between 0 and 100.' };
    }
    tiers.push({ days, fee });
  }
  tiers.sort((a, b) => b.days - a.days);
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].days === tiers[i - 1].days) {
      return { error: isRTL ? `يوجد أكثر من شريحة لـ ${tiers[i].days} يوم.` : `Two tiers share ${tiers[i].days} days.` };
    }
    if (tiers[i].fee < tiers[i - 1].fee) {
      return {
        error: isRTL
          ? 'كلما اقترب موعد الحجز يجب ألا تقل رسوم الإلغاء.'
          : 'The fee cannot go down as the booking gets closer.',
      };
    }
  }
  const sameDay = tiers.find((t) => t.days === 0);
  if (sameDay && sameDay.fee !== 100) {
    return { error: isRTL ? 'الإلغاء في يوم الحجز نفسه رسومه 100% دائماً.' : 'Same-day cancellation is always 100%.' };
  }
  return { tiers };
}

export const CancellationPolicySheet = forwardRef<CancellationPolicySheetRef, Props>(
  ({ chaletId, depositType, depositPercentage, depositFixedAmount }, ref) => {
    const { isRTL, textAlign, rowDirection } = useDirection();
    const exampleDeposit =
      depositType === 'fixed'
        ? Math.min(Number(depositFixedAmount) || 0, EXAMPLE_PRICE)
        : (EXAMPLE_PRICE * (Number(depositPercentage) || 0)) / 100;
    const sheetRef = useRef<BottomSheetModal>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const { data, isFetching, refetch } = useGetChaletCancellationPoliciesQuery(chaletId, { skip: !chaletId });
    const [setPolicies] = useSetChaletPoliciesMutation();
    const [deletePolicy] = useDeleteChaletPolicyMutation();
    const saved = useMemo(() => toArray(data), [data]);

    const loadFromServer = useCallback((tiers: ServerTier[]) => {
      setRows(
        [...tiers]
          .sort((a, b) => b.daysBeforeBooking - a.daysBeforeBooking)
          .map((t) => newRow(String(t.daysBeforeBooking), String(Number(t.penaltyPercentage)))),
      );
    }, []);

    // Set once the owner touches the tiers, so a slow refetch can't overwrite them.
    const editedRef = useRef(false);
    const edit = (next: Row[] | ((prev: Row[]) => Row[])) => {
      editedRef.current = true;
      setRows(next);
    };

    useImperativeHandle(ref, () => ({
      present: () => {
        editedRef.current = false;
        loadFromServer(saved);
        sheetRef.current?.present();
        // Edits from another device would otherwise be overwritten silently.
        refetch()
          .then((res: any) => {
            if (res?.data && !editedRef.current) loadFromServer(toArray(res.data));
          })
          .catch(() => undefined);
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const check = useMemo(() => validate(rows, isRTL), [rows, isRTL]);
    const error = 'error' in check ? check.error : null;
    const tiers = 'tiers' in check ? check.tiers : [];

    const update = (key: string, field: 'days' | 'fee', value: string) =>
      edit((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value.replace(/[^0-9.]/g, '') } : r)));

    const applyPreset = (preset: (typeof PRESETS)[number]) => {
      Haptics.selectionAsync().catch(() => {});
      edit(preset.rows.map((r) => newRow(String(r.days), String(r.fee))));
    };

    const handleSave = async () => {
      if (error) return;
      setIsSaving(true);
      try {
        if (tiers.length === 0) {
          // The API's PUT needs at least one tier, so "no refunds" is reached by
          // removing them: with no tier the fee is 100%.
          for (const t of saved) await deletePolicy({ chaletId, policyId: t.id }).unwrap();
        } else {
          await setPolicies({
            chaletId,
            data: { policies: tiers.map((t) => ({ daysBeforeBooking: t.days, penaltyPercentage: t.fee })) },
          }).unwrap();
        }
        Toast.show({ type: 'success', text1: isRTL ? 'تم حفظ سياسة الإلغاء' : 'Cancellation policy saved' });
        sheetRef.current?.dismiss();
      } catch (e: any) {
        Toast.show({
          type: 'error',
          text1: isRTL ? 'تعذّر حفظ سياسة الإلغاء' : 'Could not save the policy',
          text2: e?.data?.message,
        });
      } finally {
        setIsSaving(false);
      }
    };

    // Same wording the customer sees on the checkout card.
    const lines = describeCancellationTiers(tiers, isRTL);

    // Same arithmetic as CancellationProcessingService: the fee is a share of the
    // full price, capped at what was actually paid.
    const example = (fee: number) => {
      if (fee >= 100) return null;
      const penalty = (EXAMPLE_PRICE * fee) / 100;
      const fullRefund = Math.max(0, EXAMPLE_PRICE - penalty);
      const depositRefund = Math.max(0, exampleDeposit - Math.min(penalty, exampleDeposit));
      return isRTL
        ? `دفع كامل المبلغ ← يسترجع ${money(fullRefund)} د.ع${exampleDeposit > 0 ? ` • دفع العربون فقط ← يسترجع ${money(depositRefund)} د.ع` : ''}`
        : `Paid in full → ${money(fullRefund)} IQD back${exampleDeposit > 0 ? ` • Paid the deposit only → ${money(depositRefund)} IQD back` : ''}`;
    };

    const exampleCaption = isRTL
      ? `المبالغ أدناه مثال لحجز بـ ${money(EXAMPLE_PRICE)} د.ع${exampleDeposit > 0 ? ` (العربون ${money(exampleDeposit)} د.ع)` : ''}`
      : `Amounts are for an example ${money(EXAMPLE_PRICE)} IQD booking${exampleDeposit > 0 ? ` (deposit ${money(exampleDeposit)} IQD)` : ''}`;

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />,
      [],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={['88%']}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy'}</Text>
          <Text style={[styles.intro, { textAlign }]}>
            {isRTL
              ? 'حدّد كم يُسترجع للزبون حسب موعد إلغائه قبل الحجز. تظهر هذه السياسة للزبون قبل أن يحجز، وتُطبَّق تلقائياً عند الإلغاء.'
              : 'Set how much a customer gets back depending on how early they cancel. Customers see this before booking, and it is applied automatically.'}
          </Text>

          <Text style={[styles.sectionLabel, { textAlign }]}>{isRTL ? 'قوالب جاهزة' : 'Presets'}</Text>
          <View style={[styles.presets, { flexDirection: rowDirection }]}>
            {PRESETS.map((p) => (
              <TouchableOpacity key={p.key} style={styles.presetChip} onPress={() => applyPreset(p)} activeOpacity={0.8}>
                <Text style={styles.presetText}>{isRTL ? p.ar : p.en}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { textAlign }]}>{isRTL ? 'الشرائح' : 'Tiers'}</Text>
          {isFetching && rows.length === 0 ? (
            <ActivityIndicator color={Colors.text.muted} style={{ marginVertical: 16 }} />
          ) : null}
          {rows.map((r) => (
            <View key={r.key} style={[styles.tierRow, { flexDirection: rowDirection }]}>
              <Text style={styles.tierWord}>{isRTL ? 'قبل' : 'From'}</Text>
              <BottomSheetTextInput
                style={styles.tierInput}
                keyboardType="number-pad"
                value={r.days}
                onChangeText={(v) => update(r.key, 'days', v)}
                placeholder="7"
                placeholderTextColor="#94A3B8"
                maxLength={3}
                accessibilityLabel={isRTL ? 'عدد الأيام' : 'Days'}
              />
              <Text style={styles.tierWord}>{isRTL ? 'يوم ← رسوم' : 'days → fee'}</Text>
              <BottomSheetTextInput
                style={styles.tierInput}
                keyboardType="decimal-pad"
                value={r.fee}
                onChangeText={(v) => update(r.key, 'fee', v)}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                maxLength={5}
                accessibilityLabel={isRTL ? 'نسبة الرسوم' : 'Fee %'}
              />
              <Text style={styles.tierWord}>%</Text>
              <TouchableOpacity
                onPress={() => edit((prev) => prev.filter((x) => x.key !== r.key))}
                hitSlop={10}
                accessibilityLabel={isRTL ? 'حذف الشريحة' : 'Remove tier'}
              >
                <SolarTrashBinMinimalisticLinear size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addRow, { flexDirection: rowDirection }]}
            onPress={() => edit((prev) => [...prev, newRow()])}
            activeOpacity={0.8}
          >
            <SolarAddCircleBold size={20} color="#035DF9" />
            <Text style={styles.addText}>{isRTL ? 'إضافة شريحة' : 'Add tier'}</Text>
          </TouchableOpacity>

          {error ? <Text style={[styles.error, { textAlign }]}>{error}</Text> : null}

          {/* The preview only makes sense for a valid policy — while the tiers
              are being edited into shape the error above says what to fix. */}
          {!error ? (
            <>
              <Text style={[styles.sectionLabel, { textAlign }]}>
                {isRTL ? 'هكذا يراها الزبون' : 'What customers see'}
              </Text>
              <View style={styles.preview}>
                {tiers.some((t) => t.fee < 100) ? (
                  <Text style={[styles.previewCaption, { textAlign }]}>{exampleCaption}</Text>
                ) : null}
                {lines.map((line) => (
                  <View key={line.range} style={styles.previewItem}>
                    <Text style={[styles.previewLine, line.noRefund && styles.previewNone, { textAlign }]}>
                      <Text style={styles.previewRange}>{line.range}: </Text>
                      {line.outcome}
                    </Text>
                    {line.tier && example(line.tier.fee) ? (
                      <Text style={[styles.previewExample, { textAlign }]}>{example(line.tier.fee)}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={[styles.note, { flexDirection: rowDirection }]}>
            <SolarInfoCircleBold size={18} color="#64748B" />
            <Text style={[styles.noteText, { textAlign }]}>
              {isRTL
                ? 'الرسوم تُحسب من قيمة الحجز كاملة ولا تتجاوز ما دفعه الزبون. إذا دفع عربوناً فقط، تُخصم الرسوم من العربون أولاً — لذلك قد لا يُسترجع شيء من العربون حتى مع رسوم جزئية.'
                : 'The fee is a share of the full booking price and never exceeds what was paid. On a deposit booking it comes out of the deposit first, so a partial fee can still use up the whole deposit.'}
            </Text>
          </View>

          <PrimaryButton
            label={isRTL ? 'حفظ السياسة' : 'Save Policy'}
            onPress={handleSave}
            loading={isSaving}
            disabled={!!error || isSaving}
            activeColor={error ? '#94A3B8' : undefined}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

CancellationPolicySheet.displayName = 'CancellationPolicySheet';

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  title: {
    fontSize: normalize.font(20),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  intro: {
    fontSize: normalize.font(12.5),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#475569',
    lineHeight: 20,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: normalize.font(13),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: Colors.text.muted,
    marginBottom: 8,
    marginTop: 6,
  },
  presets: { gap: 8, marginBottom: 14 },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  presetText: { fontSize: normalize.font(12.5), fontFamily: 'IBMPlexSansArabic-Medium', color: Colors.text.primary },
  tierRow: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tierWord: { fontSize: normalize.font(13), fontFamily: 'IBMPlexSansArabic-Medium', color: '#475569' },
  tierInput: {
    minWidth: 52,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: normalize.font(15),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: Colors.text.primary,
    paddingHorizontal: 6,
  },
  addRow: { alignItems: 'center', gap: 6, paddingVertical: 10 },
  addText: { fontSize: normalize.font(13.5), fontFamily: 'IBMPlexSansArabic-Bold', color: '#035DF9' },
  error: {
    fontSize: normalize.font(12.5),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  preview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  previewCaption: { fontSize: normalize.font(11.5), fontFamily: 'IBMPlexSansArabic-Regular', color: '#64748B' },
  previewItem: { gap: 2 },
  previewLine: { fontSize: normalize.font(13), fontFamily: 'IBMPlexSansArabic-Medium', color: '#0F172A', lineHeight: 20 },
  previewNone: { color: '#B91C1C' },
  previewRange: { fontFamily: 'IBMPlexSansArabic-Bold' },
  previewExample: { fontSize: normalize.font(11.5), fontFamily: 'IBMPlexSansArabic-Regular', color: '#15803D' },
  note: {
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  noteText: {
    flex: 1,
    fontSize: normalize.font(11.5),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#475569',
    lineHeight: 18,
  },
});
