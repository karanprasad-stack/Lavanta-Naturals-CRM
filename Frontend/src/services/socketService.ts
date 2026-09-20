import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './apiClient';

let socket: Socket | null = null;
let connectionListeners: Array<(status: 'connected' | 'reconnecting' | 'disconnected') => void> = [];

export const socketService = {
  /**
   * Connect to Socket.IO using JWT authentication
   */
  connect(): Socket | null {
    const token = getAuthToken();
    if (!token) {
      this.disconnect();
      return null;
    }

    // Return existing connected socket if already active
    if (socket && socket.connected) {
      return socket;
    }

    if (socket) {
      socket.disconnect();
    }

    // Connect to backend via origin proxy (/socket.io)
    const socketUrl = window.location.origin;

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socket.on('connect', () => {
      this.notifyStatus('connected');
    });

    socket.on('reconnect_attempt', () => {
      this.notifyStatus('reconnecting');
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket?.connect();
      }
      this.notifyStatus('disconnected');
    });

    socket.on('connect_error', () => {
      this.notifyStatus('reconnecting');
    });

    return socket;
  },

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      this.notifyStatus('disconnected');
    }
  },

  /**
   * Get active socket instance or attempt connection
   */
  getSocket(): Socket | null {
    if (!socket || !socket.connected) {
      return this.connect();
    }
    return socket;
  },

  /**
   * Register connection status listener
   */
  onStatusChange(callback: (status: 'connected' | 'reconnecting' | 'disconnected') => void): () => void {
    connectionListeners.push(callback);
    return () => {
      connectionListeners = connectionListeners.filter(l => l !== callback);
    };
  },

  notifyStatus(status: 'connected' | 'reconnecting' | 'disconnected') {
    connectionListeners.forEach(listener => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in socket status listener:', err);
      }
    });
  }
};
