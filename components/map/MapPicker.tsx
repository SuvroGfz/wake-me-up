// components/map/MapPicker.tsx
// Uber/Pathao-style location picker with a center pin that stays fixed
// while the user pans the map. Tap "Confirm" to lock the location.
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Map, Camera, UserLocation, ViewAnnotation, GeoJSONSource, Layer, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { MAP_STYLE } from '@/constants/mapStyle';
import { loadAlarms } from '@/services/alarmService';
import { PROXIMITY_THRESHOLD_METERS } from '@/constants/values';
import type { Alarm } from '@/models/Alarm';

/**
 * Generate a GeoJSON polygon approximating a circle.
 */
function createCirclePolygon(
  center: [number, number],
  radiusMeters: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusMeters / 111320) * Math.cos(angle);
    const dLng = (radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

interface MapPickerProps {
  onSelect: (coords: { latitude: number; longitude: number }) => void;
  onClose?: () => void;
}

export default function MapPicker({ onSelect, onClose }: MapPickerProps) {
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [centerCoord, setCenterCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [existingAlarms, setExistingAlarms] = useState<Alarm[]>([]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const isMounted = useRef(true);

  // Pin bounce animation
  const pinBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMounted.current) return;
      if (status !== 'granted') return;
      setLocationPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({});
      if (!isMounted.current) return;
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setCurrentLocation(coords);
      setCenterCoord(coords);

      // Load existing alarms to show on map
      const alarms = await loadAlarms();
      if (!isMounted.current) return;
      setExistingAlarms(alarms);
    })();
  }, []);

  // Animate pin when dragging starts/stops
  const animatePinUp = useCallback(() => {
    setIsDragging(true);
    Animated.spring(pinBounce, {
      toValue: -12,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [pinBounce]);

  const animatePinDown = useCallback(() => {
    setIsDragging(false);
    Animated.spring(pinBounce, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [pinBounce]);

  // Called when the map camera finishes moving
  const handleRegionDidChange = useCallback((event: any) => {
    animatePinDown();
    // v11 API: event.nativeEvent is a ViewStateChangeEvent with center: [lng, lat]
    const nativeEvent = event?.nativeEvent;
    if (nativeEvent?.center) {
      const [longitude, latitude] = nativeEvent.center;
      console.log(`[MapPicker] Region changed → lat: ${latitude.toFixed(6)}, lng: ${longitude.toFixed(6)}`);
      setCenterCoord({ latitude, longitude });
    }
  }, [animatePinDown]);

  const handleRegionWillChange = useCallback(() => {
    animatePinUp();
  }, [animatePinUp]);

  const handleConfirm = async () => {
    // Use mapRef.getCenter() as the authoritative source of truth
    // This is more reliable than tracking onRegionDidChange events
    if (mapRef.current) {
      try {
        const center = await mapRef.current.getCenter();
        const [longitude, latitude] = center;
        console.log(`[MapPicker] Confirmed → lat: ${latitude.toFixed(6)}, lng: ${longitude.toFixed(6)}`);
        onSelect({ latitude, longitude });
        return;
      } catch (e) {
        console.warn('[MapPicker] getCenter failed, using tracked center', e);
      }
    }
    // Fallback to tracked state
    if (centerCoord) {
      onSelect(centerCoord);
    }
  };

  const handleSnapToUser = () => {
    if (!currentLocation) return;
    cameraRef.current?.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 16,
      duration: 1000,
    });
  };

  if (!currentLocation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loaderText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <Map
        ref={mapRef}
        style={styles.map}
        logo={false}
        attribution={false}
        mapStyle={MAP_STYLE as any}
        onRegionWillChange={handleRegionWillChange}
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [currentLocation.longitude, currentLocation.latitude],
            zoom: 16,
          }}
        />
        {/* User location — only after permission to avoid native SIGSEGV */}
        {locationPermissionGranted && <UserLocation visible={true} />}

        {/* Geofence circles — Active alarms (green) */}
        {(() => {
          const activeAlarms = existingAlarms.filter(a => a.active && a.coords?.latitude && a.coords?.longitude);
          if (activeAlarms.length === 0) return null;
          const geoJSON = {
            type: 'FeatureCollection' as const,
            features: activeAlarms.map(a => createCirclePolygon(
              [a.coords.longitude, a.coords.latitude],
              (a as any).radius || PROXIMITY_THRESHOLD_METERS
            )),
          };
          return (
            <GeoJSONSource id="picker-active-geofences" data={geoJSON}>
              <Layer id="picker-active-fill" type="fill" style={{ fillColor: 'rgba(34, 197, 94, 0.35)' }} />
              <Layer id="picker-active-border" type="line" style={{ lineColor: 'rgba(34, 197, 94, 0.8)', lineWidth: 2 }} />
            </GeoJSONSource>
          );
        })()}

        {/* Geofence circles — Disabled alarms (red) */}
        {(() => {
          const disabledAlarms = existingAlarms.filter(a => !a.active && a.coords?.latitude && a.coords?.longitude);
          if (disabledAlarms.length === 0) return null;
          const geoJSON = {
            type: 'FeatureCollection' as const,
            features: disabledAlarms.map(a => createCirclePolygon(
              [a.coords.longitude, a.coords.latitude],
              (a as any).radius || PROXIMITY_THRESHOLD_METERS
            )),
          };
          return (
            <GeoJSONSource id="picker-disabled-geofences" data={geoJSON}>
              <Layer id="picker-disabled-fill" type="fill" style={{ fillColor: 'rgba(239, 68, 68, 0.3)' }} />
              <Layer id="picker-disabled-border" type="line" style={{ lineColor: 'rgba(239, 68, 68, 0.7)', lineWidth: 2 }} />
            </GeoJSONSource>
          );
        })()}

        {/* Existing alarm markers */}
        {existingAlarms.map((alarm) => {
          if (!alarm.coords?.latitude || !alarm.coords?.longitude) return null;
          return (
            <ViewAnnotation
              key={`picker-alarm-${alarm.id}`}
              id={`picker-alarm-${alarm.id}`}
              lngLat={[alarm.coords.longitude, alarm.coords.latitude]}
              anchor="bottom"
            >
            <View style={styles.alarmMarker}>
              <View style={[
                styles.alarmMarkerDot,
                { backgroundColor: alarm.active ? '#22c55e' : '#ef4444' }
              ]} />
              <Text style={styles.alarmMarkerLabel}>{alarm.title}</Text>
            </View>
          </ViewAnnotation>
          );
        })}
      </Map>

      {/* Center Pin — fixed on screen, NOT a map marker */}
      <View style={styles.pinContainer} pointerEvents="none">
        <Animated.View style={[styles.pinWrapper, { transform: [{ translateY: pinBounce }] }]}>
          {/* Pin shadow */}
          <View style={[styles.pinShadow, isDragging && styles.pinShadowLifted]} />
          {/* Pin body */}
          <View style={styles.pin}>
            <View style={styles.pinHead}>
              <View style={styles.pinDot} />
            </View>
            <View style={styles.pinNeedle} />
          </View>
        </Animated.View>
      </View>

      {/* Top bar with close button */}
      <View style={styles.topBar}>
        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
        <View style={styles.topTitle}>
          <Text style={styles.topTitleText}>Pick Destination</Text>
          <Text style={styles.topSubtext}>Move the map to position the pin</Text>
        </View>
      </View>

      {/* My location button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={handleSnapToUser}>
        <Text style={styles.myLocationText}>📍</Text>
      </TouchableOpacity>

      {/* Bottom bar with coordinates + confirm */}
      <View style={styles.bottomBar}>
        <View style={styles.coordsBox}>
          <Text style={styles.coordsLabel}>📌 Selected Location</Text>
          {centerCoord ? (
            <Text style={styles.coordsText}>
              {centerCoord.latitude.toFixed(6)}, {centerCoord.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.coordsText}>Move map to select...</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, !centerCoord && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!centerCoord}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmBtnText}>✓ Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },

  // ---- Center Pin ----
  pinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinWrapper: {
    alignItems: 'center',
    // Offset to account for pin height — pin tip should be at exact center
    marginTop: -48,
  },
  pin: {
    alignItems: 'center',
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  pinNeedle: {
    width: 4,
    height: 18,
    backgroundColor: '#dc2626',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  pinShadow: {
    position: 'absolute',
    bottom: -6,
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pinShadowLifted: {
    width: 12,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    bottom: -12,
  },

  // ---- Top Bar ----
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '600',
  },
  topTitle: {
    flex: 1,
  },
  topTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  topSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },

  // ---- My Location Button ----
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationText: {
    fontSize: 22,
  },

  // ---- Bottom Bar ----
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  coordsBox: {
    marginBottom: 14,
  },
  coordsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  confirmBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // ---- Alarm Markers ----
  alarmMarker: {
    alignItems: 'center',
  },
  alarmMarkerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  alarmMarkerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },
});
