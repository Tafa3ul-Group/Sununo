import React from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { useGetChaletTermsQuery, useGetChaletPoliciesQuery } from "@/store/api/customerApiSlice";
import { 
  SolarKeyBold, 
  SolarForbiddenBold, 
  SolarShieldCheckBold 
} from "@/components/icons/solar-icons";

export default function ChaletInfoScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'terms' | 'policies' }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  const { data: terms, isLoading: isTermsLoading } = useGetChaletTermsQuery(id, { skip: type !== 'terms' });
  const { data: policiesData, isLoading: isPoliciesLoading } = useGetChaletPoliciesQuery(id, { skip: type !== 'policies' });

  const isLoading = isTermsLoading || isPoliciesLoading;
  const title = type === 'terms' ? t('booking.terms') : t('booking.policy');
  const Icon = type === 'terms' ? SolarKeyBold : SolarForbiddenBold;

  const getContent = () => {
    if (type === 'terms') {
      const val = isRTL ? (terms?.ar || terms) : (terms?.en || terms);
      return typeof val === 'string' ? val : (val?.ar || val?.en || '');
    } else {
      const p = policiesData?.policies;
      const cp = policiesData?.cancellationPolicy;
      const policiesText = isRTL ? (p?.ar || p) : (p?.en || p);
      const cancelText = isRTL ? (cp?.ar || cp) : (cp?.en || cp);
      
      const pStr = typeof policiesText === 'string' ? policiesText : (policiesText?.ar || policiesText?.en || '');
      const cStr = typeof cancelText === 'string' ? cancelText : (cancelText?.ar || cancelText?.en || '');

      return (
        <View>
          <ThemedText style={styles.sectionTitle}>{isRTL ? "سياسات عامة" : "General Policies"}</ThemedText>
          <ThemedText style={styles.content}>{pStr || t('common.noData')}</ThemedText>
          
          <View style={styles.divider} />
          
          <ThemedText style={styles.sectionTitle}>{isRTL ? "سياسة الإلغاء" : "Cancellation Policy"}</ThemedText>
          <ThemedText style={styles.content}>{cStr || t('common.noData')}</ThemedText>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: title,
          headerTitleStyle: { fontFamily: 'Alexandria-Black', fontSize: 18 },
          headerLeft: () => <CircleBackButton onPress={() => router.back()} />,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerIconContainer}>
          <View style={styles.iconCircle}>
            <Icon size={40} color="white" />
          </View>
          <ThemedText style={styles.pageTitle}>{title}</ThemedText>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.card}>
            {typeof getContent() === 'string' ? (
               <ThemedText style={styles.content}>{getContent() || t('common.noData')}</ThemedText>
            ) : (
              getContent()
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    boxShadow: {
      offsetX: 0,
      offsetY: 10,
      blurRadius: 15,
      color: 'rgba(43, 102, 255, 0.3)', // Colors.primary with 0.3 opacity
    },
    elevation: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Alexandria-Black',
    color: '#111827',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    boxShadow: {
      offsetX: 0,
      offsetY: 2,
      blurRadius: 10,
      color: 'rgba(0, 0, 0, 0.05)',
    },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Alexandria-Black',
    color: Colors.primary,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: 'Alexandria-Medium',
    textAlign: 'justify',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  }
});
