// screens/DestinationTracking.tsx
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
import MapViewer from '@/components/map/MapViewer';
import {clearLocationLogs} from '@/services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALARM_TONE_KEY} from '@/constants/values';
import {AlarmToneKey, alarmTones} from '@/assets/audio/alarm-tones';

export default function DestinationTracking() {
    const [coordInput, setCoordInput] = useState('');
    const [target, setTarget] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [alarmActive, setAlarmActive] = useState(false);
    const [alarmFile, setAlarmFile] = useState(require('@/assets/audio/alarm-tones/alarm1.mp3'));
    const [alarmTone, setAlarmTone] = useState<AlarmToneKey>('alarm1');

    const hasArrivedRef = useRef(false);

    const {location, errorMsg, targetLogs} = useLocationTracker(undefined, target || undefined);

    const player = useAudioPlayer(alarmFile, {
        updateInterval: 500,
        downloadFirst: true,
    });

    // Configure audio for background/silent mode
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionModeAndroid: 'duckOthers',
            interruptionMode: 'mixWithOthers',
        });
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const tone = await AsyncStorage.getItem(ALARM_TONE_KEY);
                if (tone && (tone in alarmTones)) {
                    setAlarmTone(tone as AlarmToneKey);
                } else {
                    setAlarmTone('alarm1');
                }
            } catch (e) {
                console.warn('Failed to load alarm tone, using default', e);
            }
        })();
    }, []);

    useEffect(() => {
        const file = alarmTones[alarmTone];
        if (player && file) {
            player.replace(file);
        }
    }, [alarmTone, player]);

    useEffect(() => {
        if (!target || !location || hasArrivedRef.current) return;
        const distance = getDistance(location, target);
        if (distance <= 20) {
            hasArrivedRef.current = true;
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

    // Manual coordinate input
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
        hasArrivedRef.current = false;
        setAlarmActive(false);
    };

    // Map selection
    const handleMapSelect = (coords: { latitude: number; longitude: number }) => {
        setTarget(coords);
        hasArrivedRef.current = false;
        setMapVisible(false);
        setAlarmActive(false);
    };

    // Reset destination
    const handleReset = () => {
        stopAlarm();
        hasArrivedRef.current = false;
        setTarget(null);
        setCoordInput('');
    };

    // Clear logs
    const handleClearLogs = async () => {
        await clearLocationLogs();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>⏰ Destination Alarm & Tracker</Text>

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
                                <Text style={{fontWeight: '600'}}>Current:</Text> {location.latitude.toFixed(6)},{' '}
                                {location.longitude.toFixed(6)}
                            </Text>
                            <Text>
                                <Text style={{fontWeight: '600'}}>Target:</Text> {target.latitude.toFixed(6)},{' '}
                                {target.longitude.toFixed(6)}
                            </Text>
                        </>
                    ) : (
                        <Text>Fetching location...</Text>
                    )}

                    {/* Map Viewer */}
                    <MapViewer current={location} destination={target} height={250}/>

                    <Text style={styles.subtitle}>Target Logs:</Text>
                    <ScrollView style={styles.logBox}>
                        {targetLogs.map((log, i) => (
                            <Text key={i} style={[styles.logText, log.color ? {color: log.color} : null]}>
                                {log.message}
                            </Text>
                        ))}
                    </ScrollView>

                    <View style={{flexDirection: 'row', marginTop: 12}}>
                        <TouchableOpacity
                            style={[styles.button, {flex: 1, marginRight: 4, backgroundColor: '#FF9500'}]}
                            onPress={handleReset}
                        >
                            <Text style={styles.buttonText}>Reset Destination</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, {flex: 1, marginLeft: 4, backgroundColor: '#666'}]}
                            onPress={handleClearLogs}
                        >
                            <Text style={styles.buttonText}>Clear Logs</Text>
                        </TouchableOpacity>
                    </View>
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
                        <Text
                            style={{
                                fontSize: 26,
                                fontWeight: 'bold',
                                marginBottom: 20,
                                color: '#FF3B30',
                            }}
                        >
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
