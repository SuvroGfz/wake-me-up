// services/locationService.ts
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { Coordinates } from '@/models/Alarm';

/**
 * Request location permissions
 */
export const requestLocationPermissions = async (): Promise<{
    foreground: boolean;
    background: boolean;
}> => {
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        return {
            foreground: foregroundStatus === 'granted',
            background: backgroundStatus === 'granted',
        };
    } catch (error) {
        console.error('[LocationService] Permission request failed:', error);
        return { foreground: false, background: false };
    }
};

/**
 * Check if location permissions are granted
 */
export const checkLocationPermissions = async (): Promise<{
    foreground: boolean;
    background: boolean;
}> => {
    try {
        const foreground = await Location.getForegroundPermissionsAsync();
        const background = await Location.getBackgroundPermissionsAsync();

        return {
            foreground: foreground.status === 'granted',
            background: background.status === 'granted',
        };
    } catch (error) {
        console.error('[LocationService] Permission check failed:', error);
        return { foreground: false, background: false };
    }
};

/**
 * Get current location
 */
export const getCurrentLocation = async (): Promise<Coordinates | null> => {
    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('[LocationService] Failed to get location:', error);
        return null;
    }
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
    from: Coordinates,
    to: Coordinates
): number => {
    return getDistance(from, to);
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
};

/**
 * Check if location is within proximity threshold
 */
export const isWithinProximity = (
    current: Coordinates,
    target: Coordinates,
    thresholdMeters: number
): boolean => {
    const distance = calculateDistance(current, target);
    return distance <= thresholdMeters;
};