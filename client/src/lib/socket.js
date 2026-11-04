import { io } from 'socket.io-client';
import { socketOrigin } from './api.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(socketOrigin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 900,
      reconnectionAttempts: 8,
      timeout: 8000,
    });
  }
  return socket;
}
