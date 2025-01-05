import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Rect } from 'react-native-svg';

const MAP_ZOOM = 0.01;
const INITIAL_REGION = {
  latitudeDelta: MAP_ZOOM,
  longitudeDelta: MAP_ZOOM,
  latitude: 0,
  longitude: 0,
};

const deltaToZoomLevel = (delta: number) => {
  return Math.round(-Math.log2(delta) + 9);
};

export default function ExploreScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(INITIAL_REGION);
  const [isRegionSet, setIsRegionSet] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const [pathCoordinates, setPathCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      if (!isRegionSet) {
        const newRegion = {
          latitudeDelta: MAP_ZOOM,
          longitudeDelta: MAP_ZOOM,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setMapRegion(newRegion);
        setIsRegionSet(true);
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (location) => {
          setLocation(location);
          setPathCoordinates((prevCoordinates) => [
            ...prevCoordinates,
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
          ]);
        }
      );
    })();
  }, [isRegionSet]);

  const savePath = () => {
    console.log('Save button pressed');
  };

  const { width, height } = Dimensions.get('window');
  const cellSize = 20; // Size of each grid cell in pixels
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          minZoomLevel={deltaToZoomLevel(MAP_ZOOM) - 2}
          maxZoomLevel={deltaToZoomLevel(MAP_ZOOM) + 2}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          pointerEvents="none"
        >
          <Polyline coordinates={pathCoordinates} strokeColor="#FF4500" strokeWidth={3} />
        </MapView>

        {/* Minecraft-style Grid Overlay */}
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {Array.from({ length: cols * rows }).map((_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return (
              <Rect
                key={i}
                x={col * cellSize}
                y={row * cellSize}
                width={cellSize}
                height={cellSize}
                fill={row % 2 === col % 2 ? '#7CFC00' : '#32CD32'}
                stroke="#000"
                strokeWidth={1}
                opacity={0.7}
              />
            );
          })}
        </Svg>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={savePath}>
        <Text style={styles.saveButtonText}>Save Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 1.1,
    borderWidth: 20,
    borderColor: '#8B4513',
    borderRadius: 20,
    overflow: 'hidden',
    top: '20%',
    left: '0%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  saveButton: {
    position: 'absolute',
    marginTop: 600,
    marginHorizontal: '10%',
    width: '80%',
    height: 50,
    backgroundColor: '#8B4513',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
