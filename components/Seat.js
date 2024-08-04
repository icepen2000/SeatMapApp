import React, {memo} from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

const Seat = memo(({ id, price, status, onSeatSelect, selected, geometry }) => {
  // Check if geometry is defined and has a color property, defaulting to white if not
  const color = geometry?.color || { r: 255, g: 255, b: 255 };

  // Dynamically adjust the background color based on the selected state or using the RGB values from geometry
  const seatStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    backgroundColor: selected
      ? 'blue' // Highlight the selected seat in blue
      : status === 'booked'
      ? 'red' // Set booked seats to red
      : `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`, // Default color for available seats
  };

  return (
    <TouchableOpacity
      style={seatStyle}
      onPress={() => onSeatSelect(id, status)}
      activeOpacity={status === 'booked' ? 1 : 0.7}
      disabled={status === 'booked'}
    >
      {/* <Text style={styles.text}>{id}</Text> */}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to avoid unnecessary re-renders
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.geometry?.color.r === nextProps.geometry?.color.r &&
    prevProps.geometry?.color.g === nextProps.geometry?.color.g &&
    prevProps.geometry?.color.b === nextProps.geometry?.color.b
  );
});

const styles = StyleSheet.create({
  text: {
    color: '#fff',
  },
});

export default Seat;