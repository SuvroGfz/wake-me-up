// app/(tabs)/settings.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {styles} from '@/styles/styles';
import {ALARM_TONE_KEY} from '@/constants/values';

const ALARM_TONES = [
    'alarm1.mp3',
    'alarm2.wav',
    'alarm3.mp3',
];

export default function Settings() {
    const [selectedTone, setSelectedTone] = useState<string | null>(null);

    useEffect(() => {
        // Load saved tone from AsyncStorage
        AsyncStorage.getItem(ALARM_TONE_KEY).then((t) => {
            if (t) setSelectedTone(t);
        });
    }, []);

    const handleSelect = async (tone: string) => {
        try {
            await AsyncStorage.setItem(ALARM_TONE_KEY, tone);
            setSelectedTone(tone);
            Alert.alert('Saved', `Alarm tone set to "${tone}"`);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to save selection');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>⚙️ Settings</Text>

            <Text style={[styles.subtitle, {marginBottom: 10}]}>Select Alarm Tone:</Text>
            <ScrollView style={{maxHeight: 300}}>
                {ALARM_TONES.map((tone) => (
                    <TouchableOpacity
                        key={tone}
                        style={[
                            styles.button,
                            {
                                backgroundColor: selectedTone === tone ? '#007AFF' : '#ccc',
                                marginVertical: 5,
                            },
                        ]}
                        onPress={() => handleSelect(tone)}
                    >
                        <Text style={styles.buttonText}>{tone.replace('.wav', '')}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
