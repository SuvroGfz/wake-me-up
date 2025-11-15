import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { ALARMS_KEY } from '@/constants/values';

export const MINUTE_TASK_NAME = 'MINUTE_BACKGROUND_TASK';

TaskManager.defineTask(MINUTE_TASK_NAME, async () => {
    try {
        // Get location
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

        // Increment notification counter
        const counterRaw = await AsyncStorage.getItem('@minuteTaskCounter');
        const counter = counterRaw ? parseInt(counterRaw) + 1 : 1;
        await AsyncStorage.setItem('@minuteTaskCounter', counter.toString());

        // Log entry
        const logEntry = {
            time: new Date().toISOString(),
            latitude: coords.latitude,
            longitude: coords.longitude,
            notificationNumber: counter,
        };

        const prevLogsRaw = await AsyncStorage.getItem('@minuteTaskLogs');
        const logs = prevLogsRaw ? JSON.parse(prevLogsRaw) : [];
        logs.unshift(logEntry);
        await AsyncStorage.setItem('@minuteTaskLogs', JSON.stringify(logs.slice(0, 50)));

        console.log('[MINUTE_TASK] Notification', logEntry);

        // Play alarm sound
        const { sound } = await Audio.Sound.createAsync(require('@/assets/audio/alarm-tones/alarm1.mp3'));
        await sound.setIsLoopingAsync(true);
        await sound.playAsync();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `🚨 Minute Alarm #${counter}`,
                body: `Time: ${new Date().toLocaleTimeString()}\nLat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`,
                data: { notificationNumber: counter },
                sound: 'default',
            },
            trigger: null,
            identifier: `minute_alarm_${counter}`,
        });


        // Save a flag so the front-end can stop sound manually
        await AsyncStorage.setItem('@minuteTaskPlaying', 'true');

    } catch (e) {
        console.error('[MINUTE_TASK] Error', e);
    }
});
