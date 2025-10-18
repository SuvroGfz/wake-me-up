export const alarmTones = {
    alarm1: require('./alarm1.mp3'),
    alarm2: require('./alarm2.wav'),
    alarm3: require('./alarm3.mp3'),
} as const;

export type AlarmToneKey = keyof typeof alarmTones;