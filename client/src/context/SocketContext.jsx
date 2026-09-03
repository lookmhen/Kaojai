import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState(() => {
    return {
      pin: sessionStorage.getItem('kaojai_pin') || null,
      playerId: sessionStorage.getItem('kaojai_playerId') || null,
      name: sessionStorage.getItem('kaojai_name') || null,
      avatar: sessionStorage.getItem('kaojai_avatar') || null,
      isHost: sessionStorage.getItem('kaojai_isHost') === 'true'
    };
  });

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);

      // Auto-reconnect session upon socket connect/reconnect
      const savedPin = sessionStorage.getItem('kaojai_pin');
      const savedPlayerId = sessionStorage.getItem('kaojai_playerId');
      const savedName = sessionStorage.getItem('kaojai_name');
      const savedAvatar = sessionStorage.getItem('kaojai_avatar');
      const isHost = sessionStorage.getItem('kaojai_isHost') === 'true';

      if (savedPin) {
        if (isHost) {
          console.log('Reconnecting as Host for PIN:', savedPin);
          newSocket.emit('reconnect_host', { pin: savedPin });
        } else if (savedName) {
          console.log('Reconnecting as Player:', savedName, 'for PIN:', savedPin);
          newSocket.emit('join_room', {
            pin: savedPin,
            name: savedName,
            avatar: savedAvatar,
            playerId: savedPlayerId
          });
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const saveSessionData = ({ pin, playerId, name, avatar, isHost }) => {
    if (pin) sessionStorage.setItem('kaojai_pin', pin);
    if (playerId) sessionStorage.setItem('kaojai_playerId', playerId);
    if (name) sessionStorage.setItem('kaojai_name', name);
    if (avatar) sessionStorage.setItem('kaojai_avatar', avatar);
    if (isHost !== undefined) sessionStorage.setItem('kaojai_isHost', String(isHost));

    setSession({ pin, playerId, name, avatar, isHost });
  };

  const clearSession = () => {
    sessionStorage.removeItem('kaojai_pin');
    sessionStorage.removeItem('kaojai_playerId');
    sessionStorage.removeItem('kaojai_name');
    sessionStorage.removeItem('kaojai_avatar');
    sessionStorage.removeItem('kaojai_isHost');
    setSession({ pin: null, playerId: null, name: null, avatar: null, isHost: false });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, session, saveSessionData, clearSession }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};
