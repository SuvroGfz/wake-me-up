// services/permissions.ts
import { Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const requestPermissions = async () => {
    try {
        if (Platform.OS === 'android') {
            // Display over other apps (SYSTEM_ALERT_WINDOW)
            if (Platform.Version >= 23) {
                const overlayGranted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
                );
                console.log('[Permissions] Overlay:', overlayGranted);
            }

            // Background location
            const { status: bgStatus } =
                await Location.requestBackgroundPermissionsAsync();
            console.log('[Permissions] Background location:', bgStatus);
        }

        if (Platform.OS === 'ios') {
            // Notification + background location
            await Notifications.requestPermissionsAsync();
            const { status: bgStatus } =
                await Location.requestBackgroundPermissionsAsync();
            console.log('[Permissions] iOS background location:', bgStatus);
        }
    } catch (e) {
        console.error('[Permissions] Error:', e);
    }
};
