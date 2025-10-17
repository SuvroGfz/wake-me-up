// components/MapViewer.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface LatLng {
    latitude: number;
    longitude: number;
}

interface MapViewerProps {
    current?: LatLng | null;
    destination?: LatLng | null;
    heading?: number | null;
    height?: number;
}

export default function MapViewer({
                                      current = null,
                                      destination = null,
                                      heading = null,
                                      height = 220,
                                  }: MapViewerProps) {
    const webviewRef = useRef<WebView | null>(null);

    const html = useMemo(
        () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .arrow-icon {
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 12px solid #007AFF;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map').setView([0, 0], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        let currentMarker = null;
        let arrowMarker = null;
        let destinationMarker = null;
        let routeLine = null;
        let animFrame = null;
        let lastPos = null;

        // Linear interpolation helper
        function lerp(a, b, t) {
          return a + (b - a) * t;
        }

        // Smoothly animate marker between old and new coords
        function smoothMove(from, to, duration = 1000) {
          if (!from || !to) return;
          const start = performance.now();

          function animate(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const lat = lerp(from[0], to[0], t);
            const lng = lerp(from[1], to[1], t);
            const pos = [lat, lng];
            if (currentMarker) currentMarker.setLatLng(pos);
            if (arrowMarker) arrowMarker.setLatLng(pos);
            if (t < 1) {
              animFrame = requestAnimationFrame(animate);
            } else {
              lastPos = pos;
            }
          }

          cancelAnimationFrame(animFrame);
          animFrame = requestAnimationFrame(animate);
        }

        function updateMarkers(payload) {
          const { current, destination, heading } = payload || {};
          if (!current) return;

          const currentPos = [current.latitude, current.longitude];

          // --- Create or move current marker smoothly ---
          if (!currentMarker) {
            currentMarker = L.circleMarker(currentPos, {
              radius: 8,
              color: '#007AFF',
              fillColor: '#007AFF',
              fillOpacity: 0.9,
            }).addTo(map).bindPopup('You are here');
            lastPos = currentPos;
          } else {
            // Animate movement
            smoothMove(lastPos, currentPos);
          }

          // --- Arrow (heading) marker ---
          if (heading !== null && heading !== undefined) {
            const arrowIcon = L.divIcon({
              className: '',
              html: '<div class="arrow-icon" style="transform: rotate(' + heading + 'deg);"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });
            if (!arrowMarker) {
              arrowMarker = L.marker(currentPos, { icon: arrowIcon }).addTo(map);
            } else {
              arrowMarker.setIcon(arrowIcon);
            }
          }

          // --- Destination marker ---
          if (destination) {
            const destPos = [destination.latitude, destination.longitude];
            if (!destinationMarker) {
              destinationMarker = L.marker(destPos).addTo(map).bindPopup('Destination');
            } else {
              destinationMarker.setLatLng(destPos);
            }

            // --- Route line ---
            if (!routeLine) {
              routeLine = L.polyline([currentPos, destPos], { color: '#FF3B30', weight: 3, opacity: 0.8 }).addTo(map);
            } else {
              routeLine.setLatLngs([currentPos, destPos]);
            }

            const bounds = L.latLngBounds([currentPos, destPos]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }

          map.invalidateSize();
        }

        // React Native message bridge
        function handleMessage(e) {
          try {
            const data = JSON.parse(e.data);
            updateMarkers(data);
          } catch (err) {}
        }

        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);
      </script>
    </body>
  </html>
  `,
        []
    );

    useEffect(() => {
        const payload = { current, destination, heading };
        if (webviewRef.current) {
            webviewRef.current.postMessage(JSON.stringify(payload));
        }
    }, [current, destination, heading]);

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                allowFileAccess
                mixedContentMode="always"
                style={{ flex: 1 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
});
