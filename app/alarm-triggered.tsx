// app/alarm-triggered.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ActivityIndicator,
    BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAlarmById } from '@/services/alarmService';
import { stopAlarm, snoozeAlarm } from '@/services/alarmManagerService';
import { Alarm } from '@/models/Alarm';

const { width } = Dimensions.get('window');

export default function AlarmTriggeredScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const alarmId = params.alarmId as string;

    const [alarm, setAlarm] = useState<Alarm | null>(null);
    const [loading, setLoading] = useState(true);

    // Animation values
    const pulseAnim = useState(new Animated.Value(1))[0];
    const shakeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        loadAlarm();
    }, [alarmId]);

    useEffect(() => {
        // Prevent back button from dismissing alarm
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Shake animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const loadAlarm = async () => {
        try {
            const data = await getAlarmById(alarmId);
            setAlarm(data);
        } catch (error) {
            console.error('[AlarmTriggered] Failed to load alarm:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        await stopAlarm(alarmId);
        router.back();
    };

    const handleSnooze = async () => {
        await snoozeAlarm(alarmId);
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    if (!alarm) {
        return (
            <View style={styles.error}>
                <Text style={styles.errorText}>Alarm not found</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Animated background pulses */}
            <Animated.View
                style={[
                    styles.pulse,
                    {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                            inputRange: [1, 1.2],
                            outputRange: [0.3, 0],
                        }),
                    },
                ]}
            />

            <View style={styles.content}>
                {/* Alert Icon */}
                <Animated.View
                    style={{
                        transform: [{ translateX: shakeAnim }],
                    }}
                >
                    <Text style={styles.icon}>🚨</Text>
                </Animated.View>

                {/* Alarm Info */}
                <Text style={styles.title}>WAKE UP!</Text>
                <Text style={styles.subtitle}>You've arrived at</Text>
                <Text style={styles.alarmTitle}>{alarm.title}</Text>

                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>📍 Location</Text>
                    <Text style={styles.infoValue}>
                        {alarm.coords.latitude.toFixed(4)}, {alarm.coords.longitude.toFixed(4)}
                    </Text>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>⏰ Time</Text>
                    <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {/* Stop Button (Disables alarm) */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.stopButton]}
                        onPress={handleStop}
                    >
                        <Text style={styles.stopButtonText}>🛑 STOP ALARM</Text>
                        <Text style={styles.buttonSubtext}>(Turns off alarm)</Text>
                    </TouchableOpacity>

                    {/* Snooze Button (Keeps alarm active) */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.snoozeButton]}
                        onPress={handleSnooze}
                    >
                        <Text style={styles.snoozeButtonText}>⏰ SNOOZE</Text>
                        <Text style={styles.buttonSubtext}>(Stays active)</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>
                    Stop: Turns off alarm until you enable it again{'\n'}
                    Snooze: Silences for now, will ring again if you return
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        flex: 1,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        flex: 1,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 20,
        color: '#ffffff',
        marginBottom: 20,
    },
    pulse: {
        position: 'absolute',
        width: width * 2,
        height: width * 2,
        borderRadius: width,
        backgroundColor: '#ffffff',
    },
    content: {
        alignItems: 'center',
        padding: 30,
        width: '100%',
    },
    icon: {
        fontSize: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#fee2e2',
        textAlign: 'center',
        marginBottom: 4,
    },
    alarmTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 24,
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 14,
        borderRadius: 12,
        width: width - 60,
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 12,
        color: '#fee2e2',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        marginTop: 30,
        gap: 12,
    },
    actionButton: {
        paddingVertical: 18,
        paddingHorizontal: 30,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    stopButton: {
        backgroundColor: '#ffffff',
    },
    snoozeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    stopButtonText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#dc2626',
        letterSpacing: 1,
    },
    snoozeButtonText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 1,
    },
    buttonSubtext: {
        fontSize: 12,
        color: '#fee2e2',
        marginTop: 4,
    },
    hint: {
        fontSize: 12,
        color: '#fee2e2',
        marginTop: 20,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#dc2626',
    },
});