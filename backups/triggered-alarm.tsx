import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { styles } from '@/styles/styles';
import { alarmTones } from '@/assets/audio/alarm-tones';
import { Alarm } from '@/models/Alarm';

export default function TriggeredAlarm() {
    const { alarmId } = useLocalSearchParams<{ alarmId?: string }>();
    const router = useRouter();

    const [alarm, setAlarm] = useState<Alarm | null>(null);
    const [ringing, setRinging] = useState(false);

    const player = useAudioPlayer(undefined, { updateInterval: 500 });

    // Configure playback mode
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionModeAndroid: 'duckOthers',
            interruptionMode: 'mixWithOthers',
        });
    }, []);

    // Load alarm + play sound
    useEffect(() => {
        let isMounted = true;

        const loadAlarm = async () => {
            try {
                if (!alarmId) return;
                const data = await AsyncStorage.getItem('alarms');
                if (!data) return;

                const all: Alarm[] = JSON.parse(data);
                const found = all.find((a) => a.id === alarmId);
                if (!found || !isMounted) return;

                setAlarm(found);

                // Safely initialize player
                if (alarmTones[found.tone]) {
                    await player.replace(alarmTones[found.tone]);
                    player.loop = true;
                    await player.play();
                    setRinging(true);
                } else {
                    console.warn('Tone not found for alarm:', found.tone);
                }
            } catch (e) {
                console.error('Error loading alarm:', e);
            }
        };

        loadAlarm();

        return () => {
            isMounted = false;
            safeStop();
        };
    }, [alarmId]);

    const safeStop = async () => {
        try {
            if (!player) return;
            if (!player.isLoaded) return; // check property directly
            if (player.playing || !player.paused) {
                player.pause();
                player.loop = false;
                await player.seekTo(0);
            }
        } catch (e) {
            console.warn('safeStop failed:', e);
        }
    };


    const stopAlarm = async () => {
        await safeStop();
        setRinging(false);
        router.back();
    };

    if (!alarm) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>⏰ Alarm Triggered</Text>
                <Text>No alarm details found.</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF3B30', marginTop: 20 }]}
                    onPress={stopAlarm}
                >
                    <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🚨 {alarm.title}</Text>
            <Text>Destination:</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                {alarm.coords.latitude.toFixed(5)}, {alarm.coords.longitude.toFixed(5)}
            </Text>

            <Text>Alarm Tone: {alarm.tone}</Text>
            <Text>Status: {ringing ? '🔊 Ringing' : '⏹ Stopped'}</Text>

            {/* Modal popup */}
            <Modal visible={ringing} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 30,
                            borderRadius: 20,
                            alignItems: 'center',
                            width: '80%',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 26,
                                fontWeight: 'bold',
                                marginBottom: 20,
                                color: '#FF3B30',
                            }}
                        >
                            {alarm.title}
                        </Text>
                        <Text style={{ marginBottom: 15 }}>
                            You’ve arrived at your destination 🚗
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#FF3B30' }]}
                            onPress={stopAlarm}
                        >
                            <Text style={styles.buttonText}>🛑 Stop Alarm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
