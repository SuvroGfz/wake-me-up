// components/alarm/AlarmCard.tsx
import React from 'react';
import {View, Text, TouchableOpacity, Switch, StyleSheet, Alert} from 'react-native';
import {Alarm} from '@/models/Alarm';
import {alarmToneLabels} from '@/assets/audio/alarm-tones';

interface AlarmCardProps {
    alarm: Alarm;
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function AlarmCard({alarm, onToggle, onEdit, onDelete}: AlarmCardProps) {
    const handleDelete = () => {
        Alert.alert(
            'Delete Alarm',
            `Are you sure you want to delete "${alarm.title}"?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(alarm.id)
                },
            ]
        );
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Messenger-style active indicator */}
                    <View style={styles.statusIndicatorWrapper}>
                        <View style={[
                            styles.statusDot,
                            alarm.active ? styles.statusDotActive : styles.statusDotInactive,
                        ]} />
                        {alarm.active && <View style={styles.statusRing} />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{alarm.title}</Text>
                        <Text style={[
                            styles.statusLabel,
                            { color: alarm.active ? '#16a34a' : '#9ca3af' },
                        ]}>
                            {alarm.active ? 'Active' : 'Disabled'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={alarm.active}
                    onValueChange={() => onToggle(alarm.id)}
                    trackColor={{false: '#d1d5db', true: '#3b82f6'}}
                    thumbColor={'#ffffff'}
                />
            </View>

            <View style={styles.details}>
                <Text style={styles.label}>📍 Location</Text>
                <Text style={styles.coords}>
                    {alarm.coords.latitude.toFixed(4)}, {alarm.coords.longitude.toFixed(4)}
                </Text>
            </View>

            <View style={styles.details}>
                <Text style={styles.label}>🔔 Alarm Tone</Text>
                <Text style={styles.tone}>{alarmToneLabels[alarm.tone]}</Text>
            </View>

            {alarm.triggeredAt && (
                <View style={styles.triggered}>
                    <Text style={styles.triggeredText}>
                        ⚡ Last triggered: {new Date(alarm.triggeredAt).toLocaleString()}
                    </Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => onEdit(alarm.id)}
                >
                    <Text style={styles.buttonText}>✏️ Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                >
                    <Text style={styles.buttonText}>🗑️ Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusIndicatorWrapper: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusDotActive: {
        backgroundColor: '#22c55e',
    },
    statusDotInactive: {
        backgroundColor: '#d1d5db',
    },
    statusRing: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    details: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    coords: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'monospace',
    },
    tone: {
        fontSize: 14,
        color: '#374151',
    },
    triggered: {
        backgroundColor: '#fef3c7',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    triggeredText: {
        fontSize: 12,
        color: '#92400e',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#3b82f6',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});