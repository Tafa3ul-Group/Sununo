import {
  SolarCameraBold,
  SolarTrashBinBold,
  SolarGalleryBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  startChaletVideoUpload,
  type VideoUploadTicket,
} from "@/services/chalet-video-upload";
import {
  useCreateChaletVideoTicketMutation,
  useDeleteChaletVideoByIdMutation,
  useGetChaletVideoStatusQuery,
} from "@/store/api/apiSlice";
import { Image as ExpoImage } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

/** A minute at 720p lands around 50 MB — big enough to look good, small enough to send. */
const MAX_DURATION_SECONDS = 60;

/** Mirrors the server's cap; the API refuses the ticket past it either way. */
const MAX_VIDEOS = 5;

type ChaletVideoRow = {
  id: string;
  url?: string | null;
  thumbnailUrl?: string | null;
  status: "processing" | "ready" | "failed";
};

/**
 * What each state means for the owner, in their terms.
 *
 * The words the API uses ('processing', 'ready') say what the server is doing;
 * an owner needs to know one thing instead — whether customers can see this
 * video yet, and if not, whether they have to do anything about it.
 */
function videoStatusLabel(status: ChaletVideoRow["status"], isRTL: boolean) {
  if (status === "ready") {
    return {
      text: isRTL ? "ظاهر للزبائن" : "Live for customers",
      color: "#15AB64",
    };
  }
  if (status === "failed") {
    return {
      text: isRTL ? "فشل — احذفه وأعد الرفع" : "Failed — delete and re-upload",
      color: "#EA2129",
    };
  }
  return {
    text: isRTL ? "قيد المعالجة…" : "Processing…",
    color: "#B45309",
  };
}

interface ChaletVideoUploaderProps {
  chaletId: string;
  chaletName: string;
}

/**
 * Record-and-upload for the chalet tour videos.
 *
 * Each recording goes straight to Bunny Stream in the background, so the owner
 * can leave this screen — or the app — while it sends. Encoding then takes a
 * minute or two on Bunny's side, which is what the "processing" state is for.
 * A chalet holds up to `MAX_VIDEOS`, played as a reel in the customer app.
 */
