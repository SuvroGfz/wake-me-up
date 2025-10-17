import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { styles } from '@/styles/styles';
import MapSelector from '@/components/MapPicker';

export default function DestinationTracking() {
    const [target, setTarget] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);

    const { location, errorMsg, targetLogs } = useLocationTracker(undefined, target || undefined);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎯 Destination Tracker</Text>

            {!target ? (
                <>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#007AFF' }]}
                        onPress={() => setMapVisible(true)}
                    >
                        <Text style={styles.buttonText}>Select Destination on Map</Text>
                    </TouchableOpacity>

                    <Modal visible={mapVisible} animationType="slide">
                        <MapSelector
                            onSelect={(coords) => {
                                setTarget(coords);
                                setMapVisible(false);
                            }}
                        />
                    </Modal>
                </>
            ) : (
                <>
                    {errorMsg ? (
                        <Text style={styles.error}>{errorMsg}</Text>
                    ) : location ? (
                        <>
                            <Text>Current Latitude: {location.latitude.toFixed(6)}</Text>
                            <Text>Current Longitude: {location.longitude.toFixed(6)}</Text>
                            <Text>Target Latitude: {target.latitude.toFixed(6)}</Text>
                            <Text>Target Longitude: {target.longitude.toFixed(6)}</Text>
                        </>
                    ) : (
                        <Text>Fetching location...</Text>
                    )}

                    <Text style={styles.subtitle}>Logs:</Text>
                    <ScrollView style={styles.logBox}>
                        {targetLogs.map((log, i) => (
                            <Text key={i} style={[styles.logText, log.color ? { color: log.color } : null]}>
                                {log.message}
                            </Text>
                        ))}
                    </ScrollView>
                </>
            )}
        </View>
    );
}
