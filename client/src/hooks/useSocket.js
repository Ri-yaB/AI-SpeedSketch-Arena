import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

/**
 * Initializes and manages a Socket.IO connection.
 * Returns the socket instance and connection status.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnectionError(null);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      setConnectionError(err.message);
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('reconnect', (attempt) => {
      setConnected(true);
      setConnectionError(null);
      console.log('[Socket] Reconnected after', attempt, 'attempts');
    });

    socket.on('reconnect_error', (err) => {
      setConnectionError(err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    socketRef,
    connected,
    connectionError,
  };
}
