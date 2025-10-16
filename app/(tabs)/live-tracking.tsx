// app/(tabs)/live-tracking.tsx
import {View, Text, ScrollView} from 'react-native';
import {useLocationTracker} from '@/hooks/useLocationTracker';
import {styles} from '@/styles/styles';

export default function LiveTracking() {
    const {location, errorMsg, liveLogs} = useLocationTracker();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🛰️ Live Location Tracker</Text>

            {errorMsg ? (
                <Text style={styles.error}>{errorMsg}</Text>
            ) : location ? (
                <>
                    <Text>Latitude: {location.latitude}</Text>
                    <Text>Longitude: {location.longitude}</Text>
                </>
            ) : (
                <Text>Fetching location...</Text>
            )}

            <Text style={styles.subtitle}>Movement Logs:</Text>
            <ScrollView style={styles.logBox}>
                {liveLogs.map((log, i) => (
                    <Text key={i} style={[styles.logText, log.color ? {color: log.color} : null]}>
                        {log.message}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
}
