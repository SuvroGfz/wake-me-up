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
}

export const createAlarm = (
    title: string,
    coords: Coordinates,
    tone: AlarmTone
): Alarm => ({
    id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    coords,
    tone,
    active: true,
    createdAt: new Date().toISOString(),
});