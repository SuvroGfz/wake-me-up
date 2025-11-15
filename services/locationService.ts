// services/locationService.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { LOCATION_TASK_NAME, LOCATION_TRACKING_INTERVAL_MS } from '@/constants/values';

export async function requestLocationPermissions() {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') throw new Error('Foreground location permission denied');

    // Android requires separate background permission (and on Android 11+ special),
    // on iOS you may request "Always" later.
    if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
            // still proceed — but background updates will be limited
            console.warn('Background location permission not granted on Android');
        }
    } else {
        // iOS: requestAlways if you plan to run in background long-term
        try {
            await Location.requestBackgroundPermissionsAsync();
        } catch {
            // not available pre-iOS 13, safe to ignore
        }
    }
    return true;
}

export async function startBackgroundLocation() {
    // Ensure permissions have been requested
    await requestLocationPermissions();

    // If already running, don't start again
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced, // choose appropriate
        timeInterval: LOCATION_TRACKING_INTERVAL_MS,
        distanceInterval: 0,
        foregroundService: {
            // Android: this shows a persistent notification while tracking (required for long running)
            notificationTitle: 'Location tracking active',
            notificationBody: 'Your location is being used to trigger alarms',
            notificationColor: '#FF3B30',
        },
        showsBackgroundLocationIndicator: true, // iOS: shows ind. in status bar
        pausesUpdatesAutomatically: false,
        // may add deferredUpdatesInterval etc.
    });
}

export async function stopBackgroundLocation() {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (started) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
}
