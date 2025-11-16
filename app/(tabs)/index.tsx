// app/(tabs)/index.tsx
import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAlarms } from '@/hooks/useAlarms';
import AlarmCard from '@/components/alarm/AlarmCard';

export default function HomeScreen() {
    const router = useRouter();
    const { alarms, loading, error, refresh, toggle, remove } = useAlarms();

    // Refresh alarms when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const handleEdit = (id: string) => {
        router.push({
            pathname: '/new-alarm',
            params: { editId: id },
        });
    };

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No Location Alarms</Text>
            <Text style={styles.emptyText}>
                Create your first alarm to get notified when you reach a destination
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📍 Location Alarms</Text>
                <Text style={styles.subtitle}>
                    {alarms.filter((a) => a.active).length} active alarm{alarms.filter((a) => a.active).length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Error */}
            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            )}

            {/* Alarm List */}
            {loading && alarms.length === 0 ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={alarms}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AlarmCard
                            alarm={item}
                            onToggle={toggle}
                            onEdit={handleEdit}
                            onDelete={remove}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refresh} />
                    }
                />
            )}

            {/* Add Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/new-alarm')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#ffffff',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    errorBanner: {
        backgroundColor: '#fee2e2',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
    },
    errorText: {
        color: '#991b1b',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: '#ffffff',
        fontWeight: '300',
    },
});