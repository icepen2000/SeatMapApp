import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import SeatMap from './components/SeatMap';
import { WebSocketProvider } from './components/WebSocket';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getBackendUrl } from './config';

const App = () => {
  const [sectionsData, setSectionsData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${getBackendUrl()}/api/seatmap`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch data');
      })
      .then(data => {
        setSectionsData(data);
        console.log('Seat map data loaded from Amazon S3.');
      })
      .catch(error => {
        console.error('Failed to fetch seat map data:', error);
        setError('Failed to load seat map. Please try again later.');
      });
  }, []);

  return (
    <WebSocketProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {sectionsData ? (
            <SeatMap
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
