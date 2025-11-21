import React, {useEffect, useRef, useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import * as Location from 'expo-location';
import {PROXIMITY_THRESHOLD_METERS} from '@/constants/values';

interface LatLng {
    latitude: number;
    longitude: number;
}

interface Alarm {
    id: string;
    title: string;
    coords: LatLng;
    active: boolean;
    radius?: number;
}

interface MapViewerProps {
    alarms: Alarm[];
    height?: number;
    onOpenAlarm?: (alarmId: string) => void;
}

export default function MapViewer({alarms, height = 300, onOpenAlarm}: MapViewerProps) {
    const webviewRef = useRef<WebView | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'disabled'>('all');
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);

    const [hasSnappedOnce, setHasSnappedOnce] = useState(false);


    const filteredAlarms = alarms.filter((a) => {
        if (filter === 'all') return true;
        if (filter === 'active') return a.active;
        if (filter === 'disabled') return !a.active;
        return true;
    });

    // ------------------- LOCATION -------------------
    const fetchLocation = async () => {
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        } catch (err) {
            console.warn('[MapViewer] Failed to get location', err);
        }
    };

    useEffect(() => {
        fetchLocation(); // initial
        const interval = setInterval(fetchLocation, 5000);
        return () => clearInterval(interval);
    }, []);

    // ------------------- SNAP TO USER ON INITIAL LOAD -------------------
    useEffect(() => {
        if (!userLocation || !webviewRef.current) return;

        const payload = {
            current: userLocation,
            alarms: filteredAlarms.map(a => ({
                ...a,
                radius: a.radius || PROXIMITY_THRESHOLD_METERS,
            })),
            command: hasSnappedOnce ? undefined : 'snapUser',
        };

        webviewRef.current.postMessage(JSON.stringify(payload));

        // Mark that snap has been done
        if (!hasSnappedOnce) setHasSnappedOnce(true);
    }, [userLocation]);


    // ------------------- POST TO WEBVIEW -------------------
    useEffect(() => {
        if (!webviewRef.current) return;
        const payload = {
            current: userLocation,
            alarms: filteredAlarms.map((a) => ({
                id: a.id,
                coords: a.coords,
                title: a.title,
                active: a.active,
                radius: a.radius || PROXIMITY_THRESHOLD_METERS,
            })),
        };
        webviewRef.current.postMessage(JSON.stringify(payload));
    }, [filteredAlarms, userLocation]);

    // ------------------- HTML LEAFLET -------------------
    const html = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-tooltip {
        pointer-events: none !important;
    }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('map').setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

let currentMarker = null;
let alarmMarkers = {};
let alarmCircles = {};

function updateMap(data) {
  const { current, alarms, command } = data || {};

  if (current) {
    const pos = [current.latitude, current.longitude];
    if (!currentMarker) {
    currentMarker = L.circleMarker(pos, { 
        radius: 8, 
        color: '#007AFF', 
        fillColor: '#007AFF', 
        fillOpacity: 0.5 
    }).addTo(map);

    // Add temporary tooltip
    const tooltip = L.tooltip({
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'user-tooltip'
    })
    .setContent('You are here')
    .setLatLng(pos)
    .addTo(map);

    // Remove tooltip after 3 seconds
    setTimeout(() => map.removeLayer(tooltip), 3000);
} else {
    currentMarker.setLatLng(pos);
}

    if(command === 'snapUser') map.setView(pos, 16);
  }

  if(!alarms) return;
  // Remove markers/circles that are no longer in the alarms array
    Object.keys(alarmMarkers).forEach(id => {
        if (!alarms.find(a => a.id === id)) {
            map.removeLayer(alarmMarkers[id]);
            delete alarmMarkers[id];
        }
    });
    Object.keys(alarmCircles).forEach(id => {
        if (!alarms.find(a => a.id === id)) {
            map.removeLayer(alarmCircles[id]);
            delete alarmCircles[id];
        }
    });

  const bounds = [];

  alarms.forEach(a => {
    const pos = [a.coords.latitude, a.coords.longitude];
    bounds.push(pos);
    const color = a.active ? 'green' : 'red';

    if(!alarmMarkers[a.id]) {
      alarmMarkers[a.id] = L.marker(pos, {
      title: a.title,
      riseOnHover: true,
      icon: L.icon({
        iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize:[25,41],
        iconAnchor:[12,41]
      })
    })
    .addTo(map)
    .on('click', () => {
        // send message TO REACT NATIVE
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'openAlarm',
            id: a.id
        }));
    })
    .bindTooltip(a.title + (a.active ? ' (Active)' : ' (Disabled)'), {
        permanent: true,
        direction: 'right',
        offset: [10, 0],
    });

    } else {
      alarmMarkers[a.id].setLatLng(pos);
      alarmMarkers[a.id].setPopupContent(a.title + (a.active?' (Active)':' (Disabled)'));
    }

    if(!alarmCircles[a.id]) {
      alarmCircles[a.id] = L.circle(pos, { radius: a.radius, color: color, fillColor: a.active ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)', fillOpacity:0.4 }).addTo(map);
    } else {
      alarmCircles[a.id].setLatLng(pos);
      alarmCircles[a.id].setStyle({ color, fillColor: a.active?'rgba(0,255,0,0.2)':'rgba(255,0,0,0.2)' });
    }
  });

  if(command === 'snapAlarms' && bounds.length > 0){
    map.fitBounds(bounds, {padding:[50,50], maxZoom:16});
  }
}

