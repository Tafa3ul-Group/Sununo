import { SolarCheckCircleBold, SolarCloseCircleBold, SolarMenuDotsBold, SolarNotebookBold, SolarShieldWarningBold, SolarSmartHomeBold, SolarTextBold } from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { useGetOwnerChaletDetailsQuery, useUpdateChaletMutation } from '@/store/api/apiSlice';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function EditChaletDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data: response, isLoading: isLoadingDetails, refetch } = useGetOwnerChaletDetailsQuery(id);
  const chalet = response?.data || response;

  const [updateChalet, { isLoading: isUpdating }] = useUpdateChaletMutation();

  const [form, setForm] = useState({
    policiesAr: '',
    policiesEn: '',
    termsAr: '',
    termsEn: '',
    cancellationAr: '',
    cancellationEn: '',
    checkInTime: '',
    checkOutTime: '',
  });

  useEffect(() => {
    if (chalet) {
      setForm({
        policiesAr: chalet.policies?.ar || '',
        policiesEn: chalet.policies?.en || '',
        termsAr: chalet.terms?.ar || '',
        termsEn: chalet.terms?.en || '',
        cancellationAr: chalet.cancellationPolicy?.ar || '',
        cancellationEn: chalet.cancellationPolicy?.en || '',
        checkInTime: chalet.checkInTime || '',
        checkOutTime: chalet.checkOutTime || '',
      });
    }
  }, [chalet]);

  const handleSave = async () => {
    try {
      const payload = {
        policies: { ar: form.policiesAr, en: form.policiesEn || form.policiesAr },
        terms: { ar: form.termsAr, en: form.termsEn || form.termsAr },
        cancellationPolicy: { ar: form.cancellationAr, en: form.cancellationEn || form.cancellationAr },
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
      };

      await updateChalet({ id, data: payload }).unwrap();
      Toast.show({
        type: 'success',
        text1: isRTL ? 'تم الحفظ' : 'Saved',
        text2: isRTL ? 'تم تحديث التفاصيل بنجاح' : 'Details updated successfully',
        position: 'bottom',
      });
      refetch();
      router.back();
    } catch (error: any) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل تحديث البيانات' : 'Failed to update');
    }
  };

  if (isLoadingDetails) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerInfo}>
            <SolarNotebookBold size={40} color={Colors.primary} />
            <ThemedText style={styles.headerTitle}>
              {isRTL ? 'تفاصيل ومعلومات الشاليه' : 'Chalet Details & Info'}
            </ThemedText>
            <ThemedText style={styles.headerSub}>
              {isRTL 
                ? 'أدخل السياسات والشروط والتعليمات بدقة لضمان وضوح التجربة للمستأجر' 
                : 'Enter policies, terms, and instructions precisely to ensure a clear experience for the renter'}
            </ThemedText>
          </View>

          {/* Section: Terms */}
          <View style={styles.sectionCard}>
            <View style={[styles.sectionTitleRow, { flexDirection }]}>
              <View style={styles.iconBox}>
                <SolarShieldWarningBold size={20} color={Colors.white} />
              </View>
              <ThemedText style={styles.sectionTitle}>{isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}</ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { textAlign }]}>{isRTL ? 'الشروط (بالعربية)' : 'Terms (AR)'}</ThemedText>
              <TextInput
                style={[styles.textArea, { textAlign }]}
                multiline
                placeholder={isRTL ? "مثال: يمنع التدخين، يمنع إدخال الحيوانات..." : "e.g. No smoking, no pets..."}
                value={form.termsAr}
                onChangeText={(val) => setForm({ ...form, termsAr: val })}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { textAlign }]}>{isRTL ? 'الشروط (بالإنجليزية)' : 'Terms (EN)'}</ThemedText>
              <TextInput
                style={[styles.textArea, { textAlign: 'left' }]}
                multiline
                placeholder="English translation of terms..."
                value={form.termsEn}
                onChangeText={(val) => setForm({ ...form, termsEn: val })}
              />
            </View>
          </View>

          {/* Section: General Policies */}
          <View style={styles.sectionCard}>
            <View style={[styles.sectionTitleRow, { flexDirection }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10B981' }]}>
                <SolarNotebookBold size={20} color={Colors.white} />
              </View>
              <ThemedText style={styles.sectionTitle}>{isRTL ? 'السياسات العامة' : 'General Policies'}</ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { textAlign }]}>{isRTL ? 'السياسة (بالعربية)' : 'Policy (AR)'}</ThemedText>
              <TextInput
                style={[styles.textArea, { textAlign }]}
                multiline
                placeholder={isRTL ? "أدخل سياسة الحجز والتعامل..." : "Enter booking and usage policy..."}
                value={form.policiesAr}
                onChangeText={(val) => setForm({ ...form, policiesAr: val })}
              />
            </View>
          </View>

          {/* Section: Cancellation Policy */}
          <View style={styles.sectionCard}>
            <View style={[styles.sectionTitleRow, { flexDirection }]}>
              <View style={[styles.iconBox, { backgroundColor: '#EF4444' }]}>
                <SolarCloseCircleBold size={20} color={Colors.white} />
              </View>
              <ThemedText style={styles.sectionTitle}>{isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy'}</ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { textAlign }]}>{isRTL ? 'سياسة الإلغاء (بالعربية)' : 'Cancellation (AR)'}</ThemedText>
              <TextInput
                style={[styles.textArea, { textAlign }]}
                multiline
                placeholder={isRTL ? "مثال: لا يسترد المبلغ في حال الإلغاء قبل يومين..." : "e.g. No refund if cancelled 2 days before..."}
                value={form.cancellationAr}
                onChangeText={(val) => setForm({ ...form, cancellationAr: val })}
              />
            </View>
          </View>

          {/* Section: Check-in/Out Times */}
          <View style={styles.sectionCard}>
            <View style={[styles.sectionTitleRow, { flexDirection }]}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B' }]}>
                <SolarSmartHomeBold size={20} color={Colors.white} />
              </View>
              <ThemedText style={styles.sectionTitle}>{isRTL ? 'أوقات الدخول والخروج' : 'Check-in & Out'}</ThemedText>
            </View>
            
            <View style={[styles.row, { flexDirection }]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={[styles.label, { textAlign }]}>{isRTL ? 'وقت الدخول' : 'Check-in'}</ThemedText>
                <TextInput
                  style={[styles.input, { textAlign: 'center' }]}
                  placeholder="08:00 AM"
                  value={form.checkInTime}
                  onChangeText={(val) => setForm({ ...form, checkInTime: val })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                <ThemedText style={[styles.label, { textAlign }]}>{isRTL ? 'وقت الخروج' : 'Check-out'}</ThemedText>
                <TextInput
                  style={[styles.input, { textAlign: 'center' }]}
                  placeholder="08:00 PM"
                  value={form.checkOutTime}
                  onChangeText={(val) => setForm({ ...form, checkOutTime: val })}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isRTL ? 'حفظ التفاصيل' : 'Save Details'}
            onPress={handleSave}
            loading={isUpdating}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFCFE',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: normalize.font(20),
    fontFamily: 'Alexandria-Black',
    color: Colors.text.primary,
    marginTop: 12,
  },
  headerSub: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(24),
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitleRow: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: normalize.font(16),
    fontFamily: 'Alexandria-Black',
    color: Colors.text.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Bold',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.primary,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
});
