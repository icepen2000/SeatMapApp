import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableWithoutFeedback, Button, Alert } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, useAnimatedGestureHandler, withSpring, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler, PinchGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Seat from './Seat';
import { useWebSocket } from './WebSocket';
import { getBackendUrl } from '../config'; // Import the getBackendUrl function

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const MIN_SCALE = 1;
const MAX_SCALE = 2;

const SeatMap = ({ venueName, sections = [], nonSeats = [] }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMapData, setSeatMapData] = useState(sections); // Define seatMapData state
  const [lastScale, setLastScale] = useState(1);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [contentWidth, setContentWidth] = useState(windowWidth * 3);
  const [contentHeight, setContentHeight] = useState(windowHeight * 2);
  const { websocket } = useWebSocket();

  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      console.log('pinch-->onStart');
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      console.log('pinch-->onActive');
      scale.value = Math.min(Math.max(ctx.startScale * event.scale, MIN_SCALE), MAX_SCALE);
    },
    onEnd: () => {
      console.log('pinch-->onEnd');
      runOnJS(setLastScale)(scale.value);
    }
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      console.log('pan-->onStart');
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      console.log('pan-->onActive');
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      console.log('pan-->onEnd');
    }
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(scale.value, { stiffness: 100, damping: 15 }) },
        { translateX: withSpring(translateX.value, { stiffness: 100, damping: 15 }) },
        { translateY: withSpring(translateY.value, { stiffness: 100, damping: 15 }) }
      ]
    };
  });

  const handleSeatSelect = (sectionId, rowNumber, seatNumber, status) => {
    const seatId = `${sectionId}-${rowNumber}-${seatNumber}`;

    if (status !== 'booked') {
        setSelectedSeats(prevSelectedSeats => (
          prevSelectedSeats.includes(seatId)
            ? prevSelectedSeats.filter(id => id !== seatId)
            : [...prevSelectedSeats, seatId]
        ));
    }
  };

  const updateSeatMapState = (updatedSeat) => {
    setSeatMapData(prevSeatMapData => {
      return prevSeatMapData.map(section => {
        if (section.sectionId === updatedSeat.sectionId) {
          return {
            ...section,
            rows: section.rows.map(row => {
              if (row.rowNumber === updatedSeat.rowNumber) {
                return {
                  ...row,
                  seats: row.seats.map(seat => {
                    if (seat.seatNumber === updatedSeat.seatNumber) {
                      return { ...seat, status: updatedSeat.status };
                    }
                    return seat;
                  })
                };
              }
              return row;
            })
          };
        }
        return section;
      });
    });
  };

  const calculateSeatStyle = (geometry, sectionId, rowNumber, seatNumber, status) => {
    if (!geometry) {
      return {};
    }
    const { x, y, width, height, rotation, color } = geometry;
    const backgroundColor = status === 'booked' ? 'red' : `rgb(${color.r}, ${color.g}, ${color.b})`;
    return {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      transform: [{ rotate: `${rotation}rad` }],
      backgroundColor: selectedSeats.includes(`${sectionId}-${rowNumber}-${seatNumber}`) ? 'blue' : backgroundColor,
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
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  useEffect(() => {
    let maxContentWidth = windowWidth;
    let maxContentHeight = windowHeight;

    seatMapData.forEach(section => {
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
  }, [seatMapData, nonSeats]);

  const handlePurchase = () => {
    const payload = selectedSeats.map(seatId => {
      const [sectionId, rowNumber, seatNumber] = seatId.split('-');
      return { sectionId, rowNumberSeatNumber: `${rowNumber}_${seatNumber}`, status: 'booked', price: 150 }; // Add price if needed
    });

    fetch(`${getBackendUrl()}/api/seat/update`, {  // Use getBackendUrl instead of hardcoding the URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to update seat status');
      })
      .then(data => {
        Alert.alert('Purchase Successful', 'Seats have been booked successfully.');
        setSelectedSeats([]);
      })
      .catch(error => {
        console.error('Failed to update seat status:', error);
        Alert.alert('Purchase Failed', 'Failed to book seats. Please try again later.');
      });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={[styles.mapContainer, { width: contentWidth * lastScale, height: contentHeight * lastScale }]}>
              <TouchableWithoutFeedback onPress={(e) => {
                console.log('Map touched at', e.nativeEvent.locationX, e.nativeEvent.locationY);
              }}>
                <View style={[styles.touchLayer, { width: contentWidth * lastScale, height: contentHeight * lastScale }]} />
              </TouchableWithoutFeedback>

              {nonSeats.map((nonSeat, index) => (
                <View
                  key={index}
                  style={calculateNonSeatStyle(nonSeat.geometry)}
                >
                  {nonSeat.name ? (
                    <Text style={styles.nonSeatLabel}>{nonSeat.name}</Text>
                  ) : null}
                </View>
              ))}

              {seatMapData.map((section) => (
                <View key={section.sectionId}>
                  {section.rows.map((row) => (
                    <View key={row.rowNumber}>
                      {row.seats.map((seat) => (
                        <Animated.View
                          key={`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`}
                          style={calculateSeatStyle(seat.geometry, section.sectionId, row.rowNumber, seat.seatNumber, seat.status)}
                          onTouchStart={() => {
                            console.log(`Touch start at seat: ${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`);
                            handleSeatSelect(section.sectionId, row.rowNumber, seat.seatNumber, seat.status);
                          }}
                        >
                          <Seat
                            id={`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`}
                            price={seat.price}
                            status={seat.status}
                            geometry={seat.geometry}
                            selected={selectedSeats.includes(`${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`)}
                            onSeatSelect={() => handleSeatSelect(section.sectionId, row.rowNumber, seat.seatNumber, seat.status)}
                          />
                        </Animated.View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
      <View style={styles.purchaseButtonContainer}>
        <Button title="PURCHASE" onPress={handlePurchase} />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    position: 'relative',
  },
  touchLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
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
  purchaseButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default SeatMap;
