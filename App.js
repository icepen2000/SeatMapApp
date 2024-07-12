import React from 'react';
import { SafeAreaView } from 'react-native';
import SeatMap from './components/SeatMap';
import sectionsData from './data/sectionsData.json';  // Assuming the data is loaded from a local JSON file

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SeatMap sections={sectionsData.sections} nonSeatingAreas={sectionsData.nonSeatingAreas} />
    </SafeAreaView>
  );
};

export default App;
