// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Platform, DeviceEventEmitter } from 'react-native';
import { startBackgroundLocationTracking } from '@/background/startLocationTracking';
import { initAudioMode } from '@/services/audioService';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setupNotificationChannel, setupNotificationCategories } from '@/services/notificationService';
import { stopAlarm, getActiveAlarmId, isAlarmRinging, handleHardwareButton } from '@/services/alarmManagerService';
import { STOP_ALARM_ACTION } from '@/constants/values';
import '@/background/locationTask'; // Register background task

export default function RootLayout() {
    const router = useRouter();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [currentAlarmId, setCurrentAlarmId] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    if (Platform.OS === 'android') {
        DeviceEventEmitter.addListener('hardwareButtonPress', async () => {
            await handleHardwareButton();
        });
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });

    useEffect(() => {
        const tapSubscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const { actionIdentifier, notification } = response;
                const data = notification.request.content.data;

                if (actionIdentifier === STOP_ALARM_ACTION) {
                    await stopAlarm(data.alarmId);
                    setCurrentAlarmId(null);
                    return;
                }

                if (data.type === 'location_alarm_triggered' && data.alarmId) {
                    const ringing = await isAlarmRinging();
                    if (!ringing || currentAlarmId !== data.alarmId) {
                        setCurrentAlarmId(data.alarmId);
                        router.push({
                            pathname: '/alarm-triggered',
                            params: { alarmId: data.alarmId },
                        });
                    }
                }
            }
        );
        return () => tapSubscription.remove();
    }, [router, currentAlarmId]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                const activeAlarmId = await getActiveAlarmId();
                if (activeAlarmId && currentAlarmId !== activeAlarmId) {
                    setCurrentAlarmId(activeAlarmId);
                    router.push({
                        pathname: '/alarm-triggered',
                        params: { alarmId: activeAlarmId },
                    });
                }
            }
            setAppState(nextAppState);
        });
        return () => subscription.remove();
    }, [appState, router, currentAlarmId]);

    useEffect(() => {
        const init = async () => {
            try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') console.warn('[App] Notification permission not granted');

                await setupNotificationChannel();
                await setupNotificationCategories();
                await initAudioMode();

                const result = await startBackgroundLocationTracking();
                if (!result.success) console.error('[App] Failed to start tracking:', result.error);
            } catch (error) {
                console.error('[App] Initialization error:', error);
            }
        };
        init();
    }, []);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="new-alarm" options={{ presentation: 'modal', headerShown: false }} />
                    <Stack.Screen name="alarm-triggered" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
                </Stack>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
