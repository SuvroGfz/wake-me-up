import {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import {getDistance} from 'geolib';
import {useAudioPlayer, setAudioModeAsync} from 'expo-audio';
import {useLocationTracker} from '@/hooks/useLocationTracker';
import {styles} from '@/styles/styles';
import MapSelector from '@/components/map/MapPicker';

export default function LocationAlarm() {
    const [coordInput, setCoordInput] = useState('');
    const [target, setTarget] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [alarmActive, setAlarmActive] = useState(false);

    // ✅ Keep track if the alarm has already been triggered for this destination
    const hasArrivedRef = useRef(false);

    const {location, errorMsg, targetLogs} = useLocationTracker(undefined, target || undefined);

    const player = useAudioPlayer(require('@/assets/audio/alarm-tones/alarm1.wav'), {
        updateInterval: 500,
        downloadFirst: true,
    });

    // Configure audio to play in silent/background mode
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionModeAndroid: 'duckOthers',
            interruptionMode: 'mixWithOthers',
        });
    }, []);

    // ✅ Watch for proximity to destination
    useEffect(() => {
        if (!target || !location || hasArrivedRef.current) return;

        const distance = getDistance(location, target);

        if (distance <= 20) {
            hasArrivedRef.current = true; // lock the trigger
            setAlarmActive(true);
            playAlarm();
        }
    }, [location, target]);

    const playAlarm = () => {
        try {
            player.loop = true;
            player.volume = 1.0;
            player.play();
        } catch (e) {
            console.error('Error playing alarm:', e);
        }
    };

    const stopAlarm = () => {
        try {
            player.pause();
            player.loop = false;
            player.seekTo(0);
        } catch (e) {
            console.error('Error stopping alarm:', e);
        } finally {
            setAlarmActive(false);
        }
    };

    const handleManualSet = () => {
        if (!coordInput.trim()) return;
        const parts = coordInput.split(',').map((s) => s.trim());
        if (parts.length !== 2) {
            Alert.alert('Invalid format', 'Use format: 23.780887, 90.407395');
            return;
        }
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (isNaN(lat) || isNaN(lon)) {
            Alert.alert('Invalid coordinates', 'Please check your input.');
            return;
        }

        setTarget({latitude: lat, longitude: lon});
        hasArrivedRef.current = false; // ✅ reset when new target is set
        setAlarmActive(false);
    };

    const handleMapSelect = (coords: { latitude: number; longitude: number }) => {
        setTarget(coords);
        hasArrivedRef.current = false; // ✅ reset when new target is selected
        setMapVisible(false);
        setAlarmActive(false);
    };

    const handleReset = () => {
        stopAlarm();
        hasArrivedRef.current = false;
        setTarget(null);
        setCoordInput('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>⏰ Location Alarm</Text>

            {!target ? (
                <>
                    <Text>Enter destination or pick from map:</Text>

                    <TextInput
                        placeholder="e.g. 23.780887, 90.407395"
                        value={coordInput}
                        onChangeText={setCoordInput}
                        style={styles.input}
                        autoCapitalize="none"
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

                    <Modal visible={mapVisible} animationType="slide">
                        <MapSelector onSelect={handleMapSelect}/>
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

                    <TouchableOpacity
                        style={[styles.button, {backgroundColor: '#FF9500', marginTop: 20}]}
                        onPress={handleReset}
                    >
                        <Text style={styles.buttonText}>Reset Destination</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Alarm Modal */}
            <Modal visible={alarmActive} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 30,
                            borderRadius: 20,
                            alignItems: 'center',
                            width: '80%',
                        }}
                    >
                        <Text style={{fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#FF3B30'}}>
                            Wake Up! Wake Up! 🚨
                        </Text>
                        <TouchableOpacity
                            style={[styles.button, {backgroundColor: '#FF3B30'}]}
                            onPress={stopAlarm}
                        >
                            <Text style={styles.buttonText}>Stop Alarm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
