// services/locationService.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME, LOCATION_TRACKING_INTERVAL_MS, LOCATION_LOG_KEY } from '@/constants/values';

export async function requestPermissions() {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') throw new Error('Foreground location permission denied');

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') console.warn('Background location permission not fully granted');
    return { fg, bg };
}

export async function startBackgroundLocation() {
    const registered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (registered) {
        console.log('[locationService] already registered');
        return;
    }

    await requestPermissions();

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: LOCATION_TRACKING_INTERVAL_MS,
        distanceInterval: 0,
        pausesUpdatesAutomatically: false,
        // Android foreground service (recommended)
        foregroundService: {
            notificationTitle: 'Location tracking active',
            notificationBody: 'Your location is being tracked.',
        },
        showsBackgroundLocationIndicator: true, // iOS
    });

    console.log('[locationService] started');
}

export async function stopBackgroundLocation() {
    const registered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!registered) return;
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[locationService] stopped');
}

export async function readLocationLogs(): Promise<any[]> {
    try {
        const raw = await AsyncStorage.getItem(LOCATION_LOG_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.error('[locationService] read error', e);
        return [];
    }
}

export async function clearLocationLogs() {
    try {
        await AsyncStorage.removeItem(LOCATION_LOG_KEY);
    } catch (e) {
        console.error('[locationService] clear error', e);
    }
}
