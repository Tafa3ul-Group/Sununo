import { ThemedText } from "@/components/themed-text";
import { normalize } from "@/constants/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface WalletCardProps {
  balance?: string;
  onWithdraw?: () => void;
}

export const WalletCard = ({
  balance = "100,000",
  onWithdraw,
}: WalletCardProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  return (
    <View style={styles.container}>
      {/* SVG Background - Mirrored for LTR to keep focal points consistent */}
      <View
        style={[styles.svgWrapper, { transform: [{ scaleX: isRTL ? 1 : -1 }] }]}
      >
        <Svg
          width="100%"
          height={normalize.height(130)}
          viewBox="0 24 370 123"
          preserveAspectRatio="none"
          fill="none"
        >
          <G clipPath="url(#clip0_64103_857)">
            <Path
              d="M15.9961 24.5L354.022 24.5049C362.559 24.5049 369.393 31.8833 369.393 40.4678L369.401 61.7578C369.401 62.4459 369.408 63.2383 369.416 64.0996V64.1465C369.416 64.151 369.417 64.1553 369.417 64.1592V64.2129C369.44 66.7202 369.468 69.8026 369.356 72.6953C369.251 75.4211 369.023 77.9292 368.567 79.6211L368.473 79.9482C366.611 85.986 360.189 91.7732 353.28 93.5449C347.93 94.9167 340.858 94.813 334.498 94.7158C333.015 94.6931 331.571 94.6709 330.204 94.6689H330.203L283.588 94.6641H283.589L269.688 94.6523H269.688C269.053 94.6526 268.431 94.6508 267.819 94.6484H267.807C261.437 94.6239 256.161 94.5966 250.064 97.667C247.139 99.1364 244.598 101.148 242.612 103.568L242.223 104.058C238.023 109.481 237.638 115.041 237.239 120.655C237 124.025 236.759 127.409 235.729 130.879C234.119 136.201 230.053 140.937 224.638 143.661C218.94 146.527 212.003 146.474 205.344 146.414C204.411 146.406 203.484 146.397 202.57 146.397L184.519 146.392L129.489 146.388L58.793 146.39L38.2588 146.397C37.2743 146.398 36.2148 146.408 35.1094 146.418C29.2699 146.472 22.1773 146.535 17.5068 145.356L17.5059 145.355L16.9482 145.21C11.2179 143.642 6.41323 140.136 3.56445 135.455L3.56152 135.451L3.27734 134.981C0.435788 130.144 0.46462 125.797 0.510742 120.372V40.4678C0.510742 32.0221 7.23937 24.7318 15.5967 24.5059L15.9961 24.5Z"
              fill="#035DF9"
              stroke="#6AA0FF"
            />
            {/* Birds (Left) */}
            <Path
              d="M21.0533 34L21.016 34.032C21.0082 34.5634 20.9923 35.1193 21.0043 35.6486C21.305 36.1116 22.3663 37.0143 22.7986 37.399C24.3442 38.7743 26.7296 40.6148 27.8374 42.3745C28.3371 43.1557 28.6621 44.0399 28.7891 44.9642C29.0356 46.8514 28.6199 48.7291 27.4417 50.2312C26.9948 50.801 26.2859 51.4728 25.7551 51.9938L23.0468 54.6073C22.6186 55.0236 21.8515 55.753 21.5142 56.2046C21.4721 56.8117 21.4839 57.3931 21.5089 58C22.0532 57.8061 23.0329 57.3157 23.6006 57.0547L27.748 55.1529C29.4931 54.321 31.9371 53.4531 33.3409 52.0823C34.3788 51.0688 35.0951 49.0354 35.0828 47.5511C35.4941 47.4266 36.5427 46.5735 36.9571 46.2832C37.3427 46.013 37.5669 45.8682 38 45.6452C37.3398 45.1658 36.6399 44.727 35.9598 44.2775C35.6831 44.0946 35.1493 43.8093 34.9231 43.6124C34.9031 42.7984 34.8296 42.2186 34.5334 41.454C34.1414 40.4489 33.4771 39.5789 32.6184 38.9461C31.4105 38.0484 29.7904 37.5871 28.4315 37.0072C27.1693 36.4686 25.9617 35.9205 24.681 35.4078C23.9418 35.1135 23.201 34.8235 22.4586 34.5377C21.9986 34.3635 21.4997 34.1984 21.0533 34Z"
              fill="#4B8DFF"
              fill-opacity="0.5"
            />
            <Path
              d="M42.0533 34L42.016 34.032C42.0082 34.5634 41.9923 35.1193 42.0043 35.6486C42.305 36.1116 43.3663 37.0143 43.7986 37.399C45.3442 38.7743 47.7296 40.6148 48.8374 42.3745C49.3371 43.1557 49.6621 44.0399 49.7891 44.9642C50.0356 46.8514 49.6199 48.7291 48.4417 50.2312C47.9948 50.801 47.2859 51.4728 46.7551 51.9938L44.0468 54.6073C43.6186 55.0236 42.8515 55.753 42.5142 56.2046C42.4721 56.8117 42.4839 57.3931 42.5089 58C43.0532 57.8061 44.0329 57.3157 44.6006 57.0547L48.748 55.1529C50.4931 54.321 52.9371 53.4531 54.3409 52.0823C55.3788 51.0688 56.0951 49.0354 56.0828 47.5511C56.4941 47.4266 57.5427 46.5735 57.9571 46.2832C58.3427 46.013 58.5669 45.8682 59 45.6452C58.3398 45.1658 57.6399 44.727 56.9598 44.2775C56.6831 44.0946 56.1493 43.8093 55.9231 43.6124C55.9031 42.7984 55.8296 42.2186 55.5334 41.454C55.1414 40.4489 54.4771 39.5789 53.6184 38.9461C52.4105 38.0484 50.7904 37.5871 49.4315 37.0072C48.1693 36.4686 46.9617 35.9205 45.681 35.4078C44.9418 35.1135 44.201 34.8235 43.4586 34.5377C42.9986 34.3635 42.4997 34.1984 42.0533 34Z"
              fill="#4B8DFF"
              fill-opacity="0.5"
            />
            <Path
              d="M63.0533 34L63.016 34.032C63.0082 34.5634 62.9923 35.1193 63.0043 35.6486C63.305 36.1116 64.3663 37.0143 64.7986 37.399C66.3442 38.7743 68.7296 40.6148 69.8374 42.3745C70.3371 43.1557 70.6621 44.0399 70.7891 44.9642C71.0356 46.8514 70.6199 48.7291 69.4417 50.2312C68.9948 50.801 68.2859 51.4728 67.7551 51.9938L65.0468 54.6073C64.6186 55.0236 63.8515 55.753 63.5142 56.2046C63.4721 56.8117 63.4839 57.3931 63.5089 58C64.0532 57.8061 65.0329 57.3157 65.6006 57.0547L69.748 55.1529C71.4931 54.321 73.9371 53.4531 75.3409 52.0823C76.3788 51.0688 77.0951 49.0354 77.0828 47.5511C77.4941 47.4266 78.5427 46.5735 78.9571 46.2832C79.3427 46.013 79.5669 45.8682 80 45.6452C79.3398 45.1658 78.6399 44.727 77.9598 44.2775C77.6831 44.0946 77.1493 43.8093 76.9231 43.6124C76.9031 42.7984 76.8296 42.2186 76.5334 41.454C76.1414 40.4489 75.4771 39.5789 74.6184 38.9461C73.4105 38.0484 71.7904 37.5871 70.4315 37.0072C69.1693 36.4686 67.9617 35.9205 66.681 35.4078C65.9418 35.1135 65.201 34.8235 64.4586 34.5377C63.9986 34.3635 63.4997 34.1984 63.0533 34Z"
              fill="#4B8DFF"
              fill-opacity="0.5"
            />
          </G>
          {/* Orange Button Rec */}
          <Rect
            width={128}
            height={47}
            rx={23.5}
            transform="matrix(-1 0 0 1 369.958 99.9424)"
            fill="#F64200"
          />
          <Defs>
            <ClipPath id="clip0_64103_857">
              <Rect
                width={369.958}
                height={122.942}
                fill="white"
                transform="translate(0 24)"
              />
            </ClipPath>
          </Defs>
        </Svg>
      </View>

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        <View
          style={[
            styles.topRow,
            { alignItems: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <ThemedText
            style={[
              styles.balanceLabel,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("profile.wallet.balance")}
          </ThemedText>
        </View>

        <View
          style={[
            styles.bottomRow,
            { flexDirection: isRTL ? "row" : "row-reverse" },
          ]}
        >
          <View
            style={[
              styles.balanceContainer,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <ThemedText style={styles.balanceValue}>{balance}</ThemedText>
            <ThemedText style={styles.currencyText}>
              {t("common.iqd")}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              { [isRTL ? "paddingLeft" : "paddingRight"]: normalize.width(60) },
            ]}
            onPress={onWithdraw}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.withdrawText}>
              {t("profile.wallet.withdraw")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - normalize.width(20),
    height: normalize.height(145),
    alignSelf: "center",
    marginVertical: normalize.height(4),
    overflow: "hidden",
  },
  svgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  contentOverlay: {
    flex: 1,
    paddingHorizontal: normalize.width(25),
    paddingTop: normalize.height(25),
    paddingBottom: normalize.height(35),
    justifyContent: "space-between",
  },
  topRow: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    color: "white",
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Black",
  },
  bottomRow: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  balanceContainer: {
    alignItems: "baseline",
    gap: normalize.width(6),
  },
  balanceValue: {
    color: "white",
    fontSize: normalize.font(28),
    fontFamily: "Tajawal-Black",
    lineHeight: normalize.font(36),
    paddingVertical: normalize.height(4),
  },
  currencyText: {
    color: "white",
    fontSize: normalize.font(18),
    fontFamily: "Tajawal-Bold",
  },
  withdrawButton: {
    width: normalize.width(120),
    height: normalize.height(20),
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawText: {
    color: "white",
    fontSize: normalize.font(20),
    fontFamily: "Tajawal-Black",
  },
});
