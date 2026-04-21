import { ThemedText } from "@/components/themed-text";
import { Colors, Shadows } from "@/constants/theme";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SolarCloseCircleBold, SolarStarBold } from "@/components/icons/solar-icons";

interface MapCardProps {
  title: string;
  location: string;
  rating: number;
  image: string;
  price: string;
  onPress: () => void;
  onClose?: () => void;
}

export const MapCard = ({
  title,
  location,
  rating,
  image,
  price,
  onPress,
  onClose,
}: MapCardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.container}
    >
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SolarCloseCircleBold size={16} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.titleSection}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {title}
            </ThemedText>
            <ThemedText style={styles.location} numberOfLines={1}>
              {location}
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>{rating}</Text>
            <SolarStarBold size={14} color="#035DF9" />
          </View>
          <ThemedText style={styles.price}>{price} / شفت</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    ...Shadows.medium,
    height: 100,
    alignItems: "center",
    gap: 12,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    alignItems: "flex-end",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "Tajawal-Black",
    color: "#111827",
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
   fontFamily: "Tajawal-Regular" },
  closeButton: {
    padding: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontFamily: "Tajawal-Bold",
    color: "#111827",
  },
  price: {
    fontSize: 13,
    fontFamily: "Tajawal-Black",
    color: Colors.primary,
  },
});
