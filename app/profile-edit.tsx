import {
    SolarAltArrowLeftBold,
    SolarAltArrowRightBold,
    SolarMapPointBold,
    SolarMenuDotsBold,
    SolarPenBold,
} from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api/apiSlice';
import {
    useUpdateProfileImageMutation,
    useUpdateUserProfileMutation,
} from '@/store/api/customerApiSlice';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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

  const phone = userData?.phone || '';

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

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

  const BackIcon = isRTL ? SolarAltArrowRightBold : SolarAltArrowLeftBold;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Three-dots menu (decorative, matches design) */}
        <TouchableOpacity style={styles.headerSideBtn}>
          <SolarMenuDotsBold size={22} color="#9CA3AF" />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </ThemedText>

        {/* Back button — circle with arrow */}
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <BackIcon size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

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
                  <SolarPenBold size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* الاسم الكامل */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'الاسم الكامل' : 'Full Name'}
              </ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  placeholderTextColor="#C4C4C4"
                />
              </View>
            </View>

            {/* تاريخ الميلاد */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
              </ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C4C4C4"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* رقم الهاتف */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'رقم الهاتف' : 'Phone Number'}
              </ThemedText>
              <View style={[styles.phoneRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {/* Change phone button */}
                <TouchableOpacity
                  style={styles.changePhoneBtn}
                  onPress={() =>
                    Alert.alert(
                      isRTL ? 'تغيير رقم الهاتف' : 'Change Phone',
                      isRTL
                        ? 'هذه الميزة ستكون متاحة قريباً'
                        : 'This feature will be available soon',
                    )
                  }
                >
                  <Text style={styles.changePhoneText}>
                    {isRTL ? 'تغيير رقم الهاتف' : 'Change Phone'}
                  </Text>
                </TouchableOpacity>

                {/* Phone number (read-only) */}
                <View style={styles.phoneValueWrapper}>
                  <Text
                    style={[styles.phoneValue, { textAlign: isRTL ? 'right' : 'left' }]}
                    numberOfLines={1}
                  >
                    {phone || (isRTL ? 'غير محدد' : 'Not set')}
                  </Text>
                </View>
              </View>
            </View>

            {/* الموقع */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'موقعك' : 'Your Location'}
              </ThemedText>
              <View style={styles.mapCard}>
                {/* Static map image */}
                <Image
                  source={{
                    uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png',
                  }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
                {/* Pin overlay */}
                <View style={styles.mapPinOverlay}>
                  <SolarMapPointBold size={36} color={Colors.primary} />
                </View>
                {/* Footer */}
                <View
                  style={[
                    styles.mapFooter,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <ThemedText style={styles.locationName}>
                    {isRTL ? 'البصرة - ابي الخصيب' : 'Basra - Abu Al-Khaseeb'}
                  </ThemedText>
                  <TouchableOpacity>
                    <ThemedText style={styles.changeLocText}>
                      {isRTL ? 'تغيير' : 'Change'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize.width(20),
    paddingVertical: normalize.height(12),
  },
  headerSideBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontFamily: 'Alexandria-Black',
    color: '#111827',
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(4),
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: normalize.height(28),
  },
  avatarContainer: {
    width: normalize.width(130),
    height: normalize.width(130),
    borderRadius: normalize.width(65),
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(65),
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // ── Form ─────────────────────────────────────────────────────────────────
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: normalize.height(18),
  },
  label: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Bold',
    color: '#374151',
    marginBottom: normalize.height(8),
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: normalize.height(56),
    justifyContent: 'center',
    paddingHorizontal: normalize.width(16),
  },
  input: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Medium',
    color: '#9CA3AF',
    flex: 1,
  },

  // ── Phone row ────────────────────────────────────────────────────────────
  phoneRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: normalize.height(56),
    overflow: 'hidden',
    alignItems: 'center',
  },
  changePhoneBtn: {
    backgroundColor: Colors.primary,
    height: '100%',
    paddingHorizontal: normalize.width(16),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: normalize.width(130),
  },
  changePhoneText: {
    color: '#FFFFFF',
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Black',
  },
  phoneValueWrapper: {
    flex: 1,
    paddingHorizontal: normalize.width(14),
    justifyContent: 'center',
  },
  phoneValue: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Medium',
    color: '#9CA3AF',
  },

  // ── Map card ─────────────────────────────────────────────────────────────
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  mapImage: {
    width: '100%',
    height: normalize.height(160),
  },
  mapPinOverlay: {
    position: 'absolute',
    top: normalize.height(62),
    alignSelf: 'center',
  },
  mapFooter: {
    paddingHorizontal: normalize.width(16),
    paddingVertical: normalize.height(12),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationName: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Bold',
    color: '#9CA3AF',
  },
  changeLocText: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: normalize.width(20),
    paddingBottom: normalize.height(30),
    paddingTop: normalize.height(12),
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    width: '100%',
    height: normalize.height(58),
    borderRadius: 29,
  },
});
