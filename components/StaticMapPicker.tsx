// components/StaticMapPicker.tsx
import React, {useState} from 'react';
import {View, Image, TouchableWithoutFeedback, StyleSheet} from 'react-native';

export default function StaticMapPicker({
                                            onSelect,
                                            imageSource = require('@/assets/images/dhaka_map.png'), // use your own static image
                                            bounds = {
                                                topLat: 24.0,
                                                bottomLat: 23.6,
                                                leftLon: 90.1,
                                                rightLon: 90.6
                                            }
                                        }) {
    const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);

    const handlePress = (event: any) => {
        const {locationX, locationY, nativeEvent} = event.nativeEvent;
        const {width, height} = nativeEvent.source;
        const {topLat, bottomLat, leftLon, rightLon} = bounds;

        const lat = topLat - (locationY / height) * (topLat - bottomLat);
        const lon = leftLon + (locationX / width) * (rightLon - leftLon);

        setMarker({x: locationX, y: locationY});
        onSelect({latitude: lat, longitude: lon});
    };

    return (
        <View style={{position: 'relative'}}>
            <TouchableWithoutFeedback onPress={handlePress}>
                <Image
                    source={imageSource}
                    style={styles.map}
                    resizeMode="contain"
                />
            </TouchableWithoutFeedback>

            {marker && (
                <View
                    style={[
                        styles.marker,
                        {top: marker.y - 8, left: marker.x - 8}
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: 300,
        borderRadius: 10,
    },
    marker: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'red',
    },
});
