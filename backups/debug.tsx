import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { MINUTE_TASK_NAME } from '@/background/debugTask';
import { styles } from '@/styles/styles';

export default function MinuteDebug() {
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [showAlarm, setShowAlarm] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [alarmNumber, setAlarmNumber] = useState<number | null>(null);

    // Listen to notifications
    useEffect(() => {
        const sub = Notifications.addNotificationReceivedListener(async notification => {
            const data = notification.request.content.data;
            setAlarmNumber(data.notificationNumber);
            setShowAlarm(true);

            // Play the sound in case background sound did not start
            const { sound: s } = await Audio.Sound.createAsync(require('@/assets/audio/alarm-tones/alarm1.mp3'));
            await s.setIsLoopingAsync(true);
            await s.playAsync();
            setSound(s);
        });

        return () => sub.remove();
    }, []);

    const startTask = async () => {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (fgStatus !== 'granted' || bgStatus !== 'granted') {
            alert('Location permission not granted');
            return;
        }

        await Notifications.requestPermissionsAsync();

        await Location.startLocationUpdatesAsync(MINUTE_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60000, // 1 min
            distanceInterval: 0,
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Minute Alarm Running',
                notificationBody: 'You will get an alarm every minute',
            },
        });

        setRunning(true);
        alert('✅ Minute Task Started');
    };

    const stopTask = async () => {
        await Location.stopLocationUpdatesAsync(MINUTE_TASK_NAME);
        setRunning(false);
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }
        setShowAlarm(false);
        alert('🛑 Task Stopped');
    };

    const stopAlarm = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }
        setShowAlarm(false);
    };

    const loadLogs = async () => {
        const data = await AsyncStorage.getItem('@minuteTaskLogs');
        setLogs(data ? JSON.parse(data) : []);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>⏰ Minute Alarm Debug</Text>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: running ? '#FF3B30' : '#34C759' }]}
                onPress={running ? stopTask : startTask}
            >
                <Text style={styles.buttonText}>{running ? 'Stop Task' : 'Start Task'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#007AFF', marginTop: 10 }]}
                onPress={loadLogs}
            >
                <Text style={styles.buttonText}>Load Logs</Text>
            </TouchableOpacity>

            <ScrollView style={{ marginTop: 20, maxHeight: 200, width: '100%' }}>
                {logs.map((l, i) => (
                    <Text key={i} style={{ fontSize: 12, marginBottom: 6 }}>
                        #{l.notificationNumber} | {new Date(l.time).toLocaleTimeString()} → ({l.latitude.toFixed(5)}, {l.longitude.toFixed(5)})
                    </Text>
                ))}
            </ScrollView>

            {/* Fullscreen alarm */}
            <Modal visible={showAlarm} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%' }}>
                        <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#FF3B30' }}>
                            🚨 Minute Alarm #{alarmNumber}
                        </Text>
                        <Text style={{ marginBottom: 15 }}>Your device is at alert! Lock screen or not, sound is playing 🔊</Text>

                        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF3B30' }]} onPress={stopAlarm}>
                            <Text style={styles.buttonText}>🛑 Stop Alarm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
