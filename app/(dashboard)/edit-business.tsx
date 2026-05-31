import {
    SolarShieldWarningBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import { useGetProviderProfileQuery, useUpdateProviderProfileMutation } from '@/store/api/apiSlice';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    I18nManager,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import { PrimaryButton } from '@/components/user/primary-button';

const zainCashLogo = require('@/assets/zaincash.png');
const qiLogo = require('@/assets/qi.svg');

function validateZainCash(text: string): string | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");
  
  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return "يجب أن يحتوي رقم الهاتف على أرقام فقط";
  }

  const hasIraqiPrefix = clean.startsWith("07") || 
                         clean.startsWith("7") || 
                         clean.startsWith("+9647") || 
                         clean.startsWith("9647") || 
                         clean.startsWith("009647");

  if (!hasIraqiPrefix) {
    return "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+";
  }

  if (clean.startsWith("07") && clean.length !== 11) {
    return "رقم الهاتف يجب أن يكون 11 رقماً";
  } else if (clean.startsWith("7") && clean.length !== 10) {
    return "رقم الهاتف يجب أن يكون 10 أرقام";
  } else if (clean.startsWith("+9647") && clean.length !== 13) {
    return "رقم الهاتف يجب أن يكون 13 رقماً";
  } else if (clean.startsWith("9647") && clean.length !== 12) {
    return "رقم الهاتف يجب أن يكون 12 رقماً";
  } else if (clean.startsWith("009647") && clean.length !== 14) {
    return "رقم الهاتف يجب أن يكون 14 رقماً";
  }

  return null;
}

function validateQiCard(text: string): string | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");
  if (!/^\d{10}$/.test(clean)) {
    return "يجب أن يتكون رقم بطاقة كي من 10 أرقام";
  }
  return null;
}

export default function ProviderProfileScreen() {
  const { isRTL: isArabic, rowDirection } = useDirection();
  const dispatch = useDispatch();
  const router = useRouter();

  const textStart: 'left' | 'right' = isArabic === I18nManager.isRTL ? 'left' : 'right';
  const flexDir: 'row' | 'row-reverse' = rowDirection;

  const { data: profile, isLoading, isError, refetch } = useGetProviderProfileQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProviderProfileMutation();

  const [formData, setFormData] = useState({
    zainCash: '',
    qi: ''
  });

  const [errors, setErrors] = useState<{ zainCash?: string | null; qi?: string | null }>({});

  const profileData = profile?.data || profile;

  useEffect(() => {
    if (profileData) {
      setFormData({
        zainCash: profileData.zainCash || '',
        qi: profileData.qi || ''
      });
    }
  }, [profileData]);

  const handleSave = async () => {
    const zainCashErr = validateZainCash(formData.zainCash);
    const qiErr = validateQiCard(formData.qi);

    if (zainCashErr || qiErr) {
      setErrors({
        zainCash: zainCashErr,
        qi: qiErr
      });
      Toast.show({
        type: 'error',
        text1: isArabic ? 'خطأ في المدخلات' : 'Validation Error',
        text2: isArabic ? 'يرجى تصحيح الأخطاء قبل الحفظ' : 'Please correct the errors before saving',
        position: 'bottom',
      });
      return;
    }

    setErrors({});
    try {
      await updateProfile(formData).unwrap();
      Toast.show({
        type: 'success',
        text1: isArabic ? 'نجاح' : 'Success',
        text2: isArabic ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully',
        position: 'bottom',
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: isArabic ? 'خطأ' : 'Error',
        text2: isArabic ? 'فشل تحديث البيانات' : 'Failed to update profile',
        position: 'bottom',
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderField = (
    label: string,
    value: string,
    key: string,
    imageSource: any,
    placeholder: string,
    error: string | null = null,
    keyboardType: 'default' | 'phone-pad' | 'numeric' = 'phone-pad'
  ) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={[styles.label, { textAlign: textStart }]}>{label}</ThemedText>
      <View style={[
        styles.inputWrapper, 
        error ? { borderColor: '#EF4444' } : null,
        { flexDirection: flexDir }
      ]}>
        {imageSource && (
          <Image 
            source={imageSource} 
            style={{ width: 30, height: 30, borderRadius: 6, resizeMode: 'contain', marginEnd: 8 }} 
          />
        )}
        <TextInput
          style={[styles.input, { textAlign: textStart }]}
          value={value}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [key]: text }));
            if (key === 'zainCash') {
              setErrors(prev => ({ ...prev, zainCash: validateZainCash(text) }));
            } else if (key === 'qi') {
              setErrors(prev => ({ ...prev, qi: validateQiCard(text) }));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          keyboardType={keyboardType}
        />
      </View>
      {error && (
        <ThemedText style={[styles.errorText, { textAlign: textStart }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );

  return (
    <View style={[styles.container]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.warningCard}>
            <View style={[styles.warningHeader, { flexDirection: flexDir }]}>
              <SolarShieldWarningBold size={20} color="#B45309" />
              <ThemedText style={styles.warningTitle}>
                {isArabic ? 'ملاحظة هامة وحساسة' : 'Important & Sensitive Note'}
              </ThemedText>
            </View>
            <ThemedText style={[styles.warningText, { textAlign: textStart }]}>
              {isArabic 
                ? 'يرجى التأكد من صحة رقم زين كاش ورقم بطاقة كي بدقة. أي خطأ في هذه البيانات قد يؤدي إلى فشل تحويل مستحقاتك المالية أو إرسالها إلى حساب آخر.'
                : 'Please verify your Zain Cash and Qi Card numbers carefully. Any incorrect details may lead to payout failures or sending funds to the wrong account.'}
            </ThemedText>
          </View>

          <View style={styles.section}>
            {renderField(
              isArabic ? 'رقم زين كاش' : 'Zain Cash Number',
              formData.zainCash,
              'zainCash',
              zainCashLogo,
              '07xxxxxxxx',
              errors.zainCash,
              'phone-pad'
            )}
            {renderField(
              isArabic ? 'رقم بطاقة كي' : 'Qi Card Number',
              formData.qi,
              'qi',
              qiLogo,
              isArabic ? 'رقم البطاقة المكون من 10 أرقام' : '10-digit card number',
              errors.qi,
              'numeric'
            )}
          </View>

          <PrimaryButton
            label={isArabic ? 'حفظ التعديلات' : 'Save Changes'}
            onPress={handleSave}
            loading={isUpdating}
            disabled={isUpdating}
            height={54}
            style={{ marginTop: 24 }}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white },
  scrollContent: {
    padding: 16,
    paddingBottom: 40 },
  section: {
    marginBottom: 32 },
  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginBottom: 16 },
  fieldContainer: {
    marginBottom: 20 },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary,
    marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52 },
  multilineWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12 },
  input: {
    flex: 1,
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    height: '100%',
   fontFamily: "Alexandria-Medium" },
  multilineInput: {
    textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8 },
  disabledButton: {
    opacity: 0.7 },
  saveButtonText: {
    color: Colors.white,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium" },
  errorText: {
    color: '#EF4444',
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    marginTop: 6 },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8 },
  warningHeader: {
    alignItems: 'center',
    gap: 8 },
  warningTitle: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Bold',
    color: '#B45309' },
  warningText: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Medium',
    color: '#D97706',
    lineHeight: 18 } });
