// background/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME, LOCATION_LOG_KEY } from '@/constants/values';

type StoredLog = {
    timestamp: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
};

const MAX_LOGS = 2000;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    try {
        if (error) {
            console.error('[LOCATION_TASK] error', error);
            return;
        }
        if (!data) return;

        const { locations } = data as any;
        if (!locations || !locations.length) return;

        // Build new log entries
        const newEntries: StoredLog[] = locations.map((l: any) => ({
            timestamp: new Date().toISOString(),
            latitude: l.coords.latitude,
            longitude: l.coords.longitude,
            accuracy: l.coords.accuracy,
        }));

        // Read existing logs from AsyncStorage
        const raw = await AsyncStorage.getItem(LOCATION_LOG_KEY);
        let existing: StoredLog[] = [];
        if (raw) {
            try {
                existing = JSON.parse(raw);
                if (!Array.isArray(existing)) existing = [];
            } catch {
                existing = [];
            }
        }

        // Prepend new entries (so newest first), cap size
        const merged = [...newEntries, ...existing].slice(0, MAX_LOGS);

        await AsyncStorage.setItem(LOCATION_LOG_KEY, JSON.stringify(merged));
        // Optionally, you can prune older entries here.

        console.log('[LOCATION_TASK] saved', newEntries.length);
    } catch (err) {
        console.error('[LOCATION_TASK] exception', err);
    }
});
