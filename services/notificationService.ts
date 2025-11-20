// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {Alarm} from '@/models/Alarm';
import {
    ALARM_NOTIFICATION_CHANNEL,
    STOP_ALARM_ACTION
} from '@/constants/values';

/**
 * Setup notification channel for Android
 */
export const setupNotificationChannel = async (): Promise<void> => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL, {
            name: 'Location Alarms',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#dc2626',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            enableLights: true,
            enableVibrate: true,
        });
    }
};

/**
 * Setup notification categories with actions
 */
export const setupNotificationCategories = async (): Promise<void> => {
    await Notifications.setNotificationCategoryAsync('alarm-triggered', [
        {
            identifier: STOP_ALARM_ACTION,
            buttonTitle: '🛑 Stop Alarm',
            options: {
                isDestructive: true,
                isAuthenticationRequired: false,
            },
        },
    ]);
};

/**
 * Send alarm triggered notification
 */
export const sendAlarmNotification = async (alarm: Alarm): Promise<string> => {
    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: `🚨 ${alarm.title}`,
            body: `Wake up! You've reached your destination!`,
            data: {
                alarmId: alarm.id,
                type: 'location_alarm_triggered',
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            categoryIdentifier: 'alarm-triggered',
            sticky: true, // Notification persists until dismissed
        },
        trigger: null, // Immediate notification
    });

    return notificationId;
};

/**
 * Cancel a specific notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
    await Notifications.dismissNotificationAsync(notificationId);
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.dismissAllNotificationsAsync();
};

/**
 * Schedule a persistent notification for ongoing alarm
 */
export const showPersistentAlarmNotification = async (alarm: Alarm): Promise<string> => {
    return await Notifications.scheduleNotificationAsync({
        content: {
            title: `🔔 ${alarm.title} - RINGING`,
            body: 'Tap to open or use Stop Alarm button',
            data: {
                alarmId: alarm.id,
                type: 'alarm_active',
                persistent: true,
            },
            sound: false, // sound handled by audioService
            categoryIdentifier: 'alarm-triggered',
            // Android-specific options must go under `android` object
            android: {
                channelId: ALARM_NOTIFICATION_CHANNEL,
                priority: Notifications.AndroidNotificationPriority.MAX,
                sticky: true,       // keep notification visible
                autoCancel: false,  // do not auto dismiss
                vibrationPattern: [0, 400, 200, 400], // supplemental — audioService handles vibration, but put for notification drive
                // Note: full-screen intent not available via expo-notifications JS API
            }
        },
        trigger: null
    });
};
