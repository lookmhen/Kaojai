import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { JoinRoom } from './components/player/JoinRoom';
import { PlayerLobby } from './components/player/PlayerLobby';
import { PlayerQuiz } from './components/player/PlayerQuiz';
import { PlayerPulse } from './components/player/PlayerPulse';
import { HostHeader } from './components/host/HostHeader';
import { HostLobby } from './components/host/HostLobby';
import { HostQuiz } from './components/host/HostQuiz';
import { HostPulse } from './components/host/HostPulse';
import { HostLeaderboard } from './components/host/HostLeaderboard';
import { WifiOff, RefreshCw } from 'lucide-react';
import './styles/global.css';

export function AppContent() {
  const { socket, isConnected, session, saveSessionData, clearSession } = useSocket();
  
  // App Mode & Views
  const [viewMode, setViewMode] = useState('PLAYER_JOIN'); // 'PLAYER_JOIN', 'PLAYER_GAME', 'HOST_LOBBY', 'HOST_GAME'
  
  // Room State
  const [pin, setPin] = useState(session.pin || '');
  const [roomMode, setRoomMode] = useState('QUIZ'); // 'QUIZ' or 'PULSE'
  const [status, setStatus] = useState('LOBBY'); // 'LOBBY', 'QUESTION', 'QUESTION_RESULT', 'LEADERBOARD', 'ENDED'
  const [players, setPlayers] = useState([]);
  const [playerData, setPlayerData] = useState({
    name: session.name || '',
    avatar: session.avatar || '0291dcc0ce.svg',
    playerId: session.playerId || ''
  });

  // Counts & Results
  const [counts, setCounts] = useState({ totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [pulseVotes, setPulseVotes] = useState({ green: 0, yellow: 0, red: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (data) => {
      setPin(data.pin);
      setRoomMode(data.mode);
      setPlayers(data.players || []);
      setCounts(data.counts || { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
      setStatus('LOBBY');
      setViewMode('HOST_GAME');
      saveSessionData({ pin: data.pin, isHost: true });
    };

    const onRoomUpdated = (data) => {
      setPlayers(data.players || []);
      if (data.counts) setCounts(data.counts);
    };

    const onJoinSuccess = (data) => {
      setPin(data.pin);
      setPlayerData(data.player);
      setRoomMode(data.mode);
      if (data.counts) setCounts(data.counts);
      setViewMode('PLAYER_GAME');
    };

    const onQuestionStart = (data) => {
      setCurrentQuestion(data.question);
      setQuestionResult(null);
      setStatus('QUESTION');
      if (data.totalPlayers !== undefined) {
        setCounts(prev => ({ ...prev, answeredCount: 0, totalPlayers: data.totalPlayers }));
      }
    };

    const onAnsweredCountUpdate = (data) => {
      setCounts(prev => ({
        ...prev,
        answeredCount: data.answeredCount,
        totalPlayers: data.totalPlayers
      }));
    };

    const onQuestionResult = (data) => {
      setQuestionResult(data);
      setStatus('QUESTION_RESULT');
      if (data.answeredCount !== undefined) {
        setCounts(prev => ({
          ...prev,
          answeredCount: data.answeredCount,
          totalPlayers: data.totalPlayers
        }));
      }
    };

    const onShowLeaderboard = (data) => {
      setLeaderboard(data.leaderboard || []);
      setStatus('LEADERBOARD');
    };

    const onPulseUpdated = (data) => {
      setPulseVotes(data.pulseVotes || { green: 0, yellow: 0, red: 0 });
      setCounts(prev => ({
        ...prev,
        pulseAnsweredCount: data.pulseAnsweredCount,
        totalPlayers: data.totalPlayers
      }));
    };

    const onModeSwitched = (data) => {
      setRoomMode(data.mode);
      if (data.pulseVotes) setPulseVotes(data.pulseVotes);
      setCounts(prev => ({
        ...prev,
        pulseAnsweredCount: data.pulseAnsweredCount || 0,
        totalPlayers: data.totalPlayers || prev.totalPlayers
      }));
    };

    const onErrorMessage = (data) => {
      setErrorMessage(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setTimeout(() => setErrorMessage(''), 4000);
    };

    socket.on('room_created', onRoomCreated);
    socket.on('room_updated', onRoomUpdated);
    socket.on('join_success', onJoinSuccess);
    socket.on('question_start', onQuestionStart);
    socket.on('answered_count_update', onAnsweredCountUpdate);
    socket.on('question_result', onQuestionResult);
    socket.on('show_leaderboard', onShowLeaderboard);
    socket.on('pulse_updated', onPulseUpdated);
    socket.on('mode_switched', onModeSwitched);
    socket.on('error_message', onErrorMessage);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('room_updated', onRoomUpdated);
      socket.off('join_success', onJoinSuccess);
      socket.off('question_start', onQuestionStart);
      socket.off('answered_count_update', onAnsweredCountUpdate);
      socket.off('question_result', onQuestionResult);
      socket.off('show_leaderboard', onShowLeaderboard);
      socket.off('pulse_updated', onPulseUpdated);
      socket.off('mode_switched', onModeSwitched);
      socket.off('error_message', onErrorMessage);
    };
  }, [socket]);

  // Host Action Handlers
  const handleCreateRoom = (customQuizId) => {
    if (!socket) return;
    socket.emit('create_room', null);
  };

  const handleStartQuiz = (quizId) => {
    if (!socket) return;
    socket.emit('start_quiz', { pin });
  };

  const handleNextQuestion = () => {
    if (!socket) return;
    socket.emit('next_question', { pin });
  };

  const handleShowLeaderboard = () => {
    if (!socket) return;
    socket.emit('show_leaderboard', { pin });
  };

  const handleSwitchMode = (targetMode) => {
    if (!socket) return;
    socket.emit('switch_mode', { pin, mode: targetMode });
  };

  const handleLeaveSession = () => {
    clearSession();
    setViewMode('PLAYER_JOIN');
    setPin('');
    setStatus('LOBBY');
  };

  return (
    <div className="app-container">
      {/* Connection Indicator Banner */}
      {!isConnected && (
        <div className="connection-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <WifiOff size={16} /> กำลังเชื่อมต่อระบบอีกครั้ง (Reconnecting to server...)...
        </div>
      )}

      {/* Floating Error Alert */}
      {errorMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#e74c3c',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 1100,
            fontWeight: 600
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* HOST VIEW ROUTING */}
      {viewMode === 'HOST_GAME' && (
        <div>
          <HostHeader
            pin={pin}
            mode={roomMode}
            counts={counts}
            onSwitchMode={handleSwitchMode}
            onLeave={handleLeaveSession}
          />
          {roomMode === 'PULSE' ? (
            <HostPulse
              pulseVotes={pulseVotes}
              pulseAnsweredCount={counts.pulseAnsweredCount}
              totalPlayers={counts.totalPlayers}
            />
          ) : status === 'LOBBY' ? (
            <HostLobby
              pin={pin}
              players={players}
              counts={counts}
              onStartQuiz={handleStartQuiz}
            />
          ) : status === 'LEADERBOARD' ? (
            <HostLeaderboard
              leaderboard={leaderboard}
              onNextQuestion={handleNextQuestion}
            />
          ) : (
            <HostQuiz
              question={currentQuestion}
              result={questionResult}
              answeredCount={counts.answeredCount}
              totalPlayers={counts.totalPlayers}
              onNextQuestion={handleNextQuestion}
              onShowLeaderboard={handleShowLeaderboard}
            />
          )}
        </div>
      )}

      {/* PARTICIPANT VIEW ROUTING */}
      {viewMode === 'PLAYER_JOIN' && (
        <JoinRoom
          onJoined={() => setViewMode('PLAYER_GAME')}
          onSwitchToHost={handleCreateRoom}
        />
      )}

      {viewMode === 'PLAYER_GAME' && (
        <div>
          {roomMode === 'PULSE' ? (
            <PlayerPulse
              pin={pin}
              player={playerData}
              pulseAnsweredCount={counts.pulseAnsweredCount}
              totalPlayers={counts.totalPlayers}
            />
          ) : status === 'LOBBY' ? (
            <PlayerLobby
              player={playerData}
              totalPlayers={counts.totalPlayers}
              mode={roomMode}
            />
          ) : (
            <PlayerQuiz
              question={currentQuestion}
              pin={pin}
              player={playerData}
              answeredCount={counts.answeredCount}
              totalPlayers={counts.totalPlayers}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
