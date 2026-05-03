import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { SolarNotesBoldDuotone } from "@/components/icons/solar-icons";
import { HeaderSection } from "@/components/header-section";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function ChaletDescriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: chalet, isLoading } = useGetCustomerChaletDetailsQuery(id);

  const title = t('chalet.details.overview');
  const description = isRTL
    ? chalet?.description?.ar || chalet?.descriptionAr || chalet?.description || ""
    : chalet?.description?.en || chalet?.descriptionEn || chalet?.description || "";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <HeaderSection 
        title={title} 
        showBackButton={true} 
        onBackPress={() => router.back()}
        showLogo={false} 
        userType={userType} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerIconContainer}>
          <View style={styles.iconCircle}>
            <SolarNotesBoldDuotone size={40} color="white" />
          </View>
          <ThemedText style={styles.pageTitle}>{title}</ThemedText>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.card}>
            <ThemedText style={[styles.content, { textAlign: isRTL ? 'right' : 'left' }]}>
              {description || (isRTL ? "لا يوجد وصف متوفر" : "No description available")}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
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
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: 'Alexandria-Medium',
  },
});
