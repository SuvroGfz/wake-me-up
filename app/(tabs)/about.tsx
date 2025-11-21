import React from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, Entypo } from '@expo/vector-icons'; // Expo vector icons

export default function AboutScreen() {
    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    };

    const links = [
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/gazi-fardin-zafor-suvro-a755bb2a7/', icon: <Entypo name="linkedin" size={20} color="#0a66c2" /> },
        { name: 'GitHub', url: 'https://github.com/SuvroGfz', icon: <FontAwesome name="github" size={20} color="#000" /> },
        { name: 'Portfolio', url: 'https://suvro.lovable.app/', icon: <Entypo name="link" size={20} color="#1e90ff" /> },
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>About This App</Text>

            <Text style={styles.info}>Developed by Gazi Fardin Zafor Suvro</Text>
            <Text style={styles.info}>CSE Graduate from BUET, Working as an Associate Software Engineer</Text>
            <Text style={styles.info}>Email: gazisn870@gmail.com</Text>
            <Text style={styles.info}>Dhaka, Bangladesh</Text>

            <View style={{ marginTop: 20 }}>
                {links.map((link, index) => (
                    <TouchableOpacity key={index} style={styles.linkRow} onPress={() => openLink(link.url)}>
                        {link.icon}
                        <Text style={[styles.linkText, { color: link.icon.props.color }]}>{link.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    info: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    linkText: {
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '600',
    },
});
