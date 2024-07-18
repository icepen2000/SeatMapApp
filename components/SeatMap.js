import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import Seat from './Seat';
import { Dimensions, PixelRatio } from 'react-native';
import { PinchGestureHandler } from 'react-native-gesture-handler';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const pixelRatio = PixelRatio.get();

const SeatMap = ({ venueName, sections = [] }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const scale = useRef(new Animated.Value(1));
  const onPinchEvent = Animated.event([{ nativeEvent: { scale: scale.current } }], { useNativeDriver: true });

  const handleSeatSelect = (sectionId, rowNumber, seatNumber) => {
    const seatId = `${sectionId}-${rowNumber}-${seatNumber}`;
    console.log('Seat clicked:', seatId);
    setSelectedSeats(prevSelectedSeats => {
      return prevSelectedSeats.includes(seatId)
        ? prevSelectedSeats.filter(id => id !== seatId)
        : [...prevSelectedSeats, seatId];
    });
  };

  const calculateSeatStyle = (geometry, sectionId, rowNumber, seatNumber) => {
    if (!geometry) {
      console.error(`Geometry missing for seat ${sectionId}-${rowNumber}-${seatNumber}`);
      return {};
    }
    const { x, y, width, height, rotation, color } = geometry;
    return {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      transform: [{ rotate: `${rotation}rad` }],
      backgroundColor: selectedSeats.includes(`${sectionId}-${rowNumber}-${seatNumber}`) ? 'blue' : `rgb(${color.r}, ${color.g}, ${color.b})`,
    };
  };

  return (
    <PinchGestureHandler onGestureEvent={onPinchEvent}>
      <Animated.View style={{ flex: 1, transform: [{ scale: scale.current }] }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          <View style={styles.mapContainer}>
            <Text style={styles.venueName}>{venueName}</Text>
            {sections.map((section) => (
              <View key={section.sectionId}>
                {section.rows.map((row) => (
                  <View key={row.rowNumber}>
                    {row.seats.map((seat) => (
                      <View
                        key={`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`}
                        style={calculateSeatStyle(seat.geometry, section.sectionId, row.rowNumber, seat.seatNumber)}
                        onStartShouldSetResponder={() => true}
                        onResponderGrant={() => handleSeatSelect(section.sectionId, row.rowNumber, seat.seatNumber)}
                      >
                        <Seat
                          id={`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`}
                          price={seat.price}
                          status={seat.status}
                          geometry={seat.geometry}
                          selected={selectedSeats.includes(`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`)}
                          onSeatSelect={() => handleSeatSelect(section.sectionId, row.rowNumber, seat.seatNumber)} // Ensuring correct prop usage
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}

          </View>
        </ScrollView>
      </Animated.View>
    </PinchGestureHandler>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: 'white', // Optional: to see the ScrollView area
  },
  contentContainer: {
    flexGrow: 1,
    //justifyContent: 'center', // This should vertically center your content if your ScrollView has the correct height
    alignItems: 'center',
    minHeight: windowHeight, // Ensure it's at least the height of the window
  },
  mapContainer: {
    width: '100%',
    position: 'relative',
    marginTop: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noSectionsText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  seatWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SeatMap;
