import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarAltArrowRightBold } from "@/components/icons/solar-icons";
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const MOCK_DATA = {
  today: [
    {
      id: '1',
      title: 'تخفيضات عملاقة',
      message: 'هذا مثال للإشعارات',
      time: '3:06 PM',
      isRead: false
    },
    {
      id: '2',
      title: 'تخفيضات عملاقة',
      message: 'هذا مثال للإشعارات',
      time: '3:06 PM',
      isRead: false
    }
  ],
  yesterday: [
    {
      id: '3',
      title: 'تخفيضات عملاقة',
      message: 'هذا مثال للإشعارات',
      time: '3:06 PM',
      isRead: true
    },
    {
      id: '4',
      title: 'تخفيضات عملاقة',
      message: 'هذا مثال للإشعارات',
      time: '3:06 PM',
      isRead: true
    }
  ]
};

export default function NotificationsScreen() {
    const { language } = useSelector((state: RootState) => state.auth);
    const isRTL = language === 'ar';
    const router = useRouter();

    const renderItem = (item: Notification) => (
        <View key={item.id} style={styles.notificationCard}>
            {/* Header section with orange dot and time */}
            <View style={styles.cardLeft}>
                <View style={styles.orangeDot} />
                <ThemedText style={styles.timeText}>{item.time}</ThemedText>
            </View>

            {/* Content section */}
            <View style={styles.cardContent}>
                <ThemedText style={styles.titleText}>{item.title}</ThemedText>
                <ThemedText style={styles.messageText}>{item.message}</ThemedText>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <ThemedText style={styles.headerTitle}>{isRTL ? 'الاشعارات' : 'Notifications'}</ThemedText>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <SolarAltArrowRightBold size={normalize.width(22)} color="#035DF9" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Today Section */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>{isRTL ? 'اليوم' : 'Today'}</ThemedText>
                </View>
                {MOCK_DATA.today.map(renderItem)}

                {/* Yesterday Section */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>{isRTL ? 'امس' : 'Yesterday'}</ThemedText>
                </View>
                {MOCK_DATA.yesterday.map(renderItem)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'white',
    },
    headerInner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 48,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "LamaSans-Black",
        color: '#111827',
    },
    backButton: {
        position: 'absolute',
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.small,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'flex-end',
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "LamaSans-Bold",
        color: '#9CA3AF', // Gray color as in image
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 24, // Very rounded
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orangeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4500', // Solid orange as in image
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: "LamaSans-SemiBold",
    },
    cardContent: {
        flex: 1,
        alignItems: 'flex-end',
    },
    titleText: {
        fontSize: 16,
        fontFamily: "LamaSans-Black",
        color: '#111827',
    },
    messageText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
     fontFamily: "LamaSans-Regular" }
});
