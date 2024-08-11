import React, { useEffect, useState, createContext, useContext } from 'react';
import { getWebSocketUrl } from '../config';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = React.memo(({ children, updateSeatMapState }) => {
  const [websocket, setWebsocket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('WebSocketProvider mounted');
    let ws;

    const connect = () => {
      const wsUrl = getWebSocketUrl();
      console.log('WebSocket URL:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setError(null);
      };

      ws.onmessage = (event) => {
        console.log('Message from server ', event.data);
        const updatedSeat = JSON.parse(event.data);
        if (updateSeatMapState) {
          updateSeatMapState(updatedSeat);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        if (!event.wasClean) {
          setError("Connection lost. Reconnecting...");
          console.log('Reconnect will be attempted in 1 second.');
          setTimeout(() => {
            connect();
          }, 1000);
        } else {
          console.log('WebSocket connection closed cleanly');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error', error);
        setError('WebSocket error: ' + error.message);
        ws.close();
      };

      setWebsocket(ws);
    };

    connect();

    return () => {
      console.log('WebSocketProvider unmounted');
      if (ws) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [updateSeatMapState]);

  return (
    <WebSocketContext.Provider value={{ websocket, error }}>
      {children}
    </WebSocketContext.Provider>
  );
});

export const useWebSocket = () => useContext(WebSocketContext);