function handleMessage(e) {
  try {
    const data = JSON.parse(e.data);
    updateMap(data);
  } catch(err){}
}
document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);
</script>
</body>
</html>
`, []);

    // ------------------- BUTTON HANDLERS -------------------
    const sendCommand = (command: string) => {
        if (!webviewRef.current) return;

        // Use filteredAlarms instead of all alarms
        const payload = {
            current: userLocation,
            alarms: filteredAlarms.map(a => ({
                ...a,
                radius: a.radius || PROXIMITY_THRESHOLD_METERS
            })),
            command,
        };

        webviewRef.current.postMessage(JSON.stringify(payload));

        // If command is refresh, also fetch new location
        if (command === 'refresh') fetchLocation();
    };


    return (
        <View style={{flex: 1}}>
            {/* FILTER */}
            <View style={styles.filterRow}>
                {(['all', 'active', 'disabled'] as const).map(f => (
                    <TouchableOpacity key={f} style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                                      onPress={() => setFilter(f)}>
                        <Text
                            style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{flex: 1}}>
                <WebView
                    ref={webviewRef}
                    originWhitelist={['*']}
                    source={{html}}
                    javaScriptEnabled
                    allowFileAccess
                    mixedContentMode="always"
                    style={{flex: 1}}
                    onMessage={e => {
                        try {
                            const data = JSON.parse(e.nativeEvent.data);
                            if (data.type === 'openAlarm') {
                                console.log("Open alarm:", data.id);

                                // 🔥 Call parent handler if provided
                                if (onOpenAlarm) {
                                    onOpenAlarm(data.id);
                                }
                            }
                        } catch (err) {
                            console.log("Invalid msg", err);
                        }
                    }}

                />

                {/* Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => sendCommand('snapUser')}>
                        <Text style={styles.buttonText}>📍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => sendCommand('snapAlarms')}>
                        <Text style={styles.buttonText}>🗺️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => sendCommand('refresh')}>
                        <Text style={styles.buttonText}>↻</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    filterRow: {flexDirection: 'row', backgroundColor: 'white', padding: 10, justifyContent: 'space-between'},
    filterButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center'
    },
    filterButtonActive: {backgroundColor: '#3b82f6'},
    filterText: {color: 'black', fontWeight: '600'},
    filterTextActive: {color: 'white'},
    buttonsContainer: {position: 'absolute', bottom: 20, right: 10},
    button: {
        backgroundColor: '#3b82f6',   // softer, slightly darker blue
        width: 40,                    // smaller width
        height: 40,                   // smaller height
        borderRadius: 20,             // keep it circular
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,             // spacing between stacked buttons
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    buttonText: {color: 'white', fontSize: 24},
    container: {width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee'},
});
