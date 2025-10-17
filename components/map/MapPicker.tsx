// components/MapSelector.tsx
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {WebView} from 'react-native-webview';
import * as Location from 'expo-location';

interface MapSelectorProps {
    onSelect: (coords: { latitude: number; longitude: number }) => void;
}

export default function MapSelector({onSelect}: MapSelectorProps) {
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        (async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        })();
    }, []);

    if (!currentLocation) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#007AFF"/>
            </View>
        );
    }

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map').setView([${currentLocation.latitude}, ${currentLocation.longitude}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);
          

          // Show current location marker (blue circle)
          const currentMarker = L.circleMarker([${currentLocation.latitude}, ${currentLocation.longitude}], {
            radius: 10,
            color: '#007AFF',
            fillColor: '#007AFF',
            fillOpacity: 0.7
          }).addTo(map).bindPopup('You are here');

          // Handle user selection
          let destinationMarker = null;
          map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            if (destinationMarker) destinationMarker.remove();
            destinationMarker = L.marker([lat, lng], { title: 'Destination' }).addTo(map);
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
          });
        </script>
      </body>
    </html>
  `;

    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{html}}
                onMessage={(event) => {
                    const data = JSON.parse(event.nativeEvent.data);
                    onSelect({latitude: data.lat, longitude: data.lng});
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
