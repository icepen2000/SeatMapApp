module.exports = {
  presets: [
    'module:metro-react-native-babel-preset'
  ],
  plugins: [
    [
      '@babel/plugin-transform-class-properties',
      { loose: true } // or false, depending on your preference
    ],
    [
      '@babel/plugin-transform-private-methods',
      { loose: true } // or false, depending on your preference
    ],
    [
      '@babel/plugin-transform-private-property-in-object',
      { loose: true } // or false, depending on your preference
    ],
    'react-native-reanimated/plugin'
  ],
};
