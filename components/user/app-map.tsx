import { ThemedText } from "@/components/themed-text";
import * as Theme from "@/constants/theme";
import { useDirection } from "@/i18n";
import { Image } from "expo-image";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

const { Colors, normalize, Shadows } = Theme;
const SafeShadows = Shadows || { small: {}, medium: {}, large: {} };

// Mapbox Token
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Lazy load Mapbox
let Mapbox: any = null;
try {
  Mapbox = require("@rnmapbox/maps").default;
  if (Mapbox) {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  }
} catch (e) {
  console.log("Mapbox native module not found:", e);
}

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

interface MarkerData {
  id: string;
  title: string | { ar: string; en: string };
  image: string;
  coordinates: [number, number];
  [key: string]: any;
}

// ── Marker clustering ──────────────────────────────────────────────────────
// Chalets in the same compound/street land on top of each other, so a tap used
// to be a coin-flip over which listing opened. Instead we merge them into one
// bubble and let the tap OPEN the group: zoom in far enough to separate them,
// or — when they sit on the exact same point and no zoom can ever split them —
// fan them out around the anchor so each one is still pickable.
const TILE_SIZE = 512; // Mapbox GL world tile size
const CLUSTER_RADIUS_PX = 64; // markers closer than this merge
const SPIDER_RADIUS_PX = 84; // fan-out radius for un-separable groups
const MAX_SEPARATION_ZOOM = 19; // past this, zooming stops helping

/** Geographic coordinate → Web-Mercator pixel at a given zoom. */
const projectPx = (lng: number, lat: number, zoom: number) => {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const s = Math.max(-0.9999, Math.min(0.9999, Math.sin((lat * Math.PI) / 180)));
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale,
  };
};

