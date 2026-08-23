import { MotionIcon } from "@/components/icons/motion-icons";
import { RootState } from "@/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";

const { width, height } = Dimensions.get("window");

/** Written once the splash animation has played; it never plays again after. */
const SPLASH_SEEN_KEY = "sununo:splashSeen";

export default function Index() {
  const router = useRouter();
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  // null while the flag is still being read — nothing renders until we know
  // whether this is the very first launch.
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean | null>(null);
  const { isAuthenticated, userType } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(SPLASH_SEEN_KEY)
      .then((seen) => {
        if (cancelled) return;
        setHasSeenSplash(!!seen);
        // Seen before: skip straight past the splash into the app.
        if (seen) setIsAnimationDone(true);
      })
      .catch(() => {
        // Storage unreachable — fall back to playing it.
        if (!cancelled) setHasSeenSplash(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAnimationDone) {
      let targetPath: any;

      if (!isAuthenticated && userType !== "guest") {
        targetPath = "/(auth)/login";
      } else if (userType === "owner") {
        targetPath = "/(tabs)/(dashboard)/home";
      } else {
        targetPath = "/(tabs)/(customer)";
      }

      const navTimer = setTimeout(() => {
        router.replace(targetPath);
      }, 100);

      return () => clearTimeout(navTimer);
    }
  }, [isAnimationDone, isAuthenticated, userType]);

  return (
    <View style={styles.container}>
      {hasSeenSplash === false && (
        <MotionIcon
          name="splash"
          size={Math.max(width, height)}
          loop={false}
          autoPlay={true}
          resizeMode="cover"
          onAnimationFinish={() => {
            setIsAnimationDone(true);
            AsyncStorage.setItem(SPLASH_SEEN_KEY, "1").catch(() => {});
          }}
          style={styles.lottie}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center" },
  lottie: {
    width: width,
    height: height } });
