
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

const Seat = ({ id, price, status, onSeatSelect, selected, geometry }) => {
  // Check if geometry is defined and has a color property, defaulting to white if not
  const color = geometry?.color || { r: 255, g: 255, b: 255 };

  // Dynamically adjust the background color based on the selected state or using the RGB values from geometry
  const seatStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    backgroundColor: selected
      ? 'blue'
      : `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`,
  };

  return (
    <TouchableOpacity
      style={seatStyle}
      onPress={() => onSeatSelect(id)}
      activeOpacity={0.7}
    >
      {/* <Text style={styles.text}>{id}</Text> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#fff',
  },
});

export default Seat;
