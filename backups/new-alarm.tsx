import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Modal, Alert, TextInput} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {styles} from '@/styles/styles';
import {addNewAlarm, loadAlarms} from '@/services/alarmService';
import {alarmTones, AlarmToneKey} from '@/assets/audio/alarm-tones';
import {useAudioPlayer, setAudioModeAsync} from 'expo-audio';
import MapSelector from '@/components/map/MapPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alarm} from '@/models/Alarm';

export default function NewAlarm() {
    const router = useRouter();
    const {editId} = useLocalSearchParams<{ editId?: string }>();

    const [title, setTitle] = useState('');
    const [coordInput, setCoordInput] = useState('');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [tone, setTone] = useState<AlarmToneKey>('alarm1');
    const [mapVisible, setMapVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const player = useAudioPlayer(alarmTones.alarm1, {updateInterval: 500});

    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionModeAndroid: 'duckOthers',
            interruptionMode: 'mixWithOthers',
        });
    }, []);

    // 🧩 Load existing alarm if editing
    useEffect(() => {
        const loadExistingAlarm = async () => {
            if (!editId) return;

            const stored = await AsyncStorage.getItem('alarms');
            if (!stored) return;

            const alarms: Alarm[] = JSON.parse(stored);
            const alarm = alarms.find((a) => a.id === editId);

            if (alarm) {
                setIsEdit(true);
                setTitle(alarm.title);
                setCoords(alarm.coords);
                setTone(alarm.tone);
                setCoordInput(`${alarm.coords.latitude}, ${alarm.coords.longitude}`);
            }
        };

        loadExistingAlarm();
    }, [editId]);

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
        setCoords({latitude: lat, longitude: lon});
    };

    const handleMapSelect = (selected: { latitude: number; longitude: number }) => {
        setCoords(selected);
        setCoordInput(`${selected.latitude}, ${selected.longitude}`);
        setMapVisible(false);
    };

    const handleSaveAlarm = async () => {
        if (!title.trim()) {
            Alert.alert('Missing title', 'Please enter a title for this alarm.');
            return;
        }
        if (!coords) {
            Alert.alert('Missing location', 'Please select destination first.');
            return;
        }

        const existingRaw = await AsyncStorage.getItem('alarms');
        const alarms: Alarm[] = existingRaw ? JSON.parse(existingRaw) : [];

        if (isEdit && editId) {
            // 🧠 Update existing
            const updated = alarms.map((a) =>
                a.id === editId ? {...a, title, coords, tone} : a
            );
            await AsyncStorage.setItem('alarms', JSON.stringify(updated));
            Alert.alert('✅ Updated', 'Alarm has been updated successfully.');
        } else {
            // ➕ Add new
            await addNewAlarm(coords, tone, title);
            Alert.alert('✅ Saved', 'Alarm has been added successfully.');
        }

        router.back();
    };

    const playPreview = async (t: AlarmToneKey) => {
        try {
            await player.replace(alarmTones[t]);
            await player.play();
            setTimeout(() => player.pause(), 5000);
        } catch (e) {
            console.error('Preview failed', e);
        }
    };

    return (
        <View style={[styles.container, {padding: 20}]}>
            <Text style={styles.title}>
                {isEdit ? '✏️ Edit Alarm' : '➕ Create New Alarm'}
            </Text>

            {/* 🏷️ Title Field */}
            <Text style={styles.subtitle}>📝 Alarm Title</Text>
            <TextInput
                placeholder="e.g. Morning Trip to Office"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
            />

            <Text style={styles.subtitle}>📍 Choose Destination</Text>
            <TextInput
                placeholder="e.g. 23.780887, 90.407395"
                value={coordInput}
                onChangeText={setCoordInput}
                style={styles.input}
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

            {coords && (
                <Text style={{marginTop: 10}}>
                    ✅ Selected: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </Text>
            )}

            <Text style={[styles.subtitle, {marginTop: 10}]}>🔔 Select Alarm Tone</Text>

            <ScrollView style={{maxHeight: 200}}>
                {(Object.keys(alarmTones) as AlarmToneKey[]).map((key) => (
                    <View
                        key={key}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: tone === key ? '#dbeafe' : '#f8f9fa',
                            marginVertical: 6,
                            padding: 10,
                            borderRadius: 12,
                        }}
                    >
                        <Text>🎵 {key}</Text>
                        <View style={{flexDirection: 'row', gap: 10}}>
                            <TouchableOpacity
                                style={[styles.button, {
                                    backgroundColor: '#007AFF',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6
                                }]}
                                onPress={() => playPreview(key)}
                            >
                                <Text style={{color: 'white'}}>▶️ Play</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, {
                                    backgroundColor: '#34C759',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6
                                }]}
                                onPress={() => setTone(key)}
                            >
                                <Text style={{color: 'white'}}>
                                    {tone === key ? '✅ Selected' : 'Select'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[styles.button, {backgroundColor: '#007AFF', marginTop: 20}]}
                onPress={handleSaveAlarm}
            >
                <Text style={styles.buttonText}>{isEdit ? '💾 Save Changes' : '💾 Save Alarm'}</Text>
            </TouchableOpacity>

            {/* 🗺️ Map Modal */}
            <Modal visible={mapVisible} animationType="slide">
                <MapSelector onSelect={handleMapSelect}/>
                <TouchableOpacity
                    style={[styles.button, {backgroundColor: '#FF3B30', margin: 10}]}
                    onPress={() => setMapVisible(false)}
                >
                    <Text style={styles.buttonText}>Close Map</Text>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
