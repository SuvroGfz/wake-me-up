import {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import {useLocationTracker} from '@/hooks/useLocationTracker';
import {styles} from '@/styles/styles';
import MapSelector from '@/components/map/MapPicker';
import MapViewer from '@/components/map/MapViewer';

export default function DestinationTracking() {
    const [coordInput, setCoordInput] = useState<string>(''); // single input field
    const [target, setTarget] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);

    const {location, errorMsg, targetLogs} = useLocationTracker(undefined, target || undefined);

    const handleManualSet = () => {
        if (!coordInput.trim()) return;

        // Split and parse "lat, lon"
        const parts = coordInput.split(',').map((s) => s.trim());
        if (parts.length !== 2) {
            Alert.alert('Invalid format', 'Please enter coordinates like "23.780887, 90.407395"');
            return;
        }

        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (isNaN(lat) || isNaN(lon)) {
            Alert.alert('Invalid coordinates', 'Could not parse numbers.');
            return;
        }

        setTarget({latitude: lat, longitude: lon});
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎯 Destination Tracker</Text>

            {!target ? (
                <>
                    <Text>Enter destination (comma-separated or select from map):</Text>

                    <TextInput
                        placeholder="e.g. 23.780887, 90.407395"
                        value={coordInput}
                        onChangeText={setCoordInput}
                        keyboardType="default"
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        style={[styles.button, {backgroundColor: '#34C759'}]}
                        onPress={handleManualSet}
                    >
                        <Text style={styles.buttonText}>Use Entered Coordinates</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, {backgroundColor: '#007AFF', marginTop: 10}]}
                        onPress={() => setMapVisible(true)}
                    >
                        <Text style={styles.buttonText}>Select Destination on Map</Text>
                    </TouchableOpacity>

                    {/* Map Modal */}
                    <Modal visible={mapVisible} animationType="slide">
                        <MapSelector
                            onSelect={(coords) => {
                                setTarget(coords);
                                setMapVisible(false);
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.button, {backgroundColor: '#FF3B30', margin: 10}]}
                            onPress={() => setMapVisible(false)}
                        >
                            <Text style={styles.buttonText}>Close Map</Text>
                        </TouchableOpacity>
                    </Modal>
                </>
            ) : (
                <>
                    {errorMsg ? (
                        <Text style={styles.error}>{errorMsg}</Text>
                    ) : location ? (
                        <>
                            <Text>
                                <Text style={{fontWeight: '600'}}>Current:</Text>{' '}
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </Text>
                            <Text>
                                <Text style={{fontWeight: '600'}}>Target:</Text>{' '}
                                {target.latitude.toFixed(6)}, {target.longitude.toFixed(6)}
                            </Text>
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

                    <MapViewer
                        current={location}
                        destination={target}
                        // heading={location?.heading ?? 0}  // optional
                        height={250}
                    />

                    <TouchableOpacity
                        style={[styles.button, {backgroundColor: '#FF9500', marginTop: 20}]}
                        onPress={() => {
                            setTarget(null);
                            setCoordInput('');
                        }}
                    >
                        <Text style={styles.buttonText}>Reset Destination</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}
