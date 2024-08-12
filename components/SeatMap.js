import React, { memo, useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, Button, Alert } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, useAnimatedGestureHandler, withSpring, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler, PinchGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import SeatItem from './SeatItem';
import { useWebSocket } from './WebSocket';
import { getBackendUrl } from '../config';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const TOUCH_THRESHOLD = 15; // 터치와 제스처를 구분하기 위한 임계값 (픽셀 단위)
const ZOOM_THRESHOLD = 1.5; // Zoom level to switch to seat map

const SeatMap = forwardRef(({ venueName, sections, nonSeats, onZoomIn }, ref) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMapData, setSeatMapData] = useState(sections); // Define seatMapData state
  const [lastScale, setLastScale] = useState(1);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTouchX = useRef(0);
  const startTouchY = useRef(0);
  const [contentWidth, setContentWidth] = useState(windowWidth * 3);
  const [contentHeight, setContentHeight] = useState(windowHeight * 2);
  const { websocket } = useWebSocket();
  const seatRefs = useRef({});

  // State management for opacity
  const [seatMapVisible, setSeatMapVisible] = useState(false);
  const sectionMapOpacity = useSharedValue(1);
  const seatMapOpacity = useSharedValue(0);

  // Handle pinch gesture for zooming
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      'worklet';
      console.log('pinch gesture started');
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      'worklet';
      console.log(`Pinch gesture active - Scale: ${event.scale}`);
      scale.value = Math.min(Math.max(ctx.startScale * event.scale, MIN_SCALE), MAX_SCALE);

      if (scale.value > ZOOM_THRESHOLD) {
        sectionMapOpacity.value = withSpring(0, { stiffness: 100, damping: 15 });
        seatMapOpacity.value = withSpring(1, { stiffness: 100, damping: 15 });
      } else {
        sectionMapOpacity.value = withSpring(1, { stiffness: 100, damping: 15 });
        seatMapOpacity.value = withSpring(0, { stiffness: 100, damping: 15 });
      }
    },
    onEnd: () => {
      'worklet';
      console.log('pinch gesture ended');
      if (scale.value < 1) {
        scale.value = withSpring(1, { stiffness: 100, damping: 15 });
        runOnJS(setLastScale)(1);
      } else {
        runOnJS(setLastScale)(scale.value);
        if (scale.value > ZOOM_THRESHOLD && !seatMapVisible) {
          onZoomIn(); // Notify parent to switch to seat map
          runOnJS(setSeatMapVisible)(true); // Update seatMapVisible state
        }
      }
    }
  });

  const sectionMapStyle = useAnimatedStyle(() => {
    return {
      opacity: sectionMapOpacity.value,
    };
  });

  const seatMapStyle = useAnimatedStyle(() => {
    return {
      opacity: seatMapOpacity.value,
    };
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      console.log('Pan gesture started');
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      //console.log(`Pan gesture active - TranslationX: ${event.translationX}, TranslationY: ${event.translationY}`);
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      console.log('Pan gesture ended');
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
    console.log(`${new Date().toISOString()} - Touch start at seat: ${sectionId}-${rowNumber}-${seatNumber}`);

    const refKey = `${sectionId}-${rowNumber}-${seatNumber}`;
    const seatRef = seatRefs.current[refKey]?.current;

    updateSelectedSeats(sectionId, rowNumber, seatNumber, status);

    if (seatRef && seatRef.setNativeProps) {
      const isSelected = selectedSeats.includes(refKey);
      const newBackgroundColor = isSelected ? 'blue' : calculateSeatStyle(seatRefs.current[refKey].geometry, status).backgroundColor;
      seatRef.setNativeProps({ style: { backgroundColor: newBackgroundColor } });
    }
  };

  const updateSelectedSeats = useCallback((sectionId, rowNumber, seatNumber, status) => {
    const seatId = `${sectionId}-${rowNumber}-${seatNumber}`;

    if (status !== 'booked') {
        setSelectedSeats(prevSelectedSeats => (
          prevSelectedSeats.includes(seatId)
            ? prevSelectedSeats.filter(id => id !== seatId)
            : [...prevSelectedSeats, seatId]
        ));
    }
  },[]);

  const handleTouchStart = (e) => {
    startTouchX.current = e.nativeEvent.locationX;
    startTouchY.current = e.nativeEvent.locationY;
  };

  const handleTouchEnd = (e, sectionId, rowNumber, seatNumber, status) => {
    const endTouchX = e.nativeEvent.locationX;
    const endTouchY = e.nativeEvent.locationY;
    const distance = Math.sqrt(
      Math.pow(endTouchX - startTouchX.current, 2) + Math.pow(endTouchY - startTouchY.current, 2)
    );

    if (distance < TOUCH_THRESHOLD) {
      updateSelectedSeats(sectionId, rowNumber, seatNumber, status);
    }
  };

  const updateSeatMapState = useCallback((updatedSeat) => {
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
  }, []);

  const calculateSeatStyle = useCallback((geometry, status) => {
    console.log("==== calculateSeatStyle");
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
      backgroundColor,
    };
  }, []);

  const calculateNonSeatStyle = useCallback((geometry) => {
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
  }, []);

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
    if (selectedSeats.length === 0) {
      Alert.alert('Please select a seat.');
      return;
    }

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
        selectedSeats.map(seatId => {
          const [sectionId, rowNumber, seatNumber] = seatId.split('-');
          const updatedSeat = {
            sectionId,
            rowNumber,
            seatNumber,
            status: 'booked'
          };
          updateSeatMapState(updatedSeat);
        });
        setSelectedSeats([]);
      })
      .catch(error => {
        console.error('Failed to update seat status:', error);
        Alert.alert('Purchase Failed', 'Failed to book seats. Please try again later.');
      });
  };

  const handleRefresh = () => {
    console.log(`${new Date().toISOString()} - Refresh Start`);
    fetch(`${getBackendUrl()}/api/seatmap`)
      .then(response => {
        if (response.ok) {
          console.log(`${new Date().toISOString()} - Refresh Response OK`);
          return response.json();
        }
        throw new Error('Failed to refresh data');
      })
      .then(data => {
        console.log(`${new Date().toISOString()} - Refresh Data Set Start`);
        setSelectedSeats([]);
        setSeatMapData(data.sections);
        console.log(`${new Date().toISOString()} - Refresh Data Set End`);
      })
      .catch(error => {
        console.error('Failed to refresh seat map data:', error);
        //setError('Failed to refresh seat map. Please try again later.');
      });
  };

  useImperativeHandle(ref, () => ({
    updateSeatMapState,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={[styles.mapContainer, { width: contentWidth * lastScale, height: contentHeight * lastScale }]}>

              {/* Section Map */}
              <Animated.View style={[sectionMapStyle, { opacity: seatMapVisible ? 0 : 1 }]}>
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
              </Animated.View>

              {/* Seat Map */}
              <Animated.View style={[seatMapStyle, { opacity: seatMapVisible ? 1 : 0 }]}>
                {sections.map((section) => (
                  <View key={section.sectionId}>
                    {section.rows.map((row) => (
                      <View key={row.rowNumber}>
                        {row.seats.map((seat) => {
                          const refKey = `${section.sectionId}-${row.rowNumber}-${seat.seatNumber}`;
                          const isSelected = selectedSeats.includes(refKey);

                          return (
                            <SeatItem
                              key={refKey}
                              sectionId={section.sectionId}
                              rowNumber={row.rowNumber}
                              seat={seat}
                              isSelected={isSelected}
                              handleSeatSelect={handleSeatSelect}
                              calculateSeatStyle={calculateSeatStyle}
                              seatRefs={seatRefs}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                ))}
              </Animated.View>

            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>

      <View style={styles.purchaseButtonContainer}>
        <Button title="PURCHASE" onPress={handlePurchase} />
        <Button title="REFRESH" onPress={handleRefresh} />
      </View>
    </GestureHandlerRootView>
  );
});

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
    marginLeft: windowWidth / 4,
    marginRight: windowWidth / 4,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default React.memo(SeatMap);
