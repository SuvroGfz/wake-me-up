// background/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import { loadAlarms } from '@/services/alarmService';
import { calculateDistance } from '@/services/locationService';
import { triggerAlarm } from '@/services/alarmManagerService';
import { LOCATION_TASK_NAME, PROXIMITY_THRESHOLD_METERS, ALARM_TRIGGERED_KEY } from '@/constants/values';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Minimum time (ms) after alarm activation before it can trigger.
// Prevents instant triggering when alarm is created at current location.
const ACTIVATION_COOLDOWN_MS = 60_000; // 60 seconds

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

        let triggeredAny = false;

        // Use only the most recent location for accuracy
        const location = locations[locations.length - 1];
        const currentCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };

        // Check each active alarm
        for (const alarm of activeAlarms) {
            try {
                // Skip already-triggered alarms (in-memory check)
                if (triggeredMap[alarm.id]) continue;

                // Cooldown: skip if alarm was activated/created less than 60s ago
                const activatedAt = alarm.activatedAt || alarm.createdAt;
                if (activatedAt) {
                    const elapsedMs = Date.now() - new Date(activatedAt).getTime();
                    if (elapsedMs < ACTIVATION_COOLDOWN_MS) {
                        const remainSec = Math.round((ACTIVATION_COOLDOWN_MS - elapsedMs) / 1000);
                        console.log(`[LocationTask] Alarm "${alarm.title}": cooldown (${remainSec}s left)`);
                        continue;
                    }
                }

                // Validate alarm has valid coordinates
                if (!alarm.coords ||
                    typeof alarm.coords.latitude !== 'number' ||
                    typeof alarm.coords.longitude !== 'number' ||
                    (alarm.coords.latitude === 0 && alarm.coords.longitude === 0)) {
                    console.warn(`[LocationTask] Alarm "${alarm.title}" has invalid coords, skipping`);
                    continue;
                }

                // Calculate distance
                const distance = calculateDistance(currentCoords, alarm.coords);

                console.log(
                    `[LocationTask] Alarm "${alarm.title}": ${distance}m away ` +
                    `(threshold: ${PROXIMITY_THRESHOLD_METERS}m) | ` +
                    `User: ${currentCoords.latitude.toFixed(6)},${currentCoords.longitude.toFixed(6)} → ` +
                    `Alarm: ${alarm.coords.latitude.toFixed(6)},${alarm.coords.longitude.toFixed(6)}`
                );

                // Check if within threshold
                if (distance <= PROXIMITY_THRESHOLD_METERS) {
                    console.log(`[LocationTask] 🚨 ALARM TRIGGERED: ${alarm.title}`);

                    // Mark as triggered BEFORE calling triggerAlarm to prevent duplicates
                    triggeredMap[alarm.id] = new Date().toISOString();
                    triggeredAny = true;

                    // Persist triggered status immediately
                    try {
                        await AsyncStorage.setItem(ALARM_TRIGGERED_KEY, JSON.stringify(triggeredMap));
                    } catch (e) {
                        console.error('[LocationTask] Failed to persist triggered status', e);
                    }

                    // Trigger alarm (sound + notification + popup)
                    await triggerAlarm(alarm.id);
                }
            } catch (innerError) {
                console.error(`[LocationTask] Error checking alarm ${alarm.id}:`, innerError);
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