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
  useDeleteChaletVideoMutation,
  useGetChaletVideoStatusQuery,
} from "@/store/api/apiSlice";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";

/** A minute at 720p lands around 50 MB — big enough to look good, small enough to send. */
const MAX_DURATION_SECONDS = 60;

interface ChaletVideoUploaderProps {
  chaletId: string;
  chaletName: string;
}

/**
 * Record-and-upload for the chalet tour video.
 *
 * The recording goes straight to Bunny Stream in the background, so the owner
 * can leave this screen — or the app — while it sends. Encoding then takes a
 * minute or two on Bunny's side, which is what the "processing" state is for.
 */
export function ChaletVideoUploader({ chaletId, chaletName }: ChaletVideoUploaderProps) {
  const { isRTL, rowDirection } = useDirection();
  const [progress, setProgress] = useState<number | null>(null);

  const [requestTicket] = useCreateChaletVideoTicketMutation();
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteChaletVideoMutation();

  // While Bunny encodes, poll — a webhook can be missed, and the owner should
  // not have to reopen the app to find out the video went live.
  const { data: status, refetch } = useGetChaletVideoStatusQuery(chaletId, {
    pollingInterval: 15000,
  });

  const videoStatus: string | null = status?.videoStatus ?? null;
  const videoUrl: string | null = status?.videoUrl ?? null;

  const player = useVideoPlayer(videoUrl ?? "", (p) => {
    p.loop = true;
  });

  const isUploading = progress !== null;

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

  const confirmDelete = () => {
    Alert.alert(
      isRTL ? "حذف الفيديو" : "Delete video",
      isRTL ? "متأكد؟" : "Are you sure?",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "حذف" : "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVideo(chaletId);
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
          {isRTL ? "فيديو الشالية" : "Chalet video"}
        </ThemedText>
        {(videoUrl || videoStatus === "processing") && !isUploading && (
          <TouchableOpacity
            onPress={confirmDelete}
            disabled={isDeleting}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "حذف الفيديو" : "Delete video"}
          >
            <SolarTrashBinBold size={18} color="#EA2129" />
          </TouchableOpacity>
        )}
      </View>

      {/* Uploading */}
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
      ) : videoStatus === "processing" ? (
        <View style={styles.state}>
          <ActivityIndicator color={Colors.primary} />
          <ThemedText style={styles.stateText}>
            {isRTL
              ? "الفيديو قيد المعالجة، راح يظهر خلال دقيقة"
              : "Processing — it will appear in a minute"}
          </ThemedText>
          {/* An upload that died mid-flight leaves the video encoding forever
              on Bunny's side, so there has to be a way out of this state. */}
          <TouchableOpacity onPress={confirmDelete} hitSlop={8}>
            <ThemedText style={styles.cancelLink}>
              {isRTL ? "إلغاء وإعادة المحاولة" : "Cancel and retry"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : videoUrl ? (
        <VideoView
          player={player}
          style={styles.preview}
          contentFit="cover"
          nativeControls
        />
      ) : (
        <View style={styles.state}>
          <SolarGalleryBold size={30} color="#9CA3AF" />
          <ThemedText style={styles.stateText}>
            {isRTL
              ? "ما أكو فيديو. الفيديو يزيد الحجوزات بشكل ملحوظ"
              : "No video yet. A tour video noticeably lifts bookings"}
          </ThemedText>
        </View>
      )}

      {!isUploading && videoStatus !== "processing" && (
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

      <ThemedText style={styles.hint}>
        {isRTL
          ? `الحد الأعلى ${MAX_DURATION_SECONDS} ثانية`
          : `Up to ${MAX_DURATION_SECONDS} seconds`}
      </ThemedText>
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
    width: "100%",
    height: normalize.height(180),
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
