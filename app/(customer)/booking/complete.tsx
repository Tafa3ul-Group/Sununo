import { HeaderSection } from '@/components/header-section';
import {
    SolarAddCircleBold,
    SolarCardBold,
    SolarMapPointBold,
    SolarMoonBold,
    SolarSunBold
} from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { GuestCounter } from '@/components/user/guest-counter';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { MainTabs, TabType } from '@/components/user/MainTabs';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, isRTL, normalize } from '@/constants/theme';
import { RootState } from '@/store';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetView
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useSelector } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for the chalet to match ChaletCard props
const MOCK_CHALET = {
    id: '1',
    title: "شالية الاروع علةاالطلاق",
    location: "البصرة - الجزائر",
    rating: 4.5,
    price: "30,000",
    detailedLocation: "البصرة - ابي الخصيب",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop"
};

// Helper to generate calendar days for March 2024 (1st is Friday)
const generateMarchDays = () => {
    const days = [];
    const firstDayPadding = 6;
    for (let i = 0; i < firstDayPadding; i++) days.push(null);
    for (let i = 1; i <= 31; i++) days.push(i);
    return days;
};

const ScribbleIcon = () => (
    <View style={styles.scribbleOverlay}>
        <Svg width="27" height="17" viewBox="0 0 27 17" fill="none">
            <Path d="M0 16.3342C2.99573 15.595 6.40062 12.1931 8.87516 10.3499C10.7539 8.95056 12.5344 7.38786 14.3058 5.85133C15.4503 4.82162 19.3351 1.01248 20.5624 0.694205L20.6631 0.77428C20.0331 2.22304 14.0786 6.36758 12.7559 7.86821C11.9412 8.79263 7.05325 13.2599 7.16689 14.3823C8.4238 14.2945 20.3323 4.32336 22.0845 3.05699C22.8235 2.52284 25.1521 0.00923939 26.0467 0C25.8574 0.789872 23.2059 2.65758 22.4706 3.29904C20.984 4.59612 19.5563 5.88203 18.1625 7.28613C15.947 9.51811 13.851 11.1722 12.8732 14.3075C17.2857 12.4915 22.1018 7.57582 25.5124 4.21528C25.6825 4.04772 26.0097 3.8791 26.2404 3.85331L26.2836 3.96158C25.6618 5.40745 23.6597 6.68258 22.4926 7.82798C20.8697 9.42081 19.4171 10.9377 17.8686 12.5976C16.584 13.9747 15.835 14.5322 14.6548 16.1655C17.1806 14.0611 19.7304 11.9904 22.3426 9.9975C23.6692 8.98521 25.5394 7.29498 27 6.61685C26.3425 7.94963 24.3386 10.0783 23.3023 11.287C22.466 12.2624 20.8583 14.7933 20.0165 15.4373C20.7405 13.701 23.3785 10.5202 24.6847 9.04787L24.3797 8.92814C22.5227 10.2836 20.7462 11.839 18.9151 13.2C17.789 14.0368 14.9222 16.7536 13.7398 17L13.6411 16.9076C14.0857 15.7752 16.6737 13.1961 17.661 12.3097L17.6004 11.9123C16.9492 12.4276 16.274 12.9107 15.5771 13.36C14.9133 13.7883 13.7034 14.5621 12.9276 14.3859C11.7642 13.343 15.6221 9.27202 16.3942 8.42632L16.5078 7.99092C16.4879 8.0041 16.468 8.017 16.4482 8.03038C14.9312 9.05922 8.00045 15.1758 6.80779 14.882C6.77373 14.8736 6.7407 14.8611 6.70711 14.8507C6.35217 14.031 8.37052 11.9017 8.9202 11.2266L8.66679 10.9995C7.57776 11.9989 1.29986 17.3668 0 16.3342Z" fill="#334155" />
        </Svg>
    </View>
);

