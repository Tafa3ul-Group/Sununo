import {
  SolarBanknoteBold,
  SolarCheckCircleBold,
  SolarClockCircleBold,
  SolarCloseCircleBold,
  SolarInfoCircleBold,
} from '@/components/icons/solar-icons';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import {
  useGetOwnerChaletsQuery,
  useGetProviderDiscountsQuery,
  useRequestProviderDiscountMutation,
  useToggleProviderDiscountMutation,
} from '@/store/api/apiSlice';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * The owner's own discounts.
 *
 * Everything on this screen is funded by the OWNER: the platform's commission is
 * worked out on the price before the discount and does not change, so the whole
 * saving comes out of their earnings. That is stated plainly at the top, because
 * it is the one thing they must not misunderstand before submitting.
 *
 * Two kinds of row appear: what they asked for (pausable, and pending until an
 * admin approves) and what the platform imposed (visible, not pausable).
 */
export default function ProviderDiscountsScreen() {
  const { isRTL, textAlign } = useDirection();

  const { data, isLoading, refetch, isFetching } = useGetProviderDiscountsQuery(undefined);
  const { data: chaletsData } = useGetOwnerChaletsQuery(undefined);
  const [requestDiscount, { isLoading: isSubmitting }] = useRequestProviderDiscountMutation();
  const [toggleDiscount] = useToggleProviderDiscountMutation();

  const discounts: any[] = useMemo(() => data?.data || data || [], [data]);
  const chalets: any[] = useMemo(() => chaletsData?.data || chaletsData || [], [chaletsData]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [selectedChalets, setSelectedChalets] = useState<string[]>([]);

  const label = (value: any): string =>
    typeof value === 'string' ? value : (isRTL ? value?.ar : value?.en) || value?.ar || value?.en || '';

  const resetForm = () => {
    setName('');
    setPercentage('');
    setSelectedChalets([]);
    setShowForm(false);
  };

  const toggleChalet = (id: string) =>
    setSelectedChalets((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );

  const submit = async () => {
    const pct = Number(percentage);

    if (!name.trim()) {
      Toast.show({ type: 'error', text1: isRTL ? 'أدخل اسماً للعرض' : 'Enter an offer name' });
      return;
    }
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      Toast.show({ type: 'error', text1: isRTL ? 'أدخل نسبة صحيحة' : 'Enter a valid percentage' });
      return;
    }
    if (!selectedChalets.length) {
      Toast.show({ type: 'error', text1: isRTL ? 'اختر شاليهاً واحداً على الأقل' : 'Pick at least one chalet' });
      return;
    }

    try {
      await requestDiscount({
        name: { ar: name.trim(), en: name.trim() },
        percentage: pct,
        chaletIds: selectedChalets,
      }).unwrap();

      Toast.show({
        type: 'success',
        text1: isRTL ? 'أُرسل الطلب' : 'Request sent',
        text2: isRTL ? 'سيُطبَّق بعد موافقة الإدارة' : 'It applies once the admin approves',
      });
      resetForm();
      refetch();
    } catch (error: any) {
      const raw = error?.data?.message;
      Toast.show({
        type: 'error',
        text1: isRTL ? 'تعذّر إرسال الطلب' : 'Could not send the request',
        text2: Array.isArray(raw) ? raw.join('\n') : raw,
      });
    }
  };

  const onToggle = async (discount: any, next: boolean) => {
    try {
      await toggleDiscount({ id: discount.id, isActive: next }).unwrap();
      refetch();
    } catch (error: any) {
      const raw = error?.data?.message;
      Toast.show({
        type: 'error',
        text1: isRTL ? 'تعذّر التغيير' : 'Could not change it',
        text2: Array.isArray(raw) ? raw.join('\n') : raw,
      });
    }
  };

  const statusOf = (discount: any) => {
    if (discount.approvalStatus === 'pending') {
      return { text: isRTL ? 'بانتظار الموافقة' : 'Awaiting approval', color: Colors.accent, Icon: SolarClockCircleBold };
    }
    if (discount.approvalStatus === 'rejected') {
      return { text: isRTL ? 'مرفوض' : 'Rejected', color: Colors.error, Icon: SolarCloseCircleBold };
    }
    if (!discount.isActive) {
      return { text: isRTL ? 'متوقّف' : 'Paused', color: Colors.text.muted, Icon: SolarCloseCircleBold };
    }
    return { text: isRTL ? 'فعّال' : 'Active', color: Colors.secondary, Icon: SolarCheckCircleBold };
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      {/* The one thing they must understand before submitting */}
      <View style={styles.notice}>
        <SolarInfoCircleBold size={18} color={Colors.primary} />
        <Text style={[styles.noticeText, { textAlign }]}>
          {isRTL
            ? 'هذا الخصم يُقتطع من حصتك أنت. عمولة المنصّة تُحسب على السعر قبل الخصم ولا تتغيّر، والفرق ينزل من أرباحك.'
            : "This discount comes out of your own share. The platform's commission is calculated on the pre-discount price and does not change — the difference comes off your earnings."}
        </Text>
      </View>

      {!showForm && (
        <Pressable style={styles.primaryButton} onPress={() => setShowForm(true)}>
          <SolarBanknoteBold size={18} color="white" />
          <Text style={styles.primaryButtonText}>
            {isRTL ? 'طلب خصم جديد' : 'Request a discount'}
          </Text>
        </Pressable>
      )}

      {showForm && (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign }]}>
            {isRTL ? 'طلب خصم على شاليهاتك' : 'Request a discount on your chalets'}
          </Text>

          <Text style={[styles.fieldLabel, { textAlign }]}>{isRTL ? 'اسم العرض' : 'Offer name'}</Text>
          <TextInput
            style={[styles.input, { textAlign }]}
            value={name}
            onChangeText={setName}
            placeholder={isRTL ? 'مثال: عرض نهاية الأسبوع' : 'e.g. Weekend offer'}
            placeholderTextColor={Colors.text.muted}
          />

          <Text style={[styles.fieldLabel, { textAlign }]}>{isRTL ? 'نسبة الخصم %' : 'Discount %'}</Text>
          <TextInput
            style={[styles.input, { textAlign }]}
            value={percentage}
            onChangeText={setPercentage}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={Colors.text.muted}
          />

          <Text style={[styles.fieldLabel, { textAlign }]}>{isRTL ? 'الشاليهات' : 'Chalets'}</Text>
          {chalets.map((chalet: any) => {
            const picked = selectedChalets.includes(chalet.id);
            return (
              <Pressable
                key={chalet.id}
                style={[styles.chaletRow, picked && styles.chaletRowPicked]}
                onPress={() => toggleChalet(chalet.id)}
              >
                <View style={[styles.checkbox, picked && styles.checkboxPicked]}>
                  {picked && <SolarCheckCircleBold size={14} color="white" />}
                </View>
                <Text style={[styles.chaletName, { textAlign }]} numberOfLines={1}>
                  {label(chalet.name)}
                </Text>
              </Pressable>
            );
          })}
          {!chalets.length && (
            <Text style={[styles.empty, { textAlign }]}>
              {isRTL ? 'لا توجد شاليهات' : 'No chalets yet'}
            </Text>
          )}

          <View style={styles.formActions}>
            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, styles.flex1, isSubmitting && styles.disabled]}
              onPress={submit}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : isRTL ? 'إرسال الطلب' : 'Send request'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { textAlign }]}>{isRTL ? 'خصوماتك' : 'Your discounts'}</Text>

      {!discounts.length && (
        <Text style={[styles.empty, { textAlign }]}>
          {isRTL ? 'لا توجد خصومات على شاليهاتك' : 'No discounts on your chalets'}
        </Text>
      )}

      {discounts.map((discount: any) => {
        const status = statusOf(discount);
        return (
          <View key={discount.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.discountName, { textAlign }]} numberOfLines={1}>
                {label(discount.name)}
              </Text>
              <Text style={styles.percentage}>{discount.percentage}%</Text>
            </View>

            <View style={styles.statusRow}>
              <status.Icon size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>

            {discount.imposedByPlatform && (
              <Text style={[styles.meta, { textAlign }]}>
                {isRTL
                  ? 'وضعته الإدارة — لا يمكن إيقافه من هنا'
                  : 'Set by the platform — cannot be paused here'}
              </Text>
            )}

            {discount.rejectionReason && (
              <Text style={[styles.meta, { textAlign, color: Colors.error }]}>
                {isRTL ? 'سبب الرفض: ' : 'Reason: '}{discount.rejectionReason}
              </Text>
            )}

            {/* Only campaigns they requested may be paused — the server enforces
                the same rule, this just avoids offering a control that would fail. */}
            {discount.canToggle && discount.approvalStatus === 'approved' && (
              <View style={styles.rowBetween}>
                <Text style={[styles.fieldLabel, { textAlign, marginTop: 0 }]}>
                  {isRTL ? 'مفعّل' : 'Active'}
                </Text>
                <Switch
                  value={discount.isActive !== false}
                  onValueChange={(next) => onToggle(discount, next)}
                  trackColor={{ true: Colors.primary }}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: normalize.width(16), paddingBottom: normalize.height(40), gap: normalize.height(12) },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  notice: {
    flexDirection: 'row',
    gap: normalize.width(10),
    alignItems: 'flex-start',
    backgroundColor: `${Colors.primary}12`,
    borderRadius: normalize.radius(14),
    padding: normalize.width(14),
  },
  noticeText: { flex: 1, fontSize: normalize.font(12), lineHeight: normalize.font(19), color: Colors.text.primary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    padding: normalize.width(14),
    gap: normalize.height(8),
  },
  cardTitle: { fontSize: normalize.font(15), fontFamily: 'Alexandria-Medium', color: Colors.text.primary },

  fieldLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
    marginTop: normalize.height(6),
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: normalize.radius(12),
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(10),
    fontSize: normalize.font(13),
    color: Colors.text.primary,
    backgroundColor: Colors.white,
  },

  chaletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize.width(10),
    paddingVertical: normalize.height(9),
    paddingHorizontal: normalize.width(10),
    borderRadius: normalize.radius(10),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chaletRowPicked: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}0D` },
  checkbox: {
    width: normalize.width(20),
    height: normalize.width(20),
    borderRadius: normalize.radius(6),
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxPicked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chaletName: { flex: 1, fontSize: normalize.font(13), color: Colors.text.primary },

  formActions: { flexDirection: 'row', gap: normalize.width(10), marginTop: normalize.height(6) },
  flex1: { flex: 1 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize.width(8),
    backgroundColor: Colors.primary,
    borderRadius: normalize.radius(14),
    paddingVertical: normalize.height(13),
  },
  primaryButtonText: { color: 'white', fontSize: normalize.font(13), fontFamily: 'Alexandria-Medium' },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize.height(13),
    paddingHorizontal: normalize.width(20),
    borderRadius: normalize.radius(14),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: { color: Colors.text.secondary, fontSize: normalize.font(13) },
  disabled: { opacity: 0.6 },

  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.primary,
    marginTop: normalize.height(8),
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: normalize.width(10) },
  discountName: { flex: 1, fontSize: normalize.font(14), fontFamily: 'Alexandria-Medium', color: Colors.text.primary },
  percentage: { fontSize: normalize.font(15), fontFamily: 'Alexandria-Medium', color: Colors.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: normalize.width(6) },
  statusText: { fontSize: normalize.font(12) },
  meta: { fontSize: normalize.font(11), color: Colors.text.muted, lineHeight: normalize.font(17) },
  empty: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    paddingVertical: normalize.height(16),
  },
});
