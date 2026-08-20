// app/(tabs)/index.tsx
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { useAlarms } from '@/hooks/useAlarms';
import AlarmCard from '@/components/alarm/AlarmCard';

export default function HomeScreen() {
    const router = useRouter();
    const { openAlarmId } = useLocalSearchParams<{ openAlarmId?: string }>();
    const { alarms, loading, error, refresh, toggle, remove, removeAll } = useAlarms();
    const [search, setSearch] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [highlightedAlarmId, setHighlightedAlarmId] = useState<string | null>(null);

    // Refresh alarms when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    // Handle scroll-to-alarm when navigated from map
    useEffect(() => {
        if (!openAlarmId || alarms.length === 0) return;

        // Clear search so the alarm is visible
        setSearch('');

        // Find the alarm index
        const index = alarms.findIndex((a) => a.id === openAlarmId);
        if (index === -1) return;

        // Scroll to the alarm after a short delay (wait for layout)
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.3, // show it near top
            });
            // Highlight briefly
            setHighlightedAlarmId(openAlarmId);
            setTimeout(() => setHighlightedAlarmId(null), 2000);
        }, 300);
    }, [openAlarmId, alarms]);

    const filteredAlarms = alarms.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteAll = () => {
        if (alarms.length === 0) return;
        Alert.alert(
            'Delete All Alarms',
            `Are you sure you want to delete all ${alarms.length} alarm${alarms.length !== 1 ? 's' : ''}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: () => removeAll(),
                },
            ]
        );
    };

    const handleEdit = (id: string) => {
        router.push({
            pathname: '/new-alarm',
            params: { editId: id },
        });
    };

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>
                {search ? 'No Matches' : 'No Location Alarms'}
            </Text>
            <Text style={styles.emptyText}>
                {search
                    ? `No alarms match "${search}"`
                    : 'Create your first alarm to get notified when you reach a destination'}
            </Text>
        </View>
    );

    const activeCount = alarms.filter((a) => a.active).length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>📍 Location Alarms</Text>
                    {alarms.length > 0 && (
                        <TouchableOpacity
                            style={styles.deleteAllBtn}
                            onPress={handleDeleteAll}
                        >
                            <Text style={styles.deleteAllText}>🗑️ All</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.subtitle}>
                    {activeCount} active alarm{activeCount !== 1 ? 's' : ''} · {alarms.length} total
                </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍  Search alarms..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                    clearButtonMode="while-editing"
                    autoCorrect={false}
                />
                {search.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => setSearch('')}
                    >
                        <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                )}
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
                    ref={flatListRef}
                    data={filteredAlarms}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={[
                            highlightedAlarmId === item.id && styles.highlightedCard,
                        ]}>
                            <AlarmCard
                                alarm={item}
                                onToggle={toggle}
                                onEdit={handleEdit}
                                onDelete={remove}
                            />
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refresh} />
                    }
                    onScrollToIndexFailed={(info) => {
                        // Fallback: scroll to approximate offset
                        flatListRef.current?.scrollToOffset({
                            offset: info.averageItemLength * info.index,
                            animated: true,
                        });
                    }}
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    deleteAllBtn: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    deleteAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#dc2626',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        position: 'relative',
    },
    searchInput: {
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1f2937',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    clearBtn: {
        position: 'absolute',
        right: 26,
        top: 20,
        padding: 4,
    },
    clearBtnText: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: '600',
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
    highlightedCard: {
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
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