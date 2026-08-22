import { HeaderSection } from '@/components/header-section';
import { SolarPenNewRoundBoldDuotone } from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc, getAvatarSrc } from '@/hooks/useImageSrc';
import { useDirection } from "@/i18n";
import { RootState } from '@/store';
import { ImagePrepareError, prepareImageUpload } from '@/utils/prepare-image-upload';
import { useGetMeQuery } from '@/store/api/apiSlice';
import { useSyncAuthUser } from '@/hooks/useSyncAuthUser';
import {
    useChangePhoneNumberMutation,
    useUpdateProfileImageMutation,
    useUpdateUserProfileMutation,
    useVerifyPhoneNumberChangeMutation
} from '@/store/api/customerApiSlice';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Backend error copy ──────────────────────────────────────────────────────
// The API has no i18n layer, but every thrown exception carries a stable `key`
// alongside its English `message` (sununo-api utils/exceptions/custom.exception).
// Rendering `message` verbatim put English sentences inside the Arabic RTL
// dialogs, so the keys this screen can actually hit are mapped to localized copy
// and anything unrecognized falls back to the caller's localized default.
const API_ERROR_MESSAGES: Record<string, { ar: string; en: string }> = {
  PHONE_NUMBER_EXISTS: {
    ar: 'رقم الهاتف مستخدم في حساب آخر.',
    en: 'This phone number is already used by another account.',
  },
  SAME_PHONE_NUMBER: {
    ar: 'رقم الهاتف الجديد هو نفسه رقمك الحالي.',
    en: 'The new phone number is the same as your current one.',
  },
  INVALID_CODE: {
    ar: 'رمز التحقق غير صحيح أو انتهت صلاحيته.',
    en: 'Invalid or expired verification code.',
  },
  CODE_NOT_FOUND: {
    ar: 'رمز التحقق غير صحيح أو انتهت صلاحيته.',
    en: 'Invalid or expired verification code.',
  },
  USER_NOT_FOUND: {
    ar: 'تعذر العثور على الحساب.',
    en: 'Account not found.',
  },
  USER_IDS_REQUIRED: {
    ar: 'يجب رفع صورتي الهوية لحسابات فئة العوائل.',
    en: 'Both ID card photos are required for family accounts.',
  },
  IMAGE_REQUIRED: {
    ar: 'يرجى اختيار صورة.',
    en: 'Please choose an image.',
  },
  IMAGE_UPLOAD_FAILED: {
    ar: 'فشل رفع الصورة، حاول مرة أخرى.',
    en: 'Image upload failed, please try again.',
  },
};

const ARABIC_SCRIPT = /[؀-ۿ]/;

/**
 * Localized text for an RTK Query error. Falls through to the server's own
 * message only when it is already Arabic (a few validation messages are) or the
 * UI is English — never English text inside the Arabic dialog. ValidationPipe
 * 400s arrive as an English array naming DTO fields and carry no key, so they
 * land on `fallback`.
 */
