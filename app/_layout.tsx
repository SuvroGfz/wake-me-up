import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack, useRouter} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import '@/background/locationTask';
import '@/background/debugTask';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {useEffect} from "react";
import {startBackgroundLocationTracking} from "@/background/startLocationTracking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const router = useRouter();

    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const actionId = response.actionIdentifier;
            if (actionId === 'STOP_ALARM') {
                await AsyncStorage.setItem('@minuteTaskPlaying', 'false');
                // send event to app/modal to stop sound
            } else {
                router.push('/(tabs)/debug');
            }
        });

        return () => sub.remove();
    }, []);


    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const alarmId = response.notification.request.content.data?.alarmId;
            // navigate to page showing alarm details or the alarm screen:
            if (alarmId) {
                router.push('/(tabs)/triggered-alarm');
            } else {
                // generic
                router.push('/(tabs)/location-alarm');
            }
        });

        (async () => {
            await Notifications.requestPermissionsAsync();

            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });


            await startBackgroundLocationTracking();
        })();

        return () => subscription.remove();
    }, []);


    return (
        <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
            </Stack>
            <StatusBar style="auto"/>
        </ThemeProvider>
    );
}
