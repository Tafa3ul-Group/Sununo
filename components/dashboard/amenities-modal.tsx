import { SolarCameraBold, SolarStarBold, SolarWifiBold } from '@/components/icons/solar-icons';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Colors } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import {
  useDeleteChaletImageMutation,
  useGetAmenityCategoriesQuery,
  useGetChaletAmenitiesQuery,
  useSetChaletAmenitiesMutation,
  useUploadChaletImageMutation
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  I18nManager,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AmenityIcon = ({ icon, size = 18 }: { icon: string; size?: number }) => {
  if (!icon) return <SolarStarBold size={size} color="#FFF" />;
  if (icon === "wifi") return <SolarWifiBold size={size} color="#FFF" />;

  const lower = icon.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) {
    return <SolarWifiBold size={size} color="#FFF" />;
  }

  if (icon.startsWith("http") || icon.startsWith("/") || icon.includes(".")) {
    return (
      <Image
        source={getImageSrc(icon)}
        style={{ width: size, height: size, tintColor: "#FFF" }}
        resizeMode="contain"
      />
    );
  }

  return <SolarStarBold size={size} color="#FFF" />;
};

interface AmenitiesModalProps {
  chaletId: string;
  chalet: any;
  refetchChalet: () => void;
}

export const AmenitiesModal = forwardRef<BottomSheetModal, AmenitiesModalProps>(
  ({ chaletId, chalet, refetchChalet }, ref) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language ? i18n.language.startsWith('ar') : false;
    const { showConfirm } = useConfirmationDialog();

    const { data: amenityCategories } = useGetAmenityCategoriesQuery();
    const { data: currentAmenities } = useGetChaletAmenitiesQuery(chaletId, { skip: !chaletId });
    const [setAmenitiesMutation, { isLoading: isLinking }] = useSetChaletAmenitiesMutation();
    const [uploadImage] = useUploadChaletImageMutation();
    const [deleteImage] = useDeleteChaletImageMutation();

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
    const categoryScrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
      // 1. Try to load from chalet.chaletFeatures first if present
      if (chalet && Array.isArray(chalet.chaletFeatures) && chalet.chaletFeatures.length > 0) {
        const ids = chalet.chaletFeatures
          .map((cf: any) => cf.featureId || cf.feature?.id)
          .filter(Boolean);
        setSelectedFeatures(ids);
        return;
      }

      // 2. Load from currentAmenities categories structure
      if (currentAmenities) {
        const categories = Array.isArray(currentAmenities) ? currentAmenities : [];
        const featureIds: string[] = [];
        categories.forEach((cat: any) => {
          if (Array.isArray(cat.features)) {
            cat.features.forEach((feat: any) => {
              if (feat?.id) {
                featureIds.push(feat.id);
              }
            });
          }
        });
        setSelectedFeatures(featureIds);
      }
    }, [chalet, currentAmenities]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      []
    );

    const handleCategoryScrollEnd = (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(contentOffset / SCREEN_WIDTH);
      setActiveCategoryIndex(pageIndex);
    };

    const handleGoToPage = (index: number) => {
      setActiveCategoryIndex(index);
      categoryScrollViewRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    };

    const handleNextPage = () => {
      if (activeCategoryIndex < (amenityCategories?.length || 0) - 1) {
        const nextIndex = activeCategoryIndex + 1;
        setActiveCategoryIndex(nextIndex);
        categoryScrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
      } else {
        handleUpdateAmenities();
      }
    };

    const handleUpdateAmenities = async () => {
      try {
        await setAmenitiesMutation({ chaletId, data: { featureIds: selectedFeatures } }).unwrap();
        Toast.show({
          type: 'success',
          text1: isRTL ? 'تم حفظ المرافق والخدمات بنجاح' : 'Amenities updated successfully',
        });
        (ref as any)?.current?.dismiss();
        refetchChalet();
      } catch (err: any) {
        console.error(err);
        const errMsg = err?.data?.message || err?.message || '';
        Toast.show({
          type: 'error',
          text1: isRTL ? 'خطأ في الحفظ' : 'Error saving',
          text2: errMsg,
        });
      }
    };

    const handlePickCategoryPhoto = async (categoryId: string) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: isRTL ? 'إذن الوصول للصور مطلوب' : 'Permission to photos is required',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        await handleUploadCategoryPhoto(categoryId, selectedUri);
      }
    };

    const handleUploadCategoryPhoto = async (categoryId: string, uri: string) => {
      try {
        const imageFormData = new FormData();
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        imageFormData.append('image', { uri, name: filename, type });
        imageFormData.append('amenityCategoryId', categoryId);

        await uploadImage({ chaletId, formData: imageFormData }).unwrap();
        Toast.show({
          type: 'success',
          text1: isRTL ? 'تم رفع الصورة للمرفق بنجاح' : 'Image uploaded to amenity successfully',
        });
        refetchChalet();
      } catch (err: any) {
        console.error(err);
        const errMsg = err?.data?.message || err?.message || '';
        Toast.show({
          type: 'error',
          text1: isRTL ? 'فشل رفع الصورة' : 'Upload failed',
          text2: errMsg,
        });
      }
    };

    const handleDeleteCategoryPhoto = async (imageId: string) => {
      showConfirm({
        title: isRTL ? 'حذف الصورة' : 'Delete Image',
        message: isRTL ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?',
        type: 'danger',
        confirmLabel: isRTL ? 'حذف' : 'Delete',
        cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
        onConfirm: async () => {
          try {
            await deleteImage({ chaletId, imageId }).unwrap();
            Toast.show({ type: 'success', text1: isRTL ? 'تم الحذف' : 'Deleted' });
            refetchChalet();
          } catch (err: any) {
            console.error(err);
            const errMsg = err?.data?.message || err?.message || '';
            Toast.show({
              type: 'error',
              text1: isRTL ? 'فشل الحذف' : 'Delete failed',
              text2: errMsg,
            });
          }
        },
      });
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={['85%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24, backgroundColor: '#FFFFFF' }}
      >
        <BottomSheetView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Swiper Content */}
          <ScrollView
            ref={categoryScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCategoryScrollEnd}
            style={{ flex: 1 }}
            contentContainerStyle={{}}
          >
            {amenityCategories?.map((category: any, pageIdx: number) => {
              const categoryImages =
                chalet?.images?.filter(
                  (img: any) =>
                    img.amenityCategoryId === category.id ||
                    img.amenityCategory?.id === category.id
                ) || [];
              return (
                <View key={category.id} style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                  {/* Category Title */}
                  <Text style={styles.swiperCategoryTitle}>
                    {isRTL ? category.name?.ar : category.name?.en}
                  </Text>

                  {/* List of features */}
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                  >
                    <View style={styles.swiperFeaturesList}>
                      {category.features?.map((feature: any) => {
                        const isSelected = selectedFeatures.includes(feature.id);
                        return (
                          <TouchableOpacity
                            key={feature.id}
                            style={[
                              styles.swiperFeatureCard,
                              isSelected && styles.swiperFeatureCardActive,
                              { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }
                            ]}
                            onPress={() =>
                              setSelectedFeatures((prev) =>
                                prev.includes(feature.id)
                                  ? prev.filter((id) => id !== feature.id)
                                  : [...prev, feature.id]
                              )
                            }
                            activeOpacity={0.7}
                          >
                            {/* Checkbox (Left) */}
                            <View style={styles.swiperCheckboxContainer}>
                              {isSelected ? (
                                <View style={styles.swiperCheckboxActive}>
                                  <Text style={styles.swiperCheckmark}>✓</Text>
                                </View>
                              ) : (
                                <View style={styles.swiperCheckboxInactive} />
                              )}
                            </View>

                            {/* Info (Right) */}
                            <View
                              style={[
                                styles.swiperFeatureInfo,
                                { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
                              ]}
                            >
                              <Text style={[styles.swiperFeatureName, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? feature.name?.ar : feature.name?.en}
                              </Text>

                              {/* Orange Scalloped Badge */}
                              <View style={styles.orangeBadgeContainer}>
                                <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '0deg' }] }]} />
                                <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '30deg' }] }]} />
                                <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '60deg' }] }]} />
                                <View style={styles.orangeBadgeContent}>
                                  <AmenityIcon icon={feature.icon} />
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Images Section */}
                    <Text style={styles.swiperSectionTitle}>
                      {isRTL ? 'صور هذا المرفق' : 'Amenity Images'}
                    </Text>

                    <View style={styles.swiperImagesSection}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.swiperImagesScroll}
                      >
                        {/* Camera Button */}
                        <TouchableOpacity
                          style={styles.swiperUploadBtn}
                          onPress={() => handlePickCategoryPhoto(category.id)}
                          activeOpacity={0.7}
                        >
                          <SolarCameraBold size={24} color="#94A3B8" />
                        </TouchableOpacity>

                        {/* Existing Images */}
                        {categoryImages.map((img: any) => (
                          <View key={img.id} style={styles.swiperImageContainer}>
                            <Image
                              source={{ uri: getImageSrc(img.url).uri }}
                              style={styles.swiperImage}
                            />
                            <TouchableOpacity
                              style={styles.swiperImageDeleteBtn}
                              onPress={() => handleDeleteCategoryPhoto(img.id)}
                            >
                              <Text style={styles.swiperImageDeleteText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>

          {/* Sticky Bottom Section */}
          <View style={styles.swiperBottomContainer}>
            {/* Pagination Dots */}
            <View style={[styles.swiperPaginationDots, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
              {amenityCategories?.map((_, idx) => {
                const isActive = idx === activeCategoryIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleGoToPage(idx)}
                    style={[styles.swiperDot, isActive && styles.swiperDotActive]}
                  />
                );
              })}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.swiperActionButton}
              onPress={handleNextPage}
              activeOpacity={0.8}
              disabled={isLinking}
            >
              <Text style={styles.swiperActionButtonText}>
                {activeCategoryIndex === (amenityCategories?.length || 0) - 1
                  ? isRTL
                    ? 'حفظ المرافق والخدمات'
                    : 'Save Amenities'
                  : isRTL
                    ? 'التالي'
                    : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView >
      </BottomSheetModal >
    );
  }
);

const styles = StyleSheet.create({
  swiperCategoryTitle: {
    fontSize: 20,
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  swiperFeaturesList: {
    gap: 12,
    marginBottom: 24,
  },
  swiperFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  swiperFeatureCardActive: {
    borderColor: '#E2E8F0',
  },
  swiperCheckboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperCheckboxActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Alexandria-Bold',
    marginTop: -1,
  },
  swiperCheckboxInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  swiperFeatureInfo: {
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  swiperFeatureName: {
    fontSize: 14,
    fontFamily: 'Alexandria-SemiBold',
    color: Colors.text.primary,
    flex: 1,
  },
  orangeBadgeContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orangeBadgeLayer: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FF5B00',
  },
  orangeBadgeContent: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperSectionTitle: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  swiperImagesSection: {
    marginBottom: 16,
  },
  swiperImagesScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  swiperUploadBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: 'relative',
  },
  swiperImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  swiperImageDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  swiperImageDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    marginTop: -2.5,
  },
  swiperBottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  swiperPaginationDots: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  swiperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  swiperDotActive: {
    backgroundColor: '#0066FF',
    width: 18,
  },
  swiperActionButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
  },
});
