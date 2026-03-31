import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGetProviderProfileQuery, useUpdateProviderProfileMutation } from '@/store/api/apiSlice';
import { Colors, Spacing, Typography, normalize } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { HeaderSection } from '@/components/header-section';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderProfileScreen() {
  const { t, i18n } = useTranslation();
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

  const renderField = (label: string, value: string, key: string, icon: string, placeholder: string, multiline = false) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, { textAlign: isRTL ? 'right' : 'left' }]}
          value={value}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          multiline={multiline}
        />
        <MaterialCommunityIcons name={icon as any} size={20} color={Colors.text.muted} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection 
        userType="owner"
        title={isRTL ? 'معلومات العمل والمصرف' : 'Business & Bank Info'}
        showSearch={false}
        showCategories={false}
        showBackButton={true}
      />

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
              'store-outline',
              isRTL ? 'أدخل اسم عملك' : 'Enter business name'
            )}
            {renderField(
              isRTL ? 'العنوان' : 'Address',
              formData.address,
              'address',
              'map-marker-outline',
              isRTL ? 'العنوان الفعلي' : 'Physical address'
            )}
            {renderField(
              isRTL ? 'الوصف' : 'Description',
              formData.business_description,
              'business_description',
              'text-box-outline',
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
              'bank-outline',
              isRTL ? 'اسم المصرف' : 'Bank name'
            )}
            {renderField(
              isRTL ? 'رقم الحساب' : 'Account Number',
              formData.account_number,
              'account_number',
              'numeric',
              '1234567890'
            )}
            {renderField(
              isRTL ? 'IBAN (اختياري)' : 'IBAN (Optional)',
              formData.iban,
              'iban',
              'barcode',
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
    </SafeAreaView>
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
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'right',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: normalize.font(14),
    fontWeight: '600',
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
  },
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: normalize.font(16),
    fontWeight: '700',
  },
});
