import { Colors, normalize } from "@/constants/theme";
import { Image } from "expo-image";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle } from "react-native";
import { SolarMapPointBold, SolarPenBold, SolarBanknoteBold } from "@/components/icons/solar-icons";
import { isRTL } from "@/i18n";

interface ProviderChaletCardProps {
  title: string;
  location: string;
  image: string;
  onPress?: () => void;
  onEdit?: () => void;
  onRevenue?: () => void;
  isRTL?: boolean;
  style?: ViewStyle;
}

export function ProviderChaletCard({
  title,
  location,
  image,
  onPress,
  onEdit,
  onRevenue,
  isRTL = false,
  style }: ProviderChaletCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.imageOverlay} />
        
        {/* Status Badge - Can be dynamic later */}
        <View
          style={[
            styles.statusBadge,
            { flexDirection: 'row' },
            isRTL ? { right: 12 } : { left: 12 },
          ]}
        >
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{isRTL ? 'نشط' : 'Active'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.locationRow, { flexDirection: 'row' }]}>
          <SolarMapPointBold size={14} color={Colors.primary} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={[styles.actionGrid, { flexDirection: 'row' }]}>
          <TouchableOpacity 
            style={[
              styles.actionBtn,
              styles.editBtn,
              { flexDirection: 'row' },
            ]} 
            onPress={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <SolarPenBold size={18} color={Colors.primary} />
            <Text style={styles.editBtnText}>{isRTL ? 'تعديل' : 'Edit'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionBtn,
              styles.revenueBtn,
              { flexDirection: 'row' },
            ]} 
            onPress={(e) => {
              e.stopPropagation();
              onRevenue?.();
            }}
          >
            <SolarBanknoteBold size={18} color="#FFFFFF" />
            <Text style={styles.revenueBtnText}>{isRTL ? 'الأرباح' : 'Income'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: normalize.width(220) },
  imageWrapper: {
    height: normalize.height(140),
    width: '100%',
    position: 'relative' },
  image: {
    width: '100%',
    height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)' },
  statusBadge: {
    position: 'absolute',
    top: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981' },
  statusText: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: '#111827' },
  content: {
    padding: 14 },
  title: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: '#111827',
    marginBottom: 4 },
  locationRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16 },
  location: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
    flex: 1,
   fontFamily: "Alexandria-Medium" },
  actionGrid: {
    gap: 8 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6 },
  editBtn: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '20' },
  editBtnText: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary },
  revenueBtn: {
    backgroundColor: Colors.primary },
  revenueBtnText: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: '#FFFFFF' } });
