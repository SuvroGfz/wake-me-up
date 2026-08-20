// services/alarmService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, AlarmTone, Coordinates, createAlarm } from '@/models/Alarm';
import { ALARMS_KEY, ALARM_TRIGGERED_KEY } from '@/constants/values';

/**
 * Load all alarms from storage
 */
export const loadAlarms = async (): Promise<Alarm[]> => {
    try {
        const raw = await AsyncStorage.getItem(ALARMS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('[AlarmService] Failed to load alarms:', error);
        return [];
    }
};

/**
 * Save alarms to storage
 */
export const saveAlarms = async (alarms: Alarm[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    } catch (error) {
        console.error('[AlarmService] Failed to save alarms:', error);
        throw error;
    }
};

/**
 * Add a new alarm
 */
export const addAlarm = async (title, coords, tone, customToneUri = null) => {
    const alarms = await loadAlarms();
    const newAlarm = createAlarm(title, coords, tone);

    newAlarm.customToneUri = customToneUri;
    newAlarm.vibrate = true;
    newAlarm.color = 'green';

    alarms.push(newAlarm);
    await saveAlarms(alarms);
    return newAlarm;
};

/**
 * Update an existing alarm
 */
export const updateAlarm = async (
    id: string,
    updates: Partial<Omit<Alarm, 'id' | 'createdAt'>>
): Promise<Alarm | null> => {
    const alarms = await loadAlarms();
    const index = alarms.findIndex((a) => a.id === id);

    if (index === -1) return null;

    alarms[index] = { ...alarms[index], ...updates };
    await saveAlarms(alarms);
    return alarms[index];
};

/**
 * Delete an alarm
 */
export const deleteAlarm = async (id: string): Promise<boolean> => {
    const alarms = await loadAlarms();
    const filtered = alarms.filter((a) => a.id !== id);

    if (filtered.length === alarms.length) return false;

    await saveAlarms(filtered);

    // Also clear triggered status
    await clearTriggeredStatus(id);

    return true;
};

/**
 * Toggle alarm active status
 */
export const toggleAlarmActive = async (id: string): Promise<boolean> => {
    const alarms = await loadAlarms();
    const alarm = alarms.find((a) => a.id === id);

    if (!alarm) return false;

    alarm.active = !alarm.active;
    alarm.color = alarm.active ? 'green' : 'red';

    if (alarm.active) {
        alarm.activatedAt = new Date().toISOString();
    }

    await saveAlarms(alarms);

    // Clear triggered status when re-enabling
    if (alarm.active) {
        await clearTriggeredStatus(id);
    }

    return alarm.active;
};

/**
 * Get alarm by ID
 */
export const getAlarmById = async (id: string): Promise<Alarm | null> => {
    const alarms = await loadAlarms();
    return alarms.find((a) => a.id === id) || null;
};

/**
 * Mark alarm as triggered
 */
export const markAlarmTriggered = async (id: string): Promise<void> => {
    try {
        const raw = await AsyncStorage.getItem(ALARM_TRIGGERED_KEY);
        const triggered: Record<string, string> = raw ? JSON.parse(raw) : {};

        triggered[id] = new Date().toISOString();
        await AsyncStorage.setItem(ALARM_TRIGGERED_KEY, JSON.stringify(triggered));
    } catch (error) {
        console.error('[AlarmService] Failed to mark triggered:', error);
    }
};

/**
 * Check if alarm was triggered
 */
export const isAlarmTriggered = async (id: string): Promise<boolean> => {
    try {
        const raw = await AsyncStorage.getItem(ALARM_TRIGGERED_KEY);
        const triggered: Record<string, string> = raw ? JSON.parse(raw) : {};
        return !!triggered[id];
    } catch (error) {
        console.error('[AlarmService] Failed to check triggered:', error);
        return false;
    }
};

/**
 * Clear triggered status for an alarm
 */
export const clearTriggeredStatus = async (id: string): Promise<void> => {
    try {
        const raw = await AsyncStorage.getItem(ALARM_TRIGGERED_KEY);
        const triggered: Record<string, string> = raw ? JSON.parse(raw) : {};

        delete triggered[id];
        await AsyncStorage.setItem(ALARM_TRIGGERED_KEY, JSON.stringify(triggered));
    } catch (error) {
        console.error('[AlarmService] Failed to clear triggered:', error);
    }
};

/**
 * Clear all triggered statuses
 */
export const clearAllTriggeredStatuses = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(ALARM_TRIGGERED_KEY, JSON.stringify({}));
    } catch (error) {
        console.error('[AlarmService] Failed to clear all triggered:', error);
    }
};

/**
 * Seed demo alarms around Dhaka for testing
 */
export const seedDemoAlarms = async (): Promise<void> => {
    const existing = await loadAlarms();
    
    const demoAlarms: Alarm[] = [
        {
            id: 'demo_banani',
            title: 'Banani',
            coords: { latitude: 23.7938, longitude: 90.4035 },
            tone: 'alarm1' as AlarmTone,
            active: false,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
            customToneUri: null,
            vibrate: true,
            color: 'red',
        },
        {
            id: 'demo_mirpur1',
            title: 'Mirpur-1',
            coords: { latitude: 23.7956, longitude: 90.3527 },
            tone: 'alarm2' as AlarmTone,
            active: false,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
            customToneUri: null,
            vibrate: true,
            color: 'red',
        },
        {
            id: 'demo_agargaon',
            title: 'Agargaon',
            coords: { latitude: 23.7778, longitude: 90.3680 },
            tone: 'alarm3' as AlarmTone,
            active: false,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
            customToneUri: null,
            vibrate: true,
            color: 'red',
        },
    ];

    // Only add demos that don't already exist — never overwrite
    const existingIds = new Set(existing.map(a => a.id));
    const newDemos = demoAlarms.filter(d => !existingIds.has(d.id));
    if (newDemos.length === 0) {
        console.log('[AlarmService] Demo alarms already exist, skipping seed');
        return;
    }
    const merged = [...existing, ...newDemos];
    await saveAlarms(merged);
    console.log(`[AlarmService] Seeded ${newDemos.length} demo alarms`);
};