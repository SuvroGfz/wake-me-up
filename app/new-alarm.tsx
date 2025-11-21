// app/new-alarm.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapPicker from '@/components/map/MapPicker';
import { addAlarm, getAlarmById, updateAlarm } from '@/services/alarmService';
import { AlarmTone, Coordinates } from '@/models/Alarm';
import { alarmToneLabels } from '@/assets/audio/alarm-tones';
import { playPreviewTone, stopPreviewTone } from '@/services/audioService';

export default function NewAlarmScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const editId = params.editId as string | undefined;

    const [title, setTitle] = useState('');
    const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
    const [manualInput, setManualInput] = useState('');
    const [selectedTone, setSelectedTone] = useState<AlarmTone>('alarm1');
    const [mapVisible, setMapVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!editId);

    // Load alarm in edit mode
    useEffect(() => {
        if (editId) loadAlarmData(editId);
    }, [editId]);

    useEffect(() => {
        // Cleanup when leaving screen
        return () => {
            stopPreviewTone();
        };
    }, []);


    const loadAlarmData = async (id: string) => {
        try {
            const alarm = await getAlarmById(id);
            if (!alarm) {
                Alert.alert('Error', 'Alarm not found');
                router.back();
                return;
            }
            setTitle(alarm.title);
            setSelectedCoords(alarm.coords);
            setSelectedTone(alarm.tone);
        } catch (e) {
            Alert.alert('Error', 'Failed to load alarm');
            router.back();
        } finally {
            setInitialLoading(false);
        }
    };

    const handleMapSelect = (coords: Coordinates) => {
        setSelectedCoords(coords);
        setMapVisible(false);
    };

    const handleManualSubmit = () => {
        if (!manualInput.trim()) {
            Alert.alert('Missing Coordinates', 'Please enter coordinates first.');
            return;
        }

        const [latStr, lngStr] = manualInput.split(',');
        const lat = Number(latStr);
        const lng = Number(lngStr);

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Invalid Coordinates', 'Enter values like: 40.7128,-74.0060');
            return;
        }

        setSelectedCoords({ latitude: lat, longitude: lng });
        Alert.alert('Coordinates Set', 'Using manual coordinates.');
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter an alarm title');
            return;
        }

        if (!selectedCoords) {
            Alert.alert('Missing Location', 'Please select a destination or enter coordinates');
            return;
        }

        setLoading(true);

        try {
            if (editId) {
                await updateAlarm(editId, {
                    title: title.trim(),
                    coords: selectedCoords,
                    tone: selectedTone,
                });
                Alert.alert('Success', 'Alarm updated successfully');
            } else {
                await addAlarm(title.trim(), selectedCoords, selectedTone);
                Alert.alert('Success', 'Alarm created successfully');
            }
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to save alarm');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{editId ? 'Edit Alarm' : 'New Alarm'}</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Alarm Title */}
                <View style={styles.section}>
                    <Text style={styles.label}>Alarm Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Wake up at Home"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Location Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Destination Location</Text>

                    {/* Selected Coordinates Display ALWAYS visible if coords exist */}
                    {selectedCoords ? (
                        <View style={styles.coordsDisplay}>
                            <Text style={styles.coordsText}>
                                📍 {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.hint}>No location selected yet</Text>
                    )}

                    {/* Manual Input Section (Below selected coords) */}
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 14, marginBottom: 6 }}>
                            Or enter coordinates manually:
                        </Text>

                        <TextInput
                            placeholder="Lat,Lng   e.g. 40.7128,-74.0060"
                            style={styles.manualInput}
                            value={manualInput}
                            onChangeText={setManualInput}
                            onSubmitEditing={handleManualSubmit}
                        />

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#6b7280' }]}
                            onPress={handleManualSubmit}
                        >
                            <Text style={styles.buttonText}>Use These Coordinates</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Open Map Picker */}
                    <TouchableOpacity
                        style={[styles.button, styles.mapButton]}
                        onPress={() => setMapVisible(true)}
                    >
                        <Text style={styles.buttonText}>
                            {selectedCoords ? '🗺️ Change Location' : '🗺️ Select on Map'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Alarm Tone Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Alarm Tone</Text>
                    {(['alarm1', 'alarm2', 'alarm3'] as AlarmTone[]).map((tone) => (
                        <TouchableOpacity
                            key={tone}
                            style={[
                                styles.toneOption,
                                selectedTone === tone && styles.toneOptionSelected,
                            ]}
                            onPress={() => {
                                setSelectedTone(tone)
                                playPreviewTone(tone);
                            }}
                        >
                            <Text
                                style={[
                                    styles.toneText,
                                    selectedTone === tone && styles.toneTextSelected,
                                ]}
                            >
                                {selectedTone === tone ? '🔘' : '⚪'} {alarmToneLabels[tone]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {editId ? '✅ Update Alarm' : '✅ Create Alarm'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Map Modal */}
            <Modal visible={mapVisible} animationType="slide">
                <MapPicker onSelect={handleMapSelect} />
                <TouchableOpacity
                    style={[styles.button, styles.closeButton]}
                    onPress={() => setMapVisible(false)}
                >
                    <Text style={styles.buttonText}>✕ Close Map</Text>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

/* ------------------------- STYLES ------------------------- */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: '#ffffff',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: { marginBottom: 8 },
    backText: { fontSize: 16, color: '#3b82f6' },
    title: { fontSize: 28, fontWeight: '800', color: '#1f2937' },

    content: { flex: 1, padding: 20 },

    section: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },

    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1f2937',
    },

    manualInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1f2937',
        marginBottom: 10,
        fontFamily: 'monospace',
    },

    hint: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },

    coordsDisplay: {
        backgroundColor: '#e0f2fe',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    coordsText: {
        fontSize: 14,
        color: '#075985',
        fontFamily: 'monospace',
    },

    toneOption: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    toneOptionSelected: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    toneText: { fontSize: 16, color: '#374151' },
    toneTextSelected: { color: '#1e40af', fontWeight: '600' },

    button: { padding: 16, borderRadius: 12, alignItems: 'center' },
    mapButton: { backgroundColor: '#3b82f6', marginTop: 12 },
    saveButton: { backgroundColor: '#10b981', marginTop: 8, marginBottom: 40 },
    closeButton: { backgroundColor: '#ef4444', margin: 20 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
