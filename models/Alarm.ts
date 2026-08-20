// models/Alarm.ts

export type AlarmTone = 'alarm1' | 'alarm2' | 'alarm3';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface Alarm {
    id: string;
    title: string;
    coords: Coordinates;
    tone: AlarmTone;
    active: boolean;
    createdAt: string;
    triggeredAt?: string;
    // NEW FIELDS
    customToneUri?: string | null;       // file:// or content:// tone
    vibrate?: boolean;            // vibration enabled
    color?: 'green' | 'red';      // map display color
    activatedAt?: string;         // ISO timestamp of last activation (for cooldown)
}

export const createAlarm = (title, coords, tone): Alarm => ({
    id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    coords,
    tone,
    customToneUri: null,     // NEW
    vibrate: true,           // NEW
    color: 'green',          // NEW
    active: true,
    createdAt: new Date().toISOString(),
    activatedAt: new Date().toISOString(),
});
