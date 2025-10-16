// app/(tabs)/destination-tracking.tsx
import {useState} from 'react';
import {View, Text, TextInput, ScrollView, TouchableOpacity} from 'react-native';
import {useLocationTracker} from '@/hooks/useLocationTracker';
import {styles} from '@/styles/styles';

export default function DestinationTracking() {
    const [targetLat, setTargetLat] = useState<string>('');
    const [targetLon, setTargetLon] = useState<string>('');
    const [targetSet, setTargetSet] = useState(false);

    const target =
        targetSet && targetLat && targetLon
            ? {latitude: parseFloat(targetLat), longitude: parseFloat(targetLon)}
            : undefined;

    const {location, errorMsg, targetLogs} = useLocationTracker(undefined, target);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎯 Destination Tracker</Text>

            {!targetSet ? (
                <>
                    <Text>Enter Destination Coordinates:</Text>
                    <TextInput
                        placeholder="Latitude"
                        value={targetLat}
                        onChangeText={setTargetLat}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Longitude"
                        value={targetLon}
                        onChangeText={setTargetLon}
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <TouchableOpacity
                        style={[styles.button, {backgroundColor: '#FF9500'}]}
                        onPress={() => setTargetSet(true)}
                    >
                        <Text style={styles.buttonText}>Start Tracking</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    {errorMsg ? (
                        <Text style={styles.error}>{errorMsg}</Text>
                    ) : location ? (
                        <>
                            <Text>Current Latitude: {location.latitude}</Text>
                            <Text>Current Longitude: {location.longitude}</Text>
                        </>
                    ) : (
                        <Text>Fetching location...</Text>
                    )}

                    <Text style={styles.subtitle}>Logs:</Text>
                    <ScrollView style={styles.logBox}>
                        {targetLogs.map((log, i) => (
                            <Text key={i} style={[styles.logText, log.color ? {color: log.color} : null]}>
                                {log.message}
                            </Text>
                        ))}
                    </ScrollView>
                </>
            )}
        </View>
    );
}
