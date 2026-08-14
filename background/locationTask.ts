// background/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import { loadAlarms } from '@/services/alarmService';
import { calculateDistance } from '@/services/locationService';
import { triggerAlarm } from '@/services/alarmManagerService';
import { LOCATION_TASK_NAME, PROXIMITY_THRESHOLD_METERS, ALARM_TRIGGERED_KEY } from '@/constants/values';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Background location tracking task
 * This runs even when app is closed/backgrounded
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    try {
        if (error) {
            console.error('[LocationTask] Error:', error);
            return;
        }

        if (!data) {
            console.warn('[LocationTask] No data received');
            return;
        }

        const { locations } = data as any;

        if (!locations || locations.length === 0) {
            console.warn('[LocationTask] No locations in data');
            return;
        }

        // Get all active alarms
        const alarms = await loadAlarms();
        const activeAlarms = alarms.filter((a) => a.active);

        if (activeAlarms.length === 0) {
            return;
        }

        // Load ALL triggered statuses once before the loops (1 disk read)
        let triggeredMap: Record<string, string> = {};
        try {
            const raw = await AsyncStorage.getItem(ALARM_TRIGGERED_KEY);
            if (raw) triggeredMap = JSON.parse(raw);
        } catch (e) {
            console.error('[LocationTask] Failed to load triggered statuses', e);
        }

        // Check each location update
        for (const location of locations) {
            const currentCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            // Check each active alarm
            for (const alarm of activeAlarms) {
                try {
                    // O(1) in-memory lookup instead of disk I/O per iteration
                    if (triggeredMap[alarm.id]) continue;

                    // Calculate distance
                    const distance = calculateDistance(currentCoords, alarm.coords);

                    console.log(
                        `[LocationTask] Alarm "${alarm.title}": ${distance}m away (threshold: ${PROXIMITY_THRESHOLD_METERS}m)`
                    );

                    // Check if within threshold
                    if (distance <= PROXIMITY_THRESHOLD_METERS) {
                        console.log(`[LocationTask] 🚨 ALARM TRIGGERED: ${alarm.title}`);

                        // Immediately update local map to prevent duplicate triggers
                        // within this same background execution cycle
                        triggeredMap[alarm.id] = new Date().toISOString();

                        // Trigger alarm (sound + notification + popup)
                        await triggerAlarm(alarm.id);
                    }
                } catch (innerError) {
                    console.error(`[LocationTask] Error checking alarm ${alarm.id}:`, innerError);
                }
            }
        }
    } catch (err) {
        console.error('[LocationTask] Fatal error:', err);
    }
});

/**
 * Check if location task is registered
 */
export const isLocationTaskDefined = (): boolean => {
    return TaskManager.isTaskDefined(LOCATION_TASK_NAME);
};