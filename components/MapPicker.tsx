// components/MapSelector.tsx
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

interface MapSelectorProps {
    onSelect: (coords: { latitude: number; longitude: number }) => void;
}

export default function MapSelector({onSelect}: MapSelectorProps) {
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
        const map = L.map('map').setView([23.78, 90.40], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        let marker = null;
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (marker) marker.remove();
          marker = L.marker([lat, lng]).addTo(map);
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
});
