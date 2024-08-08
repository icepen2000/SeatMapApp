import React, { memo, useEffect, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import Seat from './Seat';  // Adjust the import path as necessary

const SeatItem = memo(({ sectionId, rowNumber, seat, isSelected, handleSeatSelect, calculateSeatStyle, seatRefs }) => {
  const refKey = `${sectionId}-${rowNumber}-${seat.seatNumber}`;
  const seatRef = useRef(null);

  // Assign the ref to the seatRefs object when the component mounts
  useEffect(() => {
    seatRefs.current[refKey] = seatRef;
  }, [refKey, seatRefs]);

  const staticStyle = useMemo(() => calculateSeatStyle(seat.geometry, seat.status), [seat.geometry, seat.status]);

  const dynamicStyle = useMemo(() => {
    return { backgroundColor: isSelected ? 'blue' : staticStyle.backgroundColor };
  }, [isSelected, staticStyle.backgroundColor]);

  return (
    <Animated.View
      key={refKey}
      ref={seatRef}
      style={{ ...staticStyle, ...dynamicStyle }}
      onTouchStart={() => handleSeatSelect(sectionId, rowNumber, seat.seatNumber, seat.status)}
    >
      <Seat
        id={refKey}
        price={seat.price}
        status={seat.status}
        geometry={seat.geometry}
        selected={isSelected}
      />
    </Animated.View>
  );
});

export default SeatItem;
