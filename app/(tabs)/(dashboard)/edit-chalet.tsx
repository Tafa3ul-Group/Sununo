import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  useGetOwnerChaletDetailsQuery, 
  useUpdateChaletMutation, 
  useUploadChaletImageMutation, 
  useGetCitiesQuery, 
  useLazyGetChaletRegionsQuery,
  useGetAmenitiesQuery,
  useGetChaletAmenitiesQuery,
  useSetChaletAmenitiesMutation
} from '@/store/api/apiSlice';

export default function EditChaletScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const { data: response, isLoading: isLoadingDetails } = useGetOwnerChaletDetailsQuery(id);
  const chalet = response?.data || response;

  const [updateChalet, { isLoading: isUpdating }] = useUpdateChaletMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadChaletImageMutation();
  const [setAmenities, { isLoading: isLinking }] = useSetChaletAmenitiesMutation();
  const isLoading = isUpdating || isUploading || isLoadingDetails || isLinking;

  const [form, setForm] = useState({
    name: '',
    location: '',
    description: '',
    guests: '4',
    cityId: '',
    cityName: '',
    regionId: '',
    regionName: '',
    depositPercentage: '25',
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  
  const { data: cities, isLoading: loadingCities } = useGetCitiesQuery();
  const [triggerGetRegions, { data: regions, isLoading: loadingRegions }] = useLazyGetChaletRegionsQuery();
  const { data: availableAmenities } = useGetAmenitiesQuery();
  const { data: currentAmenities } = useGetChaletAmenitiesQuery(id as string);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Bottom Sheet Refs
  const citySheetRef = useRef<BottomSheetModal>(null);
  const regionSheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);

  // Snap Points
  const snapPoints = useMemo(() => ['50%', '75%'], []);
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

  useEffect(() => {
    if (chalet) {
      setForm({
        name: (isRTL ? chalet.name?.ar : chalet.name?.en) || chalet.name?.ar || chalet.name || '',
        location: (isRTL ? chalet.address?.ar : chalet.address?.en) || chalet.address?.ar || chalet.address || '',
        description: (isRTL ? chalet.description?.ar : chalet.description?.en) || chalet.description?.ar || chalet.description || '',
        guests: chalet.maxGuests?.toString() || '4',
        cityId: chalet.region?.cityId || '',
        cityName: chalet.region?.city?.name || '',
        regionId: chalet.regionId || '',
        regionName: chalet.region?.name || '',
        depositPercentage: chalet.depositPercentage?.toString() || '25',
      });
      setExistingImages(chalet.images || []);
      
      if (chalet.region?.cityId) {
        triggerGetRegions(chalet.region.cityId);
      }
    }
  }, [chalet, isRTL]);

  useEffect(() => {
    if (currentAmenities) {
      setSelectedAmenities(currentAmenities.map((a: any) => a.amenityId || a.amenity?.id));
    }
  }, [currentAmenities]);

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

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!form.name || !form.location || !form.regionId) {
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: isRTL ? 'يرجى ملء كافة الحقول واختيار المنطقة' : 'Please fill all fields and select a region',
        position: 'bottom',
      });
      return;
    }

    try {
      const payload = {
        name: { ar: form.name, en: form.name },
        description: { ar: form.description, en: form.description },
        address: { ar: form.location, en: form.location },
        regionId: form.regionId,
        maxGuests: parseInt(form.guests) || 0,
        depositPercentage: parseFloat(form.depositPercentage) || 0,
      };

      await updateChalet({ id, data: payload }).unwrap();

      // Upload new images
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
          
          await uploadImage({ chaletId: id, formData: imageFormData }).unwrap();
        }
      }

      // Update Amenities
      await setAmenities({ chaletId: id, data: { amenityIds: selectedAmenities } }).unwrap();

      Toast.show({
        type: 'success',
        text1: isRTL ? 'تم بنجاح' : 'Success',
        text2: isRTL ? 'تم تحديث البيانات بنجاح' : 'Listing updated successfully',
        position: 'bottom',
      });
      router.back();
    } catch (error: any) {
      console.error('Error updating chalet:', error);
      const errorMessage = error?.data?.message?.[0] || (isRTL ? 'فشل تحديث البيانات، حاول لاحقاً' : 'Failed to update data, try again');
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

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  if (isLoadingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { flexDirection }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <ThemedText type="h2" style={styles.headerTitle}>{isRTL ? 'تعديل الشاليه' : 'Edit Chalet'}</ThemedText>
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

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign }]}>اسم الشاليه</Text>
              <TextInput
                style={[styles.input, { textAlign }]}
                placeholder="مثال: شاليه اللؤلؤة"
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
              />
            </View>

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
              <View style={{ width: Spacing.md }} />
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
              <Text style={[styles.label, { textAlign }]}>العنوان التفصيلي</Text>
              <TextInput
                style={[styles.input, { textAlign }]}
                placeholder="مثال: القبلة، شارع المصرف"
                value={form.location}
                onChangeText={(val) => setForm({ ...form, location: val })}
              />
            </View>

            <View style={[styles.rowInputs, { flexDirection }]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { textAlign }]}>{isRTL ? 'نسبة العربون (%)' : 'Deposit %'}</Text>
                <TextInput
                  style={[styles.input, { textAlign }]}
                  placeholder="25"
                  keyboardType="numeric"
                  value={form.depositPercentage}
                  onChangeText={(val) => setForm({ ...form, depositPercentage: val })}
                />
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { textAlign }]}>عدد الضيوف</Text>
                <TextInput
                  style={[styles.input, { textAlign }]}
                  placeholder="4"
                  keyboardType="numeric"
                  value={form.guests}
                  onChangeText={(val) => setForm({ ...form, guests: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign }]}>الوصف</Text>
              <TextInput
                style={[styles.input, styles.textArea, { textAlign }]}
                placeholder="اكتب وصفاً مفصلاً للشاليه..."
                multiline
                numberOfLines={4}
                value={form.description}
                onChangeText={(val) => setForm({ ...form, description: val })}
              />
            </View>

            <Text style={[styles.label, { textAlign, marginBottom: Spacing.sm }]}>{isRTL ? 'المميزات المتوفرة' : 'Available Amenities'}</Text>
            <View style={[styles.featuresGrid, { flexDirection }]}>
              {availableAmenities?.map((amenity: any) => {
                const isSelected = selectedAmenities.includes(amenity.id);
                return (
                  <TouchableOpacity
                    key={amenity.id}
                    onPress={() => toggleAmenity(amenity.id)}
                    style={[
                      styles.featureItem,
                      isSelected && styles.featureItemSelected
                    ]}
                  >
                    <MaterialCommunityIcons 
                      name={(amenity.icon || 'star-outline') as any} 
                      size={20} 
                      color={isSelected ? Colors.white : Colors.text.primary} 
                    />
                    <Text style={[
                      styles.featureLabel,
                      isSelected && styles.featureLabelSelected
                    ]}>
                      {isRTL ? amenity.name?.ar : amenity.name?.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.imageSection, { marginTop: Spacing.lg }]}>
            <Text style={[styles.label, { textAlign, marginBottom: Spacing.sm }]}>{isRTL ? 'الصور الحالية' : 'Current Photos'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
              {existingImages.map((img, index) => (
                <View key={img.id} style={styles.imageItem}>
                  <Image source={getImageSrc(img.url)} style={styles.uploadedImage} />
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.label, { textAlign, marginBottom: Spacing.sm, marginTop: Spacing.md }]}>{isRTL ? 'إضافة صور جديدة' : 'Add New Photos'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={getImageSrc(uri)} style={styles.uploadedImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeSelectedImage(index)}>
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

          <TouchableOpacity 
            style={[styles.saveButton, (isUpdating || isUploading) && { opacity: 0.7 }]}
            onPress={handleUpdate}
            activeOpacity={0.8}
            disabled={isUpdating || isUploading}
          >
            {isUpdating || isUploading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>{isRTL ? 'تحديث البيانات' : 'Update Listing'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
          <Text style={styles.modalTitle}>اختر المدينة</Text>
          {loadingCities ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : (
            <BottomSheetFlatList
              data={cities}
              keyExtractor={(item: any) => item.id}
              style={{ width: '100%' }}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => handleCitySelect(item)}
                >
                  <Text style={[styles.pickerItemText, { textAlign }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
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
          <Text style={styles.modalTitle}>اختر المنطقة</Text>
          {loadingRegions ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : (
            <BottomSheetFlatList
              data={regions}
              keyExtractor={(item: any) => item.id}
              style={{ width: '100%' }}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => handleRegionSelect(item)}
                >
                  <Text style={[styles.pickerItemText, { textAlign }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: Spacing.xl * 2,
  },
  uploadText: {
    marginTop: 4,
    color: Colors.text.muted,
    fontSize: normalize.font(12),
    fontWeight: '600',
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
    top: 4,
    right: 4,
    backgroundColor: Colors.white,
    borderRadius: 12,
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
    gap: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: normalize.font(14),
  },
  input: {
    height: normalize.height(56),
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: normalize.font(16),
  },
  rowInputs: {
    width: '100%',
  },
  textArea: {
    height: normalize.height(120),
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: normalize.height(56),
    borderRadius: normalize.radius(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: normalize.font(18),
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(12),
    gap: Spacing.xs,
  },
  featureItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  featureLabel: {
    fontSize: normalize.font(12),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  featureLabelSelected: {
    color: Colors.white,
  },
});
