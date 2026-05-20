import {
  SolarCalendarBold,
  SolarMapPointBold,
  SolarPenBold,
  SolarPhoneBold,
  SolarUserBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { isRTL } from "@/i18n";
import { RootState } from '@/store';
import {
  useGetCitiesQuery,
  useGetMeQuery,
  useUpdateProfileImageMutation,
  useUpdateProfileMutation
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const { t } = useTranslation();
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
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى إدخال الاسم' : 'Please enter your name', position: 'bottom' });
      return;
    }

    if (!formData.cityId) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        gender: formData.gender,
        birthday: formData.birthday.toISOString(),
        cityId: formData.cityId
      }).unwrap();

      Toast.show({ type: 'success', text1: isRTL ? 'نجاح' : 'Success', text2: isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully', position: 'bottom' });
      router.back();
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      const errorMessage = error?.data?.message || (isRTL ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile');
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage, position: 'bottom' });
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
        Toast.show({ type: 'success', text1: isRTL ? 'نجاح' : 'Success', text2: isRTL ? 'تم تحديث الصورة بنجاح' : 'Profile image updated successfully', position: 'bottom' });
      } catch (error: any) {
        console.error('Upload Image Error:', error);
        const errorMessage = error?.data?.message || (isRTL ? 'فشل تحديث الصورة' : 'Failed to update image');
        Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage, position: 'bottom' });
      }
    }
  };

  const selectedCityName = useMemo(() => {
    if (!formData.cityId) return '';
    const city = cities.find((c: any) => c.id === formData.cityId);
    return getCityName(city || user?.city, isRTL);
  }, [formData.cityId, cities, user?.city]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#FFFFFF', direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              <Image
                source={user?.image ? getImageSrc(user.image) : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                style={styles.profileImage}
              />
              <View style={styles.sheetEditBadge}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <SolarPenBold size={16} color={Colors.white} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الاسم الكامل' : 'Full Name'}</ThemedText>
              <View style={[styles.inputWrapper, { flexDirection: 'row' }]}>
                <SolarUserBold size={20} color={Colors.text.muted} />
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                  placeholderTextColor={Colors.text.muted}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</ThemedText>
              <View style={[styles.inputWrapper, styles.disabledInputWrapper, { flexDirection: 'row' }]}>
                <SolarPhoneBold size={20} color={Colors.text.muted} />
                <ThemedText style={[styles.input, { textAlign: isRTL ? 'right' : 'left', paddingTop: 14, direction: 'ltr' }]}>
                  {user?.phone || ''}
                </ThemedText>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الجنس' : 'Gender'}</ThemedText>
              <View style={[styles.genderContainer, { flexDirection: 'row' }]}>
                <TouchableOpacity
                  style={[styles.genderOption, formData.gender === 'male' && styles.genderOptionActive, { flex: 1 }]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                >
                  <ThemedText style={[styles.genderText, formData.gender === 'male' && styles.genderTextActive]}>{isRTL ? 'ذكر' : 'Male'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, formData.gender === 'female' && styles.genderOptionActive, { flex: 1 }]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                >
                  <ThemedText style={[styles.genderText, formData.gender === 'female' && styles.genderTextActive]}>{isRTL ? 'أنثى' : 'Female'}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'تاريخ الميلاد' : 'Birthday'}</ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, { flexDirection: 'row' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <SolarCalendarBold size={20} color={Colors.text.muted} />
                <ThemedText style={[styles.input, { textAlign: isRTL ? 'right' : 'left', paddingTop: 14 }]}>
                  {formData.birthday.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                </ThemedText>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.birthday}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setFormData(prev => ({ ...prev, birthday: selectedDate }));
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المدينة' : 'City'}</ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, { flexDirection: 'row' }]}
                onPress={() => citySheetRef.current?.present()}
              >
                <SolarMapPointBold size={20} color={Colors.text.muted} />
                <ThemedText style={[styles.input, { textAlign: isRTL ? 'right' : 'left', paddingTop: 14 }]}>
                  {selectedCityName || (isRTL ? 'اختر المدينة' : 'Select City')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (isUpdating || isUploadingImage) && styles.disabledButton]}
            onPress={handleSaveProfile}
            disabled={isUpdating || isUploadingImage}
          >
            {isUpdating ? <ActivityIndicator color={Colors.white} /> : <ThemedText style={styles.saveButtonText}>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</ThemedText>}
          </TouchableOpacity>
        </BottomSheetScrollView>

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
            <ThemedText style={styles.sheetTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</ThemedText>
            <BottomSheetFlatList
              data={cities}
              keyExtractor={(item: any) => item.id}
              ListEmptyComponent={
                <ThemedText style={styles.cityEmptyText}>
                  {isCitiesLoading
                    ? (isRTL ? 'جاري تحميل المدن...' : 'Loading cities...')
                    : isCitiesError
                      ? (isRTL ? 'تعذر تحميل المدن' : 'Could not load cities')
                      : (isRTL ? 'لا توجد مدن متاحة' : 'No cities available')}
                </ThemedText>
              }
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={[styles.cityItem, { flexDirection: 'row' }]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, cityId: item.id }));
                    citySheetRef.current?.dismiss();
                  }}
                >
                  <ThemedText style={[styles.cityText, formData.cityId === item.id && styles.cityTextActive]}>
                    {getCityName(item, isRTL)}
                  </ThemedText>
                  {formData.cityId === item.id && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </BottomSheetModal>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 60
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10
  },
  imageContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55
  },
  sheetEditBadge: {
    position: 'absolute',
    bottom: 0,
    end: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white'
  },
  formSection: {
    gap: 16
  },
  fieldContainer: {
    gap: 8
  },
  label: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary
  },
  inputWrapper: {
    minHeight: 56,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center'
  },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9'
  },
  input: {
    flex: 1,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginHorizontal: 12
  },
  genderContainer: {
    gap: 12
  },
  genderOption: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  genderOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF'
  },
  genderText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary
  },
  genderTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium"
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30
  },
  disabledButton: {
    opacity: 0.7
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cityText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium"
  },
  cityTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium"
  },
  cityEmptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium"
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary
  },
  sheetTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16
  }
});
