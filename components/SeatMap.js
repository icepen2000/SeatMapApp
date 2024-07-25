import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Seat from './Seat';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const MIN_SCALE = 1; // 최소 스케일 값
const MAX_SCALE = 2; // 최대 스케일 값

const SeatMap = ({ venueName, sections = [], nonSeats = [] }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const scale = useRef(new Animated.Value(1)).current;
  const [lastScale, setLastScale] = useState(1);
  const [contentWidth, setContentWidth] = useState(windowWidth * 3);
  const [contentHeight, setContentHeight] = useState(windowHeight * 2);
  const scrollViewRef = useRef(null);
  const scrollViewRef2 = useRef(null);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        //console.log('Pinch event:', event.nativeEvent);
      }
    }
  );

  const onPinchStateChange = event => {
    //console.log('Pinch state change:', event.nativeEvent);
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let newScale = lastScale * event.nativeEvent.scale;
      if (newScale < MIN_SCALE) {
        newScale = MIN_SCALE;
      }
      if (newScale > MAX_SCALE) {
        newScale = MAX_SCALE;
      }
      setLastScale(newScale);
      scale.setValue(newScale);
    }
  };

  const handleSeatSelect = (sectionId, rowNumber, seatNumber) => {
    const seatId = `${sectionId}-${rowNumber}-${seatNumber}`;
    console.log('Seat clicked:', seatId);
    setSelectedSeats(prevSelectedSeats => (
      prevSelectedSeats.includes(seatId)
        ? prevSelectedSeats.filter(id => id !== seatId)
        : [...prevSelectedSeats, seatId]
    ));
  };

  const calculateSeatStyle = (geometry, sectionId, rowNumber, seatNumber) => {
    if (!geometry) {
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

  const calculateNonSeatStyle = (geometry) => {
    if (!geometry) {
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
      backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
      alignItems: 'center', // Center the content horizontally
      justifyContent: 'center', // Center the content vertically
    };
  };

  useEffect(() => {
    let maxContentWidth = windowWidth;
    let maxContentHeight = windowHeight;

    sections.forEach(section => {
      section.rows.forEach(row => {
        row.seats.forEach(seat => {
          const { x, y, width, height } = seat.geometry;
          maxContentWidth = Math.max(maxContentWidth, x + width);
          maxContentHeight = Math.max(maxContentHeight, y + height);
        });
      });
    });

    nonSeats.forEach(nonSeat => {
      const { x, y, width, height } = nonSeat.geometry;
      maxContentWidth = Math.max(maxContentWidth, x + width);
      maxContentHeight = Math.max(maxContentHeight, y + height);
    });

    setContentWidth(maxContentWidth);
    setContentHeight(maxContentHeight + 70);
  }, [sections, nonSeats]);

  return (
    <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
      <Animated.View style={{ flex: 1, transform: [{ scale: scale }] }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          style={styles.container}
          contentContainerStyle={{ width: contentWidth * lastScale }}
          scrollEventThrottle={16}
        >
          <ScrollView
            ref={scrollViewRef2}
            style={styles.container}
            contentContainerStyle={{ height: contentHeight * lastScale }}
            scrollEventThrottle={16}
          >
            <View style={[styles.mapContainer, { width: contentWidth * lastScale, height: contentHeight * lastScale }]}>
              {/* Render non-seats */}
              {nonSeats.map((nonSeat, index) => (
                <View
                  key={index}
                  style={calculateNonSeatStyle(nonSeat.geometry)}
                >
                  {/* Render non-seat name or label if needed */}
                  {nonSeat.name ? (
                    <Text style={styles.nonSeatLabel}>{nonSeat.name}</Text>
                  ) : null}
                </View>
              ))}

              {/* Render seats */}
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
                            onSeatSelect={() => handleSeatSelect(section.sectionId, row.rowNumber, seat.seatNumber)}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </Animated.View>
    </PinchGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    position: 'relative',
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  nonSeatLabel: {
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SeatMap;