// components/WebSocket.js
import React, { useEffect, useState, createContext, useContext } from 'react';

// Creating a WebSocket Context
export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [websocket, setWebsocket] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        function connect() {
            const ws = new WebSocket('ws://34.238.103.127:8090/ws');

            ws.onopen = () => {
                console.log('WebSocket connected');
                setError(null); // Clear any errors on successful connection
            };

            ws.onmessage = (event) => {
                console.log('Message from server ', event.data);
                // Here you could handle messages
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected', event);
                if(!event.wasClean){
                    setError("Connection lost. Reconnecting...');")
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
    }, []);

    return (
        <WebSocketContext.Provider value={{ websocket, error }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
