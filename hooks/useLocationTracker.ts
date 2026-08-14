// hooks/useLocationTracker.ts
import {useEffect, useState, useRef} from 'react';
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

    // Use refs for values that change frequently to avoid re-running the effect
    const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const onStepRef = useRef(onStep);
    const targetRef = useRef(target);

    // Keep refs current without triggering effect re-runs
    useEffect(() => { onStepRef.current = onStep; }, [onStep]);
    useEffect(() => { targetRef.current = target; }, [target]);

    const getTimeString = () => new Date().toLocaleTimeString('en-US', {hour12: false});

    useEffect(() => {
        let isMounted = true;
        let watcherSubscription: Location.LocationSubscription | null = null;
        let webWatchId: number | null = null;

        const startTracking = async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (!isMounted) return;
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const handlePosition = (latitude: number, longitude: number) => {
                if (!isMounted) return;

                setLocation({latitude, longitude});

                if (targetRef.current) {
                    const distToTarget = getDistance({latitude, longitude}, targetRef.current);
                    setTargetLogs((prev) => [
                        {message: `[${getTimeString()}] Distance to target: ${distToTarget.toFixed(1)} meters.`},
                        ...prev,
                    ]);
                }

                if (lastPositionRef.current) {
                    const d = getDistance(
                        {latitude: lastPositionRef.current.latitude, longitude: lastPositionRef.current.longitude},
                        {latitude, longitude}
                    );
                    if (d >= 5) {
                        setLiveLogs((prev) => [
                            {message: `[${getTimeString()}] You walked ${d.toFixed(1)} meters from your last position.`},
                            ...prev,
                        ]);
                        lastPositionRef.current = {latitude, longitude};
                        onStepRef.current?.(d);
                    }
                } else {
                    setLiveLogs((prev) => [
                        {message: `[${getTimeString()}] Come on! Walk Walk. Do not stay still!!`, color: 'red'},
                        ...prev,
                    ]);
                    lastPositionRef.current = {latitude, longitude};
                }
            };

            if (Platform.OS === 'web') {
                if ('geolocation' in navigator) {
                    webWatchId = navigator.geolocation.watchPosition(
                        (pos) => handlePosition(pos.coords.latitude, pos.coords.longitude),
                        (err) => { if (isMounted) setErrorMsg(err.message); },
                        {enableHighAccuracy: true, maximumAge: 0, timeout: LOCATION_TRACKING_INTERVAL_MS}
                    );
                } else {
                    setErrorMsg('Geolocation not supported in this browser.');
                }
            } else {
                const sub = await Location.watchPositionAsync(
                    {accuracy: Location.Accuracy.Highest, timeInterval: LOCATION_TRACKING_INTERVAL_MS, distanceInterval: 0},
                    (pos) => handlePosition(pos.coords.latitude, pos.coords.longitude)
                );

                // If component unmounted while awaiting, kill subscription immediately
                if (isMounted) {
                    watcherSubscription = sub;
                } else {
                    sub.remove();
                }
            }
        };

        startTracking();

        return () => {
            isMounted = false;
            if (watcherSubscription) {
                watcherSubscription.remove();
            }
            if (webWatchId !== null && Platform.OS === 'web') {
                navigator.geolocation.clearWatch(webWatchId);
            }
        };
    }, []); // Empty dependency array — effect runs exactly once

    return {location, errorMsg, liveLogs, targetLogs};
}
