// assets/audio/alarm-tones/index.ts

export const alarmTones = {
    alarm1: require('./alarm1.mp3'),
    alarm2: require('./alarm2.wav'),
    alarm3: require('./alarm3.mp3'),
};

export type AlarmToneKey = keyof typeof alarmTones;

export const alarmToneLabels: Record<AlarmToneKey, string> = {
    alarm1: 'Classic Alarm',
    alarm2: 'Digital Beep',
    alarm3: 'Morning Chime',
};