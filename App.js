import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import SeatMap from './components/SeatMap';
import { WebSocketProvider } from './components/WebSocket';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getBackendUrl } from './config';

const App = () => {
  const seatMapRef = useRef();

  const [sectionsData, setSectionsData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log(`${new Date().toISOString()} - SUNI APP Requested the seat map data`);
    fetch(`${getBackendUrl()}/api/seatmap`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch data');
      })
      .then(data => {
        console.log(`${new Date().toISOString()} - SUNI APP Received the seat map data from backend`);
        setSectionsData(data);
        console.log(`${new Date().toISOString()} - SUNI APP Seat map data loaded from Amazon S3`);
      })
      .catch(error => {
        console.error('Failed to fetch seat map data:', error);
        setError('Failed to load seat map. Please try again later.');
      });
  }, []);

  return (
    <WebSocketProvider updateSeatMapState={(newState) => seatMapRef.current.updateSeatMapState(newState)}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {sectionsData ? (
            <SeatMap
              ref={seatMapRef}
              venueName={sectionsData.venueName}
              sections={sectionsData.sections}
              nonSeats={sectionsData.nonSeats}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>{error || 'Loading seat map...'}</Text>
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </WebSocketProvider>
  );
};

export default App;
