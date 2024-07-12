import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View } from 'react-native';

const Seat = ({ id, price, view, status, onSeatSelect, selected }) => {
  return (
    <TouchableOpacity
      style={[styles.seat, selected ? styles.selected : styles.available]}
      onPress={() => onSeatSelect(id)}
    >
      <Text style={styles.text}>{id}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  seat: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'green',
  },
  text: {
    color: '#fff'
  },
  selected: {
    backgroundColor: 'blue',
  },
  available: {
    backgroundColor: 'green',
  }
});

export default Seat;