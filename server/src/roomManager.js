const { defaultQuizSets } = require('./quizData');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.quizSets = [...defaultQuizSets];
  }

  generatePin() {
    let pin;
    do {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(pin));
    return pin;
  }

  createRoom(hostSocketId, customQuizSet = null) {
    const pin = this.generatePin();
    const quizSet = customQuizSet || this.quizSets[0];
    
    const room = {
      pin,
      hostSocketId,
      mode: 'QUIZ', // 'QUIZ' or 'PULSE'
      quizSet,
      currentQuestionIndex: -1,
      questionStartTime: null,
      questionTimer: null,
      players: new Map(), // playerId -> playerData
      votedPulseUsers: new Set(),
      pulseVotes: { green: 0, yellow: 0, red: 0 },
      status: 'LOBBY', // 'LOBBY', 'QUESTION', 'QUESTION_RESULT', 'LEADERBOARD', 'ENDED'
      currentAnswers: new Map() // playerId -> { optionId, isCorrect, timeUsed, pointsEarned }
    };

    this.rooms.set(pin, room);
    return room;
  }

  getRoom(pin) {
    return this.rooms.get(pin);
  }

  getRoomByHostSocketId(hostSocketId) {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId === hostSocketId) {
        return room;
      }
    }
    return null;
  }

  reconnectHost(pin, hostSocketId) {
    const room = this.rooms.get(pin);
    if (!room) {
      throw new Error('ไม่พบห้องหรือเซสชันของคุณหมดอายุแล้ว');
    }

    room.hostSocketId = hostSocketId;

    let currentQuestion = null;
    if (room.status === 'QUESTION' && room.currentQuestionIndex >= 0 && room.quizSet.questions[room.currentQuestionIndex]) {
      const q = room.quizSet.questions[room.currentQuestionIndex];
      currentQuestion = {
        id: q.id,
        questionText: q.questionText,
        timeLimitSeconds: q.timeLimitSeconds,
        imageUrl: q.imageUrl || '',
        options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
        questionIndex: room.currentQuestionIndex,
        totalQuestions: room.quizSet.questions.length
      };
    }

    const questionResult = room.status === 'QUESTION_RESULT' ? this.getQuestionResult(pin) : null;
    const leaderboard = room.status === 'LEADERBOARD' ? this.getLeaderboard(pin) : [];
    const counts = this.getPlayerCounts(pin);
    const players = this.getPlayerList(pin);

    return {
      success: true,
      pin: room.pin,
      mode: room.mode,
      status: room.status,
      quizSet: room.quizSet,
      currentQuestion,
      questionResult,
      pulseVotes: room.pulseVotes,
      leaderboard,
      players,
      counts
    };
  }

  joinPlayer(pin, socketId, { name, avatar, playerId: clientPlayerId }) {
    const room = this.rooms.get(pin);
    if (!room) {
      throw new Error('ไม่พบห้องดังกล่าว หรือรหัส PIN ไม่ถูกต้อง');
    }

    const sanitizedName = (name || 'Anonymous').trim().substring(0, 30);
    const sanitizedAvatar = avatar || '0291dcc0ce.svg';
    const playerId = clientPlayerId || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    let existingPlayer = room.players.get(playerId);
    if (!existingPlayer) {
      for (const [id, player] of room.players.entries()) {
        if (player.name.toLowerCase() === sanitizedName.toLowerCase()) {
          existingPlayer = player;
          break;
        }
      }
    }

    let isReconnect = false;

    if (existingPlayer) {
      isReconnect = true;
      if (existingPlayer.disconnectTimeout) {
        clearTimeout(existingPlayer.disconnectTimeout);
        existingPlayer.disconnectTimeout = null;
      }
      existingPlayer.socketId = socketId;
      existingPlayer.isConnected = true;
      existingPlayer.name = sanitizedName;
      existingPlayer.avatar = sanitizedAvatar;
    } else {
      isReconnect = false;
      existingPlayer = {
        playerId,
        socketId,
        name: sanitizedName,
        avatar: sanitizedAvatar,
        score: 0,
        previousScore: 0,
        lastPointsEarned: 0,
        isConnected: true,
        disconnectTimeout: null,
        pulseChoice: null
      };
      room.players.set(playerId, existingPlayer);
    }

    let currentQuestion = null;
    if (room.status === 'QUESTION' && room.currentQuestionIndex >= 0 && room.quizSet.questions[room.currentQuestionIndex]) {
      const q = room.quizSet.questions[room.currentQuestionIndex];
      currentQuestion = {
        id: q.id,
        questionText: q.questionText,
        timeLimitSeconds: q.timeLimitSeconds,
        imageUrl: q.imageUrl || '',
        options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
        questionIndex: room.currentQuestionIndex,
        totalQuestions: room.quizSet.questions.length
      };
    }

    const questionResult = room.status === 'QUESTION_RESULT' ? this.getQuestionResult(pin) : null;
    const leaderboard = room.status === 'LEADERBOARD' ? this.getLeaderboard(pin) : [];
    const counts = this.getPlayerCounts(pin);

    return {
      room,
      player: existingPlayer,
      isReconnect,
      mode: room.mode,
      status: room.status,
      currentQuestion,
      questionResult,
      pulseVotes: room.pulseVotes,
      leaderboard,
      counts
    };
  }

  handleDisconnect(socketId, gracePeriodMs = 60000) {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId === socketId) {
        console.log(`[Host Disconnected] Room PIN: ${room.pin}`);
      }

      for (const [playerId, player] of room.players.entries()) {
        if (player.socketId === socketId) {
          player.isConnected = false;
          if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);
          player.disconnectTimeout = setTimeout(() => {
            room.players.delete(playerId);
            room.currentAnswers.delete(playerId);
            room.votedPulseUsers.delete(playerId);
          }, gracePeriodMs);
          return { room, player };
        }
      }
    }
    return null;
  }

  getPlayerCounts(pin) {
    const room = this.rooms.get(pin);
    if (!room) return { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 };

    const activePlayers = Array.from(room.players.values()).filter(p => p.isConnected);
    const totalPlayers = activePlayers.length;
    const answeredCount = room.currentAnswers.size;
    const pulseAnsweredCount = room.votedPulseUsers.size;

    return {
      totalPlayers,
      answeredCount,
      pulseAnsweredCount
    };
  }

  startQuestion(pin, questionIndex = null) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');

    if (questionIndex !== null) {
      room.currentQuestionIndex = questionIndex;
    } else {
      room.currentQuestionIndex += 1;
    }

    if (room.currentQuestionIndex >= room.quizSet.questions.length) {
      room.status = 'ENDED';
      return { isEnded: true };
    }

    // Save previous scores for racing leaderboard transition
    for (const player of room.players.values()) {
      player.previousScore = player.score;
      player.lastPointsEarned = 0;
    }

    room.status = 'QUESTION';
    room.questionStartTime = Date.now();
    room.currentAnswers.clear();

    const currentQuestion = room.quizSet.questions[room.currentQuestionIndex];
    const safeQuestion = {
      id: currentQuestion.id,
      questionText: currentQuestion.questionText,
      timeLimitSeconds: currentQuestion.timeLimitSeconds,
      imageUrl: currentQuestion.imageUrl || '',
      options: currentQuestion.options.map(opt => ({ id: opt.id, text: opt.text })),
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.quizSet.questions.length
    };

    return { isEnded: false, question: safeQuestion, currentQuestion };
  }

  submitAnswer(pin, playerId, optionId) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'QUESTION') throw new Error('ไม่ได้อยู่ในช่วงเวลาตอบคำถาม');
    if (room.currentAnswers.has(playerId)) {
      return { alreadyAnswered: true };
    }

    const currentQuestion = room.quizSet.questions[room.currentQuestionIndex];
    const chosenOption = currentQuestion.options.find(opt => opt.id === optionId);
    const isCorrect = chosenOption ? chosenOption.isCorrect : false;

    const timeLimitMs = currentQuestion.timeLimitSeconds * 1000;
    const timeUsedMs = Math.min(Date.now() - room.questionStartTime, timeLimitMs);
    
    let pointsEarned = 0;
    if (isCorrect) {
      const speedRatio = (timeLimitMs - timeUsedMs) / timeLimitMs;
      pointsEarned = Math.round(500 + 500 * Math.max(0, speedRatio));
    }

    const player = room.players.get(playerId);
    if (player) {
      player.lastPointsEarned = pointsEarned;
      player.score += pointsEarned;
    }

    const answerRecord = {
      optionId,
      isCorrect,
      timeUsedMs,
      pointsEarned
    };
    room.currentAnswers.set(playerId, answerRecord);

    const counts = this.getPlayerCounts(pin);
    const allAnswered = counts.answeredCount >= counts.totalPlayers && counts.totalPlayers > 0;

    return {
      alreadyAnswered: false,
      isCorrect,
      pointsEarned,
      totalScore: player ? player.score : 0,
      answeredCount: counts.answeredCount,
      totalPlayers: counts.totalPlayers,
      allAnswered
    };
  }

  getQuestionResult(pin) {
    const room = this.rooms.get(pin);
    if (!room) return null;

    room.status = 'QUESTION_RESULT';
    const currentQuestion = room.quizSet.questions[room.currentQuestionIndex];
    
    const optionCounts = {};
    if (currentQuestion && currentQuestion.options) {
      currentQuestion.options.forEach(opt => {
        optionCounts[opt.id] = 0;
      });
    }

    for (const answer of room.currentAnswers.values()) {
      if (optionCounts[answer.optionId] !== undefined) {
        optionCounts[answer.optionId] += 1;
      }
    }

    const counts = this.getPlayerCounts(pin);

    return {
      questionId: currentQuestion ? currentQuestion.id : null,
      correctOptionId: currentQuestion?.options?.find(o => o.isCorrect)?.id,
      optionCounts,
      answeredCount: counts.answeredCount,
      totalPlayers: counts.totalPlayers
    };
  }

  getLeaderboard(pin) {
    const room = this.rooms.get(pin);
    if (!room) return [];

    room.status = 'LEADERBOARD';

    const playerList = Array.from(room.players.values()).map(p => ({
      playerId: p.playerId,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      previousScore: p.previousScore || 0,
      lastPointsEarned: p.lastPointsEarned || 0,
      isConnected: p.isConnected
    }));

    playerList.sort((a, b) => b.score - a.score);
    return playerList.slice(0, 10);
  }

  submitPulse(pin, playerId, choice) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    if (!['green', 'yellow', 'red'].includes(choice)) throw new Error('ตัวเลือกไม่ถูกต้อง');

    const player = room.players.get(playerId);
    if (player) {
      if (player.pulseChoice) {
        room.pulseVotes[player.pulseChoice] = Math.max(0, room.pulseVotes[player.pulseChoice] - 1);
      }
      player.pulseChoice = choice;
    }

    room.votedPulseUsers.add(playerId);
    room.pulseVotes[choice] = (room.pulseVotes[choice] || 0) + 1;

    const counts = this.getPlayerCounts(pin);

    return {
      pulseVotes: room.pulseVotes,
      pulseAnsweredCount: counts.pulseAnsweredCount,
      totalPlayers: counts.totalPlayers
    };
  }

  switchMode(pin, mode) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    if (!['QUIZ', 'PULSE'].includes(mode)) throw new Error('Mode ไม่ถูกต้อง');

    room.mode = mode;
    return room;
  }

  getPlayerList(pin) {
    const room = this.rooms.get(pin);
    if (!room) return [];
    return Array.from(room.players.values()).map(p => ({
      playerId: p.playerId,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      isConnected: p.isConnected
    }));
  }
}

module.exports = new RoomManager();
module.exports.RoomManager = RoomManager;
