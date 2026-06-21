import { HeaderSection } from '@/components/header-section';
import {
    SolarAltArrowLeftBold,
    SolarAltArrowRightBold,
    SolarPenNewRoundBoldDuotone
} from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { useDirection } from "@/i18n";
import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api/apiSlice';
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

export default function ProfileEditScreen() {
  const router = useRouter();
  const { isRTL, textAlign } = useDirection();
    const { user: authUser } = useSelector((state: RootState) => state.auth);

  const { data: meData, refetch } = useGetMeQuery(undefined);
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
      const formData = new FormData();
      const fileName = asset.uri.split('/').pop() || 'profile.jpg';
      let mimeType = asset.mimeType || 'image/jpeg';
      if (mimeType === 'image/jpg' || mimeType.endsWith('jpg')) mimeType = 'image/jpeg';

      if (Platform.OS === 'web') {
        const blob = await fetch(asset.uri).then((r) => r.blob());
        formData.append('image', blob, fileName);
      } else {
        formData.append('image', { uri: asset.uri, name: fileName, type: mimeType } as any);
      }

      try {
        await updateProfileImage(formData).unwrap();
        refetch();
      } catch (err: any) {
        const msg = err?.data?.message || (isRTL ? 'فشل تحديث الصورة' : 'Failed to update image');
        Alert.alert(isRTL ? 'خطأ' : 'Error', Array.isArray(msg) ? msg[0] : msg);
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
      await updateProfile({ name: name.trim() }).unwrap();
      refetch();
      router.back();
    } catch (err: any) {
      const msg = err?.data?.message || (isRTL ? 'فشل التحديث' : 'Update failed');
      Alert.alert(isRTL ? 'خطأ' : 'Error', Array.isArray(msg) ? msg[0] : msg);
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
  const [otpCode, setOtpCode] = useState('');

  const openPhoneChange = () => {
    setNewPhone('');
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
      const res: any = await changePhoneNumber({ phone: cleanPhone }).unwrap();
      // Auto-fill OTP if the backend returns it (demo/staging environments)
      if (res?.code) setOtpCode(String(res.code));
      setChangeStep('otp');
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (isRTL ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code');
      Alert.alert(isRTL ? 'خطأ' : 'Error', Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleVerifyPhoneChange = async () => {
    if (!otpCode.trim()) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code',
      );
      return;
    }
    try {
      await verifyPhoneNumberChange({ code: otpCode.trim() }).unwrap();
      setPhoneModalVisible(false);
      refetch();
      Alert.alert(
        isRTL ? 'تم' : 'Done',
        isRTL ? 'تم تغيير رقم الهاتف بنجاح' : 'Phone number changed successfully',
      );
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (isRTL ? 'رمز التحقق غير صحيح' : 'Invalid verification code');
      Alert.alert(isRTL ? 'خطأ' : 'Error', Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const BackIcon = isRTL ? SolarAltArrowRightBold : SolarAltArrowLeftBold;

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
              <Image
                source={getImageSrc(userData?.image || userData?.imageUrl)}
                style={styles.avatarImg}
              />
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
              <ThemedText style={styles.label}>
                {isRTL ? 'الاسم الكامل' : 'Full Name'}
              </ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { textAlign }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  placeholderTextColor="#C4C4C4"
                />
              </View>
            </View>

            {/* تاريخ الميلاد */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>
                {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
              </ThemedText>
              <TouchableOpacity
                style={styles.inputWrapper}
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText
                  style={[
                    styles.input,
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
              <ThemedText style={styles.label}>
                {isRTL ? 'رقم الهاتف' : 'Phone Number'}
              </ThemedText>
              <View style={[styles.phoneRow, { flexDirection: 'row' }]}>
                {isRTL ? (
                  <>
                    <View style={styles.phoneValueWrapper}>
                      <Text
                        style={[styles.phoneValue, { textAlign: 'right' }]}
                        numberOfLines={1}
                      >
                        {phone || 'غير محدد'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changePhoneBtn}
                      onPress={openPhoneChange}
                    >
                      <Text style={styles.changePhoneText}>تغيير رقم الهاتف</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.changePhoneBtn}
                      onPress={openPhoneChange}
                    >
                      <Text style={styles.changePhoneText}>Change Phone</Text>
                    </TouchableOpacity>
                    <View style={styles.phoneValueWrapper}>
                      <Text
                        style={[styles.phoneValue, { textAlign: 'left' }]}
                        numberOfLines={1}
                      >
                        {phone || 'Not set'}
                      </Text>
                    </View>
                  </>
                )}
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
        <View style={styles.modalOverlay}>
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
                  style={[styles.modalInput, { textAlign }]}
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
                    ? `أدخل رمز التحقق المُرسل إلى ${newPhone}`
                    : `Enter the verification code sent to ${newPhone}`}
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
    fontFamily: "Alexandria-Medium",
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
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(55) },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
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
    width: '100%',
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: '#374151',
    marginBottom: normalize.height(6),
    textAlign: 'right',
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
    fontFamily: "Alexandria-Medium",
    color: '#1E293B',
    flex: 1 },
  dateDoneBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12 },
  dateDoneText: {
    color: '#FFFFFF',
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium" },
  phoneValueWrapper: {
    flex: 1,
    paddingHorizontal: normalize.width(12),
    justifyContent: 'center' },
  phoneValue: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    color: '#9CA3AF' },
  changeLocText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    color: '#111827',
    textAlign: 'center',
    marginBottom: normalize.height(18) },
  modalLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: '#6B7280',
    marginBottom: normalize.height(10) },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: normalize.width(16),
    height: normalize.height(52),
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    color: '#9CA3AF' } });
