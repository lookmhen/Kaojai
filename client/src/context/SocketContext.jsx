import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const getStorageItem = (key) => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch (e) {
    return null;
  }
};

const setStorageItem = (key, val) => {
  try {
    if (val !== null && val !== undefined) {
      localStorage.setItem(key, val);
      sessionStorage.setItem(key, val);
    } else {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch (e) {}
};

const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (e) {}
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState(() => {
    return {
      pin: getStorageItem('kaojai_pin'),
      playerId: getStorageItem('kaojai_playerId'),
      name: getStorageItem('kaojai_name'),
      avatar: getStorageItem('kaojai_avatar'),
      isHost: getStorageItem('kaojai_isHost') === 'true',
      hostToken: getStorageItem('kaojai_hostToken')
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
      const savedPin = getStorageItem('kaojai_pin');
      const savedPlayerId = getStorageItem('kaojai_playerId');
      const savedName = getStorageItem('kaojai_name');
      const savedAvatar = getStorageItem('kaojai_avatar');
      const isHost = getStorageItem('kaojai_isHost') === 'true';
      const hostToken = getStorageItem('kaojai_hostToken');

      const urlParams = new URLSearchParams(window.location.search);
      const queryPin = urlParams.get('pin');
      const targetPin = queryPin || savedPin;

      if (targetPin) {
        if (isHost && targetPin === savedPin) {
          console.log('Reconnecting as Host for PIN:', targetPin);
          newSocket.emit('reconnect_host', { pin: targetPin, hostToken }, (res) => {
            if (res && !res.success) {
              console.log('Stale host session expired, clearing session...');
              clearSession();
            }
          });
        } else if (savedName && targetPin === savedPin) {
          console.log('Reconnecting as Player:', savedName, 'for PIN:', targetPin);
          newSocket.emit('join_room', {
            pin: targetPin,
            name: savedName,
            avatar: savedAvatar,
            playerId: savedPlayerId
          }, (res) => {
            if (res && !res.success) {
              console.log('Stale player session expired, clearing session...');
              clearSession();
            }
          });
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('session_replaced', (data) => {
      console.warn('[Socket] Session replaced by new window/tab:', data?.message);
    });

    setSocket(newSocket);

    // Pagehide / Beforeunload cleanup so mobile browser navigating back or closing doesn't leave ghost socket
    const handlePageHide = () => {
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };

    const handlePageShow = (event) => {
      if (event.persisted && newSocket && !newSocket.connected) {
        newSocket.connect();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      newSocket.close();
    };
  }, []);

  const saveSessionData = ({ pin, playerId, name, avatar, isHost, hostToken }) => {
    if (pin) setStorageItem('kaojai_pin', pin);
    if (playerId) setStorageItem('kaojai_playerId', playerId);
    if (name) setStorageItem('kaojai_name', name);
    if (avatar) setStorageItem('kaojai_avatar', avatar);
    if (isHost !== undefined) setStorageItem('kaojai_isHost', String(isHost));
    if (hostToken) setStorageItem('kaojai_hostToken', hostToken);

    setSession({ pin, playerId, name, avatar, isHost, hostToken });
  };

  const clearSession = () => {
    removeStorageItem('kaojai_pin');
    removeStorageItem('kaojai_playerId');
    removeStorageItem('kaojai_name');
    removeStorageItem('kaojai_avatar');
    removeStorageItem('kaojai_isHost');
    removeStorageItem('kaojai_hostToken');
    setSession({ pin: null, playerId: null, name: null, avatar: null, isHost: false, hostToken: null });
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
