// background/startLocationTracking.ts
import * as Location from 'expo-location';
import { requestLocationPermissions } from '@/services/locationService';
import {
    LOCATION_TASK_NAME,
    MIN_DISTANCE_INTERVAL
} from '@/constants/values';

/**
 * Start background location tracking
 */
export const startBackgroundLocationTracking = async (): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Request permissions
        const permissions = await requestLocationPermissions();

        if (!permissions.foreground) {
            return {
                success: false,
                error: 'Foreground location permission not granted',
            };
        }

        if (!permissions.background) {
            return {
                success: false,
                error: 'Background location permission not granted',
            };
        }

        // Check if already running
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

        if (isRunning) {
            console.log('[Tracking] Already running');
            return { success: true };
        }

        // Start location updates
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            distanceInterval: MIN_DISTANCE_INTERVAL,
            deferredUpdatesInterval: 5000,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: '📍 Location Alarm Active',
                notificationBody: 'Tracking your location for destination alarms',
                notificationColor: '#007AFF',
            },
        });

        console.log('[Tracking] Started successfully');
        return { success: true };
    } catch (error) {
        console.error('[Tracking] Failed to start:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

/**
 * Stop background location tracking
 */
export const stopBackgroundLocationTracking = async (): Promise<boolean> => {
    try {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

        if (!isRunning) {
            console.log('[Tracking] Not running');
            return true;
        }

        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[Tracking] Stopped successfully');
        return true;
    } catch (error) {
        console.error('[Tracking] Failed to stop:', error);
        return false;
    }
};

/**
 * Check if tracking is active
 */
export const isTrackingActive = async (): Promise<boolean> => {
    try {
        return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
        console.error('[Tracking] Failed to check status:', error);
        return false;
    }
};