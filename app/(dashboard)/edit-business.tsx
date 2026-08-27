import {
    SolarAltArrowDownLinear,
    SolarCheckCircleBold,
    SolarInfoCircleBold,
    SolarShieldWarningBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { IRAQI_BANKS, OTHER_BANK_OPTION } from '@/constants/banks';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import { useGetProviderProfileQuery, useUpdateProviderProfileMutation } from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import { PrimaryButton } from '@/components/user/primary-button';

import {
    validateBankName,
    validateBankNameRequired,
    validatePayoutAccount,
} from '@/utils/payment-validation';

const zainCashLogo = require('@/assets/zaincash.png');
const qiLogo = require('@/assets/qi.svg');

// The ONE destination an owner is paid to. A bank carries its own name; the
// wallets are identified by the kind alone. Saving one clears the others — the
// old four-field form let an owner save three and nobody knew which to pay.
type PayoutMethod =
  | { kind: 'zaincash' }
  | { kind: 'qi' }
  | { kind: 'bank'; bankName: string };

// A row in the method sheet. Wallets and banks share one list — with headers,
// because two wallets followed by 22 bank names reads as one undifferentiated
// wall of Arabic otherwise — so a row needs an id distinct from its label.
type MethodRow =
  | { type: 'header'; id: string; label: string }
  | { type: 'method'; id: string; label: string; logo?: any };

export default function ProviderProfileScreen() {
  const { isRTL: isArabic, textAlign, inputTextAlign } = useDirection();
  const dispatch = useDispatch();
  const router = useRouter();
  const { showConfirm } = useConfirmationDialog();

  const { data: profile, isLoading, isError, refetch } = useGetProviderProfileQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProviderProfileMutation();

  const methodSheetRef = useRef<BottomSheetModal>(null);

  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [account, setAccount] = useState('');

  // "أخرى" mode: the bank name is typed instead of picked from the list.
  const [isOtherBank, setIsOtherBank] = useState(false);

  const [accountError, setAccountError] = useState<string | null>(null);
  const [bankNameError, setBankNameError] = useState<string | null>(null);

  // Owners onboarded before the one-destination rule may have several saved.
  // We keep exactly one and clear the rest, so say so before they hit save.
  const [hasMultipleSaved, setHasMultipleSaved] = useState(false);

  // What the server currently holds, so a save can tell which previously-filled
  // destination it is about to wipe.
  const savedRef = useRef({ zainCash: '', qi: '', bankAccount: '' });
  // The wipe warning is a one-time gate, not a nag on every retry.
  const wipeConfirmedRef = useRef(false);

  const profileData = profile?.data || profile;

  useEffect(() => {
    if (profileData) {
      const savedZainCash = profileData.zainCash || '';
      const savedQi = profileData.qi || '';
      const savedBankName = profileData.bankName || '';
      const savedBankAccount = profileData.bankAccount || '';

      savedRef.current = {
        zainCash: savedZainCash,
        qi: savedQi,
        bankAccount: savedBankAccount,
      };

      // Same precedence the payout screen actually pays out by
      // (components/payout-confirm-view.tsx): zainCash → qi → bank. Hydrating in
      // any other order would silently move where an existing owner gets paid.
      if (savedZainCash) {
        setMethod({ kind: 'zaincash' });
        setAccount(savedZainCash);
      } else if (savedQi) {
        setMethod({ kind: 'qi' });
        setAccount(savedQi);
      } else if (savedBankAccount || savedBankName) {
        setMethod({ kind: 'bank', bankName: savedBankName });
        setAccount(savedBankAccount);
      } else {
        setMethod(null);
        setAccount('');
      }

      // A saved name outside the list renders as "أخرى" + free text.
      setIsOtherBank(!!savedBankName && !IRAQI_BANKS.includes(savedBankName));
      setHasMultipleSaved(
        [savedZainCash, savedQi, savedBankAccount].filter(Boolean).length > 1
      );
    }
  }, [profileData]);

  const methodRows = useMemo<MethodRow[]>(() => [
    { type: 'header', id: 'header:wallets', label: isArabic ? 'محافظ إلكترونية' : 'E-Wallets' },
    { type: 'method', id: 'zaincash', label: isArabic ? 'زين كاش' : 'Zain Cash', logo: zainCashLogo },
    { type: 'method', id: 'qi', label: isArabic ? 'بطاقة كي' : 'Qi Card', logo: qiLogo },
    { type: 'header', id: 'header:banks', label: isArabic ? 'المصارف' : 'Banks' },
    ...IRAQI_BANKS.map(bank => ({ type: 'method' as const, id: bank, label: bank })),
    { type: 'method', id: OTHER_BANK_OPTION, label: isArabic ? 'أخرى' : 'Other' },
  ], [isArabic]);

  const isRowSelected = (row: MethodRow) => {
    if (row.type === 'header' || !method) return false;
    if (row.id === 'zaincash' || row.id === 'qi') return method.kind === row.id;
    if (row.id === OTHER_BANK_OPTION) return method.kind === 'bank' && isOtherBank;
    return method.kind === 'bank' && !isOtherBank && method.bankName === row.id;
  };

  // Picking a row in the method sheet. Choosing "أخرى" clears a listed bank so
  // the owner types their own; an already-custom name stays as the free text.
  const handleMethodSelect = (row: MethodRow) => {
    let next: PayoutMethod;
    if (row.id === 'zaincash' || row.id === 'qi') {
      next = { kind: row.id };
      setIsOtherBank(false);
    } else if (row.id === OTHER_BANK_OPTION) {
      const kept =
        method?.kind === 'bank' && !IRAQI_BANKS.includes(method.bankName)
          ? method.bankName
          : '';
      next = { kind: 'bank', bankName: kept };
      setIsOtherBank(true);
    } else {
      next = { kind: 'bank', bankName: row.id };
      setIsOtherBank(false);
    }
    setMethod(next);
    // A mis-tap must not erase what they already typed — keep the account and
    // only re-check it against the newly chosen method.
    setAccountError(account ? validatePayoutAccount(next.kind, account) : null);
    setBankNameError(null);
    methodSheetRef.current?.dismiss();
  };

  const methodLabel = !method
    ? (isArabic ? 'اختر طريقة الاستلام' : 'Select payout method')
    : method.kind === 'zaincash'
      ? (isArabic ? 'زين كاش' : 'Zain Cash')
      : method.kind === 'qi'
        ? (isArabic ? 'بطاقة كي' : 'Qi Card')
        : isOtherBank
          ? (isArabic ? 'أخرى' : 'Other')
          : method.bankName || (isArabic ? 'اختر المصرف' : 'Select Bank');

  const accountLabel = !method
    ? ''
    : method.kind === 'zaincash'
      ? (isArabic ? 'رقم زين كاش' : 'Zain Cash Number')
      : method.kind === 'qi'
        ? (isArabic ? 'رقم بطاقة كي' : 'Qi Card Number')
        : (isArabic ? 'رقم الحساب / الآيبان' : 'Account Number / IBAN');

  const accountPlaceholder = !method
    ? ''
    : method.kind === 'zaincash'
      ? '07xxxxxxxxx'
      : method.kind === 'qi'
        ? (isArabic ? 'رقم البطاقة المكون من 10 أرقام' : '10-digit card number')
        : 'IQ98NBIQ850123456789012';

  const submit = async (payload: {
    zainCash: string;
    qi: string;
    bankName: string;
    bankAccount: string;
  }) => {
    try {
      await updateProfile(payload).unwrap();
      Toast.show({
        type: 'success',
        text1: isArabic ? 'نجاح' : 'Success',
        text2: isArabic ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully',
        position: 'bottom',
      });
      router.back();
    } catch (error: any) {
      // Surface what the server actually rejected — a bare "failed" toast is
      // what made this screen impossible to debug from the outside.
      const raw = error?.data?.message;
      const detail = Array.isArray(raw) ? raw.join('\n') : raw;
      Toast.show({
        type: 'error',
        text1: isArabic ? 'خطأ' : 'Error',
        text2: detail || (isArabic ? 'فشل تحديث البيانات' : 'Failed to update profile'),
        position: 'bottom',
      });
    }
  };

  const handleSave = async () => {
    if (!method) {
      Toast.show({
        type: 'error',
        text1: isArabic ? 'خطأ في المدخلات' : 'Validation Error',
        text2: isArabic ? 'يرجى اختيار طريقة الاستلام' : 'Please choose a payout method',
        position: 'bottom',
      });
      return;
    }

    const accountErr = validatePayoutAccount(method.kind, account);
    const bankNameErr =
      method.kind === 'bank' ? validateBankNameRequired(method.bankName) : null;

    if (accountErr || bankNameErr) {
      setAccountError(accountErr);
      setBankNameError(bankNameErr);
      Toast.show({
        type: 'error',
        text1: isArabic ? 'خطأ في المدخلات' : 'Validation Error',
        text2: isArabic ? 'يرجى تصحيح الأخطاء قبل الحفظ' : 'Please correct the errors before saving',
        position: 'bottom',
      });
      return;
    }

    setAccountError(null);
    setBankNameError(null);

    // The validators above accept separators ("0772 666 4362"); the server
    // matches on digits only — normalise before sending, same as register.tsx.
    // The three unused fields go out as '': @EmptyToNull in the DTO maps that to
    // null, which is what actually clears the column server-side.
    const clean = (value: string) => value.trim().replace(/[\s\-\(\)]/g, '');
    const payload =
      method.kind === 'zaincash'
        ? { zainCash: clean(account), qi: '', bankName: '', bankAccount: '' }
        : method.kind === 'qi'
          ? { zainCash: '', qi: clean(account), bankName: '', bankAccount: '' }
          // The bank name is a real name, not a number — only trim it.
          : { zainCash: '', qi: '', bankName: method.bankName.trim(), bankAccount: clean(account) };

    // Saving one destination wipes the others. Never do that to a number the
    // owner had already saved without asking first.
    const wiped = [
      savedRef.current.zainCash && !payload.zainCash && (isArabic ? 'رقم زين كاش' : 'Zain Cash number'),
      savedRef.current.qi && !payload.qi && (isArabic ? 'رقم بطاقة كي' : 'Qi Card number'),
      savedRef.current.bankAccount && !payload.bankAccount && (isArabic ? 'الحساب المصرفي' : 'bank account'),
    ].filter(Boolean) as string[];

    if (wiped.length > 0 && !wipeConfirmedRef.current) {
      showConfirm({
        title: isArabic ? 'سيتم حذف بيانات محفوظة' : 'Saved details will be removed',
        message: isArabic
          ? `يمكن الاحتفاظ بطريقة استلام واحدة فقط. عند الحفظ سيتم حذف: ${wiped.join('، ')}.`
          : `Only one payout method is kept. Saving will remove: ${wiped.join(', ')}.`,
        type: 'warning',
        confirmLabel: isArabic ? 'حفظ' : 'Save',
        cancelLabel: isArabic ? 'إلغاء' : 'Cancel',
        onConfirm: async () => {
          wipeConfirmedRef.current = true;
          await submit(payload);
        },
      });
      return;
    }

    await submit(payload);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.warningCard}>
            <View style={[styles.warningHeader, { flexDirection: 'row' }]}>
              <SolarShieldWarningBold size={20} color="#B45309" />
              <ThemedText style={styles.warningTitle}>
                {isArabic ? 'ملاحظة هامة وحساسة' : 'Important & Sensitive Note'}
              </ThemedText>
            </View>
            <ThemedText style={[styles.warningText, { textAlign }]}>
              {isArabic 
                ? 'يتم تحويل مستحقاتك إلى طريقة استلام واحدة فقط. يرجى التأكد من صحة بياناتها بدقة، فأي خطأ فيها قد يؤدي إلى فشل التحويل أو إرساله إلى حساب آخر.'
                : 'Your payouts are sent to a single destination. Please verify its details carefully — any mistake may lead to a failed transfer or funds sent to the wrong account.'}
            </ThemedText>
          </View>

          {hasMultipleSaved && (
            <View style={styles.noticeCard}>
              <View style={[styles.warningHeader, { flexDirection: 'row' }]}>
                <SolarInfoCircleBold size={20} color={Colors.primary} />
                <ThemedText style={styles.noticeTitle}>
                  {isArabic ? 'طريقة استلام واحدة' : 'One payout method'}
                </ThemedText>
              </View>
              <ThemedText style={[styles.noticeText, { textAlign }]}>
                {isArabic
                  ? 'لديك أكثر من طريقة استلام محفوظة. أصبح بالإمكان الاحتفاظ بطريقة واحدة فقط — اختر التي تريدها، وسيتم حذف البقية عند الحفظ.'
                  : 'You have more than one payout method saved. Only one can be kept now — pick the one you want and the rest are removed when you save.'}
              </ThemedText>
            </View>
          )}

          <View style={styles.section}>
            {/* One selector for everything: the two wallets and every bank. */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign }]}>
                {isArabic ? 'طريقة الاستلام' : 'Payout Method'}
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  { flexDirection: 'row', justifyContent: 'space-between' }
                ]}
                onPress={() => methodSheetRef.current?.present()}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[styles.selectValueText, !method && { color: Colors.text.muted }]}
                >
                  {methodLabel}
                </ThemedText>
                <SolarAltArrowDownLinear size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>

            {method?.kind === 'bank' && isOtherBank && (
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { textAlign }]}>
                  {isArabic ? 'اسم المصرف' : 'Bank Name'}
                </ThemedText>
                <View style={[
                  styles.inputWrapper,
                  bankNameError ? { borderColor: '#EF4444' } : null,
                  { flexDirection: 'row' }
                ]}>
                  <TextInput
                    style={[styles.input, { textAlign: inputTextAlign }]}
                    value={method.bankName}
                    onChangeText={(text) => {
                      setMethod({ kind: 'bank', bankName: text });
                      setBankNameError(validateBankName(text, account));
                    }}
                    placeholder={isArabic ? 'اكتب اسم المصرف' : 'Type the bank name'}
                    placeholderTextColor={Colors.text.muted}
                  />
                </View>
                {bankNameError && (
                  <ThemedText style={[styles.errorText, { textAlign }]}>
                    {bankNameError}
                  </ThemedText>
                )}
              </View>
            )}

            {/* The single destination field — nothing to type until a method is picked. */}
            {method && (
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { textAlign }]}>{accountLabel}</ThemedText>
                <View style={[
                  styles.inputWrapper,
                  accountError ? { borderColor: '#EF4444' } : null,
                  { flexDirection: 'row' }
                ]}>
                  {method.kind !== 'bank' && (
                    <Image
                      source={method.kind === 'zaincash' ? zainCashLogo : qiLogo}
                      style={{ width: 30, height: 30, borderRadius: 6, resizeMode: 'contain', marginEnd: 8 }}
                    />
                  )}
                  <TextInput
                    style={[styles.input, { textAlign: inputTextAlign }]}
                    value={account}
                    onChangeText={(text) => {
                      setAccount(text);
                      // Empty stays un-flagged while typing; handleSave catches it.
                      setAccountError(text ? validatePayoutAccount(method.kind, text) : null);
                      if (method.kind === 'bank' && isOtherBank) {
                        setBankNameError(validateBankName(method.bankName, text));
                      }
                    }}
                    placeholder={accountPlaceholder}
                    placeholderTextColor={Colors.text.muted}
                    keyboardType={
                      method.kind === 'zaincash'
                        ? 'phone-pad'
                        : method.kind === 'qi'
                          ? 'numeric'
                          : 'default'
                    }
                  />
                </View>
                {accountError && (
                  <ThemedText style={[styles.errorText, { textAlign }]}>
                    {accountError}
                  </ThemedText>
                )}
              </View>
            )}
          </View>

          <PrimaryButton
            label={isArabic ? 'حفظ التعديلات' : 'Save Changes'}
            onPress={handleSave}
            loading={isUpdating}
            disabled={isUpdating}
            height={54}
            style={{ marginTop: 24 }}
          />

        </ScrollView>

        {/* Method Picker Bottom Sheet */}
        <BottomSheetModal
          ref={methodSheetRef}
          index={0}
          snapPoints={['75%']}
          backdropComponent={props => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
          )}
          enablePanDownToClose
        >
          <View style={styles.sheetContent}>
            <ThemedText style={styles.sheetTitle}>
              {isArabic ? 'اختر طريقة الاستلام' : 'Select Payout Method'}
            </ThemedText>
            <BottomSheetFlatList
              data={methodRows}
              keyExtractor={(item: MethodRow) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }: { item: MethodRow }) => {
                if (item.type === 'header') {
                  return (
                    <ThemedText style={[styles.sheetSectionTitle, { textAlign }]}>
                      {item.label}
                    </ThemedText>
                  );
                }
                const isSelected = isRowSelected(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.bankItem,
                      isSelected && styles.bankItemActive,
                      { flexDirection: 'row' }
                    ]}
                    onPress={() => handleMethodSelect(item)}
                  >
                    {item.logo && (
                      <Image
                        source={item.logo}
                        style={{ width: 26, height: 26, borderRadius: 6, resizeMode: 'contain' }}
                      />
                    )}
                    <ThemedText style={[styles.bankText, isSelected && styles.bankTextActive]}>
                      {item.label}
                    </ThemedText>
                    {isSelected && (
                      <SolarCheckCircleBold size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </BottomSheetModal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white },
  scrollContent: {
    padding: 16,
    paddingBottom: 40 },
  section: {
    marginBottom: 32 },
  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: Colors.text.primary,
    marginBottom: 16 },
  fieldContainer: {
    marginBottom: 20 },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: Colors.text.secondary,
    marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52 },
  multilineWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12 },
  input: {
    flex: 1,
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    height: '100%',
   fontFamily: "IBMPlexSansArabic-Regular" },
  multilineInput: {
    textAlignVertical: 'top' },
  selectValueText: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: Colors.text.primary },
  sheetContent: {
    flex: 1,
    padding: 20 },
  sheetTitle: {
    fontSize: normalize.font(15),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16 },
  sheetSectionTitle: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Bold",
    color: Colors.text.muted,
    marginTop: 8,
    marginBottom: 8 },
  bankItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12 },
  bankItemActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE' },
  bankText: {
    flex: 1,
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: Colors.text.primary },
  bankTextActive: {
    color: Colors.primary },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8 },
  disabledButton: {
    opacity: 0.7 },
  saveButtonText: {
    color: Colors.white,
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold" },
  errorText: {
    color: '#EF4444',
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    marginTop: 6 },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8 },
  warningHeader: {
    alignItems: 'center',
    gap: 8 },
  warningTitle: {
    fontSize: normalize.font(14),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: '#B45309' },
  warningText: {
    fontSize: normalize.font(12),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#D97706',
    lineHeight: 18 },
  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8 },
  noticeTitle: {
    fontSize: normalize.font(14),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: Colors.primary },
  noticeText: {
    fontSize: normalize.font(12),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: Colors.primary,
    lineHeight: 18 } });
