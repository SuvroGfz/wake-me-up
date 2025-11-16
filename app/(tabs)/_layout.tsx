// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

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
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="alarm" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}

// Replace <span> with React Native <Text>
function TabBarIcon({
                        name,
                        color,
                        size = 24,
                    }: {
    name: string;
    color: string;
    size?: number;
}) {
    const icons: Record<string, string> = {
        alarm: '⏰',
        home: '🏠',
        settings: '⚙️',
    };

    return (
        <Text
            style={{
                fontSize: size,
                color,
                textAlign: 'center',
            }}
        >
            {icons[name] || '📍'}
        </Text>
    );
}
