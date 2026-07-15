'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const {
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    autoConnect = true,
  } = options;

  useEffect(() => {
    if (!autoConnect) return;

    // Initialize socket connection
    socketRef.current = io(url || window.location.origin, {
      transports: ['websocket', 'polling'],
      upgrade: true,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
      setIsConnected(true);
      setError(null);
      onConnect?.(socket);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.(reason);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket.IO connection error:', err);
      setError(err.message);
      setIsConnected(false);
      onError?.(err);
    });

    // Listen for bottle detection updates
    socket.on('bottle_detected', (message) => {
      console.log('Received bottle detection:', message);
      setLastMessage(message);
      onMessage?.(message);
    });

    // Listen for welcome message
    socket.on('connected', (message) => {
      console.log('Connected message:', message);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [url, autoConnect]);

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.warn('Socket not connected');
      return false;
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    error,
    emit,
    disconnect,
  };
}