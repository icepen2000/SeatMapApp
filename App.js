import React from 'react';
import { SafeAreaView } from 'react-native';
import SeatMap from './components/SeatMap';
import sectionsData from './data/sectionsData2_color.json';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Wrap the top level of app or the specific component that uses the gesture handlers
const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <SeatMap sections={sectionsData.sections} nonSeatingAreas={sectionsData.nonSeatingAreas} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
