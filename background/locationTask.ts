// background/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getDistance } from 'geolib';
import { LOCATION_TASK_NAME, ALARMS_KEY, ALARM_TRIGGERED_KEY, PROXIMITY_THRESHOLD_METERS } from '@/constants/values';

type StoredLog = {
    timestamp: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    try {
        if (error) {
            console.error('[LOCATION_TASK] error', error);
            return;
        }
        if (!data) return;

        const { locations } = data as any;
        if (!locations || !locations.length) return;

        // Save raw location logs (optional)
        try {
            const raw = await AsyncStorage.getItem('@myapp:location_logs');
            const existing: StoredLog[] = raw ? JSON.parse(raw) : [];
            const newEntries: StoredLog[] = locations.map((l: any) => ({
                timestamp: new Date().toISOString(),
                latitude: l.coords.latitude,
                longitude: l.coords.longitude,
                accuracy: l.coords.accuracy,
            }));
            const merged = [...newEntries, ...existing].slice(0, 2000);
            await AsyncStorage.setItem('@myapp:location_logs', JSON.stringify(merged));
        } catch (e) {
            console.warn('[LOCATION_TASK] could not save logs', e);
        }

        // For each location point, check alarms
        const alarmsRaw = await AsyncStorage.getItem(ALARMS_KEY);
        const alarms = alarmsRaw ? JSON.parse(alarmsRaw) : [];

        if (!alarms || alarms.length === 0) return;

        // triggered map to avoid repeat notifications
        const triggeredRaw = await AsyncStorage.getItem(ALARM_TRIGGERED_KEY);
        const triggeredMap: Record<string, string> = triggeredRaw ? JSON.parse(triggeredRaw) : {};

        // Loop over latest location(s)
        for (const loc of locations) {
            const lat = loc.coords.latitude;
            const lon = loc.coords.longitude;

            for (const alarm of alarms) {
                try {
                    if (!alarm.active) continue;
                    // if already triggered recently, skip
                    if (triggeredMap[alarm.id]) continue;

                    const dist = getDistance(
                        { latitude: lat, longitude: lon },
                        { latitude: alarm.coords.latitude, longitude: alarm.coords.longitude }
                    );

                    if (dist <= PROXIMITY_THRESHOLD_METERS) {
                        // Mark as triggered
                        triggeredMap[alarm.id] = new Date().toISOString();
                        await AsyncStorage.setItem(ALARM_TRIGGERED_KEY, JSON.stringify(triggeredMap));

                        // Schedule a local notification immediately
                        // Note: sound uses 'default' here. Custom sound needs native setup.
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: alarm.title || 'Destination reached',
                                body: `You are within ${Math.round(dist)} meters of ${alarm.title || 'your destination'}.`,
                                data: { alarmId: alarm.id },
                                // sound: 'default' // default sound; custom sound needs native channel
                            },
                            trigger: null,
                        });

                        // Optionally: set alarm.active = false to prevent future, then write back:
                        // alarm.active = false; // if you want single-shot alarms
                    }
                } catch (inner) {
                    console.warn('[LOCATION_TASK] alarm check error', inner);
                }
            }
        }
    } catch (err) {
        console.error('[LOCATION_TASK] exception', err);
    }
});
