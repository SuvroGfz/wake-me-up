import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Alarms',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabBarIcon name="alarm" color={color} size={size} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabBarIcon name="map" color={color} size={size} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name="information-circle-outline" size={size} color={color} />
                    ),
                }}
            />

        </Tabs>
    );
}

function TabBarIcon({
                        name,
                        color,
                        size = 24,
                        focused = false,
                    }: {
    name: string;
    color: string;
    size?: number;
    focused?: boolean;
}) {
    const icons: Record<string, string> = {
        alarm: '⏰',
        home: '🏠',
        settings: '⚙️',
        map: '📍',
    };

    const containerHeight = Platform.OS === 'ios' ? 88 : 60;
    const paddingTop = Platform.OS === 'ios' ? 6 : 4;

    return (
        <View
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                borderTopWidth: focused ? 3 : 0, // highlight active tab
                borderTopColor: focused ? '#3b82f6' : 'transparent',
                paddingTop: 6,
                height: containerHeight - paddingTop - (focused ? 3 : 0),
            }}
        >
            <Text
                style={{
                    fontSize: size,
                    color,
                    fontWeight: focused ? '700' : '600',
                }}
            >
                {icons[name] || '📍'}
            </Text>
        </View>
    );
}
