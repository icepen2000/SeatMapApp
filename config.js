// config.js
const config = {
  //backendUrl: '10.0.2.2:8090', // default to localhost
  backendUrl: '34.238.103.127:8090',
};

export const getBackendUrl = () => `http://${config.backendUrl}`;
export const getWebSocketUrl = () => `ws://${config.backendUrl}/ws`;

export default config;
