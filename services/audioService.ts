// services/audioService.ts — add imports
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { Alarm, AlarmTone } from '@/models/Alarm';
import { alarmTones } from '@/assets/audio/alarm-tones';
import { ALARM_VOLUME } from '@/constants/values';

let currentSound: Audio.Sound | null = null;


/**
 * Initialize audio mode for background playback
 */
export const initAudioMode = async (): Promise<void> => {
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    } catch (error) {
        console.error('[AudioService] Failed to set audio mode:', error);
    }
};

/**
 * Play alarm sound
 * Now accepts an Alarm object so we can use customToneUri and vibrate preference.
 */
export const playAlarmSound = async (alarm: Alarm): Promise<void> => {
    try {
        // Stop any currently playing sound + vibration
        await stopAlarmSound();

        // Choose source:
        // - if alarm.customToneUri is set, use { uri: alarm.customToneUri }
        // - otherwise use preset local asset from alarmTones[alarm.tone]
        const source: any = alarm.customToneUri ? { uri: alarm.customToneUri } : alarmTones[alarm.tone];

        const { sound } = await Audio.Sound.createAsync(
            source,
            {
                isLooping: true,
                volume: ALARM_VOLUME,
                staysActiveInBackground: true, // ensure background playback
            }
        );

        currentSound = sound;

        // Start vibration pattern if enabled on the alarm
        try {
            if (alarm.vibrate) {
                // pattern: [delay, vibrate, pause, vibrate, pause ...], true => repeat
                Vibration.vibrate([0, 400, 200, 400, 200], true);
            }
        } catch (vErr) {
            console.warn('[AudioService] Vibration failed or not available:', vErr);
        }

        await sound.playAsync();

        console.log(`[AudioService] Playing alarm: ${alarm.title} (${alarm.customToneUri ? 'custom' : alarm.tone})`);
    } catch (error) {
        console.error('[AudioService] Failed to play alarm:', error);
        throw error;
    }
};


/**
 * Stop alarm sound and vibration
 */
export const stopAlarmSound = async (): Promise<void> => {
    try {
        // Stop vibration first
        try {
            Vibration.cancel();
        } catch (vErr) {
            console.warn('[AudioService] Failed to cancel vibration:', vErr);
        }

        if (currentSound) {
            // For safety check status then stop + unload
            const status = await currentSound.getStatusAsync();
            if (status?.isLoaded) {
                if (status.isPlaying) {
                    await currentSound.stopAsync();
                }
                await currentSound.unloadAsync();
            }
            currentSound = null;
            console.log('[AudioService] Alarm stopped');
        }
    } catch (error) {
        console.error('[AudioService] Failed to stop alarm:', error);
    }
};


/**
 * Check if alarm is currently playing
 */
export const isAlarmPlaying = async (): Promise<boolean> => {
    if (!currentSound) return false;

    try {
        const status = await currentSound.getStatusAsync();
        return status.isLoaded && status.isPlaying;
    } catch (error) {
        console.error('[AudioService] Failed to check playing status:', error);
        return false;
    }
};

/**
 * Set alarm volume
 */
export const setAlarmVolume = async (volume: number): Promise<void> => {
    if (!currentSound) return;

    try {
        await currentSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    } catch (error) {
        console.error('[AudioService] Failed to set volume:', error);
    }
};