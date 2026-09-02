import {
  SolarMutedBold,
  SolarPlayBold,
  SolarVolumeLoudBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { ChaletVideo, getChaletVideos } from "@/utils/chalet-videos";
import { useIsFocused } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * The chalet tour, full screen.
 *
 * One video per page, swiped vertically the way a reels feed works. Today a
 * chalet carries a single tour, so the list usually holds one page — the paging
 * is what makes several of them work the moment the API sends more.
 */
export default function ChaletVideosScreen() {
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const { isRTL } = useDirection();
  const insets = useSafeAreaInsets();

  const { data: chaletData, isLoading } = useGetCustomerChaletDetailsQuery(id);
  const chalet = (chaletData as any)?.data || chaletData || {};
  const videos = useMemo(() => getChaletVideos(chalet), [chalet]);

  const startIndex = Math.max(0, Math.min(Number(index) || 0, Math.max(videos.length - 1, 0)));
  const [activeIndex, setActiveIndex] = useState(startIndex);
  // Shared across pages so unmuting one video keeps the next one audible too.
  const [muted, setMuted] = useState(false);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: Array<{ index: number | null }> }) => {
      const first = info.viewableItems[0];
      if (first && typeof first.index === "number") setActiveIndex(first.index);
    },
  ).current;

  const getItemLayout = useCallback(
    (_: any, i: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * i,
      index: i,
    }),
    [],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <StatusBar barStyle="light-content" />

      {isLoading && videos.length === 0 ? (
        <ActivityIndicator color="#FFFFFF" size="large" />
      ) : videos.length === 0 ? (
        <ThemedText style={styles.emptyText}>
          {isRTL ? "لا يوجد فيديو لهذا الشاليه" : "No video for this chalet"}
        </ThemedText>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item: ChaletVideo, i: number) => `${item.url}-${i}`}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          renderItem={({ item, index: i }: { item: ChaletVideo; index: number }) => (
            <ReelVideo
              video={item}
              active={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          )}
        />
      )}

      <CircleBackButton style={[styles.backButton, { top: insets.top + 8 }]} />

      {videos.length > 1 ? (
        <View style={[styles.counter, { top: insets.top + 16 }]}>
          <ThemedText style={styles.counterText}>
            {activeIndex + 1} / {videos.length}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function ReelVideo({
  video,
  active,
  muted,
  onToggleMute,
}: {
  video: ChaletVideo;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const { isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  // Set by a tap on the video: keeps the visibility effect from starting it
  // again behind the viewer's back.
  const pausedByUser = useRef(false);

  const player = useVideoPlayer(video.url, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    const sub = player.addListener("playingChange", ({ isPlaying: v }) => {
      setIsPlaying(v);
      if (v) setHasRendered(true);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  // Only the page on screen plays; the others stay paused at their first frame.
  useEffect(() => {
    if (!active || !isFocused) {
      player.pause();
      return;
    }
    if (!pausedByUser.current) player.play();
  }, [active, isFocused, player]);

  const togglePlay = () => {
    if (isPlaying) {
      pausedByUser.current = true;
      player.pause();
      return;
    }
    pausedByUser.current = false;
    player.play();
  };

  return (
    <Pressable style={styles.page} onPress={togglePlay}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* The poster covers the gap between opening the screen and the first
          decoded frame, so the page never flashes black. */}
      {!hasRendered && video.thumbnailUrl ? (
        <ExpoImage
          source={{ uri: video.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={150}
        />
      ) : null}

      {!isPlaying ? (
        <View style={styles.playButton}>
          <SolarPlayBold size={26} color="#111827" />
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.muteButton, { bottom: insets.bottom + 28 }]}
        onPress={onToggleMute}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          muted ? (isRTL ? "تشغيل الصوت" : "Unmute") : isRTL ? "كتم الصوت" : "Mute"
        }
      >
        {muted ? (
          <SolarMutedBold size={20} color="#FFFFFF" />
        ) : (
          <SolarVolumeLoudBold size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center" },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000" },
  backButton: { position: "absolute", start: 20, zIndex: 20 },
  counter: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(5),
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 20 },
  counterText: {
    color: "#FFFFFF",
    fontSize: normalize.font(12),
    fontFamily: Fonts.semiBold },
  playButton: {
    width: normalize.width(64),
    height: normalize.width(64),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)" },
  muteButton: {
    position: "absolute",
    end: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)" },
  emptyText: {
    color: "#FFFFFF",
    fontSize: normalize.font(14),
    fontFamily: Fonts.medium } });