export default function CompleteBookingScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { userType } = useSelector((state: RootState) => state.auth);
    const [activeTab, setActiveTab] = useState<TabType>('SHOOKET');
    const [selectedDates, setSelectedDates] = useState<number[]>([15]);
    const [activeDateIdx, setActiveDateIdx] = useState(0);
    const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');

    // Ref for Success Sheet
    const successSheetRef = React.useRef<BottomSheetModal>(null);

    // Card Details State
    const [cardNum, setCardNum] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');

    const [adultCount, setAdultCount] = useState(2);
    const [childrenCount, setChildrenCount] = useState(1);

    const bookedDates = [2, 3, 4, 8, 9, 10, 11, 12, 31];
    const activeDate = selectedDates[activeDateIdx];

    const calendarDays = useMemo(() => generateMarchDays(), []);
    const dayHeaders = t('booking.days', { returnObjects: true }) as string[];

    const [dayShifts, setDayShifts] = useState<Record<number, { morning: boolean, evening: boolean }>>({
        15: { morning: true, evening: false }
    });

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (activeTab === 'SHOOKET') {
            setActiveTab('MANO');
        } else if (activeTab === 'MANO') {
            setActiveTab('DETAILS');
        } else {
            // We are on DETAILS tab, which now includes the payment form
            successSheetRef.current?.present();
        }
    };

    const toggleDayDate = (day: number) => {
        if (bookedDates.includes(day)) return;
        setSelectedDates(prev => {
            if (prev.includes(day)) {
                const filtered = prev.filter(d => d !== day);
                if (filtered.length > 0) setActiveDateIdx(0);
                return filtered;
            }
            const updated = [...prev, day].sort((a, b) => a - b);
            setActiveDateIdx(updated.indexOf(day));
            return updated;
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const toggleShift = (type: 'morning' | 'evening') => {
        if (!activeDate) return;
        setDayShifts(prev => ({
            ...prev,
            [activeDate]: {
                ...(prev[activeDate] || { morning: false, evening: false }),
                [type]: !(prev[activeDate]?.[type])
            }
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderDetailsTab = () => (
        <View style={styles.detailsContainer}>
            {/* Chalet Card */}
            <HorizontalCard
                chalet={MOCK_CHALET}
                style={styles.chaletCardInstance}
                shapeIndex={2}
                hideFavorite={true}
                onPress={() => { }}
            />

            {/* Map Card */}
            <View style={styles.detailsMapCard}>
                <View style={styles.mapSnippetWrapper}>
                    <ExpoImage source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/47.98,30.50,13,0/600x300?access_token=pk.dummy' }} style={styles.mapSnippet} />
                    <View style={styles.mapMarker}>
                        <SolarMapPointBold size={32} color={Colors.primary} />
                    </View>
                </View>
                <ThemedText style={styles.mapAddressLabel}>{MOCK_CHALET.detailedLocation}</ThemedText>
            </View>

            {/* Customer Information */}
            <View style={styles.infoSectionCard}>
                <ThemedText style={styles.sectionTitle}>{t('booking.customerInfo')}</ThemedText>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('booking.name')}</ThemedText>
                    <ThemedText style={styles.infoValue}>{t('booking.nameValue')}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('booking.phone')}</ThemedText>
                    <ThemedText style={[styles.infoValue, { direction: 'ltr' }]}>{t('booking.phoneValue')}</ThemedText>
                </View>
            </View>

            {/* Booking Information */}
            <View style={styles.infoSectionCard}>
                <View style={[styles.sectionHeaderRow, !isRTL && { flexDirection: 'row' }]}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setActiveTab('SHOOKET')}>
                        <ThemedText style={styles.editBtnText}>{t('booking.edit')}</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.sectionTitle}>{t('booking.bookingInfo')}</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('booking.date')}</ThemedText>
                    <ThemedText style={styles.infoValue}>{t('booking.dateValue')}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('booking.shift')}</ThemedText>
                    <ThemedText style={styles.infoValue}>{t('booking.morningShift')}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('booking.guests')}</ThemedText>
                    <ThemedText style={styles.infoValue}>{t('booking.guestsValue')}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t('booking.totalAmount')}</ThemedText>
                    <ThemedText style={styles.infoValue}>500,000 {t('common.iqd')}</ThemedText>
                </View>
            </View>

            {/* Payment Summary Title */}
            <ThemedText style={styles.paymentMainTitle}>{t('booking.paymentTitle')}</ThemedText>

            {/* Payment Options Row */}
            <TouchableOpacity
                style={[styles.paymentOptionCard, paymentType === 'DEPOSIT' && styles.paymentOptionActive]}
                onPress={() => setPaymentType('DEPOSIT')}
            >
                <ThemedText style={[styles.paymentVal, paymentType === 'DEPOSIT' && styles.paymentValActive]}>50,000 {t('common.iqd')}</ThemedText>
                <ThemedText style={[styles.paymentLabel, paymentType === 'DEPOSIT' && styles.paymentLabelActive]}>{t('booking.depositPay')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.paymentOptionCard, paymentType === 'FULL' && styles.paymentOptionActive]}
                onPress={() => setPaymentType('FULL')}
            >
                <ThemedText style={[styles.paymentVal, paymentType === 'FULL' && styles.paymentValActive]}>500,000 {t('common.iqd')}</ThemedText>
                <ThemedText style={[styles.paymentLabel, paymentType === 'FULL' && styles.paymentLabelActive]}>{t('booking.fullPay')}</ThemedText>
            </TouchableOpacity>

            {/* Agreement Text */}
            <View style={styles.agreementWrapper}>
                <ThemedText style={styles.agreementText}>
                    {t('booking.agreement')} <ThemedText style={styles.agreementLink}>{t('booking.terms')}</ThemedText> {t('common.and')} <ThemedText style={styles.agreementLink}>{t('booking.policy')}</ThemedText>
                </ThemedText>
            </View>

            {/* Inline Card Details (New Addition) */}
            <View style={styles.inlinePaymentSection}>
                <ThemedText style={styles.inlinePaymentTitle}>{t('booking.paymentDetails')}</ThemedText>

                <View style={styles.paymentForm}>
                    {/* Card Number */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>{t('booking.cardNum')}</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            placeholder="**** **** **** ****"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={cardNum}
                            onChangeText={setCardNum}
                        />
                    </View>

                    {/* Row Expiry and CVV */}
                    <View style={[styles.rowInputs, { gap: 15 }]}>
                        <View style={styles.inputGroupFull}>
                            <ThemedText style={styles.inputLabel}>{t('booking.expiry')}</ThemedText>
                            <TextInput
                                style={styles.textInput}
                                placeholder="MM/YYYY"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={expiry}
                                onChangeText={setExpiry}
                            />
                        </View>
                        <View style={styles.inputGroupFixed}>
                            <ThemedText style={styles.inputLabel}>{t('booking.cvv')}</ThemedText>
                            <TextInput
                                style={styles.textInput}
                                placeholder="***"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                value={cvv}
                                onChangeText={setCvv}
                            />
                        </View>
                    </View>

                    {/* Card Holder Name */}
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>{t('booking.cardName')}</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            placeholder={t('booking.enterName')}
                            placeholderTextColor="#94A3B8"
                            value={cardName}
                            onChangeText={setCardName}
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderSuccessSheet = () => (
        <BottomSheetModal
            ref={successSheetRef}
            index={0}
            snapPoints={['50%']}
            backdropComponent={(props) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
            )}
            handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 40 }}
        >
            <BottomSheetView style={styles.successSheetContent}>
                <LottieView
                    source={require('../../../components/icons/motions/success.json')}
                    autoPlay
                    loop={false}
                    style={[styles.lottieIcon, { height: 300 }]}
                    resizeMode="contain"
                />
                <ThemedText style={styles.successTitle}>{t('booking.successTitle') || 'تم الحجز بنجاح!'}</ThemedText>
                <ThemedText style={styles.successSub}>{t('booking.successMsg') || 'لقد تم تأكيد حجزك، يمكنك البدء الآن في متابعة التفاصيل.'}</ThemedText>

                <PrimaryButton
                    label={t('booking.goToDetails') || 'استعراض تفاصيل الحجز'}
                    onPress={() => {
                        successSheetRef.current?.dismiss();
                        router.push('/(tabs)/(customer)/booking-success');
                    }}
                    activeColor="#15AB64"
                    style={styles.successBtn}
                />
            </BottomSheetView>
        </BottomSheetModal>
    );

    const renderPaymentPage = () => (
        <View style={styles.paymentPageContainer}>
            <View style={styles.paymentHeaderInline}>
                <SolarCardBold size={28} color="#1E293B" />
                <ThemedText style={styles.paymentDetailsTitleInline}>{t('booking.paymentDetails')}</ThemedText>
            </View>

            <View style={styles.paymentForm}>
                {/* Card Number */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>{t('booking.cardNum')}</ThemedText>
                    <TextInput
                        style={styles.textInput}
                        placeholder="**** **** **** ****"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={cardNum}
                        onChangeText={setCardNum}
                    />
                </View>

                {/* Row Expiry and CVV */}
                <View style={[styles.rowInputs, { gap: 15 }]}>
                    <View style={styles.inputGroupFull}>
                        <ThemedText style={styles.inputLabel}>{t('booking.expiry')}</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            placeholder="MM/YYYY"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={expiry}
                            onChangeText={setExpiry}
                        />
                    </View>
                    <View style={styles.inputGroupFixed}>
                        <ThemedText style={styles.inputLabel}>{t('booking.cvv')}</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            placeholder="***"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            secureTextEntry
                            maxLength={4}
                            value={cvv}
                            onChangeText={setCvv}
                        />
                    </View>
                </View>

                {/* Card Holder Name */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>{t('booking.cardName')}</ThemedText>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('booking.enterName')}
                        placeholderTextColor="#94A3B8"
                        value={cardName}
                        onChangeText={setCardName}
                    />
                </View>
            </View>
        </View>
    );

    const renderCalendarDay = (day: number | null, index: number) => {
        if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
        const isBooked = bookedDates.includes(day);
        const isSelected = selectedDates.includes(day);

        return (
            <TouchableOpacity
                key={day}
                disabled={isBooked}
                style={[
                    styles.dayCell,
                    isSelected && styles.activeDayCell,
                ]}
                onPress={() => {
                    if (isSelected) setActiveDateIdx(selectedDates.indexOf(day));
                    else toggleDayDate(day);
                }}
            >
                <ThemedText style={[
                    styles.dayText,
                    isSelected && styles.activeDayText,
                    isBooked && styles.bookedDayText
                ]}>
                    {day}
                </ThemedText>
                {isBooked && <ScribbleIcon />}
            </TouchableOpacity>
        );
    };

    return (
        <BottomSheetModalProvider>
            <SafeAreaView style={styles.container}>
                <HeaderSection
                    title={t('headers.bookingComplete')}
                    showBackButton
                    showLogo={false}
                    userType={userType}
                />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.tabsContainer}>
                        <MainTabs activeTab={activeTab} onChange={setActiveTab} />
                    </View>

                    {activeTab === 'SHOOKET' ? (
                        <>
                            <View style={styles.swiperContainer}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.quickDatesRow}
                                >
                                    <TouchableOpacity
                                        style={styles.addDateBtn}
                                        onPress={() => {
                                            const last = selectedDates[selectedDates.length - 1] || 15;
                                            let next = last + 1;
                                            while (bookedDates.includes(next) && next <= 31) next++;
                                            if (next <= 31) toggleDayDate(next);
                                        }}
                                    >
                                        <SolarAddCircleBold size={24} color={Colors.primary} />
                                    </TouchableOpacity>
                                    {selectedDates.map((day, idx) => (
                                        <TouchableOpacity
                                            key={day}
                                            onPress={() => setActiveDateIdx(idx)}
                                            style={[styles.dateBadge, activeDateIdx === idx && styles.dateBadgeActive]}
                                        >
                                            <ThemedText style={[styles.dateBadgeText, activeDateIdx === idx && styles.dateBadgeTextActive]}>{day}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.calendarCard}>
                                <ThemedText style={styles.calendarMonthTitle}>{t('booking.months.march')}</ThemedText>
                                <View style={styles.daysHeader}>
                                    {dayHeaders.map((d, i) => <ThemedText key={`${d}-${i}`} style={styles.dayHeaderCell}>{d}</ThemedText>)}
                                </View>
                                <View style={[styles.daysGrid, !isRTL && { flexDirection: 'row' }]}>
                                    {calendarDays.map((day, index) => renderCalendarDay(day, index))}
                                </View>
                            </View>

                            <View style={styles.shiftsContainer}>
                                <TouchableOpacity
                                    style={[styles.shiftCard, dayShifts[activeDate]?.morning && { backgroundColor: '#F6420008', borderColor: '#F6420033' }]}
                                    onPress={() => toggleShift('morning')}
                                >
                                    <View style={styles.shiftLeft}>
                                        <View style={styles.shiftIconBox}>
                                            <SolarSunBold size={24} color={dayShifts[activeDate]?.morning ? "#F64200" : "#94A3B8"} />
                                        </View>
                                        <ThemedText style={styles.shiftTitle}>{t('booking.morningShift')}</ThemedText>
                                    </View>
                                    <ThemedText style={styles.shiftTime}>{t('booking.morningTime')}</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.shiftCard, dayShifts[activeDate]?.evening && { backgroundColor: '#035DF908', borderColor: '#035DF933' }]}
                                    onPress={() => toggleShift('evening')}
                                >
                                    <View style={styles.shiftLeft}>
                                        <View style={styles.shiftIconBox}>
                                            <SolarMoonBold size={24} color={dayShifts[activeDate]?.evening ? "#035DF9" : "#94A3B8"} />
                                        </View>
                                        <ThemedText style={styles.shiftTitle}>{t('booking.eveningShift')}</ThemedText>
                                    </View>
                                    <ThemedText style={styles.shiftTime}>{t('booking.eveningTime')}</ThemedText>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.deleteDayBtn}
                                onPress={() => {
                                    setSelectedDates(prev => prev.filter((_, i) => i !== activeDateIdx));
                                    setActiveDateIdx(0);
                                }}
                            >
                                <ThemedText style={styles.deleteDayText}>{t('booking.deleteDay')}</ThemedText>
                            </TouchableOpacity>
                        </>
                    ) : activeTab === 'MANO' ? (
                        <View style={styles.whoContainer}>
                            <View style={styles.whoCard}>
                                <View style={styles.guestInfo}>
                                    <ThemedText style={styles.guestLabel}>{t('booking.adults')}</ThemedText>
                                    <ThemedText style={styles.guestSubLabel}>{t('booking.adultsDesc')}</ThemedText>
                                </View>
                                <GuestCounter
                                    value={adultCount}
                                    onIncrement={() => setAdultCount(adultCount + 1)}
                                    onDecrement={() => setAdultCount(Math.max(1, adultCount - 1))}
                                />
                            </View>

                            <View style={[styles.whoCard, { marginTop: 12 }]}>
                                <View style={styles.guestInfo}>
                                    <ThemedText style={styles.guestLabel}>{t('booking.children')}</ThemedText>
                                    <ThemedText style={styles.guestSubLabel}>{t('booking.childrenDesc')}</ThemedText>
                                </View>
                                <GuestCounter
                                    value={childrenCount}
                                    onIncrement={() => setChildrenCount(childrenCount + 1)}
                                    onDecrement={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                                />
                            </View>
                        </View>
                    ) : (
                        renderDetailsTab()
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <PrimaryButton
                        label={activeTab === 'DETAILS' ? t('booking.completePayment') : t('booking.next')}
                        onPress={handleNext}
                        activeColor={activeTab === 'MANO' ? '#F64200' : (activeTab === 'DETAILS' ? '#15AB64' : '#035DF9')}
                        style={styles.nextBtn}
                    />
                </View>

                {renderSuccessSheet()}
            </SafeAreaView>
        </BottomSheetModalProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingBottom: 150, paddingHorizontal: 16 },
    tabsContainer: { marginTop: 15, alignItems: 'center' },
    swiperContainer: { marginTop: 20, height: 50 },
    quickDatesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
    dateBadge: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    dateBadgeActive: { borderColor: Colors.primary, borderWidth: 2 },
    dateBadgeText: { fontSize: normalize.font(16), fontFamily: "LamaSans-Bold", color: '#94A3B8' },
    dateBadgeTextActive: { color: Colors.primary, fontFamily: "LamaSans-Black" },
    addDateBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 15, marginTop: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    calendarMonthTitle: { textAlign: 'center', fontSize: normalize.font(16), fontFamily: "LamaSans-Black", color: '#1E293B', marginBottom: 15 },
    daysHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, marginBottom: 12, backgroundColor: '#F8FAFC', paddingVertical: 8, borderRadius: 10 },
    dayHeaderCell: { fontSize: normalize.font(10), fontFamily: "LamaSans-Black", color: '#94A3B8', width: (SCREEN_WIDTH - 100) / 7, textAlign: 'center' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
    dayCell: { width: (SCREEN_WIDTH - 100) / 7, height: (SCREEN_WIDTH - 100) / 7, justifyContent: 'center', alignItems: 'center', marginBottom: 4, position: 'relative' },
    activeDayCell: { backgroundColor: Colors.primary, borderRadius: 10 },
    dayText: { fontSize: normalize.font(14), fontFamily: "LamaSans-Bold", color: '#334155' },
    activeDayText: { color: '#FFF', fontFamily: "LamaSans-Black" },
    bookedDayText: { color: '#CBD5E1', fontFamily: "LamaSans-Regular" },
    scribbleOverlay: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 2, opacity: 0.4 },
    shiftsContainer: { marginTop: 20, gap: 10 },
    shiftCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: 'transparent' },
    shiftLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    shiftIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    shiftTitle: { fontSize: normalize.font(15), fontFamily: "LamaSans-Black", color: '#1E293B' },
    shiftTime: { fontSize: normalize.font(12), color: '#64748B', fontFamily: "LamaSans-Bold" },
    deleteDayBtn: { alignItems: 'center', marginTop: 30, padding: 8 },
    deleteDayText: { color: '#EF4444', fontSize: normalize.font(14), fontFamily: "LamaSans-Black", textDecorationLine: 'underline' },
    whoContainer: { marginTop: 20 },
    whoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    guestInfo: { alignItems: isRTL ? 'flex-end' : 'flex-start' },
    guestLabel: { fontSize: normalize.font(16), fontFamily: "LamaSans-Black", color: '#111827' },
    guestSubLabel: { fontSize: normalize.font(12), color: '#9CA3AF', fontFamily: "LamaSans-SemiBold", marginTop: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 35 : 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', zIndex: 100 },
    nextBtn: { width: '100%', height: 54 },

    // Inline Payment Styles
    inlinePaymentSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20, paddingBottom: 15 },
    inlinePaymentTitle: { fontSize: normalize.font(18), fontFamily: "LamaSans-Black", color: '#1E293B', marginBottom: 15, textAlign: isRTL ? 'right' : 'left' },
    paymentForm: { gap: 12 },
    inputGroup: { gap: 6 },
    inputGroupFull: { flex: 1, gap: 6 },
    inputGroupFixed: { width: 90, gap: 6 },
    inputLabel: { fontSize: normalize.font(14), fontFamily: "LamaSans-Black", color: '#1E293B', textAlign: isRTL ? 'right' : 'left' },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 14,
        height: 48,
        paddingHorizontal: 16,
        fontSize: normalize.font(14),
        fontFamily: "LamaSans-Bold",
        color: '#1E293B',
        textAlign: isRTL ? 'right' : 'left'
    },
    rowInputs: { flexDirection: isRTL ? 'row-reverse' : 'row' },

    // Success Sheet Styles
    successSheetContent: { padding: 25, alignItems: 'center', backgroundColor: '#FFFFFF' },
    lottieIcon: { width: '100%', height: 400, marginBottom: 15 },
    successTitle: { fontSize: normalize.font(20), fontFamily: "LamaSans-Black", color: '#1E293B', marginBottom: 8, textAlign: 'center' },
    successSub: { fontSize: normalize.font(14), color: '#64748B', textAlign: 'center', marginBottom: 25, lineHeight: 22, fontFamily: "LamaSans-Regular" },
    successBtn: { width: '100%', height: 56 },

    // Details Styles
    detailsContainer: { marginTop: 15 },
    chaletCardInstance: { width: '100%', marginRight: 0, marginBottom: 12 },
    detailsMapCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 12
    },
    mapSnippetWrapper: { width: '100%', height: 120, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    mapSnippet: { width: '100%', height: '100%' },
    mapMarker: { position: 'absolute', zIndex: 5 },
    mapAddressLabel: { textAlign: 'center', paddingVertical: 8, fontSize: normalize.font(12), fontFamily: "LamaSans-Black", color: '#1E293B' },
    infoSectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 12
    },
    sectionTitle: { fontSize: normalize.font(14), fontFamily: "LamaSans-Black", color: '#15AB64', textAlign: isRTL ? 'right' : 'left' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
    infoRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 10 },
    infoLabel: { fontSize: normalize.font(13), fontFamily: "LamaSans-Black", color: '#1E293B' },
    infoValue: { fontSize: normalize.font(13), fontFamily: "LamaSans-Bold", color: '#64748B' },
    sectionHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    editBtn: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#15AB6433' },
    editBtnText: { color: '#15AB64', fontSize: normalize.font(12), fontFamily: "LamaSans-Black" },
    paymentMainTitle: { fontSize: normalize.font(14), fontFamily: "LamaSans-Black", color: '#15AB64', marginVertical: 12, textAlign: isRTL ? 'right' : 'left' },
    paymentOptionCard: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        marginBottom: 10
    },
    paymentOptionActive: { borderColor: '#15AB64', backgroundColor: '#F0FDF4' },
    paymentVal: { fontSize: normalize.font(15), fontFamily: "LamaSans-Black", color: '#64748B' },
    paymentValActive: { color: '#1E293B', fontFamily: "LamaSans-Regular" },
    paymentLabel: { fontSize: normalize.font(13), fontFamily: "LamaSans-Black", color: '#64748B' },
    paymentLabelActive: { color: '#1E293B', fontFamily: "LamaSans-Regular" },
    agreementWrapper: { paddingVertical: 12, paddingBottom: 35 },
    agreementText: { fontSize: normalize.font(12), color: '#64748B', textAlign: 'center', lineHeight: 18, fontFamily: "LamaSans-Regular" },
    agreementLink: { color: Colors.primary, textDecorationLine: 'underline', fontFamily: "LamaSans-Black" }
});

