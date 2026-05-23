import { AmenitiesModal } from '@/components/dashboard/amenities-modal';
import {
  ProfileShape,
  SolarAddSquareBold,
  SolarBanknoteBold,
  SolarCameraAddBold,
  SolarCheckCircleBold,
  SolarClockCircleBold,
  SolarCloseCircleBold,
  SolarEyeBold,
  SolarGalleryBold,
  SolarMapPointBold,
  SolarNotebookBold,
  SolarPenBold,
  SolarShieldWarningBold,
  SolarStarBold,
  SolarTrashBinBold,
  SolarUsersGroupBold
} from "@/components/icons/solar-icons";
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AppMap } from '@/components/user/app-map';
import { GuestCounter } from '@/components/user/guest-counter';
import { LocationPickerModal } from '@/components/user/location-picker-modal';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import {
  useDeleteChaletImageMutation,
  useDeleteChaletMutation,
  useGetAmenityCategoriesQuery,
  useGetChaletAmenitiesQuery,
  useGetCitiesQuery,
  useGetOwnerChaletDetailsQuery,
  useGetProviderChaletStatsQuery,
  useSetChaletAmenitiesMutation,
  useUpdateChaletImageMutation,
  useUpdateChaletMutation,
  useUploadChaletImageMutation,
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Dimensions, I18nManager, Image, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 420;

// SVG path definitions for the back.svg arrow
const EN_BACK_PATH = "M16.9467 0L16.984 0.0319551C16.9918 0.563434 17.0077 1.11929 16.9957 1.64861C16.695 2.1116 15.6337 3.01428 15.2014 3.39902C13.6558 4.77432 11.2704 6.6148 10.1626 8.37453C9.66288 9.15572 9.33791 10.0399 9.21086 10.9642C8.96436 12.8514 9.38009 14.7291 10.5583 16.2312C11.0052 16.801 11.7141 17.4728 12.2449 17.9938L14.9532 20.6073C15.3814 21.0236 16.1485 21.753 16.4858 22.2046C16.5279 22.8117 16.5161 23.3931 16.4911 24C15.9468 23.8061 14.9671 23.3157 14.3994 23.0547L10.252 21.1529C8.50688 20.321 6.06286 19.4531 4.65913 18.0823C3.62117 17.0688 2.90487 15.0354 2.91724 13.5511C2.50593 13.4266 1.45728 12.5735 1.04287 12.2832C0.657269 12.013 0.433131 11.8682 0 11.6452C0.660173 11.1658 1.36011 10.727 2.0402 10.2775C2.31689 10.0946 2.85074 9.80927 3.07692 9.61241C3.09687 8.79841 3.17037 8.21858 3.46665 7.45396C3.85861 6.44889 4.52293 5.57892 5.38162 4.94608C6.58946 4.04845 8.20959 3.58706 9.56851 3.00721C10.8307 2.46863 12.0383 1.92053 13.319 1.40781C14.0582 1.1135 14.799 0.823459 15.5414 0.537748C16.0014 0.363519 16.5003 0.198389 16.9467 0Z";
const AR_BACK_PATH = "M0.0532856 0L0.0160198 0.0319551C0.00823021 0.563434 -0.00767517 1.11929 0.00434875 1.64861C0.305 2.1116 1.3663 3.01428 1.79865 3.39902C3.34419 4.77432 5.72956 6.6148 6.83738 8.37453C7.33712 9.15572 7.66209 10.0399 7.78914 10.9642C8.03564 12.8514 7.61991 14.7291 6.44174 16.2312C5.99476 16.801 5.28592 17.4728 4.75508 17.9938L2.04678 20.6073C1.61862 21.0236 0.851501 21.753 0.514236 22.2046C0.472057 22.8117 0.483946 23.3931 0.508917 24C1.05319 23.8061 2.03285 23.3157 2.60061 23.0547L6.748 21.1529C8.49312 20.321 10.9371 19.4531 12.3409 18.0823C13.3788 17.0688 14.0951 15.0354 14.0828 13.5511C14.4941 13.4266 15.5427 12.5735 15.9571 12.2832C16.3427 12.013 16.5669 11.8682 17 11.6452C16.3398 11.1658 15.6399 10.727 14.9598 10.2775C14.6831 10.0946 14.1493 9.80927 13.9231 9.61241C13.9031 8.79841 13.8296 8.21858 13.5334 7.45396C13.1414 6.44889 12.4771 5.57892 11.6184 4.94608C10.4105 4.04845 8.79041 3.58706 7.43149 3.00721C6.16934 2.46863 4.96171 1.92053 3.68105 1.40781C2.94184 1.1135 2.201 0.823459 1.45856 0.537748C0.998611 0.363519 0.499662 0.198389 0.0532856 0Z";

export default function ChaletDetailsScreen() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language ? i18n.language.startsWith('ar') : false;
  const { showConfirm } = useConfirmationDialog();

  // Robust layout bridge: 
  // - If I18nManager.isRTL is active, standard 'row' is already right-to-left. Manually forcing 'row-reverse' double-flips it back to LTR.
  // - If I18nManager.isRTL is not active, we manually use 'row-reverse' in Arabic to achieve the correct right-to-left layout.
  const flexRow = isRTL ? (I18nManager.isRTL ? 'row' : 'row-reverse') : (I18nManager.isRTL ? 'row-reverse' : 'row');
  const flexStart = isRTL ? (I18nManager.isRTL ? 'flex-start' : 'flex-end') : (I18nManager.isRTL ? 'flex-end' : 'flex-start');
  const flexEnd = isRTL ? (I18nManager.isRTL ? 'flex-end' : 'flex-start') : (I18nManager.isRTL ? 'flex-start' : 'flex-end');

  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chaletId = Array.isArray(id) ? id[0] : id;

  const { data: response, isLoading, refetch } = useGetOwnerChaletDetailsQuery(chaletId as string, { skip: !chaletId });
  const { data: chaletStatsResponse, isLoading: isLoadingStats, refetch: refetchStats } = useGetProviderChaletStatsQuery(chaletId as string, { skip: !chaletId });
  const [deleteChalet] = useDeleteChaletMutation();
  const [updateChalet, { isLoading: isUpdating }] = useUpdateChaletMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadChaletImageMutation();
  const [updateImage] = useUpdateChaletImageMutation();
  const [deleteImage] = useDeleteChaletImageMutation();
  const [setAmenitiesMutation, { isLoading: isLinking }] = useSetChaletAmenitiesMutation();
  const { data: cities } = useGetCitiesQuery();
  const { data: amenityCategories } = useGetAmenityCategoriesQuery();
  const { data: currentAmenities } = useGetChaletAmenitiesQuery(chaletId as string, { skip: !chaletId });

  const chalet = response?.data || (response?.id ? response : null);
  const chaletStats = chaletStatsResponse?.data || chaletStatsResponse || {};
  const chaletSummary = chaletStats.summary || {};

  const [isActive, setIsActive] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  // Modal Refs
  const basicInfoModalRef = useRef<BottomSheetModal>(null);
  const depositModalRef = useRef<BottomSheetModal>(null);
  const capacityModalRef = useRef<BottomSheetModal>(null);
  const amenitiesModalRef = useRef<BottomSheetModal>(null);
  const imagesModalRef = useRef<BottomSheetModal>(null);
  const citySheetRef = useRef<BottomSheetModal>(null);
  const rulesModalRef = useRef<BottomSheetModal>(null);
  const addressModalRef = useRef<BottomSheetModal>(null);

  // Form States
  const [basicForm, setBasicForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    cityId: '',
    cityName: '',
    depositPercentage: '25',
    capacity: '0',
    priceCapacity: '0',
    extraPersonPrice: '0',
    latitude: '',
    longitude: '',
    addressAr: '',
    addressEn: '',
    phone: '',
    whatsapp: '',
    area: '',
    bedrooms: '',
    bathrooms: ''
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  interface RuleItem {
    id: string;
    titleAr: string;
    titleEn?: string;
    descriptionAr: string;
    descriptionEn?: string;
  }

  const [rulesForm, setRulesForm] = useState({
    rules: [] as RuleItem[]
  });

  const [newRule, setNewRule] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
  });

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RuleItem | null>(null);
  const [isUpdatingRules, setIsUpdatingRules] = useState(false);

  useEffect(() => {
    if (chalet) {
      setIsActive(chalet.isActive);
      setBasicForm({
        nameAr: chalet.name?.ar || chalet.name || '',
        nameEn: chalet.name?.en || '',
        descriptionAr: chalet.description?.ar || chalet.description || '',
        descriptionEn: chalet.description?.en || '',
        capacity: chalet.capacity?.toString() || '0',
        priceCapacity: chalet.priceCapacity?.toString() || '0',
        extraPersonPrice: chalet.extraPersonPrice?.toString() || '0',
        cityId: chalet.city?.id || chalet.cityId || '',
        cityName: (isRTL ? chalet.city?.name : (chalet.city?.enName || chalet.city?.name)) || '',
        depositPercentage: chalet.depositPercentage?.toString() || '25',
        phone: chalet.phone || '',
        whatsapp: chalet.whatsapp || '',
        latitude: chalet.latitude?.toString() || '',
        longitude: chalet.longitude?.toString() || '',
        addressAr: chalet.address?.ar || '',
        addressEn: chalet.address?.en || '',
        area: chalet.area?.toString() || '',
        bedrooms: chalet.bedrooms?.toString() || '',
        bathrooms: chalet.bathrooms?.toString() || ''
      });
      setRulesForm({
        rules: chalet.rules ? chalet.rules.map((r: any, idx: number) => {
          const item = Array.isArray(r) ? (r[0] || {}) : r;
          return {
            id: item.id || String(idx),
            titleAr: item.title?.ar || item.title || '',
            titleEn: item.title?.en || '',
            descriptionAr: item.description?.ar || item.description || '',
            descriptionEn: item.description?.en || '',
          };
        }) : []
      });
    }
  }, [chalet]);

  useEffect(() => {
    if (currentAmenities) {
      const amenitiesSource: any = currentAmenities;
      const amenities = Array.isArray(amenitiesSource) ? amenitiesSource : amenitiesSource?.data;
      setSelectedFeatures((amenities || []).map((a: any) => a.featureId || a.amenityId || a.feature?.id || a.amenity?.id).filter(Boolean));
    }
  }, [currentAmenities]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ), []
  );

  const handleUpdateBasic = async () => {
    try {
      const payload: any = {
        name: { ar: basicForm.nameAr, en: basicForm.nameEn || basicForm.nameAr },
        description: { ar: basicForm.descriptionAr, en: basicForm.descriptionEn || basicForm.descriptionAr },
        address: { ar: basicForm.addressAr, en: basicForm.addressEn || basicForm.addressAr },
        phone: basicForm.phone,
        whatsapp: basicForm.whatsapp,
      };
      if (basicForm.cityId) payload.cityId = basicForm.cityId;
      if (basicForm.latitude) payload.latitude = parseFloat(basicForm.latitude);
      if (basicForm.longitude) payload.longitude = parseFloat(basicForm.longitude);
      await updateChalet({ id: chaletId as string, data: payload }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث التفاصيل' : 'Details updated' });
      basicInfoModalRef.current?.dismiss();
      refetch();
      refetchStats();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleUpdateDeposit = async () => {
    try {
      await updateChalet({
        id: chaletId as string,
        data: { depositPercentage: parseFloat(basicForm.depositPercentage) || 0 }
      }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث العربون' : 'Deposit updated' });
      depositModalRef.current?.dismiss();
      refetch();
      refetchStats();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleUpdateCapacity = async () => {
    try {
      const payload = {
        capacity: parseInt(basicForm.capacity) || 0,
        priceCapacity: parseInt(basicForm.priceCapacity) || 0,
        extraPersonPrice: parseFloat(basicForm.extraPersonPrice) || 0,
      };
      await updateChalet({ id: chaletId as string, data: payload }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث السعة' : 'Capacity updated' });
      capacityModalRef.current?.dismiss();
      refetch();
      refetchStats();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleUpdateAmenities = async () => {
    try {
      await setAmenitiesMutation({ chaletId: chaletId as string, data: { featureIds: selectedFeatures } }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم الحفظ' : 'Saved' });
      amenitiesModalRef.current?.dismiss();
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error' });
    }
  };

  const handleUploadImages = async () => {
    try {
      for (const uri of selectedImages) {
        const imageFormData = new FormData();
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        imageFormData.append('image', { uri, name: filename, type });
        await uploadImage({ chaletId: chaletId as string, formData: imageFormData }).unwrap();
      }
      Toast.show({ type: 'success', text1: isRTL ? 'تم الرفع' : 'Uploaded' });
      setSelectedImages([]);
      imagesModalRef.current?.dismiss();
      refetch();
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.data?.message || err?.message || '';
      Toast.show({
        type: 'error',
        text1: isRTL ? 'فشل الرفع' : 'Upload failed',
        text2: errMsg,
      });
    }
  };

  const handleDeleteChaletImage = async (imageId: string) => {
    showConfirm({
      title: isRTL ? 'حذف الصورة' : 'Delete Image',
      message: isRTL ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?',
      type: 'danger',
      confirmLabel: isRTL ? 'حذف' : 'Delete',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        try {
          await deleteImage({ chaletId: chaletId as string, imageId }).unwrap();
          Toast.show({ type: 'success', text1: isRTL ? 'تم الحذف' : 'Deleted' });
          refetch();
        } catch {
          Toast.show({ type: 'error', text1: isRTL ? 'فشل الحذف' : 'Delete failed' });
        }
      }
    });
  };

  const handleSetAsCover = async (imageId: string) => {
    try {
      await updateImage({
        chaletId: chaletId as string,
        imageId,
        data: { isMain: true }
      }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم التحديث' : 'Updated' });
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'فشل التحديث' : 'Update failed' });
    }
  };

  const handleUpdateRules = async () => {
    try {
      const payload = {
        rules: rulesForm.rules.map(r => ({
          title: { ar: r.titleAr, en: r.titleEn || r.titleAr },
          description: { ar: r.descriptionAr, en: r.descriptionEn || r.descriptionAr }
        }))
      };
      await updateChalet({ id: chaletId as string, data: payload }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث الشروط والسياسات' : 'Rules and policies updated' });
      rulesModalRef.current?.dismiss();
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleAddRule = async () => {
    if (!newRule.titleAr.trim() || !newRule.descriptionAr.trim()) {
      Toast.show({ type: 'error', text1: isRTL ? 'تنبيه' : 'Alert', text2: isRTL ? 'يرجى كتابة العنوان والشرح للشرط بالعربية' : 'Please enter the title and description in Arabic', position: 'bottom' });
      return;
    }

    setIsUpdatingRules(true);
    try {
      const newItem: RuleItem = {
        id: Date.now().toString(),
        titleAr: newRule.titleAr.trim(),
        titleEn: newRule.titleEn.trim() || newRule.titleAr.trim(),
        descriptionAr: newRule.descriptionAr.trim(),
        descriptionEn: newRule.descriptionEn.trim() || newRule.descriptionAr.trim(),
      };

      const updatedRules = [...rulesForm.rules, newItem];

      const payload = {
        rules: updatedRules.map(r => ({
          title: { ar: r.titleAr, en: r.titleEn || r.titleAr },
          description: { ar: r.descriptionAr, en: r.descriptionEn || r.descriptionAr }
        }))
      };

      await updateChalet({ id: chaletId as string, data: payload }).unwrap();

      setRulesForm({ rules: updatedRules });
      setNewRule({
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
      });
      Toast.show({ type: 'success', text1: isRTL ? 'تم إضافة الشرط بنجاح' : 'Rule added successfully' });
      refetch();
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: isRTL ? 'فشل إضافة الشرط' : 'Failed to add rule' });
    } finally {
      setIsUpdatingRules(false);
    }
  };

  const handleRemoveRule = (id: string) => {
    showConfirm({
      title: isRTL ? 'تأكيد الحذف' : 'Confirm Delete',
      message: isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا الشرط؟' : 'Are you sure you want to delete this rule?',
      type: 'danger',
      confirmLabel: isRTL ? 'حذف' : 'Delete',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        setIsUpdatingRules(true);
        try {
          const updatedRules = rulesForm.rules.filter(r => r.id !== id);

          const payload = {
            rules: updatedRules.map(r => ({
              title: { ar: r.titleAr, en: r.titleEn || r.titleAr },
              description: { ar: r.descriptionAr, en: r.descriptionEn || r.descriptionAr }
            }))
          };

          await updateChalet({ id: chaletId as string, data: payload }).unwrap();

          setRulesForm({ rules: updatedRules });
          Toast.show({ type: 'success', text1: isRTL ? 'تم حذف الشرط بنجاح' : 'Rule deleted successfully' });
          refetch();
        } catch (err) {
          console.error(err);
          Toast.show({ type: 'error', text1: isRTL ? 'فشل حذف الشرط' : 'Failed to delete rule' });
        } finally {
          setIsUpdatingRules(false);
        }
      }
    });
  };

  const startEditRule = (rule: RuleItem) => {
    setEditingRuleId(rule.id);
    setEditForm({ ...rule });
  };

  const cancelEditRule = () => {
    setEditingRuleId(null);
    setEditForm(null);
  };

  const handleSaveEditRule = async () => {
    if (!editForm || !editForm.titleAr.trim() || !editForm.descriptionAr.trim()) {
      Toast.show({ type: 'error', text1: isRTL ? 'تنبيه' : 'Alert', text2: isRTL ? 'يرجى كتابة العنوان والشرح للشرط بالعربية' : 'Please enter the title and description in Arabic', position: 'bottom' });
      return;
    }

    setIsUpdatingRules(true);
    try {
      const updatedRules = rulesForm.rules.map(r =>
        r.id === editForm.id
          ? {
            ...editForm,
            titleAr: editForm.titleAr.trim(),
            titleEn: editForm.titleEn?.trim() || editForm.titleAr.trim(),
            descriptionAr: editForm.descriptionAr.trim(),
            descriptionEn: editForm.descriptionEn?.trim() || editForm.descriptionAr.trim(),
          }
          : r
      );

      const payload = {
        rules: updatedRules.map(r => ({
          title: { ar: r.titleAr, en: r.titleEn || r.titleAr },
          description: { ar: r.descriptionAr, en: r.descriptionEn || r.descriptionAr }
        }))
      };

      await updateChalet({ id: chaletId as string, data: payload }).unwrap();

      setRulesForm({ rules: updatedRules });
      setEditingRuleId(null);
      setEditForm(null);
      Toast.show({ type: 'success', text1: isRTL ? 'تم تعديل الشرط بنجاح' : 'Rule updated successfully' });
      refetch();
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: isRTL ? 'فشل تعديل الشرط' : 'Failed to update rule' });
    } finally {
      setIsUpdatingRules(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setSelectedImages([...selectedImages, result.assets[0].uri]);
  };

  const handleDelete = () => {
    showConfirm({
      title: isRTL ? 'حذف الشاليه' : 'Delete Chalet',
      message: isRTL ? 'هل أنت متأكد من حذف هذا الشاليه نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to permanently delete this chalet? This action cannot be undone.',
      type: 'danger',
      confirmLabel: isRTL ? 'حذف' : 'Delete',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        try {
          await deleteChalet(chaletId as string).unwrap();
          router.replace('/(tabs)/(dashboard)/home');
        } catch {
          Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'فشل حذف الشاليه' : 'Failed to delete chalet' });
        }
      }
    });
  };
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (chalet) {
      setIsActive(chalet.isActive);
    }
  }, [chalet]);

  const toggleStatus = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(value);
    try {
      await updateChalet({ id: chaletId as string, data: { isActive: value } }).unwrap();
      Toast.show({
        type: 'success',
        text1: value ? (isRTL ? 'الشاليه ظاهر للزبائن' : 'Chalet is visible') : (isRTL ? 'الشاليه مخفي حالياً' : 'Chalet is hidden'),
      });
      refetch();
    } catch {
      setIsActive(!value);
      Toast.show({ type: 'error', text1: isRTL ? 'تعذر تغيير الحالة' : 'Status update failed' });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!chalet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.text.muted }}>
          {isRTL ? 'لم يتم العثور على الشاليه' : 'Chalet not found'}
        </Text>
      </View>
    );
  }

  const chaletName = isRTL ? (chalet.name?.ar || chalet.name) : (chalet.name?.en || chalet.name);
  const chaletLocation = isRTL ? (chalet.address?.ar || chalet.region?.name) : (chalet.address?.en || chalet.region?.enName);
  const chaletDescription = isRTL ? (chalet.description?.ar || chalet.description) : (chalet.description?.en || chalet.description);
  const activeAmenities = chalet?.chaletFeatures || chalet?.chaletAmenities || [];
  const coverImage = chalet?.images?.find((img: any) => img.isMain || img.isCover);
  const heroImages = chalet.images && chalet.images.length > 0
    ? [coverImage, ...chalet.images.filter((img: any) => img.id !== coverImage?.id)].filter(Boolean)
    : [];
  const totalBookings = chaletSummary.totalBookings ?? chalet?.bookingCount ?? 0;
  const totalEarnings = chaletSummary.totalProviderEarnings ?? chaletSummary.totalRevenue ?? chalet?.revenue ?? 0;
  const ratingValue = typeof chalet?.rating === 'string' ? parseFloat(chalet.rating) : (chalet?.rating || 0);
  const completionItems = [
    {
      key: 'photos',
      done: heroImages.length > 0,
      label: isRTL ? 'صور الشاليه' : 'Photos',
      onPress: () => imagesModalRef.current?.present(),
    },
    {
      key: 'price',
      done: Number(chalet?.extraPersonPrice || 0) > 0,
      label: isRTL ? 'سعر الشخص الإضافي' : 'Extra person price',
      onPress: () => capacityModalRef.current?.present(),
    },
    {
      key: 'capacity',
      done: Number(chalet?.capacity || 0) > 0,
      label: isRTL ? 'السعة القصوى' : 'Capacity',
      onPress: () => capacityModalRef.current?.present(),
    },
    {
      key: 'amenities',
      done: activeAmenities.length > 0,
      label: isRTL ? 'المرافق' : 'Amenities',
      onPress: () => amenitiesModalRef.current?.present(),
    },
    {
      key: 'rules',
      done: chalet?.rules && chalet.rules.length > 0,
      label: isRTL ? 'الشروط والقوانين' : 'Rules',
      onPress: () => rulesModalRef.current?.present(),
    }
  ];
  const completedItems = completionItems.filter((item) => item.done).length;
  const completionPercent = Math.round((completedItems / completionItems.length) * 100);
  const isFullyComplete = completionPercent === 100;
  const incompleteItems = completionItems.filter((item) => !item.done);

  const renderSettingsRow = ({
    icon: IconComponent,
    shape,
    label,
    value,
    onPress,
    rightElement,
  }: {
    icon: any;
    shape: "blue" | "green" | "pink" | "red" | "info";
    label: string;
    value?: string | number;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
        style={styles.menuRow}
      >
        <ProfileShape size={normalize.width(36)} type={shape}>
          <IconComponent size={18} color="white" />
        </ProfileShape>
        <View style={[styles.menuLabelContainer, { alignItems: flexStart }]}>
          <Text style={[styles.menuLabelText, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
          {value !== undefined && (
            <Text style={[styles.menuValueText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{value}</Text>
          )}
        </View>
        {rightElement ? (
          rightElement
        ) : onPress ? (
          <View style={{ opacity: 0.5 }}>
            <Svg
              width={10}
              height={14}
              viewBox="0 0 17 24"
              fill="none"
            >
              <Path
                d={isRTL ? EN_BACK_PATH : AR_BACK_PATH}
                fill="#94A3B8"
              />
            </Svg>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        <View style={styles.contentBodyNew}>

          {/* 1. Chalet Profile Card */}
          <TouchableOpacity
            style={[styles.profileCard, { flexDirection: flexRow }]}
            onPress={() => imagesModalRef.current?.present()}
            activeOpacity={0.9}
          >
            <View style={styles.avatarWrap}>
              {heroImages.length > 0 ? (
                <Image source={getImageSrc(heroImages[0].url)} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarInitial}>
                  <SolarGalleryBold size={24} color="white" />
                </View>
              )}
              <View style={styles.editBadge}>
                <SolarPenBold size={12} color="white" />
              </View>
            </View>

            <View style={[styles.profileInfo, { alignItems: flexStart }]}>
              <View style={{ flexDirection: flexRow, alignItems: 'center', gap: 6, width: '100%' }}>
                <Text style={[styles.profileChaletName, { textAlign: isRTL ? 'right' : 'left', flexShrink: 1 }]} numberOfLines={1}>
                  {chaletName || ''}
                </Text>
                {!isActive && (
                  <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: normalize.font(9), fontFamily: 'Alexandria-Bold', color: '#6B7280' }}>
                      {isRTL ? 'مخفي' : 'Hidden'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.profileLocationRow, { flexDirection: flexRow, alignItems: 'center', gap: 4 }]}>
                <SolarMapPointBold size={14} color="#64748B" />
                <Text style={[styles.profileLocationText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                  {chaletLocation || ''}
                </Text>
              </View>
              <View style={[styles.profileBadgesRow, { flexDirection: flexRow, alignItems: 'center', gap: 8, marginTop: 8 }]}>
                {!isActive && (
                  <View style={[styles.approvalBadgeMini, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.approvalTextMini, { color: '#6B7280' }]}>
                      {isRTL ? 'مخفي للزبائن' : 'Hidden for guests'}
                    </Text>
                  </View>
                )}
                <View style={[styles.approvalBadgeMini, { backgroundColor: chalet?.isApproved ? '#ECFDF5' : '#FFFBEB' }]}>
                  <Text style={[styles.approvalTextMini, { color: chalet?.isApproved ? '#10B981' : '#F59E0B' }]}>
                    {chalet?.isApproved ? (isRTL ? 'نشط ومقبول' : 'Approved') : (isRTL ? 'قيد المراجعة' : 'Pending')}
                  </Text>
                </View>
                <View style={styles.ratingBadgeMini}>
                  <SolarStarBold size={12} color="#F59E0B" />
                  <Text style={styles.ratingTextMini}>{ratingValue.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Pending approval warning */}
          {!chalet?.isApproved && (
            <View style={[styles.warningNoticeCard, { flexDirection: flexRow }]}>
              <SolarShieldWarningBold size={20} color="#D97706" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 2, alignItems: flexStart }}>
                <Text style={[styles.warningNoticeTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'بانتظار موافقة الإدارة' : 'Pending Admin Approval'}
                </Text>
                <Text style={[styles.warningNoticeText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL
                    ? 'الشاليه الخاص بك قيد المراجعة حالياً من قبل الإدارة. يرجى إكمال كافة التفاصيل والصور المتبقية لضمان قبول أسرع للظهور.'
                    : 'Your chalet is currently being reviewed by admin. Please complete all details and photos to ensure faster approval.'
                  }
                </Text>
              </View>
            </View>
          )}

          {/* 3. Performance Stats Bar */}
          <View style={[styles.performanceStatsCard, { flexDirection: flexRow }]}>
            <View style={styles.perfStatItem}>
              <Text style={styles.perfStatValue}>
                {isLoadingStats ? '...' : Number(totalEarnings || 0).toLocaleString()}
                <Text style={styles.perfCurrency}> {isRTL ? 'د.ع' : 'IQD'}</Text>
              </Text>
              <Text style={styles.perfStatLabel}>{isRTL ? 'الأرباح' : 'Revenue'}</Text>
            </View>
            <View style={styles.perfStatDivider} />
            <View style={styles.perfStatItem}>
              <Text style={styles.perfStatValue}>{isLoadingStats ? '...' : totalBookings}</Text>
              <Text style={styles.perfStatLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
            </View>
            <View style={styles.perfStatDivider} />
            <View style={styles.perfStatItem}>
              <View style={[styles.perfRatingRow, { flexDirection: flexRow }]}>
                <SolarStarBold size={14} color="#F59E0B" />
                <Text style={styles.perfStatValue}>{ratingValue.toFixed(1)}</Text>
              </View>
              <Text style={styles.perfStatLabel}>{isRTL ? 'التقييم' : 'Rating'}</Text>
            </View>
          </View>

          {/* 4. Listing Readiness Card — hidden when fully complete */}
          {!isFullyComplete && (
            <View style={styles.readinessCardNew}>
              <View style={[styles.readinessHeaderNew, { flexDirection: flexRow }]}>
                <View style={{ flex: 1, alignItems: flexStart }}>
                  <Text style={[styles.readinessTitleNew, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'متطلبات الجاهزية' : 'Setup Requirements'}
                  </Text>
                  <Text style={[styles.readinessSubtitleNew, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL
                      ? `أكمل ${incompleteItems.length} متطلبات لتفعيل الشاليه`
                      : `Complete ${incompleteItems.length} items to activate your chalet`}
                  </Text>
                </View>
                <View style={styles.readinessScoreNew}>
                  <Text style={styles.readinessScoreTextNew}>{completedItems}/{completionItems.length}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBgNew}>
                <View style={[styles.progressBarFillNew, {
                  width: `${completionPercent}%`,
                  backgroundColor: completionPercent >= 80 ? '#10B981' : completionPercent >= 50 ? '#F59E0B' : '#EF4444'
                }]} />
              </View>

              {/* Only show incomplete items as actionable badges */}
              <View style={[styles.pillsContainerNew, { flexDirection: flexRow }]}>
                {incompleteItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={item.onPress}
                    style={[styles.readinessPillTodoAction, { flexDirection: flexRow }]}
                  >
                    <SolarCloseCircleBold size={13} color="#EF4444" />
                    <Text style={styles.readinessPillTextTodoAction}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ──── Settings Group 1 ──── */}
          <Text style={[styles.settingsGroupTitle, { textAlign: isRTL ? 'right' : 'left', alignSelf: flexStart }]}>
            {isRTL ? 'معلومات وتفاصيل المكان' : 'Space Details & Info'}
          </Text>
          <View style={styles.menuGroup}>
            {renderSettingsRow({
              icon: SolarNotebookBold,
              shape: 'blue',
              label: isRTL ? 'التفاصيل الأساسية' : 'Basic Details',
              value: isRTL ? 'الاسم، الوصف، معلومات التواصل' : 'Name, description, contact details',
              onPress: () => basicInfoModalRef.current?.present()
            })}
            {renderSettingsRow({
              icon: SolarUsersGroupBold,
              shape: 'green',
              label: isRTL ? 'السعة والتسعير الإضافي' : 'Capacity & Extra Pricing',
              value: isRTL
                ? `سعة الشاليه: ${basicForm.capacity} شخص • سعة المبلغ: ${basicForm.priceCapacity} • الإضافي: ${Number(basicForm.extraPersonPrice || 0).toLocaleString()} د.ع`
                : `Max Capacity: ${basicForm.capacity} • Included: ${basicForm.priceCapacity} • Extra: ${Number(basicForm.extraPersonPrice || 0).toLocaleString()} IQD`,
              onPress: () => capacityModalRef.current?.present()
            })}
            {renderSettingsRow({
              icon: SolarBanknoteBold,
              shape: 'pink',
              label: isRTL ? 'نسبة العربون لتأكيد الحجز' : 'Deposit percentage',
              value: isRTL ? `المطلوب دفع ${basicForm.depositPercentage}% من القيمة الكلية` : `Required ${basicForm.depositPercentage}% deposit for booking`,
              onPress: () => depositModalRef.current?.present()
            })}

            {renderSettingsRow({
              icon: SolarClockCircleBold,
              shape: 'info',
              label: isRTL ? 'إدارة الفترات (Shifts) والأسعار اليومية' : 'Manage Shifts & Pricing',
              value: isRTL ? 'تعديل أوقات الدخول والخروج وأسعار أيام الأسبوع' : 'Edit check-in/out times & weekday pricing',
              onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({
                  pathname: '/(tabs)/(dashboard)/shifts',
                  params: { id: chaletId as string }
                });
              }
            })}
          </View>

          {/* ──── Location Map Card ──── */}
          <Text style={[styles.settingsGroupTitle, { textAlign: isRTL ? 'right' : 'left', alignSelf: flexStart }]}>
            {isRTL ? 'موقع الشاليه' : 'Chalet Location'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLocationPickerVisible(true)}
            style={styles.locationMapCard}
          >
            {basicForm.latitude && basicForm.longitude ? (
              <>
                <View style={styles.locationMapContainer}>
                  <AppMap
                    style={styles.locationMapPreview}
                    centerCoordinate={[parseFloat(basicForm.longitude), parseFloat(basicForm.latitude)]}
                    zoomLevel={14}
                    interactive={false}
                    showMarker={true}
                  />
                  {/* Edit overlay */}
                  <View style={styles.locationMapOverlay}>
                    <View style={styles.locationEditBadge}>
                      <SolarPenBold size={14} color="white" />
                      <Text style={styles.locationEditText}>
                        {isRTL ? 'تعديل الموقع' : 'Edit Location'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.locationInfoBar, { flexDirection: flexRow }]}>
                  <View style={[styles.locationInfoLeft, { flexDirection: flexRow, alignItems: 'center' }]}>
                    <SolarMapPointBold size={16} color={Colors.primary} />
                    <View style={{ marginHorizontal: 8, flex: 1 }}>
                      <Text style={[styles.locationCoordsText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {Number(basicForm.latitude).toFixed(5)}, {Number(basicForm.longitude).toFixed(5)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.locationEmptyState}>
                <SolarMapPointBold size={36} color={Colors.text.muted} />
                <Text style={styles.locationEmptyTitle}>
                  {isRTL ? 'لم يتم تحديد الموقع بعد' : 'No location set'}
                </Text>
                <Text style={styles.locationEmptySubtitle}>
                  {isRTL ? 'اضغط هنا لتحديد موقع الشاليه على الخريطة' : 'Tap here to pin your chalet on the map'}
                </Text>
                <View style={styles.locationSetButton}>
                  <SolarMapPointBold size={16} color="white" />
                  <Text style={styles.locationSetButtonText}>
                    {isRTL ? 'تحديد الموقع' : 'Set Location'}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {renderSettingsRow({
            icon: SolarPenBold,
            shape: 'blue',
            label: isRTL ? 'العنوان والمدينة' : 'Address & City',
            value: basicForm.addressAr || (isRTL ? 'لم يتم تعيين العنوان' : 'Address not set'),
            onPress: () => addressModalRef.current?.present()
          })}

          {/* ──── Settings Group 2 ──── */}
          <Text style={[styles.settingsGroupTitle, { textAlign: isRTL ? 'right' : 'left', alignSelf: flexStart }]}>
            {isRTL ? 'معرض الصور والمرافق' : 'Media & Content'}
          </Text>
          <View style={styles.menuGroup}>
            {renderSettingsRow({
              icon: SolarGalleryBold,
              shape: 'blue',
              label: isRTL ? 'صور الشاليه والغطاء' : 'Chalet Photos',
              value: isRTL ? `إجمالي ${heroImages.length} صور مضافة حالياً` : `${heroImages.length} total photos uploaded`,
              onPress: () => imagesModalRef.current?.present()
            })}
            {renderSettingsRow({
              icon: SolarStarBold,
              shape: 'pink',
              label: isRTL ? 'المرافق والخدمات المتاحة' : 'Amenities & Services',
              value: isRTL ? `مجموع ${activeAmenities.length} مرافق مفعّلة في الصفحة` : `${activeAmenities.length} active amenities configured`,
              onPress: () => amenitiesModalRef.current?.present()
            })}
            {renderSettingsRow({
              icon: SolarNotebookBold,
              shape: 'blue',
              label: isRTL ? 'الشروط وقوانين الإقامة' : 'Rules & Policies',
              value: isRTL ? `عدد ${rulesForm.rules.length} قواعد وشروط مضافة` : `${rulesForm.rules.length} chalet rules defined`,
              onPress: () => rulesModalRef.current?.present()
            })}
          </View>

          {/* ──── Visibility Status ──── */}
          <Text style={[styles.settingsGroupTitle, { textAlign: isRTL ? 'right' : 'left', alignSelf: flexStart }]}>
            {isRTL ? 'حالة ظهور الشاليه' : 'Chalet Visibility'}
          </Text>
          <View style={styles.menuGroup}>
            {renderSettingsRow({
              icon: SolarEyeBold,
              shape: isActive ? 'green' : 'info',
              label: isRTL ? 'تفعيل ظهور الشاليه للزبائن' : 'Chalet Visibility',
              value: isActive
                ? (isRTL ? 'الشاليه مفعّل ويظهر في نتائج البحث والريستات' : 'Chalet is active and visible in search')
                : (isRTL ? 'الشاليه مخفي ولا يمكن للزبائن حجزه حالياً' : 'Chalet is hidden and bookings are paused'),
              rightElement: (
                <Switch
                  value={isActive}
                  onValueChange={toggleStatus}
                  trackColor={{ false: '#D1D5DB', true: Colors.primary + '40' }}
                  thumbColor={isActive ? Colors.primary : '#9CA3AF'}
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              )
            })}
          </View>

          {/* Danger Zone Group */}
          <Text style={[styles.settingsGroupTitle, { color: '#EF4444', textAlign: isRTL ? 'right' : 'left', alignSelf: flexStart }]}>
            {isRTL ? 'إجراءات خطرة' : 'Danger Zone'}
          </Text>
          <View style={styles.menuGroup}>
            {renderSettingsRow({
              icon: SolarTrashBinBold,
              shape: 'red',
              label: isRTL ? 'حذف هذا الشاليه نهائياً' : 'Delete Chalet Permanently',
              value: isRTL ? 'سيتم مسح كافة البيانات والصور نهائياً ولا يمكن التراجع' : 'This action cannot be undone and deletes all chalet details',
              onPress: handleDelete
            })}
          </View>

          {/* Back Button Footer Spacer */}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>


      {/* ─── Address & City Modal ─── */}
      <BottomSheetModal
        ref={addressModalRef}
        index={0}
        snapPoints={['65%']}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 36 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.modalScrollContent, { direction: isRTL ? 'rtl' : 'ltr' }]}>
          <Text style={styles.modalTitle}>{isRTL ? 'العنوان والمدينة' : 'Address & City'}</Text>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'العنوان بالعربية' : 'Address (Arabic)'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'مثال: أربيل - عينكاوا' : 'e.g. Erbil - Ainkawa'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.addressAr}
              onChangeText={(val) => setBasicForm({ ...basicForm, addressAr: val })}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'العنوان بالإنجليزية' : 'Address (English)'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'Erbil - Ainkawa' : 'e.g. Erbil - Ainkawa'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.addressEn}
              onChangeText={(val) => setBasicForm({ ...basicForm, addressEn: val })}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المدينة' : 'City'}</Text>
            <TouchableOpacity
              style={[styles.modalInput, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              activeOpacity={0.7}
              onPress={() => citySheetRef.current?.present()}
            >
              <Text style={{ fontSize: normalize.font(13), fontFamily: 'Alexandria-Medium', color: basicForm.cityName ? Colors.text.primary : '#C0C7D0', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                {basicForm.cityName || (isRTL ? 'اختر المدينة' : 'Select City')}
              </Text>
              <SolarMapPointBold size={16} color={basicForm.cityName ? Colors.primary : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          <PrimaryButton
            label={isRTL ? 'حفظ العنوان والمدينة' : 'Save Address & City'}
            onPress={async () => {
              if (!basicForm.addressAr.trim()) {
                Toast.show({ type: 'error', text1: isRTL ? 'يرجى إدخال العنوان بالعربية' : 'Please enter the Arabic address' });
                return;
              }
              try {
                const payload: any = {
                  address: {
                    ar: basicForm.addressAr.trim(),
                    en: basicForm.addressEn.trim() || basicForm.addressAr.trim()
                  }
                };
                if (basicForm.cityId) payload.cityId = basicForm.cityId;
                await updateChalet({ id: chaletId as string, data: payload }).unwrap();
                Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث العنوان بنجاح' : 'Address updated successfully' });
                addressModalRef.current?.dismiss();
                refetch();
              } catch {
                Toast.show({ type: 'error', text1: isRTL ? 'فشل تحديث العنوان' : 'Failed to update address' });
              }
            }}
            loading={isUpdating}
            style={{ marginTop: 20 }}
          />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ─── Modals ─── */}

      {/* 1. Basic Info Modal */}
      <BottomSheetModal
        ref={basicInfoModalRef}
        index={0}
        snapPoints={['90%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.modalScrollContent, { direction: isRTL ? 'rtl' : 'ltr' }]}>
          <Text style={styles.modalTitle}>{isRTL ? 'المعلومات الأساسية' : 'Basic Information'}</Text>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'اسم الشاليه (عربي)' : 'Name (AR)'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'أدخل اسم الشاليه بالعربية' : 'Enter chalet name in Arabic'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.nameAr}
              onChangeText={(val) => setBasicForm({ ...basicForm, nameAr: val })}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'اسم الشاليه (English)' : 'Name (EN)'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'Enter chalet name in English' : 'Enter chalet name in English'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.nameEn}
              onChangeText={(val) => setBasicForm({ ...basicForm, nameEn: val })}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'وصف الشاليه (عربي)' : 'Description (AR)'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, styles.modalTextArea, { textAlign: isRTL ? 'right' : 'left' }]}
              multiline
              numberOfLines={4}
              placeholder={isRTL ? 'أدخل وصف الشاليه بالعربية...' : 'Enter chalet description in Arabic...'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.descriptionAr}
              onChangeText={(val) => setBasicForm({ ...basicForm, descriptionAr: val })}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'وصف الشاليه (English)' : 'Description (EN)'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, styles.modalTextArea, { textAlign: isRTL ? 'right' : 'left' }]}
              multiline
              numberOfLines={4}
              placeholder={isRTL ? 'Enter chalet description in English...' : 'Enter chalet description in English...'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.descriptionEn}
              onChangeText={(val) => setBasicForm({ ...basicForm, descriptionEn: val })}
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'رقم الهاتف' : 'Phone'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              keyboardType="phone-pad"
              placeholder={isRTL ? 'مثال: 07xxxxxxxxx' : 'e.g. 07xxxxxxxxx'}
              placeholderTextColor="#C0C7D0"
              value={basicForm.phone}
              onChangeText={(val) => setBasicForm({ ...basicForm, phone: val })}
            />
          </View>

          <PrimaryButton label={isRTL ? 'حفظ المعلومات' : 'Save Info'} onPress={handleUpdateBasic} loading={isUpdating} style={{ marginTop: 20 }} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 2. Deposit Modal */}
      <BottomSheetModal
        ref={depositModalRef}
        index={0}
        snapPoints={['40%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetView style={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'نسبة العربون' : 'Deposit Percentage'}</Text>
          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'نسبة العربون %' : 'Deposit %'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: 'center' }]}
              keyboardType="numeric"
              value={basicForm.depositPercentage}
              onChangeText={(val) => setBasicForm({ ...basicForm, depositPercentage: val })}
            />
          </View>
          <PrimaryButton label={isRTL ? 'حفظ النسبة' : 'Save Percentage'} onPress={handleUpdateDeposit} loading={isUpdating} />
        </BottomSheetView>
      </BottomSheetModal>

      {/* 3. Capacity Modal */}
      <BottomSheetModal
        ref={capacityModalRef}
        index={0}
        snapPoints={['55%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.modalScrollContent, { direction: isRTL ? 'rtl' : 'ltr' }]}>
          <Text style={styles.modalTitle}>{isRTL ? 'السعة والتسعير الإضافي' : 'Capacity & Extra Pricing'}</Text>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'السعة وإعدادات الزيادة' : 'Capacity & Pricing'}</Text>
            <View style={styles.capacityListInline}>
              <View style={[styles.capacityCardInline, { flexDirection: 'row' }]}>
                <GuestCounter value={parseInt(basicForm.capacity) || 0} onIncrement={() => setBasicForm({ ...basicForm, capacity: (parseInt(basicForm.capacity) + 1).toString() })} onDecrement={() => setBasicForm({ ...basicForm, capacity: Math.max(0, parseInt(basicForm.capacity) - 1).toString() })} />
                <Text style={styles.capacityLabelInline}>{isRTL ? 'سعة الشاليه (الحد الأقصى للزيادة)' : 'Chalet Capacity'}</Text>
              </View>
              <View style={[styles.capacityCardInline, { flexDirection: 'row' }]}>
                <GuestCounter value={parseInt(basicForm.priceCapacity) || 0} onIncrement={() => setBasicForm({ ...basicForm, priceCapacity: (parseInt(basicForm.priceCapacity) + 1).toString() })} onDecrement={() => setBasicForm({ ...basicForm, priceCapacity: Math.max(0, parseInt(basicForm.priceCapacity) - 1).toString() })} />
                <Text style={styles.capacityLabelInline}>{isRTL ? 'سعة المبلغ (العدد المشمول بالسعر)' : 'Price Capacity'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'سعر الشخص الإضافي' : 'Extra Person Price'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              keyboardType="numeric"
              value={basicForm.extraPersonPrice}
              onChangeText={(val) => setBasicForm({ ...basicForm, extraPersonPrice: val })}
            />
          </View>

          <PrimaryButton label={isRTL ? 'حفظ السعة' : 'Save Capacity'} onPress={handleUpdateCapacity} loading={isUpdating} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 2. Amenities Modal */}
      <AmenitiesModal
        ref={amenitiesModalRef}
        chaletId={chaletId as string}
        chalet={chalet}
        refetchChalet={refetch}
      />

      {/* 3. Images Modal */}
      <BottomSheetModal
        ref={imagesModalRef}
        index={0}
        snapPoints={['85%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.modalScrollContent, { direction: isRTL ? 'rtl' : 'ltr' }]}>
          <Text style={styles.modalTitle}>{isRTL ? 'إدارة الصور' : 'Manage Images'}</Text>

          {/* Existing Images Section */}
          <Text style={[styles.modalSubTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'الصور الحالية' : 'Current Images'}
          </Text>
          <View style={styles.imagesUploadGrid}>
            {chalet?.images?.map((img: any) => (
              <View key={img.id} style={styles.uploadImageItem}>
                <Image source={{ uri: getImageSrc(img.url).uri }} style={styles.uploadImage} />

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.removeUploadBtn}
                  onPress={() => handleDeleteChaletImage(img.id)}
                >
                  <SolarTrashBinBold size={18} color={Colors.error} />
                </TouchableOpacity>

                {/* Cover Indicator/Toggle */}
                <TouchableOpacity
                  style={[
                    styles.coverIndicator,
                    (img.isMain || img.isCover) && { backgroundColor: Colors.primary }
                  ]}
                  onPress={() => !(img.isMain || img.isCover) && handleSetAsCover(img.id)}
                >
                  {(img.isMain || img.isCover) ? (
                    <SolarCheckCircleBold size={14} color="white" />
                  ) : (
                    <SolarStarBold size={14} color={Colors.text.muted} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={[styles.rowDivider, { marginVertical: 24 }]} />

          {/* New Images Section */}
          <Text style={[styles.modalSubTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'إضافة صور جديدة' : 'Add New Photos'}
          </Text>
          <View style={styles.imagesUploadGrid}>
            {selectedImages.map((uri, idx) => (
              <View key={idx} style={styles.uploadImageItem}>
                <Image source={{ uri }} style={styles.uploadImage} />
                <TouchableOpacity style={styles.removeUploadBtn} onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}>
                  <SolarCloseCircleBold size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotosBtn} onPress={pickImage}>
              <SolarCameraAddBold size={30} color={Colors.text.muted} />
              <Text style={styles.addPhotosText}>{isRTL ? 'إضافة' : 'Add'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotosBtn} onPress={takePhoto}>
              <SolarCameraAddBold size={30} color={Colors.text.muted} />
              <Text style={styles.addPhotosText}>{isRTL ? 'كاميرا' : 'Camera'}</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            label={isRTL ? 'رفع الصور المختارة' : 'Upload Selected Photos'}
            onPress={handleUploadImages}
            loading={isUploading}
            disabled={selectedImages.length === 0}
            style={{ marginTop: 24 }}
          />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 6. Chalet Rules & Policies Modal */}
      <BottomSheetModal
        ref={rulesModalRef}
        index={0}
        snapPoints={['90%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.modalScrollContent, { direction: isRTL ? 'rtl' : 'ltr', paddingBottom: 60 }]}>
          <View style={[styles.modalHeaderRow, { flexDirection: flexRow, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }]}>
            <Text style={styles.modalTitle}>{isRTL ? 'الشروط وقوانين الشاليه' : 'Chalet Rules & Policies'}</Text>
            {isUpdatingRules && <ActivityIndicator size="small" color={Colors.primary} style={{ marginHorizontal: 8 }} />}
          </View>

          {/* Section: Chalet Rules Points */}
          <Text style={styles.modalSectionHeading}>{isRTL ? 'شروط الشاليه (نقاط)' : 'Chalet Rules (Points)'}</Text>

          {/* Current Rules List */}
          {rulesForm.rules.length > 0 ? (
            <View style={styles.modalRulesList}>
              {rulesForm.rules.map((rule, index) => {
                if (editingRuleId === rule.id && editForm) {
                  return (
                    <View key={rule.id} style={styles.modalRuleEditCard}>
                      <Text style={styles.editCardTitle}>{isRTL ? 'تعديل الشرط' : 'Edit Rule'}</Text>

                      {/* Arabic Inputs */}
                      <View style={styles.modalInputGroup}>
                        <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'العنوان بالعربية *' : 'Title (AR) *'}</Text>
                        <BottomSheetTextInput
                          style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                          value={editForm.titleAr}
                          onChangeText={(val) => setEditForm({ ...editForm, titleAr: val })}
                        />
                      </View>

                      <View style={styles.modalInputGroup}>
                        <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الشرح بالعربية *' : 'Description (AR) *'}</Text>
                        <BottomSheetTextInput
                          style={[styles.modalRuleTextArea, { textAlign: isRTL ? 'right' : 'left', minHeight: 60 }]}
                          multiline
                          value={editForm.descriptionAr}
                          onChangeText={(val) => setEditForm({ ...editForm, descriptionAr: val })}
                        />
                      </View>

                      {/* English Inputs */}
                      <View style={styles.modalInputGroup}>
                        <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'العنوان بالإنجليزية' : 'Title (EN)'}</Text>
                        <BottomSheetTextInput
                          style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                          value={editForm.titleEn}
                          onChangeText={(val) => setEditForm({ ...editForm, titleEn: val })}
                        />
                      </View>

                      <View style={styles.modalInputGroup}>
                        <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الشرح بالإنجليزية' : 'Description (EN)'}</Text>
                        <BottomSheetTextInput
                          style={[styles.modalRuleTextArea, { textAlign: isRTL ? 'right' : 'left', minHeight: 60 }]}
                          multiline
                          value={editForm.descriptionEn}
                          onChangeText={(val) => setEditForm({ ...editForm, descriptionEn: val })}
                        />
                      </View>

                      {/* Action buttons */}
                      <View style={[styles.editActionRow, { flexDirection: flexRow }]}>
                        <TouchableOpacity
                          onPress={handleSaveEditRule}
                          disabled={isUpdatingRules}
                          style={[styles.editActionBtn, styles.editSaveBtn, { flexDirection: flexRow }]}
                        >
                          <SolarCheckCircleBold size={18} color={Colors.white} />
                          <Text style={styles.editActionText}>{isRTL ? 'حفظ' : 'Save'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={cancelEditRule}
                          disabled={isUpdatingRules}
                          style={[styles.editActionBtn, styles.editCancelBtn, { flexDirection: flexRow }]}
                        >
                          <SolarCloseCircleBold size={18} color="#4B5563" />
                          <Text style={[styles.editActionText, { color: '#4B5563' }]}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={rule.id} style={[styles.modalRuleCard, { padding: 10, marginBottom: 8 }]}>
                    <View style={[styles.ruleCardHeader, { flexDirection: flexRow, justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 0 }]}>
                      <View style={[styles.ruleInfoCol, { flexDirection: flexRow, alignItems: 'center', flex: 1, gap: 10 }]}>
                        <View style={styles.modalRuleNumber}>
                          <Text style={styles.modalRuleNumberText}>{index + 1}</Text>
                        </View>

                        <View style={[styles.modalRuleText, { flex: 1, alignItems: flexStart }]}>
                          <Text style={[styles.modalRuleTitle, { textAlign: isRTL ? 'right' : 'left', fontSize: 13, marginBottom: 2 }]}>
                            {isRTL ? rule.titleAr : (rule.titleEn || rule.titleAr)}
                          </Text>
                          <Text style={[styles.modalRuleDesc, { textAlign: isRTL ? 'right' : 'left', fontSize: 11, color: '#4B5563' }]}>
                            {isRTL ? rule.descriptionAr : (rule.descriptionEn || rule.descriptionAr)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.ruleCardActions, { flexDirection: flexRow, gap: 8, marginStart: 8 }]}>
                        <TouchableOpacity onPress={() => startEditRule(rule)} style={[styles.modalRuleEdit, { padding: 4 }]}>
                          <SolarPenBold size={16} color={Colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleRemoveRule(rule.id)} style={[styles.modalRuleDelete, { padding: 4 }]}>
                          <SolarTrashBinBold size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.modalNoRulesText}>
              {isRTL ? 'لا توجد شروط مضافة حالياً. أضف شرطاً بالأسفل.' : 'No rules added yet. Add a rule below.'}
            </Text>
          )}

          <View style={styles.modalDivider} />

          {/* Add New Rule Form */}
          <Text style={styles.modalRuleSubTitle}>{isRTL ? 'إضافة شرط أو سياسة جديدة' : 'Add New Rule or Policy'}</Text>

          {/* Arabic Inputs Section */}
          <View style={styles.formLangSection}>
            <View style={[styles.langBadge, { marginBottom: 8, alignSelf: flexStart }]}><Text style={styles.langBadgeText}>العربية (Arabic)</Text></View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'عنوان الشرط بالعربية *' : 'Rule Title (AR) *'}</Text>
              <BottomSheetTextInput
                style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={isRTL ? "مثال: منع التدخين" : "e.g. No smoking"}
                value={newRule.titleAr}
                onChangeText={(val) => setNewRule({ ...newRule, titleAr: val })}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'شرح الشرط بالعربية *' : 'Rule Description (AR) *'}</Text>
              <BottomSheetTextInput
                style={[styles.modalRuleTextArea, { textAlign: isRTL ? 'right' : 'left', minHeight: 65 }]}
                multiline
                placeholder={isRTL ? "مثال: يمنع التدخين تماماً داخل الغرف." : "e.g. Smoking is strictly prohibited inside."}
                value={newRule.descriptionAr}
                onChangeText={(val) => setNewRule({ ...newRule, descriptionAr: val })}
              />
            </View>
          </View>

          {/* English Inputs Section */}
          <View style={[styles.formLangSection, { marginTop: 12 }]}>
            <View style={[styles.langBadge, { backgroundColor: '#F1F5F9', marginBottom: 8, alignSelf: flexStart }]}><Text style={[styles.langBadgeText, { color: '#64748B' }]}>الإنجليزية (English)</Text></View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'عنوان الشرط بالإنجليزية (اختياري)' : 'Rule Title (EN) (Optional)'}</Text>
              <BottomSheetTextInput
                style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={isRTL ? "مثال: No smoking" : "e.g. No smoking"}
                value={newRule.titleEn}
                onChangeText={(val) => setNewRule({ ...newRule, titleEn: val })}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'شرح الشرط بالإنجليزية (اختياري)' : 'Rule Description (EN) (Optional)'}</Text>
              <BottomSheetTextInput
                style={[styles.modalRuleTextArea, { textAlign: isRTL ? 'right' : 'left', minHeight: 65 }]}
                multiline
                placeholder={isRTL ? "مثال: Smoking is strictly prohibited inside." : "e.g. Smoking is strictly prohibited inside."}
                value={newRule.descriptionEn}
                onChangeText={(val) => setNewRule({ ...newRule, descriptionEn: val })}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAddRule}
            disabled={isUpdatingRules}
            style={[styles.modalAddRuleBtn, { flexDirection: flexRow, opacity: isUpdatingRules ? 0.7 : 1, marginTop: 16 }]}
          >
            {isUpdatingRules ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <SolarAddSquareBold size={20} color={Colors.white} />
            )}
            <Text style={styles.modalAddRuleBtnText}>
              {isUpdatingRules
                ? (isRTL ? 'جاري إضافة الشرط أو السياسة...' : 'Adding Rule or Policy...')
                : (isRTL ? 'إضافة الشرط أو السياسة' : 'Add Rule or Policy')}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* City Picker Modal */}
      <BottomSheetModal
        ref={citySheetRef}
        index={0}
        snapPoints={['70%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetView style={{ padding: 20, flex: 1 }}>
          <Text style={styles.modalTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</Text>
          <BottomSheetFlatList
            data={cities}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity
                style={styles.cityPickerItem}
                onPress={() => {
                  setBasicForm({ ...basicForm, cityId: item.id, cityName: item.name?.ar || item.name });
                  citySheetRef.current?.dismiss();
                }}
              >
                <Text style={[styles.cityPickerText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name?.ar || item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        initialLocation={
          basicForm.latitude && basicForm.longitude
            ? { latitude: parseFloat(basicForm.latitude), longitude: parseFloat(basicForm.longitude) }
            : undefined
        }
        onSelect={async (lat, lng) => {
          try {
            setBasicForm(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
            await updateChalet({
              id: chaletId as string,
              data: { latitude: lat, longitude: lng }
            }).unwrap();
            Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث الموقع بنجاح' : 'Location updated successfully' });
            refetch();
          } catch {
            Toast.show({ type: 'error', text1: isRTL ? 'فشل تحديث الموقع' : 'Failed to update location' });
          }
        }}
      />
    </View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  flatHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  flatHeaderContent: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  flatHeaderTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
  },
  flatDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  scrollContent: {
    paddingHorizontal: normalize.width(16),
    paddingTop: normalize.height(8),
    paddingBottom: 40,
  },
  contentBodyNew: {
    gap: 12,
  },
  // 1. Profile Card Styles
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(20),
    padding: normalize.width(12),
    marginBottom: normalize.height(16),
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  profileImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    position: 'relative',
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    flex: 1,
    marginHorizontal: normalize.width(12),
    gap: 4,
  },
  profileChaletName: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: '#374151',
  },
  profileLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileLocationText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Regular",
    color: '#64748B',
    flexShrink: 1,
  },
  profileBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  approvalBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  approvalTextMini: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Bold",
  },
  ratingBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingTextMini: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Bold",
    color: '#D97706',
  },

  // 2. Settings Group Card Styles
  settingsGroupTitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.muted,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  menuGroup: {
    gap: normalize.height(12),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(16),
    paddingVertical: normalize.height(10),
    paddingHorizontal: normalize.width(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuLabelContainer: {
    flex: 1,
    marginHorizontal: normalize.width(12),
    gap: 2,
  },
  menuLabelText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: '#374151',
  },
  menuValueText: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Regular",
    color: Colors.text.muted,
  },
  locationFieldInput: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Regular',
    color: Colors.text.primary,
    paddingVertical: 2,
    paddingHorizontal: 0,
    margin: 0,
  },
  avatarWrap: {
    width: normalize.width(66),
    height: normalize.width(66),
    borderRadius: normalize.width(33),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(33),
  },
  avatarInitial: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(33),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    borderColor: 'white',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Visibility Toggle Card Styles
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusToggleInfo: {
    flex: 1,
    gap: 2,
  },
  statusToggleTitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
  },
  statusToggleDesc: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Regular",
    color: Colors.text.muted,
    lineHeight: 16,
  },

  // Warning Notice Card Styles
  warningNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  warningNoticeTitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: '#B45309',
  },
  warningNoticeText: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Medium",
    color: '#D97706',
    lineHeight: 18,
  },

  // Performance Stats Card Styles
  performanceStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  perfStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  perfStatValue: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
  },
  perfCurrency: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Bold",
    color: Colors.primary,
  },
  perfStatLabel: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.muted,
  },
  perfStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  perfRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Listing Readiness Card Styles
  readinessCardNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  readinessHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  readinessTitleNew: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
  },
  readinessSubtitleNew: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Regular",
    color: Colors.text.muted,
    lineHeight: 14,
  },
  readinessScoreNew: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  readinessScoreTextNew: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Black",
    color: Colors.primary,
  },
  progressBarBgNew: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFillNew: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  pillsContainerNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  readinessPillNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  readinessPillDoneNew: {
    backgroundColor: '#ECFDF5',
  },
  readinessPillTodoNew: {
    backgroundColor: '#F1F5F9',
  },
  readinessPillTextNew: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: '#64748B',
  },
  readinessPillTextDoneNew: {
    color: '#10B981',
    fontFamily: "Alexandria-Bold",
  },
  readinessPillTodoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  readinessPillTextTodoAction: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Bold",
    color: '#DC2626',
  },
  aboutPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  aboutPreviewTitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
  },
  aboutPreviewText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Regular",
    color: Colors.text.muted,
    lineHeight: 20,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  basicFormSection: {
    marginBottom: 20,
  },
  basicFormSectionTitle: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.muted,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  basicFormCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: normalize.font(20),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center'
  },
  modalSubTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    marginBottom: 12
  },
  modalInputGroup: {
    marginBottom: 20
  },
  modalLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.muted,
    marginBottom: 8
  },
  modalInput: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary
  },
  modalTextArea: {
    height: 'auto',
    minHeight: 100,
    paddingTop: 16,
    textAlignVertical: 'top'
  },
  capacityListInline: {
    gap: 10
  },
  capacityCardInline: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  capacityLabelInline: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    flex: 1,
    marginHorizontal: 10
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  amenityItem: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative'
  },
  amenityItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05'
  },
  amenityIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  amenityName: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: 'center'
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    end: -5,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  imagesUploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  uploadImageItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  uploadImage: {
    width: '100%',
    height: '100%'
  },
  coverIndicator: {
    position: 'absolute',
    bottom: 5,
    start: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  removeUploadBtn: {
    position: 'absolute',
    top: 5,
    end: 5,
    backgroundColor: '#fff',
    borderRadius: 10
  },
  addPhotosBtn: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  addPhotosText: {
    fontSize: 12,
    fontFamily: "Alexandria-Bold",
    color: Colors.text.muted,
    marginTop: 4
  },
  cityPickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  cityPickerText: {
    fontSize: 16,
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary
  },
  managementList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  managementBtn: {
    width: '48%',
    marginBottom: 0
  },
  modalSectionHeading: {
    fontSize: 16,
    fontFamily: 'Alexandria-Bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 18
  },
  modalRuleTextArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 14,
    fontFamily: 'Alexandria-Medium',
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  modalRulesList: {
    marginBottom: 10
  },
  modalRuleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 10
  },
  modalRuleNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEBEA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalRuleNumberText: {
    fontSize: 12,
    fontFamily: 'Alexandria-Bold',
    color: '#EF4444'
  },
  modalRuleText: {
    flex: 1,
    alignItems: 'flex-start'
  },
  modalRuleTitle: {
    fontSize: 13,
    fontFamily: 'Alexandria-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  modalRuleDesc: {
    fontSize: 11,
    fontFamily: 'Alexandria-Medium',
    color: '#4B5563',
  },
  modalRuleDelete: {
    padding: 6
  },
  ruleInfoCol: {
    flex: 1,
    gap: 10
  },
  modalNoRulesText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Alexandria-Medium',
    textAlign: 'center',
    marginVertical: 12
  },
  modalRuleSubTitle: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: '#374151',
    marginBottom: 12,
  },
  modalAddRuleBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8
  },
  modalAddRuleBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Alexandria-Bold'
  },
  modalHeaderRow: {
    marginBottom: 8,
  },
  modalRuleEditCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editCardTitle: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  editActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14
  },
  editActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editSaveBtn: {
    backgroundColor: Colors.primary,
  },
  editCancelBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editActionText: {
    fontSize: 12,
    fontFamily: 'Alexandria-Bold',
    color: '#fff',
  },
  ruleCardHeader: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleCardActions: {
    gap: 10,
  },
  modalRuleEdit: {
    padding: 6,
  },
  langBlock: {
    width: '100%',
    marginVertical: 4,
  },
  langBadge: {
    backgroundColor: '#FFEBEA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  langBadgeText: {
    fontSize: 10,
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
  },
  langBlockDivider: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 8,
  },
  addNewRuleHeader: {
    marginBottom: 12,
  },
  formLangSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  // Location Map Card Styles
  locationMapCard: {
    borderRadius: normalize.radius(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  locationMapContainer: {
    height: normalize.height(180),
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: normalize.radius(20),
    borderTopRightRadius: normalize.radius(20),
  },
  locationMapPreview: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: normalize.radius(20),
    borderTopRightRadius: normalize.radius(20),
  },
  locationMapOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  locationEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  locationEditText: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Bold',
    color: 'white',
  },
  locationInfoBar: {
    paddingHorizontal: normalize.width(14),
    paddingVertical: normalize.height(12),
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationInfoLeft: {
    flex: 1,
    gap: 4,
  },
  locationAddressText: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Bold',
    color: '#374151',
  },
  locationCoordsText: {
    fontSize: normalize.font(10),
    fontFamily: 'Alexandria-Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  locationEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize.height(32),
    paddingHorizontal: normalize.width(20),
    gap: 6,
  },
  locationEmptyTitle: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Bold',
    color: '#374151',
    marginTop: 8,
  },
  locationEmptySubtitle: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Regular',
    color: '#94A3B8',
    textAlign: 'center',
  },
  locationSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    marginTop: 12,
  },
  locationSetButtonText: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Bold',
    color: 'white',
  },
  locationTextInputsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(20),
    padding: normalize.width(14),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  locationInputLabel: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Bold',
    color: '#6B7280',
    marginBottom: 6,
  },
  locationTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Regular',
    color: Colors.text.primary,
  },
  locationCityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  locationCityText: {
    flex: 1,
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Medium',
  },
  locationDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(20),
    padding: normalize.width(16),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 14,
  },
  locationDetailField: {
    gap: 6,
  },
  locationDetailLabel: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Bold',
    color: '#6B7280',
    paddingHorizontal: 4,
  },
  locationDetailInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.primary,
  },
});
