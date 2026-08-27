import {
  SolarBanknoteBold,
  SolarCalendarBold,
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
  useUpdateProviderDiscountMutation,
} from '@/store/api/apiSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
  const { isRTL, direction, textAlign, inputTextAlign } = useDirection();

  const { data, isLoading, refetch, isFetching } = useGetProviderDiscountsQuery(undefined);
  const { data: chaletsData } = useGetOwnerChaletsQuery(undefined);
  const [requestDiscount, { isLoading: isSubmitting }] = useRequestProviderDiscountMutation();
  const [toggleDiscount] = useToggleProviderDiscountMutation();
  const [updateDiscount, { isLoading: isSavingWindow }] = useUpdateProviderDiscountMutation();

  const discounts: any[] = useMemo(() => data?.data || data || [], [data]);
  const chalets: any[] = useMemo(() => chaletsData?.data || chaletsData || [], [chaletsData]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [selectedChalets, setSelectedChalets] = useState<string[]>([]);

  // The window is edited in exactly ONE place at a time — the request form, or a
  // single row's editor — so both share this state and opening either closes the
  // other. `null` on either end is a real value: "starts now" / "never ends".
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [picker, setPicker] = useState<null | 'start' | 'end'>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const label = (value: any): string =>
    typeof value === 'string' ? value : (isRTL ? value?.ar : value?.en) || value?.ar || value?.en || '';

  /**
   * The server resolvers test `endsAt >= now`, so a bare midnight end date would kill
   * the campaign at 00:00 ON the last day the owner picked — a full day early. The end
   * is therefore pushed to the last millisecond of that local day, and the start floored
   * to its first. The admin portal builds the same two edges (`T23:59:59` in
   * sununo-portal discounts.vue), so a window means the same thing in both clients.
   */
  const startOfDay = (value: Date) => {
    const day = new Date(value);
    day.setHours(0, 0, 0, 0);
    return day;
  };
  const endOfDay = (value: Date) => {
    const day = new Date(value);
    day.setHours(23, 59, 59, 999);
    return day;
  };

  // No `pinLTR` here, unlike a phone number: a slash-separated numeric date is a
  // single bidi number run, so it keeps its own order inside an Arabic paragraph.
  const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US');

  const resetForm = () => {
    setName('');
    setPercentage('');
    setSelectedChalets([]);
    setStartsAt(null);
    setEndsAt(null);
    setPicker(null);
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
    if (startsAt && endsAt && startOfDay(startsAt) > endOfDay(endsAt)) {
      Toast.show({
        type: 'error',
        text1: isRTL ? 'تاريخ البداية يجب أن يسبق تاريخ النهاية' : 'The start date must come before the end date',
      });
      return;
    }

    try {
      await requestDiscount({
        name: { ar: name.trim(), en: name.trim() },
        percentage: pct,
        chaletIds: selectedChalets,
        // Explicit nulls: an untouched field means "open-ended", not "unspecified".
        startsAt: startsAt ? startOfDay(startsAt).toISOString() : null,
        endsAt: endsAt ? endOfDay(endsAt).toISOString() : null,
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

  const startEditing = (discount: any) => {
    // One editor open at a time — the request form and a row editor share the dates.
    setShowForm(false);
    setPicker(null);
    setEditingId(discount.id);
    setStartsAt(discount.startsAt ? new Date(discount.startsAt) : null);
    setEndsAt(discount.endsAt ? new Date(discount.endsAt) : null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setPicker(null);
    setStartsAt(null);
    setEndsAt(null);
  };

  const saveWindow = async () => {
    if (!editingId) return;
    if (startsAt && endsAt && startOfDay(startsAt) > endOfDay(endsAt)) {
      Toast.show({
        type: 'error',
        text1: isRTL ? 'تاريخ البداية يجب أن يسبق تاريخ النهاية' : 'The start date must come before the end date',
      });
      return;
    }

    try {
      await updateDiscount({
        id: editingId,
        startsAt: startsAt ? startOfDay(startsAt).toISOString() : null,
        endsAt: endsAt ? endOfDay(endsAt).toISOString() : null,
      }).unwrap();

      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث الفترة' : 'Period updated' });
      cancelEditing();
      refetch();
    } catch (error: any) {
      const raw = error?.data?.message;
      Toast.show({
        type: 'error',
        text1: isRTL ? 'تعذّر تحديث الفترة' : 'Could not update the period',
        text2: Array.isArray(raw) ? raw.join('\n') : raw,
      });
    }
  };

  // Mirrors the admin portal's `phaseOf` (sununo-portal discounts.vue) so an owner and
  // an admin never read the same campaign differently: approval outranks everything,
  // then the pause switch, then the window.
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
    const now = Date.now();
    if (discount.startsAt && new Date(discount.startsAt).getTime() > now) {
      return { text: isRTL ? 'مجدول' : 'Scheduled', color: Colors.primary, Icon: SolarClockCircleBold };
    }
    if (discount.endsAt && new Date(discount.endsAt).getTime() < now) {
      return { text: isRTL ? 'منتهي' : 'Expired', color: Colors.text.muted, Icon: SolarCloseCircleBold };
    }
    return { text: isRTL ? 'فعّال' : 'Active', color: Colors.secondary, Icon: SolarCheckCircleBold };
  };

  /** The window fields — shared by the request form and every row's editor. */
  const renderDateField = (which: 'start' | 'end') => {
    const value = which === 'start' ? startsAt : endsAt;
    return (
      <View key={which}>
        <Text style={[styles.fieldLabel, { textAlign }]}>
          {which === 'start'
            ? isRTL ? 'بداية العرض (اختياري)' : 'Offer start (optional)'
            : isRTL ? 'نهاية العرض (اختياري)' : 'Offer end (optional)'}
        </Text>
        <Pressable style={[styles.input, styles.dateField]} onPress={() => setPicker(which)}>
          <SolarCalendarBold size={16} color={Colors.text.muted} />
          <Text style={[styles.dateValue, !value && styles.datePlaceholder, { textAlign }]} numberOfLines={1}>
            {value
              ? formatDate(value)
              : which === 'start'
                ? isRTL ? 'من الآن' : 'From now'
                : isRTL ? 'بلا نهاية' : 'No end'}
          </Text>
          {!!value && (
            <Pressable
              hitSlop={10}
              onPress={() => (which === 'start' ? setStartsAt(null) : setEndsAt(null))}
            >
              <SolarCloseCircleBold size={16} color={Colors.text.muted} />
            </Pressable>
          )}
        </Pressable>
      </View>
    );
  };

  /**
   * Said out loud because the mistake it prevents is a mispriced season: the window is
   * matched against WHEN THE BOOKING IS MADE, not against the nights being booked. An
   * owner reading "1–10 September" as "September stays are discounted" would be wrong.
   */
  const renderWindowHint = () => (
    <Text style={[styles.meta, { textAlign }]}>
      {isRTL
        ? 'يُطبَّق على الحجوزات التي تُجرى خلال هذه الفترة — لا على ليالي الإقامة الواقعة فيها.'
        : 'It applies to bookings MADE within this period — not to stays that fall inside it.'}
    </Text>
  );

  const pickerValue = (picker === 'end' ? endsAt : startsAt) || new Date();
  const applyPickedDate = (selected: Date) => {
    if (picker === 'end') setEndsAt(selected);
    else setStartsAt(selected);
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
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            cancelEditing();
            setShowForm(true);
          }}
        >
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
            style={[styles.input, { textAlign: inputTextAlign }]}
            value={name}
            onChangeText={setName}
            placeholder={isRTL ? 'مثال: عرض نهاية الأسبوع' : 'e.g. Weekend offer'}
            placeholderTextColor={Colors.text.muted}
          />

          <Text style={[styles.fieldLabel, { textAlign }]}>{isRTL ? 'نسبة الخصم %' : 'Discount %'}</Text>
          <TextInput
            style={[styles.input, { textAlign: inputTextAlign }]}
            value={percentage}
            onChangeText={setPercentage}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={Colors.text.muted}
          />

          {renderDateField('start')}
          {renderDateField('end')}
          {renderWindowHint()}

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

            {/* Shown on every row, imposed ones included — "فعّال" alone never says
                whether the campaign is still inside its window. */}
            <Text style={[styles.meta, { textAlign }]}>
              {discount.startsAt || discount.endsAt
                ? isRTL
                  ? `من ${discount.startsAt ? formatDate(discount.startsAt) : 'الآن'} إلى ${discount.endsAt ? formatDate(discount.endsAt) : 'بلا نهاية'}`
                  : `From ${discount.startsAt ? formatDate(discount.startsAt) : 'now'} to ${discount.endsAt ? formatDate(discount.endsAt) : 'no end'}`
                : isRTL
                  ? 'بلا فترة محددة'
                  : 'No set period'}
            </Text>

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

            {/* Only campaigns they requested may be rescheduled — gated on the server's
                own `canEdit`, never inferred from `imposedByPlatform`. Pending is allowed
                too: moving the window costs the platform nothing, so it needs no re-approval. */}
            {discount.canEdit &&
              (discount.approvalStatus === 'approved' || discount.approvalStatus === 'pending') &&
              (editingId === discount.id ? (
                <View style={styles.windowEditor}>
                  {renderDateField('start')}
                  {renderDateField('end')}
                  {renderWindowHint()}
                  <View style={styles.formActions}>
                    <Pressable style={styles.secondaryButton} onPress={cancelEditing}>
                      <Text style={styles.secondaryButtonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButton, styles.flex1, isSavingWindow && styles.disabled]}
                      onPress={saveWindow}
                      disabled={isSavingWindow}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isSavingWindow ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : isRTL ? 'حفظ الفترة' : 'Save period'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.linkButton} onPress={() => startEditing(discount)}>
                  <SolarCalendarBold size={14} color={Colors.primary} />
                  <Text style={styles.linkButtonText}>{isRTL ? 'تعديل الفترة' : 'Edit the period'}</Text>
                </Pressable>
              ))}

            {/* Only campaigns they requested may be paused — the server enforces
                the same rule, this just avoids offering a control that would fail. */}
            {discount.canToggle && discount.approvalStatus === 'approved' && (
              <>
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
                <Text style={[styles.meta, { textAlign }]}>
                  {isRTL
                    ? 'الإيقاف والفترة مستقلّان: الإيقاف يعطّل العرض فوراً مهما كانت الفترة، والفترة تنتهي وحدها دون حاجة لإيقافه.'
                    : 'The switch and the period are independent: pausing stops the offer at once whatever the period says, and the period expires on its own without pausing.'}
                </Text>
              </>
            )}
          </View>
        );
      })}

      {/* One picker serves both editors; `picker` says which end it is filling. */}
      {picker !== null &&
        (Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" visible onRequestClose={() => setPicker(null)}>
            {/* RN Modal = new native root; re-apply direction. */}
            <View style={[styles.modalOverlay, { direction }]}>
              <View style={styles.modalContainer}>
                <View style={[styles.modalHeader, { flexDirection: 'row' }]}>
                  <Pressable onPress={() => setPicker(null)}>
                    <Text style={styles.modalCloseText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                  </Pressable>
                  <Pressable onPress={() => setPicker(null)}>
                    <Text style={styles.modalDoneText}>{isRTL ? 'تم' : 'Done'}</Text>
                  </Pressable>
                </View>
                <View style={styles.modalPickerContainer}>
                  <DateTimePicker
                    value={pickerValue}
                    mode="date"
                    display="spinner"
                    textColor={Colors.text.primary}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) applyPickedDate(selectedDate);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setPicker(null);
              if (selectedDate) applyPickedDate(selectedDate);
            }}
          />
        ))}
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
  cardTitle: { fontSize: normalize.font(15), fontFamily: 'IBMPlexSansArabic-SemiBold', color: Colors.text.primary },

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

  dateField: { flexDirection: 'row', alignItems: 'center', gap: normalize.width(8) },
  dateValue: { flex: 1, fontSize: normalize.font(13), color: Colors.text.primary },
  datePlaceholder: { color: Colors.text.muted },
  windowEditor: { gap: normalize.height(4), marginTop: normalize.height(4) },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: normalize.width(6),
    paddingVertical: normalize.height(6),
  },
  linkButtonText: { fontSize: normalize.font(12), color: Colors.primary, fontFamily: 'IBMPlexSansArabic-Medium' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseText: { fontSize: normalize.font(14), fontFamily: 'IBMPlexSansArabic-Medium', color: Colors.text.secondary },
  modalDoneText: { fontSize: normalize.font(14), fontFamily: 'IBMPlexSansArabic-Medium', color: Colors.primary },
  modalPickerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, width: '100%' },

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
  primaryButtonText: { color: 'white', fontSize: normalize.font(13), fontFamily: 'IBMPlexSansArabic-SemiBold' },
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
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    color: Colors.text.primary,
    marginTop: normalize.height(8),
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: normalize.width(10) },
  discountName: { flex: 1, fontSize: normalize.font(14), fontFamily: 'IBMPlexSansArabic-SemiBold', color: Colors.text.primary },
  percentage: { fontSize: normalize.font(15), fontFamily: 'IBMPlexSansArabic-Medium', color: Colors.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: normalize.width(6) },
  statusText: { fontSize: normalize.font(12) },
  meta: { fontSize: normalize.font(11), color: Colors.text.muted, lineHeight: normalize.font(17) },
  empty: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    paddingVertical: normalize.height(16),
  },
});
