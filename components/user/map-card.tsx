import { ThemedText } from "@/components/themed-text";
import { Colors, Shadows } from "@/constants/theme";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, I18nManager } from "react-native";
import { SolarCloseCircleBold, SolarStarBold } from "@/components/icons/solar-icons";
import { useDirection } from "@/i18n";


interface MapCardProps {
  title: string;
  location: string;
  rating: number;
  image: string;
  price: string;
  onPress: () => void;
  onClose?: () => void;
}

export const MapCard = React.memo(function MapCard({
  title,
  location,
  rating,
  image,
  price,
  onPress,
  onClose }: MapCardProps) {
  const { isRTL, rowDirection, textAlign } = useDirection();
  const isArabic = isRTL;
  const rowDir = rowDirection;
  const rowReverseDir: "row" | "row-reverse" =
    rowDirection === "row" ? "row-reverse" : "row";
  // alignItems is NOT auto-mirrored by RN, so keep the explicit content-vs-manager comparison.
  const alignStart: "flex-start" | "flex-end" =
    isArabic === I18nManager.isRTL ? "flex-start" : "flex-end";
  const ratingBoxDir = rowDir;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        { flexDirection: rowDir },
      ]}
    >
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.content}>
        <View
          style={[
            styles.header,
            { flexDirection: rowReverseDir },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SolarCloseCircleBold size={16} color="#6B7280" />
          </TouchableOpacity>
          <View
            style={[
              styles.titleSection,
              { alignItems: alignStart },
            ]}
          >
            <ThemedText
              style={[styles.title, { textAlign }]}
              numberOfLines={1}
            >
              {title}
            </ThemedText>
            <ThemedText
              style={[
                styles.location,
                { textAlign },
              ]}
              numberOfLines={1}
            >
              {location}
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { flexDirection: rowReverseDir },
          ]}
        >
          <View
            style={[
              styles.ratingContainer,
              { flexDirection: ratingBoxDir },
            ]}
          >
            <SolarStarBold size={14} color="#035DF9" />
            <Text style={styles.rating}>{rating}</Text>
          </View>
          <ThemedText
            style={[styles.price, { textAlign }]}
          >
            {price} {isArabic ? "/ شفت" : "/ shift"}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    ...Shadows.medium,
    height: 100,
    alignItems: "center",
    gap: 12 },
  image: {
    width: 84,
    height: 84,
    borderRadius: 12 },
  content: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    paddingVertical: 4 },
  header: {
    justifyContent: "space-between",
    alignItems: "flex-start" },
  titleSection: {
    flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827" },
  location: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 2,
   fontFamily: "Alexandria-Medium" },
  closeButton: {
    padding: 2 },
  footer: {
    justifyContent: "space-between",
    alignItems: "center" },
  ratingContainer: {
    alignItems: "center",
    gap: 4 },
  rating: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827" },
  price: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary } });
