// components/map/MapViewer.tsx
// Native MapLibre map for viewing all alarms with geofences, user location, and controls.
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import {
  Map,
  Camera,
  UserLocation,
  ViewAnnotation,
  Marker,
  GeoJSONSource,
  Layer,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { MAP_STYLE } from '@/constants/mapStyle';
import { PROXIMITY_THRESHOLD_METERS } from '@/constants/values';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface Alarm {
  id: string;
  title: string;
  coords: LatLng;
  active: boolean;
  radius?: number;
}

interface MapViewerProps {
  alarms: Alarm[];
  height?: number;
  onOpenAlarm?: (alarmId: string) => void;
}

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
    const dLng =
      (radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180))) *
      Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

export default function MapViewer({ alarms, height = 300, onOpenAlarm }: MapViewerProps) {
  const cameraRef = useRef<CameraRef>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [hasSnappedOnce, setHasSnappedOnce] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const filteredAlarms = useMemo(
    () =>
      alarms.filter((a) => {
        if (filter === 'all') return true;
        if (filter === 'active') return a.active;
        if (filter === 'disabled') return !a.active;
        return true;
      }),
    [alarms, filter]
  );

  // ---- Build geofence GeoJSON ----
  const activeGeofenceGeoJSON = useMemo(() => {
    const activeAlarms = filteredAlarms.filter(
      (a) => a.active && a.coords?.latitude && a.coords?.longitude
    );
    if (activeAlarms.length === 0) return null;

    const features = activeAlarms.map((alarm) =>
      createCirclePolygon(
        [alarm.coords.longitude, alarm.coords.latitude],
        alarm.radius || PROXIMITY_THRESHOLD_METERS
      )
    );

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [filteredAlarms]);

  const disabledGeofenceGeoJSON = useMemo(() => {
    const disabledAlarms = filteredAlarms.filter(
      (a) => !a.active && a.coords?.latitude && a.coords?.longitude
    );
    if (disabledAlarms.length === 0) return null;

    const features = disabledAlarms.map((alarm) =>
      createCirclePolygon(
        [alarm.coords.longitude, alarm.coords.latitude],
        alarm.radius || PROXIMITY_THRESHOLD_METERS
      )
    );

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [filteredAlarms]);

  // ---- Location polling ----
  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMounted.current) return;
      if (status !== 'granted') return;
      setLocationPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({});
      if (!isMounted.current) return;
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err) {
      console.warn('[MapViewer] Failed to get location', err);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [fetchLocation]);

  // ---- Snap to user on first load ----
  useEffect(() => {
    if (!userLocation || hasSnappedOnce) return;
    cameraRef.current?.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
      duration: 1500,
    });
    setHasSnappedOnce(true);
  }, [userLocation, hasSnappedOnce]);

  // ---- Button handlers ----
  const snapToUser = () => {
    if (!userLocation) return;
    cameraRef.current?.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
      duration: 1500,
    });
  };

  const snapToAlarms = () => {
    if (filteredAlarms.length === 0) return;
    const lngs = filteredAlarms.map((a) => a.coords.longitude);
    const lats = filteredAlarms.map((a) => a.coords.latitude);

    let west = Math.min(...lngs);
    let south = Math.min(...lats);
    let east = Math.max(...lngs);
    let north = Math.max(...lats);

    const MIN_SPREAD = 0.005;
    if (east - west < MIN_SPREAD) {
      const midLng = (east + west) / 2;
      west = midLng - MIN_SPREAD / 2;
      east = midLng + MIN_SPREAD / 2;
    }
    if (north - south < MIN_SPREAD) {
      const midLat = (north + south) / 2;
      south = midLat - MIN_SPREAD / 2;
      north = midLat + MIN_SPREAD / 2;
    }

    const bounds: [number, number, number, number] = [west, south, east, north];
    cameraRef.current?.fitBounds(bounds, {
      padding: { top: 80, right: 80, bottom: 80, left: 80 },
      duration: 1500,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Map fills entire area */}
      <Map
        style={{ flex: 1 }}
        logo={false}
        attribution={false}
        mapStyle={MAP_STYLE as any}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: userLocation
              ? [userLocation.longitude, userLocation.latitude]
              : [90.4125, 23.8103],
            zoom: 12,
          }}
        />

        {locationPermissionGranted && <UserLocation visible={true} />}

        {/* Geofence circles — Active alarms (green) */}
        {activeGeofenceGeoJSON && (
          <GeoJSONSource id="active-geofences" data={activeGeofenceGeoJSON}>
            <Layer
              id="active-geofence-fill"
              type="fill"
              style={{
                fillColor: 'rgba(34, 197, 94, 0.35)',
              }}
            />
            <Layer
              id="active-geofence-border"
              type="line"
              style={{
                lineColor: 'rgba(34, 197, 94, 0.8)',
                lineWidth: 2,
              }}
            />
          </GeoJSONSource>
        )}

        {/* Geofence circles — Disabled alarms (red) */}
        {disabledGeofenceGeoJSON && (
          <GeoJSONSource id="disabled-geofences" data={disabledGeofenceGeoJSON}>
            <Layer
              id="disabled-geofence-fill"
              type="fill"
              style={{
                fillColor: 'rgba(239, 68, 68, 0.3)',
              }}
            />
            <Layer
              id="disabled-geofence-border"
              type="line"
              style={{
                lineColor: 'rgba(239, 68, 68, 0.7)',
                lineWidth: 2,
              }}
            />
          </GeoJSONSource>
        )}

        {/* Alarm markers */}
        {filteredAlarms.map((alarm) => {
          if (!alarm.coords?.latitude || !alarm.coords?.longitude) return null;
          return (
            <Marker
              key={`marker-${alarm.id}`}
              id={`marker-${alarm.id}`}
              lngLat={[alarm.coords.longitude, alarm.coords.latitude]}
              anchor="bottom"
              onPress={() => onOpenAlarm?.(alarm.id)}
            >
              <View style={styles.markerWrapper}>
                <View
                  style={[
                    styles.markerLabel,
                    { backgroundColor: alarm.active ? '#22c55e' : '#ef4444' },
                  ]}
                >
                  <Text style={styles.markerLabelText} numberOfLines={1}>
                    {alarm.title}
                  </Text>
                  <Text style={styles.markerStatusText}>
                    {alarm.active ? '● Active' : '○ Disabled'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.markerPin,
                    { backgroundColor: alarm.active ? '#22c55e' : '#ef4444' },
                  ]}
                />
                <View style={[
                  styles.markerArrow,
                  {
                    borderTopColor: alarm.active ? '#22c55e' : '#ef4444',
                  },
                ]} />
              </View>
            </Marker>
          );
        })}
      </Map>

      {/* Filter row — absolute overlay on top of map */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'disabled'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Control buttons — absolute overlay */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={snapToUser}>
          <Text style={styles.buttonText}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={snapToAlarms}>
          <Text style={styles.buttonText}>🗺️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={fetchLocation}>
          <Text style={styles.buttonText}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 30) + 5,
    left: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 12,
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: '#3b82f6' },
  filterText: { color: 'black', fontWeight: '600' },
  filterTextActive: { color: 'white' },
  buttonsContainer: { position: 'absolute', bottom: 20, right: 10 },
  button: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: { color: 'white', fontSize: 24 },
  markerWrapper: {
    alignItems: 'center',
  },
  markerLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerLabelText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 120,
  },
  markerStatusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '500',
  },
  markerPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -1,
  },
});
