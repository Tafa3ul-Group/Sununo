import {
  SolarMutedBold,
  SolarPlayBold,
  SolarVolumeLoudBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { useIsFocused } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

interface ChaletVideoPlayerProps {
  /** HLS playlist from Bunny Stream. */
  videoUrl: string;
  thumbnailUrl?: string | null;
  /**
   * `card` is the stand-alone section: a poster that waits to be tapped.
   * `hero` is the first slide of the header strip: it fills the strip and
   * starts on its own, muted.
   */
  variant?: "card" | "hero";
  /** `hero` only: false while another slide is on screen, so the video pauses. */
  active?: boolean;
  /** `hero` only: fired once the tour has played through. */
  onEnded?: () => void;
  /**
   * `hero` only: what a tap does. Given one, the tap opens the full-screen
   * viewer instead of toggling playback inside the strip.
   */
  onPress?: () => void;
}

export function ChaletVideoPlayer({
  variant = "card",
  ...props
}: ChaletVideoPlayerProps) {
  // Two components, not one with a branch: each owns its own player and hooks.
  return variant === "hero" ? (
    <HeroChaletVideo {...props} />
  ) : (
    <CardChaletVideo {...props} />
  );
}

/**
 * The chalet tour as the opening slide of the photo strip.
 *
 * Plays by itself the moment the screen opens — but muted, so arriving at a
 * chalet never blares audio — and pauses whenever it is swiped away from or the
 * screen loses focus, so nothing keeps streaming in the background.
 */
function HeroChaletVideo({
  videoUrl,
  thumbnailUrl,
  active = true,
  onEnded,
  onPress,
}: Omit<ChaletVideoPlayerProps, "variant">) {
  const { isRTL } = useDirection();
  const isFocused = useIsFocused();
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  // Set by the user tapping pause: keeps the visibility effect below from
  // starting the video again behind their back.
  const pausedByUser = useRef(false);
  const ended = useRef(false);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const playing = player.addListener("playingChange", ({ isPlaying: v }) => {
      setIsPlaying(v);
      if (v) setHasRendered(true);
    });
    const finished = player.addListener("playToEnd", () => {
      ended.current = true;
      onEnded?.();
    });
    return () => {
      playing.remove();
      finished.remove();
    };
  }, [player, onEnded]);

  // Off-screen or backgrounded: stop pulling video bytes.
  useEffect(() => {
    const visible = active && isFocused;
    if (!visible) {
      player.pause();
      return;
    }
    if (!pausedByUser.current && !ended.current) player.play();
  }, [active, isFocused, player]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    player.muted = next;
  };

  const togglePlay = () => {
    if (isPlaying) {
      pausedByUser.current = true;
      player.pause();
      return;
    }
    pausedByUser.current = false;
    if (ended.current) {
      ended.current = false;
      player.currentTime = 0;
    }
    player.play();
  };

  return (
    <Pressable style={styles.hero} onPress={onPress ?? togglePlay}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* The poster stays up until the first frame is actually on screen, so
          the strip never opens on a black rectangle. */}
      {!hasRendered && thumbnailUrl ? (
        <ExpoImage
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      {!isPlaying && hasRendered ? (
        <View style={styles.heroPlayButton}>
          <SolarPlayBold size={22} color="#111827" />
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.muteButton}
        onPress={toggleMute}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          muted
            ? isRTL
              ? "تشغيل الصوت"
              : "Unmute"
            : isRTL
              ? "كتم الصوت"
              : "Mute"
        }
      >
        {muted ? (
          <SolarMutedBold size={20} color="#FFFFFF" />
        ) : (
          <SolarVolumeLoudBold size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <View style={styles.heroBadge}>
        <ThemedText style={styles.heroBadgeText}>
          {isRTL ? "جولة بالفيديو" : "Video tour"}
        </ThemedText>
      </View>
    </Pressable>
  );
}

/**
 * The chalet tour as its own section.
 *
 * Starts as a poster with a play button rather than a live player: nothing here
 * should pull video bytes over mobile data before someone asks for them.
 */
function CardChaletVideo({
  videoUrl,
  thumbnailUrl,
}: Omit<ChaletVideoPlayerProps, "variant">) {
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
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827" },
  heroPlayButton: {
    width: normalize.width(54),
    height: normalize.width(54),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)" },
  muteButton: {
    position: "absolute",
    top: 106,
    end: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)" },
  heroBadge: {
    position: "absolute",
    top: 50,
    start: 78,
    paddingHorizontal: normalize.width(10),
    paddingVertical: normalize.height(6),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)" },
  heroBadgeText: {
    fontSize: normalize.font(11),
    fontFamily: Fonts.semiBold,
    color: "white" },
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
