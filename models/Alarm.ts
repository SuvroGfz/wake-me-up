import {AlarmToneKey} from "@/assets/audio/alarm-tones";

export type Alarm = {
    id: string;
    title: string;
    coords: { latitude: number; longitude: number };
    tone: AlarmToneKey;
    active: boolean;
    createdAt: string;
};
