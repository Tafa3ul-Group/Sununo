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
    View,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { isRTL } from "@/i18n";

export default function ProviderProfileScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
    const router = useRouter();

  const { data: profile, isLoading, isError, refetch } = useGetProviderProfileQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProviderProfileMutation();

  const [formData, setFormData] = useState({
    bankName: '',
    bankAccountNo: '',
    iban: '' });

  const profileData = profile?.data || profile;

  useEffect(() => {
    if (profileData) {
      setFormData({
        bankName: profileData.bankName || '',
        bankAccountNo: profileData.bankAccountNo || '',
        iban: profileData.iban || '' });
    }
  }, [profileData, isRTL]);

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
      <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</ThemedText>
      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper, { flexDirection: 'row-reverse' }]}>
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
          <View style={styles.section}>
            {/* Redundant title removed */}
            {renderField(
              isRTL ? 'اسم البنك' : 'Bank Name',
              formData.bankName,
              'bankName',
              SolarBanknoteBold,
              isRTL ? 'اسم المصرف' : 'Bank name'
            )}
            {renderField(
              isRTL ? 'رقم الحساب' : 'Account Number',
              formData.bankAccountNo,
              'bankAccountNo',
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
    fontFamily: "Alexandria-Medium" } });
