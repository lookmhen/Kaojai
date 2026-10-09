import React, { useState, useEffect, useRef } from 'react';
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
import { SequenceIntroGuide } from './components/common/SequenceIntroGuide';
import { LuckyDrawPage } from './components/common/LuckyDrawPage';
import { PlayerLuckyDrawOverlay } from './components/player/PlayerLuckyDrawOverlay';
import { LuckyDrawPlayerJoin } from './components/player/LuckyDrawPlayerJoin';
import { WifiOff, AlertCircle, X } from 'lucide-react';
import './styles/global.css';

export function AppContent() {
  const { socket, isConnected, session, saveSessionData, clearSession, syncSession, needsSyncRef } = useSocket();
  
  // App Mode & Views: 'PLAYER_JOIN', 'PLAYER_GAME', 'HOST_LOBBY', 'HOST_GAME', 'TEACHER_BACKOFFICE', 'LUCKY_DRAW', 'LUCKY_DRAW_PLAYER'
  const [viewMode, setViewMode] = useState(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isLuckyDrawScan = urlParams && (urlParams.get('luckydraw') === '1' || urlParams.get('mode') === 'luckydraw');
    if (isLuckyDrawScan) return 'LUCKY_DRAW_PLAYER';
    if (session?.isLuckyDraw && session?.pin) return 'LUCKY_DRAW';
    if (session?.isHost && session?.pin) return 'HOST_GAME';
    if (session?.playerId && session?.pin) return 'PLAYER_GAME';
    return 'PLAYER_JOIN';
  });
  
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
  const [pulseRound, setPulseRound] = useState(1);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [pretestData, setPretestData] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const errorTimerRef = useRef(null);

  const showNotificationError = (msg, durationMs = 4500) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setErrorMessage(msg);
    if (durationMs > 0) {
      errorTimerRef.current = setTimeout(() => {
        setErrorMessage('');
        errorTimerRef.current = null;
      }, durationMs);
    }
  };

  const [prepareData, setPrepareData] = useState(null);
  const [sequenceIntroData, setSequenceIntroData] = useState(null);
  const [quizMode, setQuizMode] = useState('NORMAL');

  // Team State
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [teams, setTeams] = useState([]);

  // Lucky Draw State
  const [previousViewMode, setPreviousViewMode] = useState('PLAYER_JOIN');
  const [playerLuckyDrawSpinData, setPlayerLuckyDrawSpinData] = useState(null);

  const handleOpenLuckyDraw = () => {
    setPreviousViewMode(viewMode);
    if (!session?.isHost) {
      setPin('');
      setPlayers([]);
      setLeaderboard([]);
    }
    setViewMode('LUCKY_DRAW');
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (data) => {
      setPin(data.pin);
      const isLucky = data.mode === 'LUCKY_DRAW' || data.isLuckyDraw;
      setRoomMode(data.mode || (isLucky ? 'LUCKY_DRAW' : 'QUIZ'));
      setPlayers(data.players || []);
      setCounts(data.counts || { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
      if (data.pulseRound) setPulseRound(data.pulseRound);
      if (data.teamsEnabled !== undefined) setTeamsEnabled(data.teamsEnabled);
      if (data.teams) setTeams(data.teams);
      if (data.quizSet?.id) setSelectedQuizId(data.quizSet.id);
      setStatus('LOBBY');
      setViewMode(prev => (prev === 'LUCKY_DRAW' || isLucky) ? 'LUCKY_DRAW' : 'HOST_GAME');
      saveSessionData({
        pin: data.pin,
        isHost: true,
        hostToken: data.hostToken,
        isLuckyDraw: isLucky
      });
    };

    const onHostReconnected = (data) => {
      setPin(data.pin);
      const isLucky = data.mode === 'LUCKY_DRAW' || data.isLuckyDraw;
      setRoomMode(data.mode || (isLucky ? 'LUCKY_DRAW' : 'QUIZ'));
      setStatus(data.status || 'LOBBY');
      if (data.quizMode) setQuizMode(data.quizMode);
      setPlayers(data.players || []);
      setCounts(data.counts || { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
      if (data.questionResult) setQuestionResult(data.questionResult);
      if (data.pulseVotes) setPulseVotes(data.pulseVotes);
      if (data.pulseRound) setPulseRound(data.pulseRound);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.quizAnalytics) setQuizAnalytics(data.quizAnalytics);
      if (data.teamsEnabled !== undefined) setTeamsEnabled(data.teamsEnabled);
      if (data.teams) setTeams(data.teams);
      if (data.pretestData) setPretestData(data.pretestData);
      if (data.pretestData?.quizId) {
        setSelectedQuizId(data.pretestData.quizId);
      } else if (data.quizSet?.id) {
        setSelectedQuizId(data.quizSet.id);
      }
      if (data.sequenceIntroData) {
        setSequenceIntroData(data.sequenceIntroData);
      }
      setViewMode(prev => (prev === 'LUCKY_DRAW' || isLucky) ? 'LUCKY_DRAW' : 'HOST_GAME');
      saveSessionData({
        pin: data.pin,
        isHost: true,
        hostToken: data.hostToken || session.hostToken,
        isLuckyDraw: isLucky
      });
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
      if (data.quizMode) setQuizMode(data.quizMode);
      if (data.counts) setCounts(data.counts);
      if (data.currentQuestion) setCurrentQuestion(data.currentQuestion);
      if (data.questionResult) setQuestionResult(data.questionResult);
      if (data.pulseVotes) setPulseVotes(data.pulseVotes);
      if (data.pulseRound) setPulseRound(data.pulseRound);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.teamsEnabled !== undefined) setTeamsEnabled(data.teamsEnabled);
      if (data.teams) setTeams(data.teams);
      if (data.sequenceIntroData) {
        setSequenceIntroData(data.sequenceIntroData);
      }
      
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
      if (data.quizMode) setQuizMode(data.quizMode);
      setSequenceIntroData(null);
      setQuestionResult(null);
      setCurrentQuestion(null);
      setStatus('PREPARE');
      setPrepareData(data);
    };

    const onSequenceIntro = (data) => {
      if (data.quizMode) setQuizMode(data.quizMode);
      setPrepareData(null);
      setQuestionResult(null);
      setCurrentQuestion(null);
      setStatus('SEQUENCE_INTRO');
      setSequenceIntroData(data);
    };

    const onQuestionStart = (data) => {
      console.log('[DEBUG App onQuestionStart]', {
        qId: data?.question?.id,
        qIndex: data?.currentQuestionIndex,
        quizMode: data?.quizMode,
        totalPlayers: data?.totalPlayers
      });
      setPrepareData(null);
      setSequenceIntroData(null);
      if (data.quizMode) setQuizMode(data.quizMode);
      setCurrentQuestion(data.question);
      setQuestionResult(null);
      setStatus('QUESTION');
      if (data.totalPlayers !== undefined) {
        setCounts(prev => ({ ...prev, answeredCount: 0, totalPlayers: data.totalPlayers }));
      }
    };

    const onAnsweredCountUpdate = (data) => {
      console.log('[DEBUG App onAnsweredCountUpdate]', data);
      setCounts(prev => ({
        ...prev,
        answeredCount: data.answeredCount,
        totalPlayers: data.totalPlayers
      }));
    };

    const onQuestionResult = (data) => {
      console.log('[DEBUG App onQuestionResult]', {
        resultQId: data?.questionId,
        quizMode: data?.quizMode,
        answeredCount: data?.answeredCount,
        totalPlayers: data?.totalPlayers
      });
      setPrepareData(null);
      if (data.quizMode) setQuizMode(data.quizMode);
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
      console.log('[DEBUG App onAnswerFeedback]', data);
      if (data && data.totalScore !== undefined) {
        setPlayerData(prev => ({ ...prev, score: data.totalScore }));
      }
    };

    const onShowLeaderboard = (data) => {
      setPrepareData(null);
      setQuestionResult(null);
      if (data.quizMode) setQuizMode(data.quizMode);
      const list = data.leaderboard || [];
      if (data.quizAnalytics) {
        setQuizAnalytics(data.quizAnalytics);
      }
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
      setQuestionResult(null);
      if (data.quizMode) setQuizMode(data.quizMode);
      const list = data.leaderboard || [];
      if (data.quizAnalytics) {
        setQuizAnalytics(data.quizAnalytics);
      }
      // When a PRETEST completes, store pretestData for the Post-test flow
      if (data.quizMode === 'PRETEST' && data.pretestData) {
        setPretestData(data.pretestData);
      }
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
      if (data.pulseRound) setPulseRound(data.pulseRound);
      setCounts(prev => ({
        ...prev,
        pulseAnsweredCount: data.pulseAnsweredCount || 0,
        totalPlayers: data.totalPlayers || prev.totalPlayers
      }));
    };

    const onPulseReset = (data) => {
      setPulseVotes(data.pulseVotes || { green: 0, yellow: 0, red: 0 });
      if (data.pulseRound) setPulseRound(data.pulseRound);
      setCounts(prev => ({
        ...prev,
        pulseAnsweredCount: 0,
        totalPlayers: data.totalPlayers || prev.totalPlayers
      }));
    };

    const onErrorMessage = (data) => {
      showNotificationError(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 4000);
    };

    const onTeamsToggled = (data) => {
      setTeamsEnabled(data.teamsEnabled);
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setPlayerData(prev => {
        if (!prev?.playerId) return prev;
        const me = (data.players || []).find(p => p.playerId === prev.playerId);
        return me ? { ...prev, teamId: me.teamId || null } : prev;
      });
    };

    const onTeamsUpdated = (data) => {
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setPlayerData(prev => {
        if (!prev?.playerId) return prev;
        const me = (data.players || []).find(p => p.playerId === prev.playerId);
        return me ? { ...prev, teamId: me.teamId || null } : prev;
      });
    };

    const onRoomResetToLobby = (data) => {
      setPrepareData(null);
      setCurrentQuestion(null);
      setQuestionResult(null);
      setQuizAnalytics(null);
      setLeaderboard([]);
      setPulseRound(1);
      setPlayerData(prev => (prev ? { ...prev, score: 0 } : null));
      if (data?.players) setPlayers(data.players);
      if (data?.counts) setCounts(data.counts);
      setQuizMode(data?.quizMode || 'NORMAL');
      setPretestData(data?.pretestData || null);
      if (data?.pretestData?.quizId) {
        setSelectedQuizId(data.pretestData.quizId);
      } else if (data?.quizSet?.id) {
        setSelectedQuizId(data.quizSet.id);
      }
      setStatus('LOBBY');
    };

    const onQuizSelected = (data) => {
      if (data?.quizId) {
        setSelectedQuizId(data.quizId);
      }
    };

    const onPretestCleared = () => {
      setPretestData(null);
    };

    const onRoomClosed = (data) => {
      showNotificationError(data.message || 'วิทยากรได้ปิดห้องหรือออกจากห้องแล้ว', 5000);
      clearSession();
      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
      setViewMode('PLAYER_JOIN');
      setPin('');
      setStatus('LOBBY');
      setPlayerData(null);
      setPretestData(null);
      setPrepareData(null);
      setCurrentQuestion(null);
      setQuestionResult(null);
      setLeaderboard([]);
      setQuizAnalytics(null);
      setPlayers([]);
      setTeams([]);
      setPulseRound(1);
      setPulseVotes({ green: 0, yellow: 0, red: 0 });
      setCounts({ totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
    };

    const onQuizAnalyticsData = (data) => {
      if (data?.quizAnalytics) setQuizAnalytics(data.quizAnalytics);
    };

    const onLuckyDrawSpin = (data) => {
      setPlayerLuckyDrawSpinData(data);
    };

    const onLuckyDrawClosed = () => {
      setPlayerLuckyDrawSpinData(null);
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
    socket.on('quiz_selected', onQuizSelected);
    socket.on('quiz_analytics_data', onQuizAnalyticsData);
    socket.on('pretest_cleared', onPretestCleared);
    socket.on('pulse_updated', onPulseUpdated);
    socket.on('pulse_reset', onPulseReset);
    socket.on('mode_switched', onModeSwitched);
    socket.on('error_message', onErrorMessage);
    socket.on('teams_toggled', onTeamsToggled);
    socket.on('teams_updated', onTeamsUpdated);
    socket.on('sequence_intro', onSequenceIntro);
    socket.on('room_reset_to_lobby', onRoomResetToLobby);
    socket.on('room_closed', onRoomClosed);
    socket.on('lucky_draw_spin', onLuckyDrawSpin);
    socket.on('lucky_draw_closed', onLuckyDrawClosed);

    // ─── SYNC SESSION: Call syncSession now that all listeners are registered ───
    // This fixes the race condition where host_reconnected/join_success events
    // were emitted before App.jsx listeners were attached (e.g. on page refresh).
    if (needsSyncRef?.current) {
      syncSession();
    }

    // Periodically check if a sync is needed (e.g. from visibility wakeup or socket reconnect)
    const syncCheckInterval = setInterval(() => {
      if (needsSyncRef?.current && socket?.connected) {
        syncSession();
      }
    }, 500);

    return () => {
      clearInterval(syncCheckInterval);
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
      socket.off('room_created', onRoomCreated);
      socket.off('host_reconnected', onHostReconnected);
      socket.off('room_updated', onRoomUpdated);
      socket.off('join_success', onJoinSuccess);
      socket.off('question_prepare', onQuestionPrepare);
      socket.off('sequence_intro', onSequenceIntro);
      socket.off('question_start', onQuestionStart);
      socket.off('answered_count_update', onAnsweredCountUpdate);
      socket.off('answer_feedback', onAnswerFeedback);
      socket.off('question_result', onQuestionResult);
      socket.off('show_leaderboard', onShowLeaderboard);
      socket.off('quiz_ended', onQuizEnded);
      socket.off('quiz_selected', onQuizSelected);
      socket.off('quiz_analytics_data', onQuizAnalyticsData);
      socket.off('pretest_cleared', onPretestCleared);
      socket.off('pulse_updated', onPulseUpdated);
      socket.off('pulse_reset', onPulseReset);
      socket.off('mode_switched', onModeSwitched);
      socket.off('error_message', onErrorMessage);
      socket.off('teams_toggled', onTeamsToggled);
      socket.off('teams_updated', onTeamsUpdated);
      socket.off('room_reset_to_lobby', onRoomResetToLobby);
      socket.off('room_closed', onRoomClosed);
      socket.off('lucky_draw_spin', onLuckyDrawSpin);
      socket.off('lucky_draw_closed', onLuckyDrawClosed);
    };
  }, [socket, session.hostToken, syncSession, needsSyncRef]);

  // Intercept browser back button when player is in game
  useEffect(() => {
    if (viewMode === 'PLAYER_GAME') {
      window.history.pushState({ inGame: true }, '', window.location.href);

      const handlePopState = () => {
        const confirmLeave = window.confirm('คุณต้องการออกจากห้องกิจกรรมและกลับสู่หน้าหลักใช่หรือไม่?');
        if (confirmLeave) {
          handleLeaveSession();
        } else {
          // Re-push state so next back button press will also be intercepted
          window.history.pushState({ inGame: true }, '', window.location.href);
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [viewMode, pin, playerData?.playerId]);

  // Host Action Handlers
  const handleCreateRoom = (customQuizId) => {
    if (!socket) return;
    const effectiveQuizId = typeof customQuizId === 'string' ? customQuizId : null;
    socket.emit('create_room', effectiveQuizId ? { customQuizId: effectiveQuizId } : null);
  };

  const handleResumeRoom = (targetPin) => {
    if (!socket || !targetPin) return;
    const savedToken = localStorage.getItem('kaojai_hostToken') || sessionStorage.getItem('kaojai_hostToken');
    socket.emit('reconnect_host', { pin: targetPin, hostToken: savedToken }, (res) => {
      if (res && res.success) {
        saveSessionData({ pin: res.pin, isHost: true, hostToken: res.hostToken });
      }
    });
  };

  const getEffectiveHostToken = () => {
    return session?.hostToken || sessionStorage.getItem('kaojai_hostToken') || localStorage.getItem('kaojai_hostToken') || null;
  };

  const handleSelectQuiz = (newQuizId) => {
    if (typeof newQuizId !== 'string') return;
    setSelectedQuizId(newQuizId);
    const token = getEffectiveHostToken();
    if (socket && pin && (session.isHost || token)) {
      socket.emit('select_quiz', { pin, hostToken: token, quizId: newQuizId });
    }
  };

  const handleClearPretest = () => {
    if (!socket || !pin) return;
    const token = getEffectiveHostToken();
    socket.emit('clear_pretest', { pin, hostToken: token }, (res) => {
      if (res && res.success) {
        setPretestData(null);
      }
    });
  };

  const handleStartQuiz = (quizId, startQuizMode = 'NORMAL') => {
    if (!socket) return;
    const effectiveQuizId = typeof quizId === 'string' ? quizId : selectedQuizId;
    const effectiveQuizMode = typeof startQuizMode === 'string' ? startQuizMode : 'NORMAL';
    setQuizMode(effectiveQuizMode);
    const token = getEffectiveHostToken();
    socket.emit('start_quiz', { pin, hostToken: token, quizId: effectiveQuizId, quizMode: effectiveQuizMode });
  };

  const handleNextQuestion = () => {
    if (!socket || status === 'ENDED' || status === 'PREPARE' || status === 'SEQUENCE_INTRO') return;
    const token = getEffectiveHostToken();
    socket.emit('next_question', { pin, hostToken: token });
  };

  const handleStartSequenceQuestion = () => {
    if (!socket) return;
    const token = getEffectiveHostToken();
    socket.emit('start_sequence_question', { pin, hostToken: token });
  };

  const handleShowLeaderboard = () => {
    if (!socket) return;
    const token = getEffectiveHostToken();
    socket.emit('show_leaderboard', { pin, hostToken: token });
  };

  const handleSwitchMode = (targetMode) => {
    if (!socket || typeof targetMode !== 'string') return;
    const token = getEffectiveHostToken();
    socket.emit('switch_mode', { pin, mode: targetMode, hostToken: token });
  };

  const handleResetToLobby = () => {
    if (!socket) return;
    const token = getEffectiveHostToken();
    socket.emit('reset_to_lobby', { pin, hostToken: token });
  };

  const handleLeaveSession = () => {
    const token = getEffectiveHostToken();
    if (socket && pin) {
      if (session?.isHost || token) {
        socket.emit('close_room', { pin, hostToken: token });
      } else if (playerData?.playerId) {
        socket.emit('leave_room', { pin, playerId: playerData.playerId });
      }
    }
    clearSession();
    if (window.history.replaceState) {
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
    setViewMode('PLAYER_JOIN');
    setPin('');
    setStatus('LOBBY');
    setQuizMode('NORMAL');
    setPlayerData(null);
    setPrepareData(null);
    setSequenceIntroData(null);
    setCurrentQuestion(null);
    setQuestionResult(null);
    setLeaderboard([]);
    setQuizAnalytics(null);
    setPretestData(null);
    setPlayers([]);
    setTeams([]);
    setPulseVotes({ green: 0, yellow: 0, red: 0 });
    setCounts({ totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
  };

  const handleBackFromLuckyDraw = () => {
    if (previousViewMode === 'PLAYER_JOIN' || roomMode === 'LUCKY_DRAW') {
      const token = getEffectiveHostToken();
      if (socket && pin && token) {
        socket.emit('close_room', { pin, hostToken: token });
      }
      clearSession();
      setPin('');
      setRoomMode('QUIZ');
      setPlayers([]);
      setLeaderboard([]);
      setViewMode('PLAYER_JOIN');
    } else {
      setViewMode(previousViewMode || (session?.isHost ? 'HOST_GAME' : 'PLAYER_JOIN'));
    }
  };

  const handleToggleTeams = (enabled) => {
    if (!socket) return;
    const isBool = typeof enabled === 'boolean' ? enabled : !teamsEnabled;
    socket.emit('toggle_teams', { pin, enabled: isBool });
  };

  const handleAutoAssignTeams = (teamCount) => {
    if (!socket) return;
    const count = typeof teamCount === 'number' && Number.isFinite(teamCount) ? teamCount : 2;
    socket.emit('auto_assign_teams', { pin, teamCount: count });
  };

  const handleCreateTeam = (name, color) => {
    if (!socket || typeof name !== 'string' || !name.trim()) return;
    socket.emit('create_team', { pin, name: name.trim(), color: typeof color === 'string' ? color : '#2563EB' });
  };

  const handleRemoveTeam = (teamId) => {
    if (!socket || typeof teamId !== 'string') return;
    socket.emit('remove_team', { pin, teamId });
  };

  const handleAssignTeam = (playerId, teamId) => {
    if (!socket || typeof playerId !== 'string') return;
    socket.emit('assign_team', { pin, playerId, teamId: typeof teamId === 'string' ? teamId : null });
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
          className="animate-pop"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#DC2626',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
            zIndex: 2500,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: 'calc(100vw - 40px)'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem' }}>{errorMessage}</span>
          <button
            type="button"
            onClick={() => {
              if (errorTimerRef.current) {
                clearTimeout(errorTimerRef.current);
                errorTimerRef.current = null;
              }
              setErrorMessage('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              marginLeft: '6px',
              borderRadius: '6px',
              opacity: 0.9
            }}
            title="ปิดการแจ้งเตือน"
            aria-label="Close error message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* TEACHER BACKOFFICE ROUTING */}
      {viewMode === 'TEACHER_BACKOFFICE' && (
        <TeacherBackoffice onBack={() => setViewMode('PLAYER_JOIN')} />
      )}

      {/* LUCKY DRAW DEDICATED FULL-PAGE ROUTING */}
      {viewMode === 'LUCKY_DRAW' && (
        <LuckyDrawPage
          pin={pin}
          hostToken={session?.hostToken}
          players={players}
          leaderboard={leaderboard}
          socket={socket}
          onBack={handleBackFromLuckyDraw}
        />
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
            onOpenLuckyDraw={handleOpenLuckyDraw}
          />
          {roomMode === 'PULSE' ? (
            <HostPulse
              pin={pin}
              pulseVotes={pulseVotes}
              pulseAnsweredCount={counts.pulseAnsweredCount}
              totalPlayers={counts.totalPlayers}
              pulseRound={pulseRound}
            />
          ) : status === 'LOBBY' ? (
            <HostLobby
              pin={pin}
              players={players}
              counts={counts}
              onStartQuiz={handleStartQuiz}
              teamsEnabled={teamsEnabled}
              teams={teams}
              onToggleTeams={handleToggleTeams}
              onAutoAssignTeams={handleAutoAssignTeams}
              onCreateTeam={handleCreateTeam}
              onRemoveTeam={handleRemoveTeam}
              onAssignTeam={handleAssignTeam}
              pretestData={pretestData}
              selectedQuizId={selectedQuizId}
              onSelectQuiz={handleSelectQuiz}
              onClearPretest={handleClearPretest}
            />
          ) : status === 'LEADERBOARD' || status === 'ENDED' ? (
            <HostLeaderboard
              pin={pin}
              leaderboard={leaderboard}
              pulseVotes={pulseVotes}
              quizAnalytics={quizAnalytics}
              pretestData={pretestData}
              isEnded={status === 'ENDED'}
              quizMode={quizMode}
              onNextQuestion={handleNextQuestion}
              onResetToLobby={handleResetToLobby}
              onLeave={handleLeaveSession}
              onOpenLuckyDraw={handleOpenLuckyDraw}
            />
          ) : status === 'PREPARE' ? (
            <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
              <div className="glass-card animate-pop" style={{ padding: '40px 24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  เตรียมตัวให้พร้อมสำหรับคำถามถัดไป!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  ระบบกำลังโหลดข้อมูลคำถาม กรุณารอสักครู่ ✨
                </p>
              </div>
            </div>
          ) : (
            <HostQuiz
              key={`${quizMode}-${currentQuestion?.id || (currentQuestion?.questionIndex ?? 0)}`}
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

      {/* DEDICATED LUCKY DRAW PARTICIPANT REGISTRATION VIEW */}
      {viewMode === 'LUCKY_DRAW_PLAYER' && (
        <LuckyDrawPlayerJoin initialPin={pin} />
      )}

      {/* PARTICIPANT VIEW ROUTING */}
      {viewMode === 'PLAYER_JOIN' && (
        <JoinRoom
          onJoined={(joinRes) => {
            if (joinRes?.player) setPlayerData(joinRes.player);
            if (joinRes?.pin) setPin(joinRes.pin);
            if (joinRes?.status) setStatus(joinRes.status);
            if (joinRes?.mode) setRoomMode(joinRes.mode);
            if (joinRes?.quizMode) setQuizMode(joinRes.quizMode);
            if (joinRes?.currentQuestion) setCurrentQuestion(joinRes.currentQuestion);
            if (joinRes?.leaderboard) setLeaderboard(joinRes.leaderboard);
            if (joinRes?.counts) setCounts(joinRes.counts);
            if (joinRes?.teamsEnabled !== undefined) setTeamsEnabled(joinRes.teamsEnabled);
            if (joinRes?.teams) setTeams(joinRes.teams);
            setViewMode('PLAYER_GAME');
          }}
          onSwitchToHost={handleCreateRoom}
          onResumeRoom={handleResumeRoom}
          onOpenTeacherBackoffice={() => setViewMode('TEACHER_BACKOFFICE')}
          onOpenLuckyDraw={handleOpenLuckyDraw}
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
              onLeave={handleLeaveSession}
              pulseRound={pulseRound}
            />
          ) : status === 'LOBBY' ? (
            <PlayerLobby
              pin={pin}
              player={playerData}
              totalPlayers={counts.totalPlayers}
              mode={roomMode}
              teamsEnabled={teamsEnabled}
              teams={teams}
              onAssignTeam={handleAssignTeam}
              onLeave={handleLeaveSession}
            />
          ) : status === 'ENDED' ? (
            <PlayerEndedView
              player={playerData}
              leaderboard={leaderboard}
              quizMode={quizMode}
              onLeave={handleLeaveSession}
            />
          ) : status === 'LEADERBOARD' ? (
            <PlayerLeaderboardView
              player={playerData}
              leaderboard={leaderboard}
              quizMode={quizMode}
              onLeave={handleLeaveSession}
            />
          ) : status === 'PREPARE' ? (
            <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
              <div className="glass-card animate-pop" style={{ padding: '36px 20px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  เตรียมตัวให้พร้อม!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  ระบบกำลังโหลดคำถามข้อถัดไป กรุณารอสักครู่ ✨
                </p>
              </div>
            </div>
          ) : (
            <PlayerQuiz
              key={`${quizMode}-${currentQuestion?.id || (currentQuestion?.questionIndex ?? 0)}`}
              question={currentQuestion}
              result={questionResult}
              pin={pin}
              player={playerData}
              answeredCount={counts.answeredCount}
              totalPlayers={counts.totalPlayers}
              quizMode={quizMode}
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

      {sequenceIntroData && status === 'SEQUENCE_INTRO' && (
        <SequenceIntroGuide
          isHost={viewMode === 'HOST_GAME'}
          nextQuestionIndex={sequenceIntroData.nextQuestionIndex}
          totalQuestions={sequenceIntroData.totalQuestions}
          questionText={sequenceIntroData.questionText}
          onStartQuestion={handleStartSequenceQuestion}
        />
      )}

      {/* PLAYER LUCKY DRAW OVERLAY */}

      <PlayerLuckyDrawOverlay
        spinData={playerLuckyDrawSpinData}
        currentPlayerData={playerData}
        onClose={() => setPlayerLuckyDrawSpinData(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
