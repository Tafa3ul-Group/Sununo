import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { 
  SolarMenuDotsBold, 
  SolarPenBold, 
  SolarMapPointBold,
  SolarAltArrowLeftLinear,
  SolarAltArrowRightLinear
} from "@/components/icons/solar-icons";
import { PrimaryButton } from '@/components/user/primary-button';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [name, setName] = useState(user?.name || (isRTL ? 'انسة انس' : 'Ansi Ans'));
  const [birthDate, setBirthDate] = useState('2000-04-21');
  const [phone, setPhone] = useState(user?.phone || '07735409876');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          {isRTL ? (
            <SolarAltArrowRightLinear size={24} color="#6B7280" />
          ) : (
            <SolarAltArrowLeftLinear size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        <ThemedText style={styles.headerTitle}>{t('headers.profile')}</ThemedText>

        <View style={styles.logoCircle}>
          <Image 
            source={isRTL ? require('@/assets/arlogo.svg') : require('@/assets/logo.svg')} 
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.avatarImg} 
            />
            <TouchableOpacity style={[styles.editIconBadge, { [isRTL ? 'right' : 'left']: 5 }]}>
              <SolarPenBold size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* الاسم الكامل */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.fullName')}</ThemedText>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* تاريخ الميلاد */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('profile.edit.birthDate')}</ThemedText>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={birthDate}
                onChangeText={setBirthDate}
              />
            </View>
          </View>

          {/* رقم الهاتف */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.phone')}</ThemedText>
            <View style={[styles.phoneInputRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
               <TextInput 
                style={[styles.phoneInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
               <TouchableOpacity style={styles.changePhoneBtn}>
                  <ThemedText style={styles.changePhoneText}>{t('profile.edit.changePhone')}</ThemedText>
               </TouchableOpacity>
            </View>
          </View>

          {/* موقعك */}
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('common.location')}</ThemedText>
            <View style={styles.mapCard}>
              <Image 
                source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png' }} 
                style={styles.mapImage} 
              />
              <View style={styles.mapPinOverlay}>
                 <SolarMapPointBold size={32} color="#035DF9" />
              </View>
              <View style={[styles.mapFooter, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                 <TouchableOpacity>
                   <ThemedText style={styles.changeLocText}>{t('common.edit') || t('booking.edit')}</ThemedText>
                 </TouchableOpacity>
                 <ThemedText style={styles.locNameText}>
                   {isRTL ? 'البصرة - ابي الخصيب' : 'Basra - Abu Al-Khaseeb'}
                 </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={styles.footer}>
        <PrimaryButton 
          label={t('profile.edit.confirm')} 
          onPress={() => router.back()} 
          style={styles.submitBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Alexandria-Black",
    color: '#111827',
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '70%',
    height: '70%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F3F4F6',
    padding: 2,
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#035DF9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  form: {
    marginTop: 10,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontFamily: "Alexandria-Bold",
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    fontFamily: "Alexandria-SemiBold",
    color: '#9CA3AF',
    flex: 1,
  },
  phoneInputRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 56,
    overflow: 'hidden',
    alignItems: 'center',
  },
  changePhoneBtn: {
    backgroundColor: '#035DF9',
    height: '100%',
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhoneText: {
    color: 'white',
    fontSize: 12,
    fontFamily: "Alexandria-Black",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Alexandria-SemiBold",
    color: '#9CA3AF',
    paddingHorizontal: 16,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    paddingBottom: 15,
  },
  mapImage: {
    width: '100%',
    height: 150,
  },
  mapPinOverlay: {
    position: 'absolute',
    top: 60,
    left: '46%',
  },
  mapFooter: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  changeLocText: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
    color: '#035DF9',
  },
  locNameText: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: 'transparent',
  },
  submitBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
  }
});
