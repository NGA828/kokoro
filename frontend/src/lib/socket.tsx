'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api';
import { useAuth } from './store';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      ref.current?.disconnect();
      ref.current = null;
      setSocket(null);
      setConnected(false);
      return;
    }
    const token = localStorage.getItem('km_access');
    if (!token) return;
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    ref.current = s;
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => {
      s.disconnect();
      ref.current = null;
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
