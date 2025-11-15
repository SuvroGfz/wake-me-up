// app/(tabs)/index.tsx
import {View, Text, TouchableOpacity, ScrollView, Switch} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';
import {styles} from '@/styles/styles';
import {useCallback, useState} from "react";
import {Alarm} from "@/models/Alarm";
import {loadAlarms} from "@/services/alarmService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeMenu() {
    const router = useRouter();

    const [alarms, setAlarms] = useState<Alarm[]>([]);

    const refreshAlarms = useCallback(async () => {
        const data = await loadAlarms();
        setAlarms(data.reverse());
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshAlarms();
        }, [refreshAlarms])
    );

    const toggleActive = async (id: string) => {
        const updated = alarms.map(a => a.id === id ? {...a, active: !a.active} : a);
        setAlarms(updated);
        await AsyncStorage.setItem('alarms', JSON.stringify(updated));
    };

    const deleteAlarm = async (id: string) => {
        const updated = alarms.filter(a => a.id !== id);
        setAlarms(updated);
        await AsyncStorage.setItem('alarms', JSON.stringify(updated));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏠 Main Menu</Text>

            <TouchableOpacity
                style={[styles.button, {backgroundColor: '#007AFF'}]}
                onPress={() => router.push('/(tabs)/live-tracking')}
            >
                <Text style={styles.buttonText}>📡 Live Movement Tracker</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, {backgroundColor: '#34C759'}]}
                onPress={() => router.push('/(tabs)/destination-tracking')}
            >
                <Text style={styles.buttonText}>🎯 Track Distance to Destination</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, {backgroundColor: '#FF3B30'}]}
                onPress={() => router.push('/(tabs)/location-alarm')}
            >
                <Text style={styles.buttonText}>⏰ Destination Alarm</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, {backgroundColor: '#FFD60A', marginTop: 10}]}
                onPress={() => router.push('/(tabs)/settings')}
            >
                <Text style={styles.buttonText}>⚙️ Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#007AFF', marginTop: 10 }]}
                onPress={() => router.push('/(tabs)/new-alarm')}
            >
                <Text style={styles.buttonText}>➕ Add New Alarm</Text>
            </TouchableOpacity>

            <Text style={styles.title} >⏰ Saved Destination Alarms</Text>

            <ScrollView>
                {alarms.map(a => (
                    <View
                        key={a.id}
                        style={{
                            backgroundColor: '#f9fafb',
                            padding: 15,
                            borderRadius: 12,
                            marginVertical: 8,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                        }}
                    >
                        <Text style={{fontWeight: '600', fontSize: 16}}>{a.title}</Text>
                        <Text style={{color: '#666'}}>
                            {a.coords.latitude.toFixed(3)}, {a.coords.longitude.toFixed(3)}
                        </Text>
                        <Text>🔔 {a.tone}</Text>

                        <View style={{flexDirection: 'row', marginTop: 10, justifyContent: 'space-between'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Text>Active</Text>
                                <Switch value={a.active} onValueChange={() => toggleActive(a.id)} />
                            </View>

                            <View style={{flexDirection: 'row', gap: 10}}>
                                <TouchableOpacity
                                    style={[styles.button, {backgroundColor: '#007AFF', paddingHorizontal: 10}]}
                                    onPress={() => router.push({pathname: '/new-alarm', params: {editId: a.id}})}
                                >
                                    <Text style={{color: 'white'}}>✏️ Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, {backgroundColor: '#FF3B30', paddingHorizontal: 10}]}
                                    onPress={() => deleteAlarm(a.id)}
                                >
                                    <Text style={{color: 'white'}}>🗑 Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.button, {backgroundColor: '#34C759', marginTop: 20}]}
                    onPress={() => router.push('/new-alarm')}
                >
                    <Text style={styles.buttonText}>➕ Add New Alarm</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
