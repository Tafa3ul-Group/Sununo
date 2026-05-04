'use no memo';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { useRegisterProviderMutation } from '@/store/api/apiSlice';
import { LoginHeaderLogo } from '@/components/icons/login-header-logo';
import { CircleBackButton } from '@/components/ui/circle-back-button';
import { normalize } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function JoinAsOwnerScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [registerProvider, { isLoading }] = useRegisterProviderMutation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessNameAr: '',
    businessNameEn: '',
    commercialRegNo: '',
  });

  const handleRegister = async () => {
    if (!formData.name || !formData.phone || !formData.businessNameAr) {
      Alert.alert(t('common.error'), isRTL ? 'يرجى ملء الحقول الأساسية' : 'Please fill all required fields');
      return;
    }

    try {
      await registerProvider({
        phone: formData.phone,
        name: formData.name,
        businessName: {
          ar: formData.businessNameAr,
          en: formData.businessNameEn || formData.businessNameAr,
        },
        commercialRegNo: formData.commercialRegNo,
      }).unwrap();

      Alert.alert(
        isRTL ? 'تم إرسال الطلب' : 'Request Sent',
        isRTL ? 'سنتواصل معك قريباً لتفعيل حسابك وإضافة شاليهك' : 'We will contact you soon to activate your account and add your chalet',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = err?.data?.message;
      const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || "Failed to submit request");
      Alert.alert(t('common.error'), String(displayMsg));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CircleBackButton onPress={() => router.back()} />
        <ThemedText style={styles.headerTitle}>{t('auth.joinAsOwner')}</ThemedText>
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
          <View style={styles.logoContainer}>
             <LoginHeaderLogo size={normalize.width(120)} color="#0061FE" />
          </View>

          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'معلوماتك الشخصية' : 'Personal Information'}
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.fullName')} *</ThemedText>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'ادخل اسمك الكامل' : 'Enter your full name'}
              value={formData.name}
              onChangeText={(val) => setFormData({ ...formData, name: val })}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.phone')} *</ThemedText>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder="077XXXXXXXX"
              value={formData.phone}
              onChangeText={(val) => setFormData({ ...formData, phone: val })}
              keyboardType="phone-pad"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginTop: 20 }]}>
            {isRTL ? 'معلومات الشاليه / الشركة' : 'Chalet / Business Information'}
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'اسم الشاليه (بالعربية) *' : 'Chalet Name (Arabic) *'}</ThemedText>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'مثلاً: شاليه النخيل' : 'e.g. Al Nakheel Chalet'}
              value={formData.businessNameAr}
              onChangeText={(val) => setFormData({ ...formData, businessNameAr: val })}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'اسم الشاليه (بالانجليزية)' : 'Chalet Name (English)'}</ThemedText>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'مثلاً: Al Nakheel Chalet' : 'e.g. Al Nakheel Chalet'}
              value={formData.businessNameEn}
              onChangeText={(val) => setFormData({ ...formData, businessNameEn: val })}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'رقم السجل التجاري (إن وجد)' : 'Commercial Registration (Optional)'}</ThemedText>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder="CR-XXXXXX"
              value={formData.commercialRegNo}
              onChangeText={(val) => setFormData({ ...formData, commercialRegNo: val })}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <PrimaryButton
            label={isRTL ? 'تقديم الطلب' : 'Submit Request'}
            onPress={handleRegister}
            style={styles.submitBtn}
            loading={isLoading}
            activeColor="#0061FE"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Alexandria-Bold',
    color: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Alexandria-Black',
    color: '#1E293B',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Alexandria-Medium',
    color: '#1E293B',
  },
  submitBtn: {
    marginTop: 20,
    width: '100%',
  },
});
