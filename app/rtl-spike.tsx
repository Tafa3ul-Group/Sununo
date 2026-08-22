// RTL verification screen (Phase 0 spike). DEV-ONLY — the export below is
// swapped for a redirect in release builds, so the route stays unreachable in
// production while remaining available as the on-device RTL oracle.
// Open via deep link: /rtl-spike  (e.g. exp://.../rtl-spike or the dev menu).
//
// It proves the Option-C assumptions on a REAL device, both iOS & Android:
//   1. Does `direction:'rtl'` on a container flip `flexDirection:'row'`?
//   2. Do LOGICAL edges (start / marginStart) follow the container direction?
//   3. Do PHYSICAL edges (left / marginLeft) stay physical (we set
//      swapLeftAndRightInRTL(false), so they should NOT swap)?
//   4. textAlign 'auto' vs explicit 'left'/'right'.
//   5. Does a @gorhom bottom-sheet (portal) inherit the app direction?
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useRef } from 'react';
import { I18nManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { changeLanguage, useDirection } from '@/i18n';

const Box = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.box, { backgroundColor: color }]}>
    <Text style={styles.boxText}>{label}</Text>
  </View>
);

function Panel({ dir }: { dir: 'rtl' | 'ltr' }) {
  return (
    <View style={[styles.panel, { direction: dir }]}>
      <Text style={styles.panelTitle}>container direction = {dir}</Text>

      <Text style={styles.caption}>{"1) flexDirection:'row' → [1][2][3]"}</Text>
      <View style={styles.row}>
        <Box label="1" color="#2B66FF" />
        <Box label="2" color="#15AB64" />
        <Box label="3" color="#F97316" />
      </View>

      <Text style={styles.caption}>2) logical: marginStart:24 (should hug the START edge)</Text>
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: '#7C3AED', marginStart: 24 }]}>
          <Text style={styles.boxText}>mS</Text>
        </View>
      </View>

      <Text style={styles.caption}>3) physical: marginLeft:24 (should stay LEFT)</Text>
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: '#DC2626', marginLeft: 24 }]}>
          <Text style={styles.boxText}>mL</Text>
        </View>
      </View>

      <Text style={styles.caption}>4) absolute start:0 vs left:0</Text>
      <View style={styles.absHost}>
        <View style={[styles.tag, { start: 0, backgroundColor: '#0EA5E9' }]}>
          <Text style={styles.boxText}>start</Text>
        </View>
        <View style={[styles.tag, { left: 0, top: 30, backgroundColor: '#64748B' }]}>
          <Text style={styles.boxText}>left</Text>
        </View>
      </View>

      <Text style={styles.caption}>5) textAlign</Text>
      <Text style={[styles.sample, { textAlign: 'auto' }]}>auto: نص عربي / english</Text>
      <Text style={[styles.sample, { textAlign: 'left' }]}>left: نص عربي / english</Text>
      <Text style={[styles.sample, { textAlign: 'right' }]}>right: نص عربي / english</Text>
    </View>
  );
}

function RtlSpikeScreen() {
  const { i18n } = useTranslation();
  const { isRTL, direction } = useDirection();
  const sheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>RTL Spike</Text>
        <Text style={styles.meta}>
          i18n.language = {i18n.language} | useDirection.direction = {direction} | isRTL ={' '}
          {String(isRTL)} | I18nManager.isRTL = {String(I18nManager.isRTL)}
        </Text>
        <Text style={styles.metaWarn}>
          I18nManager.isRTL MUST be false. If true, the one-time native-LTR reload hasn&apos;t landed yet.
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btn} onPress={() => changeLanguage('ar')}>
            <Text style={styles.btnText}>عربي</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => changeLanguage('en')}>
            <Text style={styles.btnText}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => sheetRef.current?.present()}>
            <Text style={styles.btnText}>Open sheet</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          Below: the app root is already direction={direction}. The two panels FORCE rtl/ltr to
          compare. Language buttons must flip layout INSTANTLY with no reload.
        </Text>

        <Panel dir="rtl" />
        <Panel dir="ltr" />
      </ScrollView>

      <BottomSheetModal ref={sheetRef} index={0} snapPoints={['40%']} backdropComponent={renderBackdrop}>
        <BottomSheetView style={styles.sheet}>
          <Text style={styles.caption}>
            Portal test — this sheet has NO explicit direction. Does the row inherit the app
            direction ({direction})? Icon should be on the {isRTL ? 'RIGHT' : 'LEFT'} (start).
          </Text>
          <View style={styles.row}>
            <Box label="A" color="#2B66FF" />
            <Box label="B" color="#15AB64" />
            <Box label="C" color="#F97316" />
          </View>
          <Text style={[styles.sample, { textAlign: 'auto' }]}>نص داخل البورتال — portal text</Text>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// The route file must always export a component, so gate at the export rather
// than deleting the screen: in release builds this bounces to home, which keeps
// the debug surface out of production without losing the diagnostic in dev.
export default __DEV__ ? RtlSpikeScreen : function RtlSpikeDisabled() {
  return <Redirect href="/" />;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, gap: 10 },
  h1: { color: '#fff', fontSize: 22, fontFamily: 'IBMPlexSansArabic-Bold' },
  meta: { color: '#CBD5E1', fontSize: 12 },
  metaWarn: { color: '#FCD34D', fontSize: 12 },
  note: { color: '#94A3B8', fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btn: { backgroundColor: '#2B66FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: '#fff', fontFamily: 'IBMPlexSansArabic-Bold' },
  panel: { backgroundColor: '#1E293B', borderRadius: 14, padding: 12, gap: 8 },
  panelTitle: { color: '#fff', fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 14 },
  caption: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1220', borderRadius: 8, padding: 6 },
  box: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  boxText: { color: '#fff', fontFamily: 'IBMPlexSansArabic-Bold' },
  absHost: { height: 64, backgroundColor: '#0B1220', borderRadius: 8 },
  tag: { position: 'absolute', top: 0, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sample: { color: '#E2E8F0', fontSize: 14, backgroundColor: '#0B1220', padding: 6, borderRadius: 6 },
  sheet: { flex: 1, padding: 16, gap: 10 },
});
