// background/startLocationTracking.ts
import * as Location from 'expo-location';
import {LOCATION_TASK_NAME} from '@/constants/values';

export async function startBackgroundLocationTracking() {
    const {status: fg} = await Location.requestForegroundPermissionsAsync();
    const {status: bg} = await Location.requestBackgroundPermissionsAsync();

    if (fg !== 'granted' || bg !== 'granted') {
        console.warn('[Tracking] Location permissions not granted');
        return;
    }

    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!started) {
        console.log('[Tracking] Starting location updates');
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // meters between updates
            deferredUpdatesInterval: 10000,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Location Alarm Active',
                notificationBody: 'Tracking your location for destination alarms.',
            },
        });
    } else {
        console.log('[Tracking] Already running');
    }
}
