// hooks/useLocationTracker.ts
import {useEffect, useState} from 'react';
import * as Location from 'expo-location';
import {getDistance} from 'geolib';
import {Platform} from 'react-native';
import {LOCATION_TRACKING_INTERVAL_MS} from "@/constants/values";

export function useLocationTracker(
    onStep?: (distance: number) => void,
    target?: { latitude: number; longitude: number }
) {
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [liveLogs, setLiveLogs] = useState<{ message: string; color?: string }[]>([]);
    const [targetLogs, setTargetLogs] = useState<{ message: string; color?: string }[]>([]);
    const [lastPosition, setLastPosition] = useState<{ latitude: number; longitude: number } | null>(null);

    const getTimeString = () => new Date().toLocaleTimeString('en-US', {hour12: false});

    useEffect(() => {
        let watcher: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const handlePosition = (latitude: number, longitude: number) => {
                setLocation({latitude, longitude});

                if (target) {
                    const distToTarget = getDistance({latitude, longitude}, target);
                    setTargetLogs((prev) => [
                        {message: `[${getTimeString()}] Distance to target: ${distToTarget.toFixed(1)} meters.`},
                        ...prev,
                    ]);
                }

                if (lastPosition) {
                    const d = getDistance(
                        {latitude: lastPosition.latitude, longitude: lastPosition.longitude},
                        {latitude, longitude}
                    );
                    if (d >= 5) {
                        setLiveLogs((prev) => [
                            {message: `[${getTimeString()}] You walked ${d.toFixed(1)} meters from your last position.`},
                            ...prev,
                        ]);
                        setLastPosition({latitude, longitude});
                        onStep?.(d);
                    }
                } else {
                    setLiveLogs((prev) => [
                        {message: `[${getTimeString()}] Come on! Walk Walk. Do not stay still!!`, color: 'red'},
                        ...prev,
                    ]);
                    setLastPosition({latitude, longitude});
                }
            };

            if (Platform.OS === 'web') {
                if ('geolocation' in navigator) {
                    const id = navigator.geolocation.watchPosition(
                        (pos) => handlePosition(pos.coords.latitude, pos.coords.longitude),
                        (err) => setErrorMsg(err.message),
                        {enableHighAccuracy: true, maximumAge: 0, timeout: LOCATION_TRACKING_INTERVAL_MS}
                    );
                    watcher = {remove: () => navigator.geolocation.clearWatch(id)} as any;
                } else {
                    setErrorMsg('Geolocation not supported in this browser.');
                }

            } else {
                watcher = await Location.watchPositionAsync(
                    {accuracy: Location.Accuracy.Highest, timeInterval: LOCATION_TRACKING_INTERVAL_MS, distanceInterval: 0},
                    (pos) => handlePosition(pos.coords.latitude, pos.coords.longitude)
                );
            }
        };

        startTracking();
        return () => watcher?.remove();
    }, [lastPosition, onStep, target]);

    return {location, errorMsg, liveLogs, targetLogs};
}
