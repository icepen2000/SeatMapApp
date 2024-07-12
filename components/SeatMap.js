import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Seat from './Seat';

const SeatMap = ({ sections = [], nonSeatingAreas = [] }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Debugging data
  console.log("Sections data:", sections);
  console.log("Non-seating areas:", nonSeatingAreas);

  const handleSeatSelect = (sectionId, rowNumber, seatNumber) => {
    const seatId = `${sectionId}-${rowNumber}-${seatNumber}`;
    setSelectedSeats(prevSelectedSeats => {
      return prevSelectedSeats.includes(seatId)
        ? prevSelectedSeats.filter(id => id !== seatId)
        : [...prevSelectedSeats, seatId];
    });
  };

  if (!sections || sections.length === 0) {
    return <Text style={styles.noSectionsText}>No sections available.</Text>;
  }

  return (
    <ScrollView style={styles.scrollViewStyle} contentContainerStyle={styles.contentContainer}>
      <View style={styles.mapContainer}>
        {sections.map((section) => (
          <View
            key={section.sectionId}
            style={styles.section}>
            <Text style={styles.sectionTitle}>Section {section.sectionId}</Text>
            {section.rows.map((row) => (
              <View
                key={row.rowNumber}
                style={styles.row}>
                {row.seats.map((seat) => (
                  <Seat
                    key={`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`}
                    id={`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`}
                    price={seat.price}
                    status={seat.status}
                    onSeatSelect={() => handleSeatSelect(section.sectionId, row.rowNumber, seat.seatNumber)}
                    selected={selectedSeats.includes(`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`)}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
        {nonSeatingAreas.map((area) => (
          <View key={area.areaId} style={[styles.nonSeatingArea, {
            left: area.geometry.x,
            top: area.geometry.y,
            width: area.geometry.width,
            height: area.geometry.height,
            transform: [{ rotate: `${area.geometry.rotation}deg` }]
          }]}>
            <Text style={styles.areaText}>{area.areaId}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewStyle: {
    flex: 1  // Full height of the container
  },
  contentContainer: {
    paddingVertical: 20,  // Adds vertical padding inside the scroll view
    minHeight: 1000, // Ensure there's enough vertical space for absolute items
  },
  mapContainer: {
    alignItems: 'center',  // Aligns sections in the center
    width: '100%',  // Full width to accommodate all sections
    position: 'relative', // Required for absolute positioning of non-seating areas
  },
  section: {
    marginBottom: 20,  // Adds space between each section
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10  // Space between the title and the rows
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5
  },
  nonSeatingArea: {
    position: 'absolute',
    backgroundColor: 'rgba(68, 68, 68, 0.8)',  // Semi-transparent dark gray for visibility
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#666',
    borderWidth: 1,
    zIndex: 1000  // Ensure it's on top of other components
  },
  areaText: {
    color: 'white',
    fontWeight: 'bold'
  },
  noSectionsText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20
  }
});

export default SeatMap;
