import { Linking } from "react-native";

/**
 * Driving directions to a point in Google Maps. The same URL opens the Google
 * Maps app when it is installed and the website otherwise, on iOS and Android.
 */
export function openDirections(latitude: number, longitude: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  return Linking.openURL(url);
}