export function ChaletVideoUploader({ chaletId, chaletName }: ChaletVideoUploaderProps) {
  const { isRTL, rowDirection } = useDirection();
  const [progress, setProgress] = useState<number | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [requestTicket] = useCreateChaletVideoTicketMutation();
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteChaletVideoByIdMutation();

  // While Bunny encodes, poll — a webhook can be missed, and the owner should
  // not have to reopen the app to find out the video went live.
  const { data: status, refetch } = useGetChaletVideoStatusQuery(chaletId, {
    pollingInterval: 15000,
  });

  const videos: ChaletVideoRow[] = status?.videos ?? [];
  const isUploading = progress !== null;
  const isFull = videos.length >= MAX_VIDEOS;

  const player = useVideoPlayer(previewUrl ?? "", (p) => {
    p.loop = true;
  });

  const pickAndUpload = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        isRTL ? "الإذن مرفوض" : "Permission denied",
        isRTL
          ? "نحتاج إذن الكاميرا حتى تصوّر الشالية"
          : "Camera access is needed to record the chalet",
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["videos"],
      videoMaxDuration: MAX_DURATION_SECONDS,
      // Anything higher produces a file so large it is a burden to upload over
      // mobile data, for detail nobody sees on a phone screen.
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      allowsEditing: true,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return;
    const asset = result.assets[0];

    try {
      setProgress(0);
      const handle = await startChaletVideoUpload({
        chaletId,
        fileUri: asset.uri,
        title: chaletName,
        requestTicket: (id) =>
          requestTicket(id).unwrap() as Promise<VideoUploadTicket>,
        onProgress: setProgress,
      });
      await handle.done;
      setProgress(null);
      refetch();
    } catch (error: any) {
      setProgress(null);
      Alert.alert(
        isRTL ? "فشل الرفع" : "Upload failed",
        error?.message ||
          (isRTL ? "جرّب مرة ثانية" : "Please try again"),
      );
    }
  };

  const confirmDelete = (videoRowId: string) => {
    Alert.alert(
      isRTL ? "حذف الفيديو" : "Delete video",
      isRTL ? "متأكد؟" : "Are you sure?",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "حذف" : "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVideo({ chaletId, videoRowId });
            refetch();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <ThemedText style={styles.title}>
          {isRTL ? "فيديوات الشالية" : "Chalet videos"}
        </ThemedText>
        <ThemedText style={styles.counter}>
          {videos.length} / {MAX_VIDEOS}
        </ThemedText>
      </View>

      {/* One tile per video, in the order the customer swipes through them. */}
      {videos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tiles}
        >
          {videos.map((video, i) => {
            const state = videoStatusLabel(video.status, isRTL);
            return (
            <View key={video.id} style={styles.tileColumn}>
            <View style={styles.tile}>
              {video.thumbnailUrl && video.status === "ready" ? (
                <ExpoImage
                  source={{ uri: video.thumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.tilePlaceholder]}>
                  {video.status === "processing" ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <SolarGalleryBold size={22} color="#9CA3AF" />
                  )}
                </View>
              )}

              {video.status === "ready" && video.url ? (
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  onPress={() => setPreviewUrl(video.url ?? null)}
                  accessibilityRole="button"
                  accessibilityLabel={isRTL ? "عرض الفيديو" : "Preview video"}
                />
              ) : null}

              <View style={styles.tileIndex}>
                <ThemedText style={styles.tileIndexText}>{i + 1}</ThemedText>
              </View>

              {/* An upload that died mid-flight leaves the video encoding
                  forever on Bunny's side, so every tile — processing ones
                  included — has a way out. */}
              <TouchableOpacity
                style={styles.tileDelete}
                onPress={() => confirmDelete(video.id)}
                disabled={isDeleting}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={isRTL ? "حذف الفيديو" : "Delete video"}
              >
                <SolarTrashBinBold size={14} color="#FFFFFF" />
              </TouchableOpacity>

            </View>

            <View style={[styles.tileStatus, { flexDirection: rowDirection }]}>
              <View style={[styles.tileDot, { backgroundColor: state.color }]} />
              <ThemedText style={[styles.tileStatusText, { color: state.color }]}>
                {state.text}
              </ThemedText>
            </View>
            </View>
            );
          })}
        </ScrollView>
      ) : null}

      {isUploading ? (
        <View style={styles.state}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.round((progress ?? 0) * 100)}%` }]}
            />
          </View>
          <ThemedText style={styles.stateText}>
            {isRTL
              ? `جاري الرفع ${Math.round((progress ?? 0) * 100)}% — تكدر تطلع من التطبيق، الرفع يكمل بالخلفية`
              : `Uploading ${Math.round((progress ?? 0) * 100)}% — you can leave the app, it keeps going`}
          </ThemedText>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.state}>
          <SolarGalleryBold size={30} color="#9CA3AF" />
          <ThemedText style={styles.stateText}>
            {isRTL
              ? "ما أكو فيديو. الفيديو يزيد الحجوزات بشكل ملحوظ"
              : "No video yet. A tour video noticeably lifts bookings"}
          </ThemedText>
        </View>
      ) : null}

      {!isUploading && !isFull && (
        <View style={[styles.actions, { flexDirection: rowDirection }]}>
          <TouchableOpacity
            style={[styles.action, styles.actionPrimary, { flexDirection: rowDirection }]}
            onPress={() => pickAndUpload(true)}
            activeOpacity={0.85}
          >
            <SolarCameraBold size={16} color="white" />
            <ThemedText style={[styles.actionLabel, styles.actionLabelPrimary]}>
              {isRTL ? "صوّر الآن" : "Record"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, { flexDirection: rowDirection }]}
            onPress={() => pickAndUpload(false)}
            activeOpacity={0.85}
          >
            <SolarGalleryBold size={16} color={Colors.primary} />
            <ThemedText style={styles.actionLabel}>
              {isRTL ? "من المعرض" : "From gallery"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {videos.some(v => v.status === "processing") ? (
        <ThemedText style={styles.stateText}>
          {isRTL
            ? "الفيديو قيد المعالجة عدنا — يستغرق دقيقة أو دقيقتين، وما يظهر للزبائن قبل ما يخلص. تكدر تطلع من التطبيق."
            : "Processing on our side — a minute or two, and customers do not see it until it finishes. You can leave the app."}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.hint}>
        {isFull
          ? isRTL
            ? `وصلت الحد الأعلى ${MAX_VIDEOS} فيديوات — احذف واحد حتى تضيف غيره`
            : `You have reached the ${MAX_VIDEOS}-video limit — delete one to add another`
          : isRTL
            ? `الحد الأعلى ${MAX_DURATION_SECONDS} ثانية لكل فيديو`
            : `Up to ${MAX_DURATION_SECONDS} seconds per video`}
      </ThemedText>

      {/* Preview stays a modal: a player per tile would keep several videos
          buffering at once inside a form the owner is still filling in. */}
      <Modal
        visible={previewUrl !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewUrl(null)}
      >
        <View style={styles.previewBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setPreviewUrl(null)}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "إغلاق" : "Close"}
          />
          <VideoView
            player={player}
            style={styles.preview}
            contentFit="contain"
            nativeControls
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: normalize.height(12),
    padding: normalize.width(14),
    borderRadius: normalize.radius(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white" },
  header: {
    alignItems: "center",
    justifyContent: "space-between" },
  title: {
    fontSize: normalize.font(14),
    fontFamily: Fonts.bold,
    color: "#111827" },
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: normalize.height(10),
    paddingVertical: normalize.height(22),
    paddingHorizontal: normalize.width(12),
    borderRadius: normalize.radius(12),
    backgroundColor: "#F9FAFB" },
  stateText: {
    textAlign: "center",
    fontSize: normalize.font(11),
    fontFamily: Fonts.regular,
    color: "#6B7280" },
  counter: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.medium,
    color: "#6B7280" },
  tiles: {
    gap: normalize.width(10),
    paddingVertical: normalize.height(2) },
  tileColumn: {
    width: normalize.width(96),
    gap: normalize.height(6) },
  tileStatus: {
    alignItems: "center",
    justifyContent: "center",
    gap: normalize.width(4) },
  tileDot: {
    width: 6,
    height: 6,
    borderRadius: 3 },
  tileStatusText: {
    flexShrink: 1,
    fontSize: normalize.font(9),
    fontFamily: Fonts.medium },
  tile: {
    width: normalize.width(96),
    height: normalize.height(120),
    borderRadius: normalize.radius(12),
    overflow: "hidden",
    backgroundColor: "#F3F4F6" },
  tilePlaceholder: {
    alignItems: "center",
    justifyContent: "center" },
  tileIndex: {
    position: "absolute",
    top: 6,
    start: 6,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)" },
  tileIndexText: {
    fontSize: normalize.font(10),
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF" },
  tileDelete: {
    position: "absolute",
    top: 6,
    end: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(234,33,41,0.9)" },
  previewBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.85)" },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB" },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.primary },
  preview: {
    width: "92%",
    height: normalize.height(260),
    borderRadius: normalize.radius(12),
    backgroundColor: "#000" },
  actions: {
    gap: normalize.width(10) },
  action: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: normalize.width(6),
    minHeight: normalize.height(44),
    borderRadius: normalize.radius(12),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white" },
  actionPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary },
  actionLabel: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.semiBold,
    color: Colors.primary },
  actionLabelPrimary: {
    color: "white" },
  cancelLink: {
    fontSize: normalize.font(11),
    fontFamily: Fonts.semiBold,
    color: Colors.primary },
  hint: {
    textAlign: "center",
    fontSize: normalize.font(10),
    fontFamily: Fonts.regular,
    color: "#9CA3AF" } });
