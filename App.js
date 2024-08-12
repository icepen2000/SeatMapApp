import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import SeatMap from './components/SeatMap';
import { WebSocketProvider } from './components/WebSocket';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { getBackendUrl } from './config';

const App = () => {
  console.log('Rendering App Component');

  const seatMapRef = useRef();

  const [mapData, setMapData] = useState(null);
  const [seatMapData, setSeatMapData] = useState(null);
  const [mapType, setMapType] = useState('sectionMap');
  const [error, setError] = useState('');

  const fetchMapData = useCallback((type, isBackground = false) => {
    console.log(`Fetching ${type} data from the backend...`);
    fetch(`${getBackendUrl()}/api/map?type=${type}`)
      .then(response => {
        console.log(`Response status: ${response.status}`);
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch data');
      })
      .then(data => {
        console.log(`${type} data fetched successfully:`);
        if (type === 'sectionMap') {
          console.log('Updating mapData and mapType state');
          setMapData(data);
          setMapType(type);
          fetchMapData('seatMap', true);
        } else if (type === 'seatMap') {
          console.log('Updating seatMapData state');
          setSeatMapData(data.sections);
          updateSeatMapData(data.sections);
          if (!isBackground) {
            console.log('Updating mapType state');
            setMapType(type);
          }
        }
      })
      .catch(error => {
        console.error(`Failed to fetch ${type} data:`, error);
        console.log('Updating error state');
        setError(`Failed to load ${type}. Please try again later.`);
      });
  }, []);

  const updateSeatMapState = useCallback((newState) => {
    if (seatMapRef.current) {
      seatMapRef.current.updateSeatMapState(newState);
    }
  }, []);

  const updateSeatMapData = useCallback((sectionData) => {
    if (seatMapRef.current) {
      seatMapRef.current.setSeatMapData(sectionData);
    }
  }, []);

  useEffect(() => {
    console.log('App component mounted');
    fetchMapData('sectionMap', false);
  }, [fetchMapData]);

  const handleZoomIn = useCallback(() => {
    'worklet';
    if (mapType === 'sectionMap' && seatMapData) {
      console.log('Zooming in and switching to seatMap');
      runOnJS(setMapType)('seatMap');
      //setMapType('seatMap');
    }
  }, [mapType, seatMapData]);

  useEffect(() => {
    console.log('App component mounted');
    return () => {
      console.log('App component unmounted');
    };
  }, []);

  return (
    <WebSocketProvider updateSeatMapState={updateSeatMapState}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {mapData ? (
            <SeatMap
              ref={seatMapRef}
              venueName={mapData.venueName}
              sections={mapType === 'seatMap' ? seatMapData : mapData.sections}
              nonSeats={mapData.nonSeats}
              onZoomIn={handleZoomIn}
              mapType={mapType}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>{error || 'Loading map...'}</Text>
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </WebSocketProvider>
  );
};

export default App;
