// background/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import { loadAlarms, isAlarmTriggered } from '@/services/alarmService';
import { calculateDistance } from '@/services/locationService';
import { triggerAlarm } from '@/services/alarmManagerService';
import { LOCATION_TASK_NAME, PROXIMITY_THRESHOLD_METERS } from '@/constants/values';

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

        // Check each location update
        for (const location of locations) {
            const currentCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            // Check each active alarm
            for (const alarm of activeAlarms) {
                try {
                    // Skip if already triggered
                    const wasTriggered = await isAlarmTriggered(alarm.id);
                    if (wasTriggered) continue;

                    // Calculate distance
                    const distance = calculateDistance(currentCoords, alarm.coords);

                    console.log(
                        `[LocationTask] Alarm "${alarm.title}": ${distance}m away (threshold: ${PROXIMITY_THRESHOLD_METERS}m)`
                    );

                    // Check if within threshold
                    if (distance <= PROXIMITY_THRESHOLD_METERS) {
                        console.log(`[LocationTask] 🚨 ALARM TRIGGERED: ${alarm.title}`);

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