// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import notifee, {
    AndroidImportance,
    AndroidCategory,
    AndroidFlags,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {Alarm} from '@/models/Alarm';
import {
    ALARM_NOTIFICATION_CHANNEL,
    STOP_ALARM_ACTION
} from '@/constants/values';

// Notifee channel ID for full-screen alarms
const NOTIFEE_ALARM_CHANNEL = 'full-screen-alarms';

/**
 * Setup notification channel for Android (expo-notifications — used for non-alarm notifications)
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
 * Send alarm triggered notification via Notifee (full-screen intent for lock screen)
 */
export const sendAlarmNotification = async (alarm: Alarm): Promise<string> => {
    // Create the Notifee channel (idempotent — safe to call every time)
    const channelId = await notifee.createChannel({
        id: NOTIFEE_ALARM_CHANNEL,
        name: 'Full Screen Alarms',
        importance: AndroidImportance.HIGH,
        bypassDnd: true,
        vibration: true,
        vibrationPattern: [300, 400, 300, 400],
        lights: true,
        lightColor: '#dc2626',
    });

    const notificationId = await notifee.displayNotification({
        title: `🚨 ${alarm.title}`,
        body: `Wake up! You've reached your destination!`,
        data: {
            alarmId: alarm.id,
            type: 'location_alarm_triggered',
        },
        android: {
            channelId,
            category: AndroidCategory.ALARM,
            fullScreenAction: {
                id: 'default',
                launchActivity: 'default', // Launches MainActivity (with showWhenLocked)
            },
            ongoing: true,              // Cannot be swiped away
            flags: [AndroidFlags.FLAG_INSISTENT],
            importance: AndroidImportance.HIGH,
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
        },
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
 * Cancel all notifications (both expo-notifications and notifee)
 */
export const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.dismissAllNotificationsAsync();
    await notifee.cancelAllNotifications();
};

/**
 * Schedule a persistent notification for ongoing alarm (expo-notifications)
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
                vibrationPattern: [300, 400, 300, 400], // supplemental — audioService handles vibration
            }
        },
        trigger: null
    });
};
