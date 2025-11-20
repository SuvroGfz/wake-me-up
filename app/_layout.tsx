// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { startBackgroundLocationTracking } from '@/background/startLocationTracking';
import { initAudioMode } from '@/services/audioService';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
    setupNotificationChannel,
    setupNotificationCategories
} from '@/services/notificationService';
import { stopAlarm, getActiveAlarmId } from '@/services/alarmManagerService';
import { STOP_ALARM_ACTION } from '@/constants/values';
import '@/background/locationTask'; // Register the background task

import { DeviceEventEmitter, Platform } from 'react-native';
import { handleHardwareButton } from '@/services/alarmManagerService';

if (Platform.OS === 'android') {
    DeviceEventEmitter.addListener('hardwareButtonPress', async (keyCode: number) => {
        // call the exported handler to stop alarm
        await handleHardwareButton();
    });
}

/**
 * Configure notification handler
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function RootLayout() {
    const router = useRouter();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        const init = async () => {
            try {
                // Request notification permissions
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('[App] Notification permission not granted');
                }

                // Setup notification channel and categories
                await setupNotificationChannel();
                await setupNotificationCategories();

                // Initialize audio mode
                await initAudioMode();

                // Start background location tracking
                const result = await startBackgroundLocationTracking();
                if (!result.success) {
                    console.error('[App] Failed to start tracking:', result.error);
                }

                console.log('[App] Initialization complete');
            } catch (error) {
                console.error('[App] Initialization error:', error);
            }
        };

        init();
    }, []);

    useEffect(() => {
        // Handle notification taps
        const tapSubscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const { actionIdentifier, notification } = response;
                const data = notification.request.content.data;

                // Handle Stop Alarm button
                if (actionIdentifier === STOP_ALARM_ACTION) {
                    await stopAlarm(data.alarmId);
                    return;
                }

                // Handle notification tap (open alarm screen)
                if (data.type === 'location_alarm_triggered' && data.alarmId) {
                    router.push({
                        pathname: '/alarm-triggered',
                        params: { alarmId: data.alarmId },
                    });
                }
            }
        );

        return () => tapSubscription.remove();
    }, [router]);

    useEffect(() => {
        // Check if alarm is ringing when app comes to foreground
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                const activeAlarmId = await getActiveAlarmId();
                if (activeAlarmId) {
                    // Alarm is ringing, open alarm screen
                    router.push({
                        pathname: '/alarm-triggered',
                        params: { alarmId: activeAlarmId },
                    });
                }
            }
            setAppState(nextAppState);
        });

        return () => subscription.remove();
    }, [appState, router]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                        name="new-alarm"
                        options={{
                            presentation: 'modal',
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="alarm-triggered"
                        options={{
                            presentation: 'fullScreenModal',
                            headerShown: false,
                            gestureEnabled: false,
                        }}
                    />
                </Stack>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}