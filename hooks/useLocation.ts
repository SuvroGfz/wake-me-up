import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {LOCATION_TRACKING_INTERVAL_MS} from "@/constants/values";

export default function useLocation() {
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let watcher: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            watcher = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: LOCATION_TRACKING_INTERVAL_MS,
                    distanceInterval: 0,
                },
                (pos) => {
                    setLocation({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                }
            );
        };

        startTracking();

        return () => {
            watcher?.remove();
        };
    }, []);

    return { location, errorMsg };
}
