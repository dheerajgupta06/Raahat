import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket.js';

/** Subscribes to public Socket.io bed/oxygen snapshots. */
export function useHospitalUpdates(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const listener = (payload) => {
      if (payload?.id) handlerRef.current?.(payload);
    };
    socket.on('hospital:update', listener);
    return () => {
      socket.off('hospital:update', listener);
    };
  }, []);
}
