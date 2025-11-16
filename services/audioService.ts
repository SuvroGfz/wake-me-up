// services/audioService.ts
import { Audio, AVPlaybackStatus } from 'expo-av';
import { AlarmTone } from '@/models/Alarm';
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
 */
export const playAlarmSound = async (tone: AlarmTone): Promise<void> => {
    try {
        // Stop any currently playing sound
        await stopAlarmSound();

        const { sound } = await Audio.Sound.createAsync(
            alarmTones[tone],
            {
                isLooping: true,
                volume: ALARM_VOLUME,
            }
        );

        currentSound = sound;
        await sound.playAsync();

        console.log(`[AudioService] Playing alarm: ${tone}`);
    } catch (error) {
        console.error('[AudioService] Failed to play alarm:', error);
        throw error;
    }
};

/**
 * Stop alarm sound
 */
export const stopAlarmSound = async (): Promise<void> => {
    try {
        if (currentSound) {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
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