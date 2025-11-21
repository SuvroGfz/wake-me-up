// tabs/map.tsx
import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapViewer from '@/components/map/MapViewer';
import {router, useFocusEffect} from 'expo-router';
import { useAlarms } from '@/hooks/useAlarms';

export default function MapTab() {
    const { alarms, loading, error, refresh } = useAlarms();

    // Refresh alarms when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    if (loading && alarms.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 10 }}>Loading alarms...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ color: 'red', fontSize: 16 }}>⚠️ Error loading alarms: {error}</Text>
            </View>
        );
    }

    // Pass the fetched alarms to MapViewer
    return <MapViewer alarms={alarms}
                  onOpenAlarm={(id) => {
                      router.push({
                          pathname: "/",
                          params: { openAlarmId: id }   // you will use this in Home to scroll/expand
                      });
                  }}
            />;
}
