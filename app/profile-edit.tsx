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
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { 
  SolarMenuDotsBold, 
  SolarPenBold, 
  SolarMapPointBold 
} from "@/components/icons/solar-icons";
import { PrimaryButton } from '@/components/user/primary-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileEditScreen() {
  const router = useRouter();
  const [name, setName] = useState('انسة انس');
  const [birthDate, setBirthDate] = useState('2000-04-21');
  const [phone, setPhone] = useState('07735409876');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <SolarMenuDotsBold size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <ThemedText style={styles.headerTitle}>الملف الشخصي</ThemedText>

        <View style={styles.logoCircle}>
          <Image 
            source={require('@/assets/arlogo.svg')} 
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
              source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Mimi' }} 
              style={styles.avatarImg} 
            />
            <TouchableOpacity style={styles.editIconBadge}>
              <SolarPenBold size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* الاسم الكامل */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>الاسم الكامل</ThemedText>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>
          </View>

          {/* تاريخ الميلاد */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>تاريخ الميلاد</ThemedText>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                textAlign="right"
              />
            </View>
          </View>

          {/* رقم الهاتف */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>رقم الهاتف</ThemedText>
            <View style={styles.phoneInputRow}>
               <TextInput 
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
               <TouchableOpacity style={styles.changePhoneBtn}>
                  <ThemedText style={styles.changePhoneText}>تغيير رقم الهاتف</ThemedText>
               </TouchableOpacity>
            </View>
          </View>

          {/* موقعك */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>موقعك</ThemedText>
            <View style={styles.mapCard}>
              <Image 
                source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png' }} 
                style={styles.mapImage} 
              />
              <View style={styles.mapPinOverlay}>
                 <SolarMapPointBold size={32} color="#035DF9" />
              </View>
              <View style={styles.mapFooter}>
                 <TouchableOpacity>
                   <ThemedText style={styles.changeLocText}>تغيير</ThemedText>
                 </TouchableOpacity>
                 <ThemedText style={styles.locNameText}>البصرة -ابة الخصيب</ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={styles.footer}>
        <PrimaryButton 
          label="تاكيد" 
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
    flexDirection: 'row',
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
    fontFamily: "LamaSans-Black",
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
    right: 5,
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
    fontFamily: "LamaSans-Bold",
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
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
    fontFamily: "LamaSans-SemiBold",
    color: '#9CA3AF',
    flex: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
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
    fontSize: 13,
    fontFamily: "LamaSans-Black",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "LamaSans-SemiBold",
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  changeLocText: {
    fontSize: 14,
    fontFamily: "LamaSans-Bold",
    color: '#035DF9',
  },
  locNameText: {
    fontSize: 14,
    fontFamily: "LamaSans-Bold",
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
