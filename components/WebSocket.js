import React, { useEffect, useState, createContext, useContext } from 'react';
import { getWebSocketUrl } from '../config';

// Creating a WebSocket Context
export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, updateSeatMapState  }) => {
    const [websocket, setWebsocket] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        function connect() {
            const wsUrl = getWebSocketUrl();
            console.log('WebSocket URL:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setError(null); // Clear any errors on successful connection
            };

            ws.onmessage = (event) => {
                console.log('Message from server ', event.data);
                const updatedSeat = JSON.parse(event.data);
                // Update the seat map state with the new status
                if (updateSeatMapState) {
                    updateSeatMapState(updatedSeat);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected', event);
                if(!event.wasClean){
                    setError("Connection lost. Reconnecting...");
                }
                console.log('Reconnect will be attempted in 1 second.');
                setTimeout(() => {
                    connect();
                }, 1000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error', error);
                setError('WebSocket error: ' + error.message);
                ws.close();
            };

            setWebsocket(ws);
        }

        connect();

        return () => {
            if (websocket) {
                websocket.close();
            }
        };
    }, [updateSeatMapState]);

    return (
        <WebSocketContext.Provider value={{ websocket, error }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