const getApiErrorMessage = (err: any, fallback: string, isRTL: boolean): string => {
  const mapped = API_ERROR_MESSAGES[err?.data?.key];
  if (mapped) return isRTL ? mapped.ar : mapped.en;

  const raw = err?.data?.message;
  const message = Array.isArray(raw) ? raw[0] : raw;
  if (typeof message === 'string' && message.trim()) {
    if (!isRTL || ARABIC_SCRIPT.test(message)) return message;
  }
  return fallback;
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const { isRTL, textAlign, inputTextAlign, direction } = useDirection();
    const { user: authUser } = useSelector((state: RootState) => state.auth);

  const { data: meData, refetch } = useGetMeQuery(undefined);
  // Keep the persisted user (tab-bar avatar, drawer) in step with the edits.
  useSyncAuthUser(meData);
  const userData = (meData as any)?.data || meData || authUser;

  const [updateProfile, { isLoading: isSaving }] = useUpdateUserProfileMutation();
  const [updateProfileImage, { isLoading: isUploadingImage }] = useUpdateProfileImageMutation();

  const [name, setName] = useState(userData?.name || '');
  const [birthDate, setBirthDate] = useState(
    userData?.birthday
      ? new Date(userData.birthday).toISOString().split('T')[0]
      : '',
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onBirthDateChange = (_event: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      setBirthDate(`${y}-${m}-${d}`);
    }
  };

  const phone = userData?.phone || '';

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8 });

    if (!result.canceled) {
      const asset = result.assets[0];

      try {
        const formData = new FormData();
        // prepareImageUpload fixes the mime (".jpg" ≠ "image/jpg") and re-encodes
        // HEIC/WebP picks to JPEG so the API accepts them.
        const { uri, name, type } = await prepareImageUpload(asset);

        if (Platform.OS === 'web') {
          const blob = await fetch(uri).then((r) => r.blob());
          formData.append('image', blob, name);
        } else {
          formData.append('image', { uri, name, type } as any);
        }

        await updateProfileImage(formData).unwrap();
        refetch();
      } catch (err: any) {
        const msg = err instanceof ImagePrepareError
          ? (isRTL ? 'تعذّرت معالجة الصورة، جرّب صورة أخرى' : 'Could not process the image, try another photo')
          : getApiErrorMessage(
              err,
              isRTL ? 'فشل تحديث الصورة' : 'Failed to update image',
              isRTL,
            );
        Alert.alert(isRTL ? 'خطأ' : 'Error', msg);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name',
      );
      return;
    }
    try {
      const payload: { name: string; birthday?: string } = { name: name.trim() };
      // Send the birth date only when set (YYYY-MM-DD).
      if (birthDate) payload.birthday = birthDate;
      await updateProfile(payload).unwrap();
      refetch();
      router.back();
    } catch (err: any) {
      const msg = getApiErrorMessage(
        err,
        isRTL ? 'فشل التحديث' : 'Update failed',
        isRTL,
      );
      Alert.alert(isRTL ? 'خطأ' : 'Error', msg);
    }
  };

  // ── Phone change flow ──────────────────────────────────────────────────
  const [changePhoneNumber, { isLoading: isRequestingChange }] =
    useChangePhoneNumberMutation();
  const [verifyPhoneNumberChange, { isLoading: isVerifyingChange }] =
    useVerifyPhoneNumberChangeMutation();
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [changeStep, setChangeStep] = useState<'phone' | 'otp'>('phone');
  const [newPhone, setNewPhone] = useState('');
  // The exact number step 1 asked the OTP for. `verify-phone` requires it again
  // — the server reads it to write the new number — so it is kept verbatim
  // instead of re-deriving it from the input on submit.
  const [pendingPhone, setPendingPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const openPhoneChange = () => {
    setNewPhone('');
    setPendingPhone('');
    setOtpCode('');
    setChangeStep('phone');
    setPhoneModalVisible(true);
  };

  const handleRequestPhoneChange = async () => {
    const cleanPhone = newPhone.trim().replace(/[\s\-()]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number',
      );
      return;
    }
    try {
      const res: any = await changePhoneNumber({ newPhone: cleanPhone }).unwrap();
      setPendingPhone(cleanPhone);
      // Auto-fill OTP if the backend returns it (demo/staging environments)
      if (res?.code) setOtpCode(String(res.code));
      setChangeStep('otp');
    } catch (err: any) {
      const msg = getApiErrorMessage(
        err,
        isRTL ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code',
        isRTL,
      );
      Alert.alert(isRTL ? 'خطأ' : 'Error', msg);
    }
  };

  const handleVerifyPhoneChange = async () => {
    // Digits only — the API types `code` as a number, so a stray character would
    // be sent as null and come back as an opaque validation error.
    if (!/^\d+$/.test(otpCode.trim())) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code',
      );
      return;
    }
    try {
      await verifyPhoneNumberChange({
        newPhone: pendingPhone,
        code: otpCode.trim(),
      }).unwrap();
      setPhoneModalVisible(false);
      refetch();
      Alert.alert(
        isRTL ? 'تم' : 'Done',
        isRTL ? 'تم تغيير رقم الهاتف بنجاح' : 'Phone number changed successfully',
      );
    } catch (err: any) {
      const msg = getApiErrorMessage(
        err,
        isRTL ? 'رمز التحقق غير صحيح' : 'Invalid verification code',
        isRTL,
      );
      Alert.alert(isRTL ? 'خطأ' : 'Error', msg);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <HeaderSection
        title={isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
        showBackButton
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickImage}
              activeOpacity={0.85}
            >
              <View style={styles.avatarClip}>
                <Image
                  source={getAvatarSrc(userData?.image || userData?.imageUrl)}
                  style={styles.avatarImg}
                />
              </View>
              {/* Edit badge — bottom right */}
              <View style={styles.editBadge}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <SolarPenNewRoundBoldDuotone size={20} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* الاسم الكامل */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { alignSelf: 'flex-start' }]}>
                {isRTL ? 'الاسم الكامل' : 'Full Name'}
              </ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { textAlign: inputTextAlign }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  placeholderTextColor="#C4C4C4"
                />
              </View>
            </View>

            {/* تاريخ الميلاد */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { alignSelf: 'flex-start' }]}>
                {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
              </ThemedText>
              <TouchableOpacity
                style={styles.inputWrapper}
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText
                  style={[
                    styles.dateInputText,
                    { textAlign, color: birthDate ? Colors.text.primary : '#C4C4C4' },
                  ]}
                >
                  {birthDate || 'YYYY-MM-DD'}
                </ThemedText>
              </TouchableOpacity>
              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={birthDate ? new Date(birthDate) : new Date(2000, 0, 1)}
                    mode="date"
                    maximumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    // الشاشة مثبّتة على خلفية بيضاء، بينما التطبيق
                    // userInterfaceStyle: "automatic" — بدون هذولا يرسم iOS
                    // أرقام العجلة بالأبيض بالوضع الليلي فتختفي على الأبيض.
                    themeVariant="light"
                    textColor={Colors.text.primary}
                    onChange={onBirthDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.dateDoneBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <ThemedText style={styles.dateDoneText}>
                        {isRTL ? 'تم' : 'Done'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* رقم الهاتف */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { alignSelf: 'flex-start' }]}>
                {isRTL ? 'رقم الهاتف' : 'Phone Number'}
              </ThemedText>
              {/* Natural order [value, action] — the container direction
                  mirrors it; no manual per-language reversal. */}
              <View style={[styles.phoneRow, { flexDirection: 'row' }]}>
                <View style={styles.phoneValueWrapper}>
                  <Text
                    style={[styles.phoneValue, { textAlign }]}
                    numberOfLines={1}
                  >
                    {phone || (isRTL ? 'غير محدد' : 'Not set')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changePhoneBtn}
                  onPress={openPhoneChange}
                >
                  <Text style={styles.changePhoneText}>
                    {isRTL ? 'تغيير رقم الهاتف' : 'Change Phone'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Footer Button ── */}
      <View style={styles.footer}>
        <PrimaryButton
          label={isSaving ? '' : (isRTL ? 'تأكيد' : 'Confirm')}
          onPress={handleSave}
          loading={isSaving}
          style={styles.submitBtn}
        />
      </View>

      {/* ── Phone Change Modal ── */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        {/* RN Modal = new native root; re-apply direction. */}
        <View style={[styles.modalOverlay, { direction }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isRTL ? 'تغيير رقم الهاتف' : 'Change Phone Number'}
            </Text>

            {changeStep === 'phone' ? (
              <>
                <Text style={[styles.modalLabel, { textAlign }]}>
                  {isRTL ? 'رقم الهاتف الجديد' : 'New phone number'}
                </Text>
                <TextInput
                  style={[styles.modalInput, { textAlign: inputTextAlign }]}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="07XXXXXXXXX"
                  placeholderTextColor="#C4C4C4"
                  keyboardType="phone-pad"
                  autoFocus
                />
                <PrimaryButton
                  label={isRTL ? 'إرسال رمز التحقق' : 'Send code'}
                  onPress={handleRequestPhoneChange}
                  loading={isRequestingChange}
                  style={styles.modalBtn}
                />
              </>
            ) : (
              <>
                <Text style={[styles.modalLabel, { textAlign }]}>
                  {isRTL
                    ? `أدخل رمز التحقق المُرسل إلى ${pendingPhone || newPhone}`
                    : `Enter the verification code sent to ${pendingPhone || newPhone}`}
                </Text>
                <TextInput
                  style={[styles.modalInput, { textAlign: 'center', letterSpacing: 6 }]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="------"
                  placeholderTextColor="#C4C4C4"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <PrimaryButton
                  label={isRTL ? 'تأكيد التغيير' : 'Confirm change'}
                  onPress={handleVerifyPhoneChange}
                  loading={isVerifyingChange}
                  style={styles.modalBtn}
                />
              </>
            )}

            <TouchableOpacity
              onPress={() => setPhoneModalVisible(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF' },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize.width(20),
    paddingVertical: normalize.height(10) },
  headerSideBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center' },
  headerTitle: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: '#111827' },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE' },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(2) },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: normalize.height(20) },
  avatarContainer: {
    width: normalize.width(110),
    height: normalize.width(110),
    borderRadius: normalize.width(55),
    backgroundColor: '#F3F4F6',
    position: 'relative' },
  avatarClip: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(55),
    overflow: 'hidden' },
  avatarImg: {
    width: '100%',
    height: '100%',
    // Slight zoom so the figure fills the circle and no light ring shows around it.
    transform: [{ scale: 1.18 }] },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    end: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF' },

  // ── Form ─────────────────────────────────────────────────────────────────
  form: {
    gap: 0 },
  fieldGroup: {
    marginBottom: normalize.height(14),
    width: '100%',
  },
  label: {
    fontSize: normalize.font(8),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: '#374151',
    marginBottom: normalize.height(6),
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: normalize.height(48),
    justifyContent: 'center',
    paddingHorizontal: normalize.width(14) },
  input: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: '#1E293B',
    flex: 1 },
  // Date display text: NO flex so the wrapper's justifyContent:'center'
  // vertically centers it (flex:1 stretched it and pushed text to the top).
  dateInputText: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: '#1E293B' },
  dateDoneBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12 },
  dateDoneText: {
    color: '#FFFFFF',
    fontFamily: "IBMPlexSansArabic-Medium",
    fontSize: normalize.font(14) },

  // ── Phone row ────────────────────────────────────────────────────────────
  phoneRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: normalize.height(48),
    overflow: 'hidden',
    alignItems: 'center' },
  changePhoneBtn: {
    backgroundColor: Colors.primary,
    height: '100%',
    paddingHorizontal: normalize.width(14),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: normalize.width(110) },
  changePhoneText: {
    color: '#FFFFFF',
    fontSize: normalize.font(8),
    fontFamily: "IBMPlexSansArabic-Medium" },
  phoneValueWrapper: {
    flex: 1,
    paddingHorizontal: normalize.width(12),
    justifyContent: 'center' },
  phoneValue: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: '#1E293B' },

  // ── Map card ─────────────────────────────────────────────────────────────
  mapCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB' },
  mapImage: {
    width: '100%',
    height: normalize.height(140) },
  mapPinOverlay: {
    position: 'absolute',
    top: normalize.height(52),
    alignSelf: 'center' },
  mapFooter: {
    paddingHorizontal: normalize.width(14),
    paddingVertical: normalize.height(10),
    justifyContent: 'space-between',
    alignItems: 'center' },
  locationName: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: '#9CA3AF' },
  changeLocText: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: Colors.primary },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: normalize.width(20),
    paddingBottom: normalize.height(20),
    paddingTop: normalize.height(10),
    backgroundColor: '#FFFFFF' },
  submitBtn: {
    width: '100%',
    height: normalize.height(54),
    borderRadius: 27 },

  // ── Phone change modal ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: normalize.width(24) },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: normalize.width(24) },
  modalTitle: {
    fontSize: normalize.font(16),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: '#111827',
    textAlign: 'center',
    marginBottom: normalize.height(18) },
  modalLabel: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: '#6B7280',
    marginBottom: normalize.height(10) },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: normalize.width(16),
    height: normalize.height(52),
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: '#111827',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: normalize.height(18) },
  modalBtn: {
    width: '100%',
    height: normalize.height(52),
    borderRadius: 26 },
  modalCancelBtn: {
    marginTop: normalize.height(12),
    alignItems: 'center',
    paddingVertical: normalize.height(8) },
  modalCancelText: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: '#9CA3AF' } });
