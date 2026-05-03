import { HeaderSection } from '@/components/header-section';
import {
    SolarBanknoteBold,
    SolarCardBold,
    SolarMapPointBold,
    SolarPenBold,
    SolarShopBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize } from '@/constants/theme';
import { useGetProviderProfileQuery, useUpdateProviderProfileMutation } from '@/store/api/apiSlice';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

export default function ProviderProfileScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  const { data: profile, isLoading, isError } = useGetProviderProfileQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProviderProfileMutation();

  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    bank_name: '',
    account_number: '',
    iban: '',
    address: '',
  });

  useEffect(() => {
    if (profile?.data) {
      setFormData({
        business_name: profile.data.business_name || '',
        business_description: profile.data.business_description || '',
        bank_name: profile.data.bank_name || '',
        account_number: profile.data.account_number || '',
        iban: profile.data.iban || '',
        address: profile.data.address || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap();
      Alert.alert(
        isRTL ? 'نجاح' : 'Success',
        isRTL ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully'
      );
      router.back();
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث البيانات' : 'Failed to update profile'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderField = (label: string, value: string, key: string, IconComponent: React.ElementType, placeholder: string, multiline = false) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, { textAlign: isRTL ? 'right' : 'left' }]}
          value={value}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          multiline={multiline}
        />
        <IconComponent size={20} color={Colors.text.muted} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{isRTL ? 'معلومات العمل' : 'Business Info'}</ThemedText>
            {renderField(
              isRTL ? 'اسم العمل' : 'Business Name',
              formData.business_name,
              'business_name',
              SolarShopBold,
              isRTL ? 'أدخل اسم عملك' : 'Enter business name'
            )}
            {renderField(
              isRTL ? 'العنوان' : 'Address',
              formData.address,
              'address',
              SolarMapPointBold,
              isRTL ? 'العنوان الفعلي' : 'Physical address'
            )}
            {renderField(
              isRTL ? 'الوصف' : 'Description',
              formData.business_description,
              'business_description',
              SolarPenBold,
              isRTL ? 'وصف مختصر لعملك' : 'Short business description',
              true
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{isRTL ? 'معلومات الحساب المصرفي' : 'Bank Account Info'}</ThemedText>
            {renderField(
              isRTL ? 'اسم البنك' : 'Bank Name',
              formData.bank_name,
              'bank_name',
              SolarBanknoteBold,
              isRTL ? 'اسم المصرف' : 'Bank name'
            )}
            {renderField(
              isRTL ? 'رقم الحساب' : 'Account Number',
              formData.account_number,
              'account_number',
              SolarCardBold,
              '1234567890'
            )}
            {renderField(
              isRTL ? 'IBAN (اختياري)' : 'IBAN (Optional)',
              formData.iban,
              'iban',
              SolarBanknoteBold,
              'IQ00 BANK 0000 ...'
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isUpdating && styles.disabledButton]} 
            onPress={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <ThemedText style={styles.saveButtonText}>{isRTL ? 'حفظ التعديلات' : 'Save Changes'}</ThemedText>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'right',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: Colors.text.secondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  multilineWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: normalize.font(16),
    color: Colors.text.primary,
    height: '100%',
   fontFamily: "Alexandria-Regular" },
  multilineInput: {
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
  },
});