/** Web-Mercator pixel → geographic coordinate at a given zoom. */
const unprojectPx = (x: number, y: number, zoom: number): [number, number] => {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return [
    (x / scale) * 360 - 180,
    (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
  ];
};

interface Cluster {
  id: string;
  members: MarkerData[];
  center: [number, number];
  centerPx: { x: number; y: number };
  /** Widest pixel gap inside the group — 0 means identical coordinates. */
  spreadPx: number;
}

interface AppMapProps {
  style?: any;
  centerCoordinate?: [number, number]; // [lng, lat]
  zoomLevel?: number;
  interactive?: boolean;
  showMarker?: boolean;
  selectedChalet?: any;
  markers?: MarkerData[];
  route?: any;
  isNavigating?: boolean;
  onSelectMarker?: (chalet: any) => void;
  onPressCard?: (id: string) => void;
  onCameraChanged?: (center: [number, number], zoom: number) => void;
  onPress?: () => void;
}

const AppMapComponent = ({
  style,
  centerCoordinate,
  zoomLevel = 12,
  interactive = true,
  showMarker = false,
  selectedChalet,
  markers = [],
  route,
  isNavigating = false,
  onSelectMarker,
  onPressCard,
  onCameraChanged,
  onPress }: AppMapProps) => {
  const { isRTL } = useDirection();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedChaletState, setSelectedChaletState] =
    useState<any>(selectedChalet);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [hasNativeMap, setHasNativeMap] = useState(false);
  const cameraRef = React.useRef<any>(null);

  // Zoom the clustering math is computed against. It MUST come from the map
  // itself: the `zoomLevel` prop is only a request (the parent sets 15 while the
  // camera actually sits at 19), and onMapIdle doesn't reliably carry the zoom.
  // Reading the wrong zoom made every group look glued together and made the
  // "zoom in to separate" target land on the zoom we were already at.
  const [clusterZoom, setClusterZoom] = useState(zoomLevel);
  const liveZoomRef = React.useRef(zoomLevel);
  const clusterZoomRef = React.useRef(zoomLevel);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(
    null,
  );

  // Fires continuously while the camera moves. The ref is always exact; the
  // state re-renders only every 0.2 zoom levels so gestures stay smooth.
  const handleNativeCameraChanged = useCallback((state: any) => {
    const z = state?.properties?.zoom;
    if (typeof z !== "number" || isNaN(z)) return;
    liveZoomRef.current = z;
    if (Math.abs(clusterZoomRef.current - z) < 0.2) return;
    clusterZoomRef.current = z;
    setClusterZoom(z);
    // A fanned-out group is laid out in pixels at a fixed zoom, so only a ZOOM
    // change invalidates it. Panning keeps it correct (the pins are anchored to
    // real coordinates), and collapsing on every onMapIdle was wrong — Mapbox
    // fires idle after a plain tap too, which killed the fan-out instantly.
    setExpandedClusterId(null);
  }, []);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(2, { duration: 2000 }), -1, false);
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(0, { duration: 2000 }),
      ),
      -1,
      false,
    );

    // Check if native Mapbox is truly ready
    if (Mapbox && Platform.OS !== "web") {
      setHasNativeMap(true);
    }

    let locationSubscription: any = null;
    // The permission prompt and the first GPS fix take seconds, and the map is
    // mounted/unmounted on every explore + home visit. Without this flag an
    // unmount mid-await left cleanup with `null` while the watcher created a
    // moment later kept running for the rest of the process — a 1 Hz GPS drain
    // plus setState on a dead component, accumulating one watcher per visit.
    let cancelled = false;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status === "granted") {
          // Get initial position
          let currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          if (cancelled) return;
          setLocation(currentLocation);

          // Watch for changes
          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 5, // update every 5 meters
              timeInterval: 1000, // or every second
            },
            (newLocation) => {
              if (cancelled) return;
              setLocation(newLocation);
            },
          );
          // Unmounted while watchPositionAsync was still resolving — cleanup
          // has already run and will never see this subscription, so drop it
          // here instead of letting it leak.
          if (cancelled) {
            sub.remove();
            return;
          }
          locationSubscription = sub;
        }
      } catch (err) {
        console.warn("Location error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handlePress = useCallback(() => {
    setExpandedClusterId(null);
    onPress?.();
  }, [onPress]);

  const handleMapLoadingError = useCallback((err: any) => {
    console.warn("Mapbox Load Error:", err);
  }, []);

  // Last camera we handed to the parent — used to swallow no-op repeats.
  const lastReportedRef = React.useRef<[number, number, number] | null>(null);

  // @rnmapbox/maps v10 hands `onMapIdle` a MapState, NOT the old v8
  // PointFeature: `{ properties: { center, bounds, zoom, heading, pitch }, ... }`
  // (see node_modules/@rnmapbox/maps/.../MapView.d.ts, `export type MapState`).
  // Reading `feature.geometry.coordinates` / `properties.zoomLevel` meant the
  // guard was always false, so the parent NEVER learned the camera moved — the
  // explore screen kept querying chalets for its initial region no matter where
  // the user panned. `handleNativeCameraChanged` above already reads the v10
  // shape, which is why clustering worked and hid this.
  const handleMapIdle = useCallback(
    (state: any) => {
      if (!onCameraChanged) return;
      const center = state?.properties?.center;
      const zoom = state?.properties?.zoom;
      if (
        !Array.isArray(center) ||
        typeof center[0] !== "number" ||
        typeof center[1] !== "number" ||
        isNaN(center[0]) ||
        isNaN(center[1]) ||
        typeof zoom !== "number" ||
        isNaN(zoom)
      ) {
        return;
      }

      // Parents typically feed the reported center straight back in as
      // `centerCoordinate`, and Mapbox's Camera re-issues a stop whenever that
      // array's IDENTITY changes — a same-place fly-to that fires idle again.
      // Reporting only real movement keeps that from becoming a loop.
      const prev = lastReportedRef.current;
      if (
        prev &&
        Math.abs(prev[0] - center[0]) < 1e-6 &&
        Math.abs(prev[1] - center[1]) < 1e-6 &&
        Math.abs(prev[2] - zoom) < 0.01
      ) {
        return;
      }
      lastReportedRef.current = [center[0], center[1], zoom];

      onCameraChanged([center[0], center[1]], zoom);
    },
    [onCameraChanged],
  );

  // Group markers that would land within CLUSTER_RADIUS_PX of each other at the
  // current zoom. Greedy single-pass — plenty for the ~100 markers MarkerView
  // can carry, and it re-runs only when the marker set or the zoom changes.
  const clusters = useMemo<Cluster[]>(() => {
    const list = (markers || []).filter(
      (m) =>
        Array.isArray(m.coordinates) &&
        !isNaN(m.coordinates[0]) &&
        !isNaN(m.coordinates[1]),
    );
    if (!list.length) return [];

    const pts = list.map((m) => ({
      m,
      p: projectPx(m.coordinates[0], m.coordinates[1], clusterZoom),
    }));
    const taken = new Array(pts.length).fill(false);
    const result: Cluster[] = [];

    for (let i = 0; i < pts.length; i++) {
      if (taken[i]) continue;
      taken[i] = true;
      const group = [pts[i]];

      for (let j = i + 1; j < pts.length; j++) {
        if (taken[j]) continue;
        const d = Math.hypot(pts[j].p.x - pts[i].p.x, pts[j].p.y - pts[i].p.y);
        if (d <= CLUSTER_RADIUS_PX) {
          taken[j] = true;
          group.push(pts[j]);
        }
      }

      const cx = group.reduce((s, g) => s + g.p.x, 0) / group.length;
      const cy = group.reduce((s, g) => s + g.p.y, 0) / group.length;

      let spreadPx = 0;
      for (let a = 0; a < group.length; a++) {
        for (let b = a + 1; b < group.length; b++) {
          spreadPx = Math.max(
            spreadPx,
            Math.hypot(
              group[a].p.x - group[b].p.x,
              group[a].p.y - group[b].p.y,
            ),
          );
        }
      }

      result.push({
        id: group.map((g) => g.m.id).join("+"),
        members: group.map((g) => g.m),
        center: unprojectPx(cx, cy, clusterZoom),
        centerPx: { x: cx, y: cy },
        spreadPx,
      });
    }

    return result;
  }, [markers, clusterZoom]);

  const handleClusterPress = useCallback(
    (cluster: Cluster) => {
      if (cluster.members.length === 1) {
        onSelectMarker?.(cluster.members[0]);
        return;
      }

      // spreadPx was measured at clusterZoom; rescale it to where the camera
      // actually is right now before deciding anything.
      const zoomNow = liveZoomRef.current;
      const spreadNow =
        cluster.spreadPx * Math.pow(2, zoomNow - clusterZoom);

      // Zoom exactly far enough to pull the group apart, when that's reachable.
      if (spreadNow > 0.5) {
        const needed =
          zoomNow + Math.log2((CLUSTER_RADIUS_PX * 1.8) / spreadNow);
        if (needed <= MAX_SEPARATION_ZOOM) {
          cameraRef.current?.setCamera({
            centerCoordinate: cluster.center,
            zoomLevel: Math.max(needed, zoomNow + 1),
            animationDuration: 600,
          });
          return;
        }
      }

      // Same point (or too tight for any zoom) — fan them out instead.
      setExpandedClusterId(cluster.id);
    },
    [clusterZoom, onSelectMarker],
  );

  const markerTitleOf = useCallback(
    (marker: MarkerData) =>
      typeof marker.title === "object"
        ? isRTL
          ? marker.title.ar
          : marker.title.en
        : marker.title,
    [isRTL],
  );

  // Automatically fit map to markers when they load
  useEffect(() => {
    // When the parent drives the camera via centerCoordinate (e.g. the explore
    // screen following the user's live GPS position), do NOT auto-fit to the
    // markers — doing so yanks the camera onto the chalets and locks it on a
    // fixed spot away from the user. Let the parent own the camera in that case.
    const centerProvided =
      !!centerCoordinate &&
      !isNaN(centerCoordinate[0]) &&
      !isNaN(centerCoordinate[1]);
    if (centerProvided) return;

    // Only auto-fit if we don't have a specific chalet selected
    if (markers && markers.length > 0 && cameraRef.current && !selectedChalet) {
      // Small delay to ensure map is ready
      const timer = setTimeout(() => {
        if (markers.length === 1) {
          cameraRef.current?.setCamera({
            centerCoordinate: markers[0].coordinates,
            zoomLevel: 14,
            animationDuration: 1000
          });
        } else {
          const { minLat, maxLat, minLng, maxLng } = markers.reduce(
            (bounds, m) => {
              const lng = m.coordinates[0];
              const lat = m.coordinates[1];
              return {
                minLat: Math.min(bounds.minLat, lat),
                maxLat: Math.max(bounds.maxLat, lat),
                minLng: Math.min(bounds.minLng, lng),
                maxLng: Math.max(bounds.maxLng, lng),
              };
            },
            {
              minLat: Infinity,
              maxLat: -Infinity,
              minLng: Infinity,
              maxLng: -Infinity,
            },
          );

          cameraRef.current?.fitBounds(
            [maxLng, maxLat], // North East
            [minLng, minLat], // South West
            Platform.OS === "ios" ? 80 : 100, // Padding
            1000, // Duration
          );
        }
      }, 800); // Increased delay for better stability
      return () => clearTimeout(timer);
    }
  }, [markers?.length, !!selectedChalet, centerCoordinate]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value
  }));

  const routeShape = React.useMemo(() => {
    if (!route) return null;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: route
        },
      ]
    };
  }, [route]);

  if (loading) {
    return (
      <View style={[styles.container, style, styles.loading]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Fallback for Expo Go / Web / Error

  if (!hasNativeMap || Platform.OS === "web") {
    const fallbackLng = centerCoordinate?.[0] || 47.85;
    const fallbackLat = centerCoordinate?.[1] || 30.5;
    const showStaticMarker =
      showMarker &&
      centerCoordinate &&
      !isNaN(centerCoordinate[0]) &&
      !isNaN(centerCoordinate[1]);
    const markerOverlay = showStaticMarker
      ? `pin-l+${Colors.primary.replace("#", "")}(${fallbackLng},${fallbackLat})/`
      : "";

    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <View style={styles.abstractMapBackground}>
          <Image
            source={{
              uri: `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markerOverlay}${fallbackLng},${fallbackLat},${zoomLevel}/800x800?access_token=${MAPBOX_ACCESS_TOKEN}`
            }}
            style={styles.fallbackImage}
            contentFit="cover"
          />
        </View>

        {/* Render markers */}
        {markers.map((marker, idx) => (
          <TouchableOpacity
            key={marker.id}
            onPress={() => onSelectMarker?.(marker)}
            style={[
              styles.customMarkerUI,
              {
                position: "absolute",
                top: 150 + idx * 100,
                left: 50 + idx * 40 * (idx % 2 === 0 ? 1 : -1)
              },
            ]}
          >
            <View style={styles.markerCircle}>
              <Image
                source={marker.image}
                style={styles.markerImage}
                contentFit="cover"
                transition={200}
              />
            </View>
            <ThemedText style={styles.markerTitle}>
              {typeof marker.title === "object"
                ? isRTL
                  ? marker.title.ar
                  : marker.title.en
                : marker.title}
            </ThemedText>
          </TouchableOpacity>
        ))}

        <View style={styles.fallbackOverlay}>
          <ThemedText style={styles.fallbackText}>
            Mapbox Live requires a Development Build
          </ThemedText>
        </View>
      </View>
    );
  }

  const hasValidCenter =
    centerCoordinate &&
    !isNaN(centerCoordinate[0]) &&
    !isNaN(centerCoordinate[1]);

  const finalCenter: [number, number] = hasValidCenter
    ? centerCoordinate
    : location
      ? [location.coords.longitude, location.coords.latitude]
      : [47.82, 30.51]; // Default to a central Basra point

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={
          isNavigating ? Mapbox.StyleURL.NavigationDay : Mapbox.StyleURL.Light
        }
        logoEnabled={false}
        attributionEnabled={false}
        onPress={handlePress}
        onMapLoadingError={handleMapLoadingError}
        onMapIdle={handleMapIdle}
        onCameraChanged={handleNativeCameraChanged}
      >
        {/* Immersive 3D Buildings - Temporarily disabled for debugging route */}
        {/*
        {isNavigating && (
          <Mapbox.FillExtrusionLayer
            id="3d-buildings"
            sourceID="composite"
            sourceLayerID="building"
            filter={['==', 'extrude', 'true']}
            style={{
              fillExtrusionColor: '#D1D5DB',
              fillExtrusionHeight: ['get', 'height'],
              fillExtrusionBase: ['get', 'min_height'],
              fillExtrusionOpacity: 0.6 }}
          />
        )}
        */}
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={isNavigating ? 18 : zoomLevel}
          centerCoordinate={isNavigating ? undefined : finalCenter}
          followUserLocation={isNavigating}
          followUserMode={isNavigating ? "course" : "normal"}
          followPitch={isNavigating ? 70 : 0}
          animationMode="flyTo"
          animationDuration={1500}
        />

        {/* User Location Marker - Using MarkerView for custom UI and reliability */}
        {location && (
          <Mapbox.MarkerView
            id="user-location"
            coordinate={[location.coords.longitude, location.coords.latitude]}
          >
            <View
              style={[
                styles.userLocationMarker,
                isNavigating &&
                location.coords.heading !== null && {
                  transform: [{ rotate: `${location.coords.heading}deg` }]
                },
              ]}
            >
              {/* Premium Pulse for driving mode */}
              <Animated.View
                style={[
                  styles.userLocationPulse,
                  pulseStyle,
                  {
                    backgroundColor: isNavigating
                      ? "rgba(59, 130, 246, 0.4)"
                      : Colors.primary
                  },
                ]}
              />

              {/* Navigation Puck style to match screenshot */}
              <View
                style={[styles.userLocationDot, isNavigating && styles.navPuck]}
              >
                {isNavigating && <View style={styles.puckArrow} />}
              </View>

              {/* Static Heading Arrow (for non-navigation) */}
              {!isNavigating &&
                location.coords.heading !== null &&
                location.coords.heading >= 0 && (
                  <View
                    style={[
                      styles.headingArrowContainer,
                      {
                        transform: [
                          { rotate: `${location.coords.heading}deg` },
                        ]
                      },
                    ]}
                  >
                    <View style={styles.headingArrow} />
                  </View>
                )}
            </View>
          </Mapbox.MarkerView>
        )}

        {/* Single Marker for center coordinate if requested and no markers provided */}
        {showMarker && hasValidCenter && markers.length === 0 && (
          <Mapbox.MarkerView id="centerMarker" coordinate={centerCoordinate}>
            <View style={styles.simpleMarker}>
              <View
                style={[styles.markerPin, { backgroundColor: Colors.primary }]}
              />
              <View
                style={[styles.markerDot, { backgroundColor: Colors.primary }]}
              />
            </View>
          </Mapbox.MarkerView>
        )}

        {/* Render all active markers, grouped by proximity */}
        {clusters.map((cluster) => {
          // Expanded group: each member fanned out around the shared anchor so
          // co-located chalets become individually tappable.
          if (expandedClusterId === cluster.id && cluster.members.length > 1) {
            return cluster.members.map((member, index) => {
              const angle =
                (2 * Math.PI * index) / cluster.members.length - Math.PI / 2;
              const coordinate = unprojectPx(
                cluster.centerPx.x + Math.cos(angle) * SPIDER_RADIUS_PX,
                cluster.centerPx.y + Math.sin(angle) * SPIDER_RADIUS_PX,
                clusterZoom,
              );
              return (
                <Mapbox.MarkerView
                  key={`${cluster.id}:${member.id}`}
                  id={`${cluster.id}:${member.id}`}
                  coordinate={coordinate}
                  anchor={{ x: 0.5, y: 0.5 }}
                  allowOverlap
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectMarker?.(member)}
                    style={styles.customMarkerUI}
                  >
                    <View style={styles.markerCircle}>
                      <Image
                        source={member.image}
                        style={styles.markerImage}
                        contentFit="cover"
                        transition={300}
                      />
                    </View>
                    <ThemedText style={styles.markerTitle}>
                      {markerTitleOf(member)}
                    </ThemedText>
                  </TouchableOpacity>
                </Mapbox.MarkerView>
              );
            });
          }

          const head = cluster.members[0];
          const count = cluster.members.length;

          return (
            <Mapbox.MarkerView
              key={cluster.id}
              id={cluster.id}
              coordinate={cluster.center}
              anchor={{ x: 0.5, y: 0.5 }}
              // Without this, Mapbox silently DROPS any marker that overlaps one
              // already drawn — chalets one street apart just vanish from the
              // map. Clutter is recoverable (zoom in), a missing listing is not.
              allowOverlap
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleClusterPress(cluster)}
                style={styles.customMarkerUI}
              >
                <View>
                  <View style={styles.markerCircle}>
                    <Image
                      source={head.image}
                      style={styles.markerImage}
                      contentFit="cover"
                      transition={300}
                    />
                  </View>
                  {count > 1 && (
                    <View style={styles.clusterBadge}>
                      <ThemedText style={styles.clusterBadgeText}>
                        {count}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.markerTitle}>
                  {count > 1
                    ? isRTL
                      ? `${count} شاليهات`
                      : `${count} chalets`
                    : markerTitleOf(head)}
                </ThemedText>
              </TouchableOpacity>
            </Mapbox.MarkerView>
          );
        })}

        {/* Route Source - Moved to bottom for max z-index */}
        {routeShape && (
          <Mapbox.ShapeSource
            id="routeSource"
            key={route ? "route-active" : "route-inactive"}
            shape={routeShape}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: "#3B82F6",
                lineWidth: 10,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 1
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
};

// Memoized so the preview map only re-renders when its props actually change.
// Combined with stable handlers/markers from callers, this prevents the map
// from redrawing its markers on unrelated parent updates (e.g. camera changes).
export const AppMap = React.memo(AppMapComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    overflow: "hidden"
  },
  map: {
    flex: 1,
    // MUST stay 'ltr' — the one deliberate exception to the app-wide `direction`
    // contract (docs/RTL.md). In Arabic the root sets `direction: 'rtl'`, and on
    // Android Fabric pushes that down as a native
    // `View.setLayoutDirection(LAYOUT_DIRECTION_RTL)` onto RNMBXMapView, which
    // Mapbox's internal MapView + its view-annotation FrameLayout inherit.
    // MarkerViews are positioned with `setTranslationX/Y` ON TOP OF that
    // FrameLayout's own layout pass, whose default child gravity (TOP|START)
    // resolves to TOP|RIGHT under RTL — so every marker is laid out from the
    // right edge first and ends up displaced horizontally by ~(mapWidth -
    // markerWidth). Latitude/Y stays correct, longitude/X does not: chalets
    // render hundreds of km east of where they are. iOS positions annotation
    // subviews by frame, so it was never affected. Pinning the map subtree to
    // LTR makes the FrameLayout resolve START as LEFT again.
    direction: "ltr"
  },
  loading: {
    justifyContent: "center",
    alignItems: "center"
  },
  fallbackContainer: {
    position: "relative",
    height: "100%",
    width: "100%",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center"
  },
  abstractMapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8F9FA"
  },
  fallbackImage: {
    width: "100%",
    height: "100%",
    opacity: 0.9
  },
  customMarkerUI: {
    alignItems: "center",
    justifyContent: "center",
    width: 100
  },
  markerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  markerImage: {
    width: "100%",
    height: "100%"
  },
  // Sits OUTSIDE markerCircle (which clips with overflow:'hidden').
  clusterBadge: {
    position: "absolute",
    top: -4,
    end: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    ...SafeShadows.small
  },
  clusterBadgeText: {
    color: "white",
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "Alexandria-Bold"
  },
  markerTitle: {
    fontSize: 8,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    marginTop: 6,
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    ...SafeShadows.small
  },
  fallbackOverlay: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  fallbackText: {
    fontSize: 8,
    color: "#6B7280",
    fontFamily: "Alexandria-Medium",
    textAlign: "center"
  },
  fabContainer: {
    position: "absolute",
    bottom: normalize.height(100),
    right: normalize.width(16),
    left: normalize.width(16),
    flexDirection: "row",
    justifyContent: "center"
  },
  fab: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    ...SafeShadows.medium,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    gap: 8
  },
  fabActive: {
    backgroundColor: Theme.Colors.primary,
    borderColor: Theme.Colors.primary
  },
  fabText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium"
  },
  userLocationMarker: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.Colors.primary,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 2,
    ...SafeShadows.small
  },
  userLocationPulse: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.Colors.primary,
    zIndex: 1
  },
  simpleMarker: {
    alignItems: "center",
    justifyContent: "center"
  },
  markerPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.Colors.primary,
    borderWidth: 3,
    borderColor: "white",
    ...SafeShadows.medium
  },
  navPuck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center"
  },
  puckArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "white",
    transform: [{ translateY: -2 }]
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.Colors.primary,
    position: "absolute",
    bottom: -10
  },
  headingArrowContainer: {
    position: "absolute",
    top: -10,
    width: 20,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 10
  },
  headingArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Theme.Colors.primary
  }
});
