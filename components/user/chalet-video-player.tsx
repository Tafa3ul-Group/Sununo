import { SolarPlayBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { Image as ExpoImage } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ChaletVideoPlayerProps {
  /** HLS playlist from Bunny Stream. */
  videoUrl: string;
  thumbnailUrl?: string | null;
}

/**
 * The chalet tour video.
 *
 * Starts as a poster with a play button rather than a live player: the screen
 * is already loading a gallery, a map and reviews, and nothing here should pull
 * video bytes over mobile data before someone asks for them.
 */
export function ChaletVideoPlayer({ videoUrl, thumbnailUrl }: ChaletVideoPlayerProps) {
  const { isRTL } = useDirection();
  const [started, setStarted] = useState(false);
  const viewRef = useRef<VideoView>(null);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  const start = () => {
    setStarted(true);
    player.play();
  };

  if (!started) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={start}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={isRTL ? "تشغيل فيديو الشالية" : "Play chalet video"}
      >
        {thumbnailUrl ? (
          <ExpoImage
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.posterFallback]} />
        )}

        <View style={styles.scrim} />
        <View style={styles.playButton}>
          <SolarPlayBold size={22} color="#111827" />
        </View>
        <ThemedText style={styles.label}>
          {isRTL ? "جولة بالفيديو" : "Video tour"}
        </ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        ref={viewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls
        allowsFullscreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: normalize.height(200),
    marginHorizontal: normalize.width(16),
    borderRadius: normalize.radius(16),
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827" },
  posterFallback: {
    backgroundColor: "#1F2937" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)" },
  playButton: {
    width: normalize.width(54),
    height: normalize.width(54),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)" },
  label: {
    position: "absolute",
    bottom: normalize.height(12),
    fontSize: normalize.font(12),
    fontFamily: Fonts.semiBold,
    color: "white" } });
