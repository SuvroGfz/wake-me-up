// services/alarmManagerService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getAlarmById,
    updateAlarm,
    markAlarmTriggered
} from '@/services/alarmService';
import { playAlarmSound, stopAlarmSound } from '@/services/audioService';
import {
    sendAlarmNotification,
    showPersistentAlarmNotification,
    cancelAllNotifications
} from '@/services/notificationService';
import { ACTIVE_ALARM_KEY } from '@/constants/values';

/**
 * Trigger an alarm (sound + notification + popup)
 */
export const triggerAlarm = async (alarmId: string): Promise<boolean> => {
    try {
        const alarm = await getAlarmById(alarmId);

        if (!alarm || !alarm.active) {
            console.log('[AlarmManager] Alarm not found or inactive:', alarmId);
            return false;
        }

        // Mark as triggered
        await markAlarmTriggered(alarmId);

        // Save as currently active alarm
        await AsyncStorage.setItem(ACTIVE_ALARM_KEY, alarmId);

        // Play alarm sound
        await playAlarmSound(alarm.tone);

        // Send initial notification
        await sendAlarmNotification(alarm);

        // Show persistent notification
        await showPersistentAlarmNotification(alarm);

        console.log('[AlarmManager] ✅ Alarm triggered:', alarm.title);
        return true;
    } catch (error) {
        console.error('[AlarmManager] Failed to trigger alarm:', error);
        return false;
    }
};

/**
 * Stop the currently ringing alarm
 */
export const stopAlarm = async (alarmId?: string): Promise<boolean> => {
    try {
        // Get active alarm ID
        const activeId = alarmId || await AsyncStorage.getItem(ACTIVE_ALARM_KEY);

        if (!activeId) {
            console.log('[AlarmManager] No active alarm to stop');
            return false;
        }

        // Stop sound
        await stopAlarmSound();

        // Clear active alarm
        await AsyncStorage.removeItem(ACTIVE_ALARM_KEY);

        // Disable the alarm so it doesn't trigger again immediately
        await updateAlarm(activeId, { active: false });

        // Cancel all notifications
        await cancelAllNotifications();

        console.log('[AlarmManager] ✅ Alarm stopped:', activeId);
        return true;
    } catch (error) {
        console.error('[AlarmManager] Failed to stop alarm:', error);
        return false;
    }
};

/**
 * Get currently active alarm ID
 */
export const getActiveAlarmId = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(ACTIVE_ALARM_KEY);
    } catch (error) {
        console.error('[AlarmManager] Failed to get active alarm:', error);
        return null;
    }
};

/**
 * Check if an alarm is currently ringing
 */
export const isAlarmRinging = async (): Promise<boolean> => {
    const activeId = await getActiveAlarmId();
    return !!activeId;
};

/**
 * Snooze alarm (stop for now, keep active)
 */
export const snoozeAlarm = async (alarmId: string): Promise<boolean> => {
    try {
        // Stop sound
        await stopAlarmSound();

        // Clear active alarm
        await AsyncStorage.removeItem(ACTIVE_ALARM_KEY);

        // Cancel notifications
        await cancelAllNotifications();

        // Keep alarm active (will trigger again if user goes back near location)
        console.log('[AlarmManager] ⏰ Alarm snoozed:', alarmId);
        return true;
    } catch (error) {
        console.error('[AlarmManager] Failed to snooze alarm:', error);
        return false;
    }
};