import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { MotionIcon } from '@/components/icons/motion-icons';
import { StatusModal } from '@/components/ui/status-modal';

export default function DemoMotionsScreen() {
  const [modalType, setModalType] = useState<'loading' | 'success' | 'failed' | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'استعراض الحركات', headerShown: true }} />
      
      <ThemedText style={styles.sectionTitle}>الحركات المتوفرة</ThemedText>
      
      <View style={styles.grid}>
        <View style={styles.item}>
           <MotionIcon name="splash" size={150} />
           <ThemedText style={styles.itemLabel}>Splash</ThemedText>
        </View>
        
        <View style={styles.item}>
           <MotionIcon name="loading" size={120} />
           <ThemedText style={styles.itemLabel}>Loading</ThemedText>
        </View>

        <View style={styles.item}>
           <MotionIcon name="success" size={150} loop={false} />
           <ThemedText style={styles.itemLabel}>Success</ThemedText>
        </View>

        <View style={styles.item}>
           <MotionIcon name="failed" size={150} loop={false} />
           <ThemedText style={styles.itemLabel}>Failed</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.sectionTitle}>اختبار النوافذ (Modals)</ThemedText>
      
      <TouchableOpacity style={styles.btn} onPress={() => {
        setModalType('loading');
        setTimeout(() => setModalType(null), 3000);
      }}>
        <ThemedText style={styles.btnText}>تشغيل Loading Modal (3 ثواني)</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => setModalType('success')}>
        <ThemedText style={styles.btnText}>تشغيل Success Modal</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => setModalType('failed')}>
        <ThemedText style={styles.btnText}>تشغيل Failed Modal</ThemedText>
      </TouchableOpacity>

      <StatusModal 
        visible={modalType !== null}
        type={modalType || 'loading'}
        title={modalType === 'success' ? "عملية ناجحة" : modalType === 'failed' ? "فشل التنفيذ" : "جاري المعالجة..."}
        message={modalType === 'success' ? "تمت العملية بنجاح تام." : modalType === 'failed' ? "عذراً، حدث خطأ ما يرجى المحاولة لاحقاً." : "يرجى الانتظار قليلاً..."}
        onClose={() => setModalType(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    alignSelf: 'flex-end',
    marginTop: 30,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  item: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 24,
    alignItems: 'center',
    width: '45%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  itemLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  btn: {
    backgroundColor: '#035DF9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
