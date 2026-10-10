import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './apiClient';

let socket: Socket | null = null;
let currentSocketToken: string | null = null;
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

    // Return existing socket if active/connecting with matching session token
    if (socket && currentSocketToken === token) {
      if (socket.disconnected) {
        socket.connect();
      }
      return socket;
    }

    // If socket exists with a stale token, cleanly disconnect it
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    currentSocketToken = token;

    // Connect directly to backend in development to avoid proxy drops, or use origin in production
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
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

    if (typeof window !== 'undefined') {
      (window as any).__socket = socket;
      (window as any).__socketService = this;
    }

    return socket;
  },

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentSocketToken = null;
      this.notifyStatus('disconnected');
    }
  },

  /**
   * Get active socket instance or attempt connection
   */
  getSocket(): Socket | null {
    const token = getAuthToken();
    if (!token) {
      this.disconnect();
      return null;
    }
    if (!socket || socket.disconnected || currentSocketToken !== token) {
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
  },

  /**
   * Test harness helper to dispatch socket events directly to client listeners
   */
  triggerEvent(event: string, data: any) {
    const s = socket || this.getSocket();
    if (s) {
      if (typeof (s as any).listeners === 'function') {
        const list = (s as any).listeners(event);
        list.forEach((fn: any) => {
          try {
            fn(data);
          } catch (e) {
            console.error('[socketService.triggerEvent] Error:', e);
          }
        });
        return;
      }
      const callbacks = (s as any)._callbacks;
      const fns = callbacks?.[`$${event}`] || callbacks?.[event] || [];
      fns.forEach((fn: any) => {
        try {
          fn(data);
        } catch (e) {
          console.error('[socketService.triggerEvent] Error:', e);
        }
      });
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).__socketService = socketService;
}

