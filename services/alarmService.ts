import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALARM_TONE_KEY, ALARM_TRIGGERED_KEY, ALARMS_KEY} from "@/constants/values";
import {Alarm} from "@/models/Alarm";
import {AlarmToneKey} from "@/assets/audio/alarm-tones";


export const saveAlarms = async (alarms: Alarm[]) => {
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
};

export const loadAlarms = async (): Promise<Alarm[]> => {
    const data = await AsyncStorage.getItem(ALARMS_KEY);
    return data ? JSON.parse(data) : [];
};

export const addNewAlarm = async (coords: { latitude: number; longitude: number }, tone: string, title: string) => {
    const newAlarm: Alarm = {
        id: Date.now().toString(),
        title,
        coords,
        tone: tone as any,
        active: true,
        createdAt: new Date().toISOString(),
    };

    const existing = await AsyncStorage.getItem('alarms');
    const alarms: Alarm[] = existing ? JSON.parse(existing) : [];
    alarms.push(newAlarm);

    await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
    return newAlarm;
};

// services/alarmService.ts
export const clearAlarmTriggered = async (id: string) => {
    const raw = await AsyncStorage.getItem(ALARM_TRIGGERED_KEY);
    const map = raw ? JSON.parse(raw) : {};
    delete map[id];
    await AsyncStorage.setItem(ALARM_TRIGGERED_KEY, JSON.stringify(map));
};


export const loadSelectedTone = async (defaultTone = 'alarm1'): Promise<string> => {
    const t = await AsyncStorage.getItem(ALARM_TONE_KEY);
    return t ?? defaultTone;
};
