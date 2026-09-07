import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { JoinRoom } from './components/player/JoinRoom';
import { PlayerLobby } from './components/player/PlayerLobby';
import { PlayerQuiz } from './components/player/PlayerQuiz';
import { PlayerPulse } from './components/player/PlayerPulse';
import { PlayerEndedView } from './components/player/PlayerEndedView';
import { PlayerLeaderboardView } from './components/player/PlayerLeaderboardView';
import { HostHeader } from './components/host/HostHeader';
import { HostLobby } from './components/host/HostLobby';
import { HostQuiz } from './components/host/HostQuiz';
import { HostPulse } from './components/host/HostPulse';
import { HostLeaderboard } from './components/host/HostLeaderboard';
import { TeacherBackoffice } from './components/teacher/TeacherBackoffice';
import { PrepareCountdown } from './components/common/PrepareCountdown';
import { WifiOff } from 'lucide-react';
import './styles/global.css';

export function AppContent() {
  const { socket, isConnected, session, saveSessionData, clearSession } = useSocket();
  
  // App Mode & Views: 'PLAYER_JOIN', 'PLAYER_GAME', 'HOST_LOBBY', 'HOST_GAME', 'TEACHER_BACKOFFICE'
  const [viewMode, setViewMode] = useState('PLAYER_JOIN');
  
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
  const [prepareData, setPrepareData] = useState(null);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (data) => {
      setPin(data.pin);
      setRoomMode(data.mode || 'QUIZ');
      setPlayers(data.players || []);
      setCounts(data.counts || { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
      setStatus('LOBBY');
      setViewMode('HOST_GAME');
      saveSessionData({ pin: data.pin, isHost: true });
    };

    const onHostReconnected = (data) => {
      setPin(data.pin);
      setRoomMode(data.mode);
      setStatus(data.status || 'LOBBY');
      setPlayers(data.players || []);
      setCounts(data.counts || { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
      if (data.questionResult) setQuestionResult(data.questionResult);
      if (data.pulseVotes) setPulseVotes(data.pulseVotes);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
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
      setStatus(data.status || 'LOBBY');
      if (data.counts) setCounts(data.counts);
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
      if (data.questionResult) setQuestionResult(data.questionResult);
      if (data.pulseVotes) setPulseVotes(data.pulseVotes);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      
      saveSessionData({
        pin: data.pin,
        playerId: data.player.playerId,
        name: data.player.name,
        avatar: data.player.avatar,
        isHost: false
      });
      
      setViewMode('PLAYER_GAME');
    };

    const onQuestionPrepare = (data) => {
      setPrepareData(data);
    };

    const onQuestionStart = (data) => {
      setPrepareData(null);
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
      setPrepareData(null);
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

    const onAnswerFeedback = (data) => {
      if (data && data.totalScore !== undefined) {
        setPlayerData(prev => ({ ...prev, score: data.totalScore }));
      }
    };

    const onShowLeaderboard = (data) => {
      setPrepareData(null);
      const list = data.leaderboard || [];
      setLeaderboard(list);
      setPlayerData(prev => {
        const me = list.find(p => p.playerId === prev.playerId);
        return me ? { ...prev, score: me.score } : prev;
      });
      if (data.status === 'ENDED' || data.isEnded) {
        setStatus('ENDED');
      } else {
        setStatus('LEADERBOARD');
      }
    };

    const onQuizEnded = (data) => {
      setPrepareData(null);
      const list = data.leaderboard || [];
      setLeaderboard(list);
      setPlayerData(prev => {
        const me = list.find(p => p.playerId === prev.playerId);
        return me ? { ...prev, score: me.score } : prev;
      });
      setStatus('ENDED');
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
      setPrepareData(null);
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
    socket.on('host_reconnected', onHostReconnected);
    socket.on('room_updated', onRoomUpdated);
    socket.on('join_success', onJoinSuccess);
    socket.on('question_prepare', onQuestionPrepare);
    socket.on('question_start', onQuestionStart);
    socket.on('answered_count_update', onAnsweredCountUpdate);
    socket.on('answer_feedback', onAnswerFeedback);
    socket.on('question_result', onQuestionResult);
    socket.on('show_leaderboard', onShowLeaderboard);
    socket.on('quiz_ended', onQuizEnded);
    socket.on('pulse_updated', onPulseUpdated);
    socket.on('mode_switched', onModeSwitched);
    socket.on('error_message', onErrorMessage);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('host_reconnected', onHostReconnected);
      socket.off('room_updated', onRoomUpdated);
      socket.off('join_success', onJoinSuccess);
      socket.off('question_prepare', onQuestionPrepare);
      socket.off('question_start', onQuestionStart);
      socket.off('answered_count_update', onAnsweredCountUpdate);
      socket.off('answer_feedback', onAnswerFeedback);
      socket.off('question_result', onQuestionResult);
      socket.off('show_leaderboard', onShowLeaderboard);
      socket.off('quiz_ended', onQuizEnded);
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
    if (!socket || status === 'ENDED') return;
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

      {/* TEACHER BACKOFFICE ROUTING */}
      {viewMode === 'TEACHER_BACKOFFICE' && (
        <TeacherBackoffice onBack={() => setViewMode('PLAYER_JOIN')} />
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
              pin={pin}
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
          ) : status === 'LEADERBOARD' || status === 'ENDED' ? (
            <HostLeaderboard
              pin={pin}
              leaderboard={leaderboard}
              pulseVotes={pulseVotes}
              isEnded={status === 'ENDED'}
              onNextQuestion={handleNextQuestion}
              onResetToLobby={() => setStatus('LOBBY')}
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
          onJoined={(joinRes) => {
            if (joinRes?.player) setPlayerData(joinRes.player);
            if (joinRes?.pin) setPin(joinRes.pin);
            if (joinRes?.status) setStatus(joinRes.status);
            if (joinRes?.mode) setRoomMode(joinRes.mode);
            if (joinRes?.currentQuestion) setCurrentQuestion(joinRes.currentQuestion);
            if (joinRes?.leaderboard) setLeaderboard(joinRes.leaderboard);
            if (joinRes?.counts) setCounts(joinRes.counts);
            setViewMode('PLAYER_GAME');
          }}
          onSwitchToHost={handleCreateRoom}
          onOpenTeacherBackoffice={() => setViewMode('TEACHER_BACKOFFICE')}
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
          ) : status === 'ENDED' ? (
            <PlayerEndedView
              player={playerData}
              leaderboard={leaderboard}
            />
          ) : status === 'LEADERBOARD' ? (
            <PlayerLeaderboardView
              player={playerData}
              leaderboard={leaderboard}
            />
          ) : (
            <PlayerQuiz
              question={currentQuestion}
              result={questionResult}
              pin={pin}
              player={playerData}
              answeredCount={counts.answeredCount}
              totalPlayers={counts.totalPlayers}
            />
          )}
        </div>
      )}

      {prepareData && (
        <PrepareCountdown
          nextQuestionIndex={prepareData.nextQuestionIndex}
          totalQuestions={prepareData.totalQuestions}
          initialSeconds={prepareData.countdownSeconds || 5}
          onComplete={() => setPrepareData(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
