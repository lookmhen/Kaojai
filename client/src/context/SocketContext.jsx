import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const getStorageItem = (key) => {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
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
      isLuckyDraw: getStorageItem('kaojai_isLuckyDraw') === 'true',
      hostToken: getStorageItem('kaojai_hostToken')
    };
  });

  // Track whether the initial sync is still pending (App.jsx hasn't called syncSession yet)
  const needsSyncRef = useRef(false);
  // Store clearSession in ref so syncSession callback can access it without stale closure
  const clearSessionRef = useRef(null);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      // Mark that a sync is needed — App.jsx will call syncSession() after its listeners are ready
      needsSyncRef.current = true;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected, reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('session_replaced', (data) => {
      console.warn('[Socket] Session replaced by new window/tab:', data?.message);
    });

    setSocket(newSocket);

    // Automatic wakeup when tab becomes visible or window regains focus
    let lastWakeup = 0;
    const handleWakeup = () => {
      const now = Date.now();
      if (now - lastWakeup < 1000) return;
      lastWakeup = now;

      if (document.visibilityState === 'visible') {
        if (newSocket && !newSocket.connected) {
          console.log('[Socket] Tab visible/focused, reconnecting socket...');
          newSocket.connect();
        } else if (newSocket && newSocket.connected) {
          // On visibility/focus wakeup, mark sync needed — App.jsx will handle it
          needsSyncRef.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleWakeup);
    window.addEventListener('focus', handleWakeup);
    window.addEventListener('pageshow', handleWakeup);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeup);
      window.removeEventListener('focus', handleWakeup);
      window.removeEventListener('pageshow', handleWakeup);
      newSocket.close();
    };
  }, []);

  const saveSessionData = (patch) => {
    if (!patch || typeof patch !== 'object') return;
    const { pin, playerId, name, avatar, isHost, hostToken, isLuckyDraw } = patch;
    if (pin) setStorageItem('kaojai_pin', pin);
    if (playerId) setStorageItem('kaojai_playerId', playerId);
    if (name) setStorageItem('kaojai_name', name);
    if (avatar) setStorageItem('kaojai_avatar', avatar);
    if (isHost !== undefined) setStorageItem('kaojai_isHost', String(isHost));
    if (isLuckyDraw !== undefined) setStorageItem('kaojai_isLuckyDraw', String(isLuckyDraw));
    if (hostToken) setStorageItem('kaojai_hostToken', hostToken);

    setSession(prev => ({
      ...prev,
      ...Object.fromEntries(Object.entries(patch).filter(([_, v]) => v !== undefined))
    }));
  };

  const clearSession = useCallback(() => {
    removeStorageItem('kaojai_pin');
    removeStorageItem('kaojai_playerId');
    removeStorageItem('kaojai_name');
    removeStorageItem('kaojai_avatar');
    removeStorageItem('kaojai_isHost');
    removeStorageItem('kaojai_isLuckyDraw');
    removeStorageItem('kaojai_hostToken');
    setSession({ pin: null, playerId: null, name: null, avatar: null, isHost: false, isLuckyDraw: false, hostToken: null });
  }, []);

  // Keep ref up to date
  clearSessionRef.current = clearSession;

  /**
   * syncSession — call this from App.jsx AFTER socket event listeners are registered.
   * Re-emits reconnect_host or join_room so the server response events are caught properly.
   */
  const syncSession = useCallback(() => {
    if (!socket || !socket.connected) return;

    const savedPin = getStorageItem('kaojai_pin');
    const savedPlayerId = getStorageItem('kaojai_playerId');
    const savedName = getStorageItem('kaojai_name');
    const savedAvatar = getStorageItem('kaojai_avatar');
    const isHost = getStorageItem('kaojai_isHost') === 'true';
    const hostToken = getStorageItem('kaojai_hostToken');

    const urlParams = new URLSearchParams(window.location.search);
    const queryPin = urlParams.get('pin');
    const targetPin = queryPin || savedPin;

    needsSyncRef.current = false;

    if (targetPin) {
      if (isHost && targetPin === savedPin) {
        console.log('[Socket] Syncing host session for PIN:', targetPin);
        socket.emit('reconnect_host', { pin: targetPin, hostToken }, (res) => {
          if (res && !res.success) {
            console.log('Stale host session expired, clearing session...');
            if (clearSessionRef.current) clearSessionRef.current();
          }
        });
      } else if (savedName && targetPin === savedPin) {
        console.log('[Socket] Syncing player session:', savedName, 'for PIN:', targetPin);
        socket.emit('join_room', {
          pin: targetPin,
          name: savedName,
          avatar: savedAvatar,
          playerId: savedPlayerId
        }, (res) => {
          if (res && !res.success) {
            console.log('Stale player session expired, clearing session...');
            if (clearSessionRef.current) clearSessionRef.current();
          }
        });
      }
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, session, saveSessionData, clearSession, syncSession, needsSyncRef }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};
