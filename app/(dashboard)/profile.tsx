import {
    ProfileShape,
    SolarBanknoteBold,
    SolarCalendarBold,
    SolarGlobalBold,
    SolarLogoutBold,
    SolarMapPointBold,
    SolarPenBold,
    SolarPhoneBold,
    SolarShieldBold,
    SolarUserBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { LanguageSheet } from '@/components/user/language-sheet';
import { LogoutSheet } from '@/components/user/logout-sheet';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import {
    useGetCitiesQuery,
    useGetMeQuery,
    useGetProviderProfileQuery,
    useLogoutUserMutation,
    useUpdateProfileImageMutation,
    useUpdateProfileMutation } from '@/store/api/apiSlice';
import { logout } from '@/store/authSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { isRTL } from "@/i18n";

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

export default function ProviderProfileScreen() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
    const { user: authUser } = useSelector((state: RootState) => state.auth);

  const { data: userData } = useGetMeQuery(undefined);
  const user = userData?.data || userData || authUser;

  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse;

  const { data: cities = [], isLoading: isCitiesLoading, isError: isCitiesError } = useGetCitiesQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [updateProfileImage, { isLoading: isUploadingImage }] = useUpdateProfileImageMutation();
  const [logoutApi] = useLogoutUserMutation();

  const router = useRouter();
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const editProfileSheetRef = useRef<BottomSheetModal>(null);
  const citySheetRef = useRef<BottomSheetModal>(null);
  const logoutSheetRef = useRef<BottomSheetModal>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    birthday: new Date(),
    cityId: '' });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        gender: user.gender || 'male',
        birthday: user.birthday ? new Date(user.birthday) : new Date(),
        cityId: user.cityId || user.city?.id || '' });
    }
  }, [user]);

  const openLanguageSheet = () => {
    languageSheetRef.current?.present();
  };

  const openEditProfileSheet = () => {
    editProfileSheetRef.current?.present();
  };

  const handleLogout = () => {
    Alert.alert(
      isRTL ? 'تسجيل الخروج' : 'Logout',
      isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
      [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel' },
        {
          text: isRTL ? 'خروج' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutApi(undefined).unwrap();
            } catch {
              // تجاهل خطأ السيرفر وأكمل الخروج
            }
            // Clear Redux state — the Auth Guard in _layout.tsx will redirect automatically
            dispatch(logout());
          } },
      ],
    );
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال الاسم' : 'Please enter your name');
      return;
    }

    if (!formData.cityId) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى اختيار المدينة' : 'Please select a city');
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        gender: formData.gender,
        birthday: formData.birthday.toISOString(),
        cityId: formData.cityId }).unwrap();

      Alert.alert(
        isRTL ? 'نجاح' : 'Success',
        isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
      );
      editProfileSheetRef.current?.dismiss();
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      const errorMessage = error?.data?.message || (isRTL ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile');
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        Array.isArray(errorMessage) ? errorMessage[0] : errorMessage
      );
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8 });

    if (!result.canceled) {
      const imageAsset = result.assets[0];
      const imageFormData = new FormData();
      
      const uri = imageAsset.uri;
      const name = uri.split('/').pop() || 'profile.jpg';
      let type = imageAsset.mimeType || 'image/jpeg';
      
      // Standardize jpeg type
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
          type } as any);
      }

      try {
        await updateProfileImage(imageFormData).unwrap();
      } catch (error: any) {
        console.error('Upload Image Error:', error);
        const errorMessage = error?.data?.message || (isRTL ? 'فشل تحديث الصورة' : 'Failed to update image');
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          Array.isArray(errorMessage) ? errorMessage[0] : errorMessage
        );
      }
    }
  };

  const selectedCityName = useMemo(() => {
    if (!formData.cityId) return '';
    const city = cities.find((c: any) => c.id === formData.cityId);
    return getCityName(city || user?.city, isRTL);
  }, [formData.cityId, cities, user?.city]);

  const menuItems = [
    { id: 'profile', title: isRTL ? 'المعلومات الشخصية' : 'Personal Information', shape: 'blue' as const, icon: <SolarUserBold size={20} color="white" />, action: openEditProfileSheet },
    { id: 'business', title: isRTL ? 'معلومات المصرف' : 'Bank Information', shape: 'blue' as const, icon: <SolarBanknoteBold size={20} color="white" />, route: '/(dashboard)/edit-business' },
    { id: 'language', title: isRTL ? 'اللغة' : 'Language', shape: 'blue' as const, icon: <SolarGlobalBold size={20} color="white" />, action: openLanguageSheet },
    { id: 'contact', title: isRTL ? 'تواصل معنا' : 'Contact Us', shape: 'green' as const, icon: <SolarPhoneBold size={20} color="white" /> },
    { id: 'privacy', title: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy', shape: 'blue' as const, icon: <SolarShieldBold size={20} color="white" /> },
    { id: 'logout', title: isRTL ? 'تسجيل الخروج' : 'Logout', shape: 'red' as const, icon: <SolarLogoutBold size={20} color="white" />, action: handleLogout },
  ];

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      {/* Profile Header & User Card */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={[styles.userCard]}
          onPress={openEditProfileSheet}
          activeOpacity={0.9}
        >
          <View style={[styles.userInfo, { alignItems: 'flex-start' }]}>
            <Text style={[styles.userName, { textAlign: 'left' }]}>
              {user?.name || profile?.business_name || t('tabs.home')}
            </Text>
          </View>

          <View style={styles.avatarWrap}>
            {user?.image ? (
              <Image source={getImageSrc(user.image)} style={styles.avatarImg} />
            ) : profile?.business_name ? (
              <View style={styles.avatarInitial}>
                <Text style={styles.avatarInitialText}>{profile?.business_name?.charAt(0)}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                style={styles.avatarImg}
              />
            )}
            <View style={styles.editBadge}>
              <SolarPenBold size={12} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuGroup}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuRow]}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  router.push(item.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuLabelText, { textAlign: 'left' }]}>{item.title}</Text>
              <ProfileShape size={normalize.width(42)} type={item.shape}>
                {item.icon}
              </ProfileShape>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      <BottomSheetModal
        ref={editProfileSheetRef}
        index={0}
        snapPoints={['90%']}
        backdropComponent={props => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        enablePanDownToClose
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent}>
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>{isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}</ThemedText>
            </View>

            {/* Profile Image in Sheet */}
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

            <View style={styles.formSection}>
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'الاسم الكامل' : 'Full Name'}</ThemedText>
                <View style={[styles.inputWrapper]}>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                    placeholderTextColor={Colors.text.muted}
                  />
                  <SolarUserBold size={20} color={Colors.text.muted} />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</ThemedText>
                <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                  <ThemedText style={[styles.input, { textAlign: 'left', paddingTop: 14, direction: 'ltr' }]}>
                    {user?.phone || ''}
                  </ThemedText>
                  <SolarPhoneBold size={20} color={Colors.text.muted} />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'الجنس' : 'Gender'}</ThemedText>
                <View style={[styles.genderContainer]}>
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
                <ThemedText style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'تاريخ الميلاد' : 'Birthday'}</ThemedText>
                <TouchableOpacity
                  style={[styles.inputWrapper]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText style={[styles.input, { textAlign: 'left', paddingTop: 14 }]}>
                    {formData.birthday.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                  </ThemedText>
                  <SolarCalendarBold size={20} color={Colors.text.muted} />
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
                <ThemedText style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'المدينة' : 'City'}</ThemedText>
                <TouchableOpacity
                  style={[styles.inputWrapper]}
                  onPress={() => citySheetRef.current?.present()}
                >
                  <ThemedText style={[styles.input, { textAlign: 'left', paddingTop: 14 }]}>
                    {selectedCityName || (isRTL ? 'اختر المدينة' : 'Select City')}
                  </ThemedText>
                  <SolarMapPointBold size={20} color={Colors.text.muted} />
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
        </KeyboardAvoidingView>
      </BottomSheetModal>

      {/* City Picker in Profile Page */}
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
                style={[styles.cityItem]}
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

      <LanguageSheet ref={languageSheetRef} />
      <LogoutSheet ref={logoutSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF' },
  topSection: {
    paddingHorizontal: normalize.width(20),
    paddingTop: 10 },
  scrollView: {
    flex: 1 },
  scrollContent: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(10),
    paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(24),
    padding: normalize.width(18),
    marginBottom: normalize.height(20),
    borderWidth: 1,
    borderColor: '#F3F4F6' },
  userInfo: {
    flex: 1,
    marginHorizontal: normalize.width(15) },
  userName: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#374151' },
  userType: {
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
    marginTop: 4 },
  avatarWrap: {
    width: normalize.width(66),
    height: normalize.width(66),
    borderRadius: normalize.width(33),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(33) },
  avatarInitial: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(33),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center' },
  avatarInitialText: {
    color: 'white',
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium" },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    end: -2,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white' },
  menuGroup: {
    gap: normalize.height(16) },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(18),
    paddingVertical: normalize.height(14),
    paddingHorizontal: normalize.width(18),
    borderWidth: 1,
    borderColor: '#F3F4F6' },
  menuLabelText: {
    flex: 1,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#374151',
    marginHorizontal: normalize.width(15) },
  sheetScrollContent: {
    padding: 20,
    paddingBottom: 40 },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20 },
  sheetTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24 },
  imageContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55 },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55 },
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
    borderColor: 'white' },
  formSection: {
    gap: 16 },
  fieldContainer: {
    gap: 8 },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary },
  inputWrapper: {
    minHeight: 56,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center' },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9' },
  input: {
    flex: 1,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginHorizontal: 12 },
  genderContainer: {
    flexDirection: 'row',
    gap: 12 },
  genderOption: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center' },
  genderOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF' },
  genderText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary },
  genderTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium" },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30 },
  disabledButton: {
    opacity: 0.7 },
  saveButtonText: {
    color: 'white',
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium" },
  citySheetContent: {
    flex: 1,
    padding: 20 },
  cityItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'space-between',
    alignItems: 'center' },
  cityText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium" },
  cityTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium" },
  cityEmptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium" },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary }
});
