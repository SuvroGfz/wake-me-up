// app/(tabs)/index.tsx
import {View, Text, TouchableOpacity} from 'react-native';
import {useRouter} from 'expo-router';
import {styles} from '@/styles/styles';

export default function HomeMenu() {
    const router = useRouter();

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

        </View>
    );
}
