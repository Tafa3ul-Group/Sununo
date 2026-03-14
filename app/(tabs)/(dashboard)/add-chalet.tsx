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
} from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useCreateChaletMutation, useUploadChaletImageMutation, useGetCitiesQuery, useLazyGetRegionsQuery } from '@/store/api/apiSlice';

export default function AddChaletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const [createChalet, { isLoading: isCreating }] = useCreateChaletMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadChaletImageMutation();
  const isLoading = isCreating || isUploading;

  const [form, setForm] = useState({
    name: '',
    location: '',
    price: '',
    description: '',
    guests: '4',
    rooms: '2',
    cityId: '',
    cityName: '',
    regionId: '',
    regionName: '',
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { data: cities, isLoading: loadingCities } = useGetCitiesQuery();
  const [triggerGetRegions, { data: regions, isLoading: loadingRegions }] = useLazyGetRegionsQuery();

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

  const [features, setFeatures] = useState([
    { id: 'pool', label: 'مسبح', icon: 'pool', selected: false },
    { id: 'wifi', label: 'واي فاي', icon: 'wifi', selected: false },
    { id: 'ac', label: 'تكييف', icon: 'air-conditioner', selected: false },
    { id: 'grill', label: 'شواء', icon: 'grill', selected: false },
    { id: 'garden', label: 'حديقة', icon: 'tree', selected: false },
  ]);

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
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
    if (!form.name || !form.location || !form.price || !form.regionId) {
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
        depositPercentage: 25,
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
                <Text style={[styles.label, { textAlign }]}>السعر لليلة (د.ع)</Text>
                <TextInput
                  style={[styles.input, { textAlign }]}
                  placeholder="300,000"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(val) => setForm({ ...form, price: val })}
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

            <Text style={[styles.label, { textAlign, marginBottom: Spacing.sm }]}>المميزات</Text>
            <View style={[styles.featuresGrid, { flexDirection }]}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  onPress={() => toggleFeature(feature.id)}
                  style={[
                    styles.featureItem,
                    feature.selected && styles.featureItemSelected
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={feature.icon as any} 
                    size={20} 
                    color={feature.selected ? Colors.white : Colors.text.primary} 
                  />
                  <Text style={[
                    styles.featureLabel,
                    feature.selected && styles.featureLabelSelected
                  ]}>
                    {feature.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.imageSection, { marginTop: Spacing.lg }]}>
            <Text style={[styles.label, { textAlign, marginBottom: Spacing.sm }]}>{isRTL ? 'صور الشاليه' : 'Chalet Photos'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
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
            style={[styles.saveButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>حفظ ونشر الشاليه</Text>
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
  featuresGrid: {
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
  saveButton: {
    backgroundColor: Colors.primary,
    height: normalize.height(56),
    borderRadius: normalize.radius(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    ...Shadows.medium,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: normalize.font(18),
    fontWeight: 'bold',
  },
});
