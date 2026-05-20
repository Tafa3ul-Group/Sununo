import {
  SolarAltArrowDownLinear,
  SolarCalendarBold,
  SolarCameraBold,
  SolarCheckCircleBold,
  SolarLockBold,
  SolarMapPointBold,
  SolarPhoneBold,
  SolarUserBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import {
  useGetCitiesQuery,
  useGetMeQuery,
  useUpdateProfileImageMutation,
  useUpdateProfileMutation
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';

const getCityName = (city: any, isArabic: boolean) => {
  if (!city) return '';
  if (typeof city.name === 'object') {
    return (isArabic ? city.name?.ar : city.name?.en) || city.name?.ar || city.name?.en || '';
  }
  return (
    (isArabic ? city.nameAr || city.arName : city.nameEn || city.enName) ||
    city.name ||
    city.nameAr ||
    city.arName ||
    city.nameEn ||
    city.enName ||
    ''
  );
};

export default function EditProfileScreen() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language ? i18n.language.startsWith('ar') : true;

  const textStart: 'left' | 'right' = isArabic === I18nManager.isRTL ? 'left' : 'right';
  const textEnd: 'left' | 'right' = isArabic === I18nManager.isRTL ? 'right' : 'left';
  const alignStart: 'flex-start' | 'flex-end' = isArabic === I18nManager.isRTL ? 'flex-start' : 'flex-end';
  const alignEnd: 'flex-start' | 'flex-end' = isArabic === I18nManager.isRTL ? 'flex-end' : 'flex-start';
  const flexDir: 'row' | 'row-reverse' = isArabic === I18nManager.isRTL ? 'row' : 'row-reverse';
  const { user: authUser } = useSelector((state: RootState) => state.auth);

  const { data: userData } = useGetMeQuery(undefined);
  const user = userData?.data || userData || authUser;

  const { data: cities = [], isLoading: isCitiesLoading, isError: isCitiesError } = useGetCitiesQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [updateProfileImage, { isLoading: isUploadingImage }] = useUpdateProfileImageMutation();

  const router = useRouter();
  const citySheetRef = useRef<BottomSheetModal>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    birthday: new Date(),
    cityId: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        gender: user.gender || 'male',
        birthday: user.birthday ? new Date(user.birthday) : new Date(),
        cityId: user.cityId || user.city?.id || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      Toast.show({ type: 'error', text1: isArabic ? 'خطأ' : 'Error', text2: isArabic ? 'يرجى إدخال الاسم' : 'Please enter your name', position: 'bottom' });
      return;
    }

    if (!formData.cityId) {
      Toast.show({ type: 'error', text1: isArabic ? 'خطأ' : 'Error', text2: isArabic ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        gender: formData.gender,
        birthday: formData.birthday.toISOString(),
        cityId: formData.cityId
      }).unwrap();

      Toast.show({ type: 'success', text1: isArabic ? 'نجاح' : 'Success', text2: isArabic ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully', position: 'bottom' });
      router.back();
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      const errorMessage = error?.data?.message || (isArabic ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile');
      Toast.show({ type: 'error', text1: isArabic ? 'خطأ' : 'Error', text2: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage, position: 'bottom' });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled) {
      const imageAsset = result.assets[0];
      const imageFormData = new FormData();

      const uri = imageAsset.uri;
      const name = uri.split('/').pop() || 'profile.jpg';
      let type = imageAsset.mimeType || 'image/jpeg';

      if (type === 'image/jpg' || type.endsWith('jpg')) {
        type = 'image/jpeg';
      }

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        imageFormData.append('image', blob, name);
      } else {
        imageFormData.append('image', {
          uri,
          name,
          type
        } as any);
      }

      try {
        await updateProfileImage(imageFormData).unwrap();
        Toast.show({ type: 'success', text1: isArabic ? 'نجاح' : 'Success', text2: isArabic ? 'تم تحديث الصورة بنجاح' : 'Profile image updated successfully', position: 'bottom' });
      } catch (error: any) {
        console.error('Upload Image Error:', error);
        const errorMessage = error?.data?.message || (isArabic ? 'فشل تحديث الصورة' : 'Failed to update image');
        Toast.show({ type: 'error', text1: isArabic ? 'خطأ' : 'Error', text2: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage, position: 'bottom' });
      }
    }
  };

  const selectedCityName = useMemo(() => {
    if (!formData.cityId) return '';
    const city = cities.find((c: any) => c.id === formData.cityId);
    return getCityName(city || user?.city, isArabic);
  }, [formData.cityId, cities, user?.city, isArabic]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer} activeOpacity={0.85}>
              <Image
                source={user?.image ? getImageSrc(user.image) : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                style={styles.profileImage}
              />
              <View style={styles.editBadge}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <SolarCameraBold size={18} color={Colors.white} />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
              <ThemedText style={[styles.changePhotoText, { textAlign: textStart }]}>
                {isArabic ? 'تغيير الصورة الشخصية' : 'Change Profile Picture'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Personal Information Form */}
          <View style={styles.card}>
            <ThemedText style={[styles.cardHeaderTitle, { textAlign: textStart }]}>
              {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
            </ThemedText>

            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: textStart }]}>
                {isArabic ? 'الاسم الكامل' : 'Full Name'}
              </ThemedText>
              <View style={[styles.inputWrapper, { flexDirection: flexDir }]}>
                <SolarUserBold size={20} color={Colors.text.muted} />
                <TextInput
                  style={[styles.input, { textAlign: textStart }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  placeholderTextColor={Colors.text.muted}
                />
              </View>
            </View>

            {/* Gender Control */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: textStart }]}>
                {isArabic ? 'الجنس' : 'Gender'}
              </ThemedText>
              <View style={[styles.genderWrapper, { flexDirection: flexDir }]}>
                <TouchableOpacity
                  style={[styles.genderOption, formData.gender === 'male' && styles.genderOptionActive]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.genderText, formData.gender === 'male' && styles.genderTextActive]}>
                    {isArabic ? 'ذكر' : 'Male'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, formData.gender === 'female' && styles.genderOptionActive]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.genderText, formData.gender === 'female' && styles.genderTextActive]}>
                    {isArabic ? 'أنثى' : 'Female'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Birthday Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: textStart }]}>
                {isArabic ? 'تاريخ الميلاد' : 'Birthday'}
              </ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, { flexDirection: flexDir }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <SolarCalendarBold size={20} color={Colors.text.muted} />
                <ThemedText style={styles.inputTextValue}>
                  {formData.birthday.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                </ThemedText>
              </TouchableOpacity>
              {Platform.OS === 'ios' ? (
                <Modal
                  transparent={true}
                  animationType="slide"
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <View style={[styles.modalHeader, { flexDirection: flexDir }]}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <ThemedText style={styles.modalCloseText}>
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <ThemedText style={styles.modalDoneText}>
                            {isArabic ? 'تم' : 'Done'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.modalPickerContainer}>
                        <DateTimePicker
                          value={formData.birthday}
                          mode="date"
                          display="spinner"
                          textColor={Colors.text.primary}
                          onChange={(event, selectedDate) => {
                            if (selectedDate) setFormData(prev => ({ ...prev, birthday: selectedDate }));
                          }}
                          maximumDate={new Date()}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                showDatePicker && (
                  <DateTimePicker
                    value={formData.birthday}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setFormData(prev => ({ ...prev, birthday: selectedDate }));
                    }}
                    maximumDate={new Date()}
                  />
                )
              )}
            </View>

            {/* City Field */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: textStart }]}>
                {isArabic ? 'المدينة' : 'City'}
              </ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, { flexDirection: flexDir, justifyContent: 'space-between' }]}
                onPress={() => citySheetRef.current?.present()}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: flexDir, alignItems: 'center', gap: 12, flex: 1 }}>
                  <SolarMapPointBold size={20} color={Colors.text.muted} />
                  <ThemedText style={[styles.inputTextValue, !selectedCityName && { color: Colors.text.muted }]}>
                    {selectedCityName || (isArabic ? 'اختر المدينة' : 'Select City')}
                  </ThemedText>
                </View>
                <SolarAltArrowDownLinear size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Details Card */}
          <View style={styles.card}>
            <ThemedText style={[styles.cardHeaderTitle, { textAlign: textStart }]}>
              {isArabic ? 'معلومات الحساب' : 'Account Details'}
            </ThemedText>

            {/* Phone Number (Read Only) */}
            <View style={styles.fieldContainer}>
              <View style={{ flexDirection: flexDir, justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={[styles.label, { textAlign: textStart }]}>
                  {isArabic ? 'رقم الهاتف (غير قابل للتعديل)' : 'Phone Number (Read-only)'}
                </ThemedText>
                <SolarLockBold size={14} color={Colors.text.muted} />
              </View>
              <View style={[styles.inputWrapper, styles.disabledInputWrapper, { flexDirection: flexDir }]}>
                <SolarPhoneBold size={20} color={Colors.text.muted} />
                <ThemedText style={[styles.inputTextValue, styles.disabledInputText, { direction: 'ltr' }]}>
                  {user?.phone || ''}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.saveButton, (isUpdating || isUploadingImage) && styles.disabledButton]}
            onPress={handleSaveProfile}
            disabled={isUpdating || isUploadingImage}
            activeOpacity={0.85}
          >
            {isUpdating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <ThemedText style={styles.saveButtonText}>{isArabic ? 'حفظ التغييرات' : 'Save Changes'}</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* City Picker Bottom Sheet */}
        <BottomSheetModal
          ref={citySheetRef}
          index={0}
          snapPoints={['50%']}
          backdropComponent={props => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
          )}
          enablePanDownToClose
        >
          <View style={styles.citySheetContent}>
            <ThemedText style={styles.sheetTitle}>{isArabic ? 'اختر المدينة' : 'Select City'}</ThemedText>
            <BottomSheetFlatList
              data={cities}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={
                <ThemedText style={styles.cityEmptyText}>
                  {isCitiesLoading
                    ? (isArabic ? 'جاري تحميل المدن...' : 'Loading cities...')
                    : isCitiesError
                      ? (isArabic ? 'تعذر تحميل المدن' : 'Could not load cities')
                      : (isArabic ? 'لا توجد مدن متاحة' : 'No cities available')}
                </ThemedText>
              }
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    formData.cityId === item.id && styles.cityItemActive,
                    { flexDirection: flexDir }
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, cityId: item.id }));
                    citySheetRef.current?.dismiss();
                  }}
                >
                  <ThemedText style={[styles.cityText, formData.cityId === item.id && styles.cityTextActive]}>
                    {getCityName(item, isArabic)}
                  </ThemedText>
                  {formData.cityId === item.id && (
                    <SolarCheckCircleBold size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </BottomSheetModal>
      </KeyboardAvoidingView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    ...Shadows.medium,
    padding: 4
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    end: 2,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadows.small
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small
  },
  cardHeaderTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 20,
  },
  fieldContainer: {
    gap: 8,
    marginBottom: 16
  },
  label: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary
  },
  inputWrapper: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 12
  },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    height: '100%',
    fontFamily: "Alexandria-Medium"
  },
  inputTextValue: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
  },
  disabledInputText: {
    color: Colors.text.secondary,
  },
  genderWrapper: {
    height: 54,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    gap: 4
  },
  genderOption: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  genderOptionActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.small
  },
  genderText: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary
  },
  genderTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium"
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...Shadows.medium
  },
  disabledButton: {
    opacity: 0.6
  },
  saveButtonText: {
    color: 'white',
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium"
  },
  citySheetContent: {
    flex: 1,
    padding: 20
  },
  cityItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cityItemActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  cityText: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary
  },
  cityTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium"
  },
  cityEmptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium"
  },
  sheetTitle: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
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
  modalDoneText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  modalCloseText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary,
  },
  modalPickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%'
  }
});
