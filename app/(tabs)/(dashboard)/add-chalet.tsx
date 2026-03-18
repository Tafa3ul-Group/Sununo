import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getImageSrc } from '@/hooks/useImageSrc';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { 
  useCreateChaletMutation, 
  useUploadChaletImageMutation, 
  useGetCitiesQuery, 
  useLazyGetChaletRegionsQuery, 
  useGetAmenitiesQuery, 
  useSetChaletAmenitiesMutation 
} from '@/store/api/apiSlice';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { LocationPickerModal } from '@/components/user/location-picker-modal';
import { AppMap } from '@/components/user/app-map';

export default function AddChaletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const [createChalet, { isLoading: isCreating }] = useCreateChaletMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadChaletImageMutation();
  const [setAmenities, { isLoading: isLinking }] = useSetChaletAmenitiesMutation();
  const isLoading = isCreating || isUploading || isLinking;

  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    addressAr: '',
    addressEn: '',
    descriptionAr: '',
    descriptionEn: '',
    guests: '4',
    cityId: '',
    cityName: '',
    regionId: '',
    regionName: '',
    depositPercentage: '25',
    phone: '',
    whatsapp: '',
    latitude: '',
    longitude: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 'basic', title: isRTL ? 'الأساسية' : 'Basic' },
    { id: 'location', title: isRTL ? 'الموقع' : 'Location' },
    { id: 'booking', title: isRTL ? 'الحجز' : 'Booking' },
    { id: 'media', title: isRTL ? 'المزايا والصور' : 'Media' },
  ];

  const [showMap, setShowMap] = useState(false);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { data: cities, isLoading: loadingCities } = useGetCitiesQuery();
  const [triggerGetRegions, { data: regions, isLoading: loadingRegions }] = useLazyGetChaletRegionsQuery();
  const { data: availableAmenities } = useGetAmenitiesQuery();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Bottom Sheet Refs
  const citySheetRef = useRef<BottomSheetModal>(null);
  const regionSheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);

  // Snap Points
  const snapPoints = useMemo(() => ['65%', '90%'], []);
  const imageSnapPoints = useMemo(() => ['30%'], []);

  // Backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'نحتاج صلاحية الوصول للأستوديو' : 'Permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'نحتاج صلاحية الوصول للكاميرا' : 'Permission needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.nameAr || !form.addressAr || !form.regionId) {
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: isRTL ? 'يرجى ملء الاسم العربي والعنوان والمنطقة' : 'Please fill Arabic name, address, and select a region',
        position: 'bottom',
      });
      return;
    }

    try {
      const payload = {
        name: { ar: form.nameAr, en: form.nameEn || form.nameAr },
        description: { ar: form.descriptionAr, en: form.descriptionEn || form.descriptionAr },
        address: { ar: form.addressAr, en: form.addressEn || form.addressAr },
        regionId: form.regionId,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        maxGuests: parseInt(form.guests) || 0,
        depositPercentage: parseFloat(form.depositPercentage) || 25,
      };

      const result = await createChalet(payload).unwrap();
      const chaletId = result.id;

      // Upload images one by one
      if (selectedImages.length > 0) {
        for (const uri of selectedImages) {
          const imageFormData = new FormData();
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : `image`;
          
          // @ts-ignore
          imageFormData.append('image', {
            uri,
            name: filename,
            type,
          });
          
          await uploadImage({ chaletId, formData: imageFormData }).unwrap();
        }
      }

      // Link Amenities
      if (selectedAmenities.length > 0) {
        await setAmenities({ chaletId, data: { amenityIds: selectedAmenities } }).unwrap();
      }


      Toast.show({
        type: 'success',
        text1: isRTL ? 'تم بنجاح' : 'Success',
        text2: isRTL ? 'تمت إضافة الشاليه بنجاح' : 'Chalet added successfully',
        position: 'bottom',
      });
      router.back();
    } catch (error: any) {
      console.error('Error creating chalet:', error);
      const errorMessage = error?.data?.message?.[0] || (isRTL ? 'فشل إرسال البيانات، حاول لاحقاً' : 'Failed to save data, try again');
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: errorMessage,
        position: 'bottom',
      });
    }
  };

  const handleCitySelect = (city: any) => {
    setForm({ ...form, cityId: city.id, cityName: city.name, regionId: '', regionName: '' });
    citySheetRef.current?.dismiss();
    triggerGetRegions(city.id);
  };

  const handleRegionSelect = (region: any) => {
    setForm({ ...form, regionId: region.id, regionName: region.name });
    regionSheetRef.current?.dismiss();
  };

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!form.nameAr && !!form.descriptionAr;
      case 1:
        return !!form.cityId && !!form.regionId && !!form.addressAr;
      case 2:
        return !!form.phone && !!form.depositPercentage && !!form.guests;
      case 3:
        return selectedImages.length > 0;
      default:
        return true;
    }
  }, [currentStep, form, selectedImages]);

  const nextStep = () => {
    if (!isStepValid) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={[styles.stepIndicatorContainer, { flexDirection }]}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot, 
                  isActive && styles.stepDotActive,
                  isCompleted && styles.stepDotCompleted
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  ) : (
                    <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>
                  {step.title}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { flexDirection }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <ThemedText type="h2" style={styles.headerTitle}>{t('dashboard.addChalet')}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepIndicator()}

          {currentStep === 0 && (
            <View style={styles.sectionCard}>
              <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'المعلومات الأساسية' : 'Basic Information'}</ThemedText>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (بالعربي)' : 'Chalet Name (Arabic)'}</Text>
                <TextInput
                  style={[styles.input, { textAlign }]}
                  placeholder={isRTL ? "مثال: شاليه الورد" : "e.g. Rose Chalet"}
                  value={form.nameAr}
                  onChangeText={(val) => setForm({ ...form, nameAr: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (English)' : 'Chalet Name (English)'}</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'left' }]}
                  placeholder="e.g. Rose Chalet"
                  value={form.nameEn}
                  onChangeText={(val) => setForm({ ...form, nameEn: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'الوصف (بالعربي)' : 'Description (Arabic)'}</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { textAlign }]}
                  placeholder={isRTL ? "اكتب وصفاً بالعربي..." : "Enter Arabic description..."}
                  multiline
                  numberOfLines={4}
                  value={form.descriptionAr}
                  onChangeText={(val) => setForm({ ...form, descriptionAr: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'الوصف (English)' : 'Description (English)'}</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { textAlign: 'left' }]}
                  placeholder="Enter description in English..."
                  multiline
                  numberOfLines={4}
                  value={form.descriptionEn}
                  onChangeText={(val) => setForm({ ...form, descriptionEn: val })}
                />
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View style={styles.sectionCard}>
              <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'تحديد الموقع' : 'Location Details'}</ThemedText>
              
              <View style={[styles.rowInputs, { flexDirection }]}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { textAlign }]}>المدينة</Text>
                  <TouchableOpacity 
                    style={[styles.input, { justifyContent: 'center' }]} 
                    onPress={() => citySheetRef.current?.present()}
                  >
                    <Text style={{ color: form.cityName ? Colors.text.primary : Colors.text.muted, textAlign }}>
                      {form.cityName || "اختر المدينة"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { textAlign }]}>المنطقة</Text>
                  <TouchableOpacity 
                    style={[styles.input, { justifyContent: 'center' }]} 
                    onPress={() => form.cityId ? regionSheetRef.current?.present() : Alert.alert("تنبيه", "يرجى اختيار المدينة أولاً")}
                    disabled={!form.cityId}
                  >
                    <Text style={{ color: form.regionName ? Colors.text.primary : Colors.text.muted, textAlign }}>
                      {form.regionName || "اختر المنطقة"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'العنوان (بالعربي)' : 'Address (Arabic)'}</Text>
                <TextInput
                  style={[styles.input, { textAlign }]}
                  placeholder={isRTL ? "مثال: القبلة، شارع المصرف" : "e.g. Al-Qibla, Bank St."}
                  value={form.addressAr}
                  onChangeText={(val) => setForm({ ...form, addressAr: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'العنوان (English)' : 'Address (English)'}</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'left' }]}
                  placeholder="e.g. Al-Qibla, Bank St."
                  value={form.addressEn}
                  onChangeText={(val) => setForm({ ...form, addressEn: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'موقع الشاليه' : 'Chalet Location'}</Text>
                <TouchableOpacity 
                  style={styles.mapPreviewContainer}
                  onPress={() => setShowMap(true)}
                  activeOpacity={0.8}
                >
                  <AppMap 
                    style={styles.miniMap}
                    centerCoordinate={form.latitude && form.longitude ? [parseFloat(form.longitude), parseFloat(form.latitude)] : undefined}
                    zoomLevel={15}
                    interactive={false}
                    showMarker={true}
                  />
                  <View style={styles.mapOverlay}>
                      <View style={styles.editLocBadge}>
                          <Ionicons name="map" size={16} color={Colors.white} />
                          <Text style={styles.editLocText}>{isRTL ? 'تعديل الموقع على الخارطة' : 'Edit on Map'}</Text>
                      </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.sectionCard}>
              <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'التواصل وسياسة الحجز' : 'Contact & Booking'}</ThemedText>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'رقم الهاتف' : 'Phone'}</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'left' }]}
                  placeholder="+964..."
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(val) => setForm({ ...form, phone: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'رابط واتساب' : 'WhatsApp Link'}</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'left' }]}
                  placeholder="https://wa.me/964..."
                  keyboardType="url"
                  autoCapitalize="none"
                  value={form.whatsapp}
                  onChangeText={(val) => setForm({ ...form, whatsapp: val })}
                />
              </View>

              <View style={[styles.rowInputs, { flexDirection }]}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'نسبة العربون (%)' : 'Deposit %'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    placeholder="25"
                    keyboardType="numeric"
                    value={form.depositPercentage}
                    onChangeText={(val) => setForm({ ...form, depositPercentage: val })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'أقصى عدد ضيوف' : 'Max Guests'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    placeholder="20"
                    keyboardType="numeric"
                    value={form.guests}
                    onChangeText={(val) => setForm({ ...form, guests: val })}
                  />
                </View>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <>
              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'المميزات المتوفرة' : 'Available Amenities'}</ThemedText>
                <View style={[styles.featuresGrid, { flexDirection }]}>
                  {availableAmenities?.map((amenity: any) => {
                    const isSelected = selectedAmenities.includes(amenity.id);
                    return (
                      <View key={amenity.id} style={styles.featureItemWrapper}>
                        <SecondaryButton
                          label={isRTL ? amenity.name?.ar : amenity.name?.en}
                          onPress={() => toggleAmenity(amenity.id)}
                          icon={amenity.icon ? (amenity.icon as any) : 'star'}
                          isActive={isSelected}
                          textStyle={{ fontSize: normalize.font(12) }}
                          style={{ height: 40 }}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'صور الشاليه' : 'Chalet Photos'}</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri }} style={styles.uploadedImage} />
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.imageUpload} onPress={() => imageSourceSheetRef.current?.present()}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={32} color={Colors.text.muted} />
                    <Text style={styles.uploadText}>{isRTL ? 'إضافة صور' : 'Add Photos'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { flexDirection }]}>
          {currentStep > 0 && (
            <SecondaryButton
              label={isRTL ? 'السابق' : 'Back'}
              onPress={prevStep}
              style={{ flex: 1 }}
            />
          )}
          {currentStep < steps.length - 1 ? (
            <PrimaryButton
              label={isRTL ? 'التالي' : 'Next'}
              onPress={nextStep}
              disabled={!isStepValid}
              activeColor={isStepValid ? Colors.primary : '#CBD5E1'}
              style={{ flex: 2 }}
            />
          ) : (
            <PrimaryButton
              label={isRTL ? 'حفظ ونشر الشاليه' : 'Save & Publish Chalet'}
              onPress={handleSave}
              loading={isLoading}
              disabled={!isStepValid}
              activeColor={isStepValid ? Colors.primary : '#CBD5E1'}
              style={{ flex: 2 }}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* City Picker Bottom Sheet */}
      <BottomSheetModal
        ref={citySheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: normalize.radius(24) }}
      >
        <BottomSheetView style={styles.sheetContent}>
          {loadingCities ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : (
            <BottomSheetFlatList
              data={cities}
              keyExtractor={(item: any) => item.id}
              style={{ width: '100%' }}
              ListHeaderComponent={<Text style={styles.modalTitle}>اختر المدينة</Text>}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => handleCitySelect(item)}
                >
                  <Text style={[styles.pickerItemText, { textAlign }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Region Picker Bottom Sheet */}
      <BottomSheetModal
        ref={regionSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: normalize.radius(24) }}
      >
        <BottomSheetView style={styles.sheetContent}>
          {loadingRegions ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : (
            <BottomSheetFlatList
              data={regions}
              keyExtractor={(item: any) => item.id}
              style={{ width: '100%' }}
              ListHeaderComponent={<Text style={styles.modalTitle}>اختر المنطقة</Text>}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => handleRegionSelect(item)}
                >
                  <Text style={[styles.pickerItemText, { textAlign }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Image Source Bottom Sheet */}
      <BottomSheetModal
        ref={imageSourceSheetRef}
        index={0}
        snapPoints={imageSnapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: normalize.radius(24) }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'اختر مصدر الصورة' : 'Select Image Source'}</Text>
          <View style={styles.modalOptions}>
            <TouchableOpacity style={styles.modalOption} onPress={() => { takePhoto(); imageSourceSheetRef.current?.dismiss(); }}>
              <View style={[styles.modalIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="camera" size={30} color={Colors.primary} />
              </View>
              <Text style={styles.modalOptionText}>{isRTL ? 'الكاميرا' : 'Camera'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => { pickImage(); imageSourceSheetRef.current?.dismiss(); }}>
              <View style={[styles.modalIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="images" size={30} color="#9C27B0" />
              </View>
              <Text style={styles.modalOptionText}>{isRTL ? 'الأستوديو' : 'Gallery'}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <LocationPickerModal
        visible={showMap}
        onClose={() => setShowMap(false)}
        onSelect={(lat, lng) => setForm({ ...form, latitude: lat.toString(), longitude: lng.toString() })}
        initialLocation={form.latitude && form.longitude ? { latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: normalize.font(18),
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: '#fff',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTitleActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginTop: -16, // Align with dots
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionCard: {
    backgroundColor: 'transparent',
    padding: Spacing.xs,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  uploadText: {
    marginTop: normalize.height(4),
    color: Colors.text.muted,
    fontSize: normalize.font(12),
    fontWeight: '600',
  },
  rowInputs: {
    gap: Spacing.sm,
  },
  imageSection: {
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    gap: Spacing.sm,
  },
  imageItem: {
    width: normalize.width(100),
    height: normalize.width(100),
    borderRadius: normalize.radius(16),
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: normalize.height(6),
    right: normalize.width(6),
    backgroundColor: Colors.white,
    borderRadius: normalize.radius(12),
  },
  imageUpload: {
    width: normalize.width(100),
    height: normalize.width(100),
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  sheetContent: {
    padding: Spacing.lg,
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  modalOption: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalIcon: {
    width: normalize.width(70),
    height: normalize.width(70),
    borderRadius: normalize.radius(35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    ...Typography.body,
    fontWeight: '600',
  },
  modalCancel: {
    width: '100%',
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCancelText: {
    ...Typography.body,
    color: Colors.text.muted,
    fontWeight: '600',
  },
  pickerItem: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemText: {
    ...Typography.body,
    fontSize: normalize.font(16),
    color: Colors.text.primary,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: normalize.font(14),
  },
  input: {
    height: normalize.height(54),
    backgroundColor: '#F8FAFC',
    borderRadius: normalize.radius(16),
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: normalize.font(15),
    color: Colors.text.primary,
  },
  textArea: {
    height: normalize.height(100),
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureItemWrapper: {
    width: '48.5%', // Solid 2-column layout
  },
  saveBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  mapPreviewContainer: {
    height: normalize.height(180),
    width: '100%',
    borderRadius: normalize.radius(16),
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  miniMap: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  editLocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(3, 93, 249, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editLocText: {
    color: Colors.white,
    fontSize: normalize.font(12),
    fontWeight: '700',
  }
});
