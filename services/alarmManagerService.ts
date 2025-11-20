// services/alarmManagerService.ts
// replace imports at top to include Alarm type and audio changes
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '@/models/Alarm';
import { getAlarmById, updateAlarm, markAlarmTriggered } from '@/services/alarmService';
import { playAlarmSound, stopAlarmSound } from '@/services/audioService';
import {
    sendAlarmNotification,
    showPersistentAlarmNotification,
    cancelAllNotifications
} from '@/services/notificationService';
import { ACTIVE_ALARM_KEY } from '@/constants/values';


import * as Haptics from 'expo-haptics';
import { EventEmitter } from 'expo-modules-core';


/**
 * Trigger an alarm (sound + notification + popup)
 */

const volumeEmitter = new EventEmitter();
let volumeStopEnabled = false;

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

        // Play alarm sound (now pass full alarm)
        await playAlarmSound(alarm);

        // Send initial notification and persistent notification
        await sendAlarmNotification(alarm);
        await showPersistentAlarmNotification(alarm);

        // Enable hardware-volume-to-stop behavior while alarm rings
        volumeStopEnabled = true;

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
        const activeId = alarmId || await AsyncStorage.getItem(ACTIVE_ALARM_KEY);

        if (!activeId) {
            console.log('[AlarmManager] No active alarm to stop');
            return false;
        }

        // Stop audio + vibration
        await stopAlarmSound();

        // Clear active alarm
        await AsyncStorage.removeItem(ACTIVE_ALARM_KEY);

        // Disable the alarm so it doesn't trigger again immediately
        await updateAlarm(activeId, { active: false });

        // Cancel notifications
        await cancelAllNotifications();

        // disable hardware stop gate
        volumeStopEnabled = false;

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
 * Called by a native listener when volume/power keys are pressed.
 * If an alarm is currently ringing (volumeStopEnabled), this will stop it immediately.
 * (See native/bridge instructions below.)
 */
export const handleHardwareButton = async (): Promise<void> => {
    try {
        if (volumeStopEnabled) {
            await stopAlarm();
        }
    } catch (err) {
        console.error('[AlarmManager] handleHardwareButton error:', err);
    }
};
