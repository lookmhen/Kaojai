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
      teams: new Map(),   // teamId -> { id, name, color, memberIds: Set }
      teamsEnabled: false, // host toggles this on/off per session
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
      counts,
      teamsEnabled: room.teamsEnabled,
      teams: this.getTeamList(pin)
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
        pulseChoice: null,
        teamId: null   // set by host via assign_team or auto_assign_teams
      };
      room.players.set(playerId, existingPlayer);
    }

    let currentQuestion = null;
    if (room.status === 'QUESTION' && room.currentQuestionIndex >= 0 && room.quizSet.questions[room.currentQuestionIndex]) {
      currentQuestion = room.currentSafeQuestion || this.createSafeQuestion(
        room.quizSet.questions[room.currentQuestionIndex],
        room.currentQuestionIndex,
        room.quizSet.questions.length
      );
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

  handleDisconnect(socketId, gracePeriodMs = 60000, onExpired = null) {
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
            if (typeof onExpired === 'function') {
              onExpired(room, playerId);
            }
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

  createSafeQuestion(q, questionIndex, totalQuestions) {
    const isSequence = q.questionType === 'SEQUENCE' || (Array.isArray(q.sequenceItems) && q.sequenceItems.length > 0);

    if (isSequence) {
      // Shuffle sequence items randomly so players do not receive pre-ordered items
      const shuffled = [...q.sequenceItems]
        .map(item => ({ id: item.id, text: item.text }))
        .sort(() => Math.random() - 0.5);

      return {
        id: q.id,
        questionType: 'SEQUENCE',
        questionText: q.questionText,
        timeLimitSeconds: q.timeLimitSeconds,
        imageUrl: q.imageUrl || '',
        sequenceItems: shuffled,
        questionIndex,
        totalQuestions
      };
    }

    return {
      id: q.id,
      questionType: 'CHOICE',
      questionText: q.questionText,
      timeLimitSeconds: q.timeLimitSeconds,
      imageUrl: q.imageUrl || '',
      options: (q.options || []).map(opt => ({ id: opt.id, text: opt.text })),
      questionIndex,
      totalQuestions
    };
  }

  startQuestion(pin, questionIndex = null) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');

    if (questionIndex !== null) {
      room.currentQuestionIndex = questionIndex;
    } else if (room.currentQuestionIndex === -1) {
      room.currentQuestionIndex = 0;
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
    const safeQuestion = this.createSafeQuestion(
      currentQuestion,
      room.currentQuestionIndex,
      room.quizSet.questions.length
    );
    room.currentSafeQuestion = safeQuestion;

    return { isEnded: false, question: safeQuestion, currentQuestion };
  }

  submitAnswer(pin, playerId, answerData) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'QUESTION') throw new Error('ไม่ได้อยู่ในช่วงเวลาตอบคำถาม');
    if (room.currentAnswers.has(playerId)) {
      return { alreadyAnswered: true };
    }

    const currentQuestion = room.quizSet.questions[room.currentQuestionIndex];
    const isSequence = currentQuestion.questionType === 'SEQUENCE' || (Array.isArray(currentQuestion.sequenceItems) && currentQuestion.sequenceItems.length > 0);

    const timeLimitMs = currentQuestion.timeLimitSeconds * 1000;
    const timeUsedMs = Math.min(Date.now() - room.questionStartTime, timeLimitMs);
    const speedRatio = Math.max(0, (timeLimitMs - timeUsedMs) / timeLimitMs);

    let isCorrect = false;
    let pointsEarned = 0;
    let details = {};

    if (isSequence) {
      // Sequence evaluation
      const submittedIds = Array.isArray(answerData)
        ? answerData
        : (answerData?.orderedItemIds || (typeof answerData === 'string' ? [answerData] : []));

      const correctIds = currentQuestion.sequenceItems.map(item => item.id);
      const totalItems = correctIds.length;
      let correctPositions = 0;

      for (let i = 0; i < totalItems; i++) {
        if (submittedIds[i] === correctIds[i]) {
          correctPositions++;
        }
      }

      isCorrect = correctPositions === totalItems;
      const accuracyRatio = totalItems > 0 ? (correctPositions / totalItems) : 0;
      // Points formula: accuracy percentage of 500 base points + speed bonus scaled by accuracy
      pointsEarned = Math.round((500 * accuracyRatio) + (500 * speedRatio * accuracyRatio));

      details = {
        questionType: 'SEQUENCE',
        orderedItemIds: submittedIds,
        correctPositions,
        totalItems,
        isPerfect: isCorrect
      };
    } else {
      // Standard CHOICE evaluation
      const optionId = typeof answerData === 'object' ? answerData.optionId : answerData;
      const chosenOption = currentQuestion.options?.find(opt => opt.id === optionId);
      isCorrect = chosenOption ? Boolean(chosenOption.isCorrect) : false;

      if (isCorrect) {
        pointsEarned = Math.round(500 + 500 * speedRatio);
      }

      details = {
        questionType: 'CHOICE',
        optionId
      };
    }

    const player = room.players.get(playerId);
    if (player) {
      player.lastPointsEarned = pointsEarned;
      player.score += pointsEarned;
    }

    const answerRecord = {
      ...details,
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
      allAnswered,
      details
    };
  }

  getQuestionResult(pin) {
    const room = this.rooms.get(pin);
    if (!room) return null;

    room.status = 'QUESTION_RESULT';
    const currentQuestion = room.quizSet.questions[room.currentQuestionIndex];
    const isSequence = currentQuestion?.questionType === 'SEQUENCE' || Boolean(currentQuestion?.sequenceItems?.length);
    const counts = this.getPlayerCounts(pin);

    if (isSequence) {
      let perfectCount = 0;
      let partialCount = 0;

      for (const ans of room.currentAnswers.values()) {
        if (ans.isCorrect) {
          perfectCount++;
        } else if (ans.correctPositions > 0) {
          partialCount++;
        }
      }

      return {
        questionId: currentQuestion.id,
        questionType: 'SEQUENCE',
        correctSequence: currentQuestion.sequenceItems.map(item => ({
          id: item.id,
          text: item.text
        })),
        perfectCount,
        partialCount,
        answeredCount: counts.answeredCount,
        totalPlayers: counts.totalPlayers
      };
    }

    // CHOICE mode
    const optionCounts = {};
    if (currentQuestion && currentQuestion.options) {
      currentQuestion.options.forEach(opt => {
        optionCounts[opt.id] = 0;
      });
    }

    for (const answer of room.currentAnswers.values()) {
      if (answer.optionId && optionCounts[answer.optionId] !== undefined) {
        optionCounts[answer.optionId] += 1;
      }
    }

    return {
      questionId: currentQuestion ? currentQuestion.id : null,
      questionType: 'CHOICE',
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
    return playerList;
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
      isConnected: p.isConnected,
      teamId: p.teamId || null
    }));
  }

  // ─── Team Management ───────────────────────────────────────────────────────

  /**
   * Toggle team mode on or off for a room.
   * Assignments are preserved when disabled so re-enabling restores them.
   */
  setTeamsEnabled(pin, enabled) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    room.teamsEnabled = Boolean(enabled);
    return room.teamsEnabled;
  }

  /**
   * Create a new team in the room.
   * @param {string} pin
   * @param {{ name: string, color: string }} options
   * @returns {{ id, name, color, memberIds: Set }}
   */
  createTeam(pin, { name, color = '#6366F1' } = {}) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    if (!name || !name.trim()) throw new Error('ชื่อทีมไม่ถูกต้อง');

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const team = {
      id: teamId,
      name: name.trim().substring(0, 30),
      color,
      memberIds: new Set()
    };
    room.teams.set(teamId, team);
    return team;
  }

  /**
   * Remove a team and unassign all its members.
   */
  removeTeam(pin, teamId) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    const team = room.teams.get(teamId);
    if (!team) throw new Error('ไม่พบทีมดังกล่าว');

    // Unassign all members
    for (const playerId of team.memberIds) {
      const player = room.players.get(playerId);
      if (player) player.teamId = null;
    }
    room.teams.delete(teamId);
  }

  /**
   * Assign a player to a team (moves them from previous team if needed).
   */
  assignPlayerToTeam(pin, playerId, teamId) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');
    const player = room.players.get(playerId);
    if (!player) throw new Error('ไม่พบผู้เล่นดังกล่าว');

    // Remove from previous team
    if (player.teamId) {
      const prevTeam = room.teams.get(player.teamId);
      if (prevTeam) prevTeam.memberIds.delete(playerId);
    }

    if (teamId === null) {
      // Unassign
      player.teamId = null;
      return;
    }

    const team = room.teams.get(teamId);
    if (!team) throw new Error('ไม่พบทีมดังกล่าว');

    team.memberIds.add(playerId);
    player.teamId = teamId;
  }

  /**
   * Auto-distribute all connected players into existing teams as evenly as possible.
   * If no teams exist, creates `teamCount` teams with default names/colors.
   */
  autoAssignTeams(pin, teamCount = 2) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');

    const DEFAULT_COLORS = ['#E11D48', '#2563EB', '#D97706', '#059669', '#7C3AED', '#0891B2'];
    const DEFAULT_NAMES  = ['ทีม 1', 'ทีม 2', 'ทีม 3', 'ทีม 4', 'ทีม 5', 'ทีม 6'];

    // Ensure we have enough teams
    if (room.teams.size === 0) {
      const count = Math.min(Math.max(teamCount, 2), 6);
      for (let i = 0; i < count; i++) {
        this.createTeam(pin, { name: DEFAULT_NAMES[i], color: DEFAULT_COLORS[i] });
      }
    }

    // Clear current assignments
    for (const team of room.teams.values()) team.memberIds.clear();
    for (const player of room.players.values()) player.teamId = null;

    const teamIds = Array.from(room.teams.keys());
    const connectedPlayers = Array.from(room.players.values())
      .filter(p => p.isConnected)
      .sort(() => Math.random() - 0.5); // shuffle for random distribution

    connectedPlayers.forEach((player, idx) => {
      const teamId = teamIds[idx % teamIds.length];
      player.teamId = teamId;
      room.teams.get(teamId).memberIds.add(player.playerId);
    });

    return this.getTeamList(pin);
  }

  /**
   * Get serializable team list with member details.
   */
  getTeamList(pin) {
    const room = this.rooms.get(pin);
    if (!room) return [];

    return Array.from(room.teams.values()).map(team => ({
      id: team.id,
      name: team.name,
      color: team.color,
      memberIds: Array.from(team.memberIds),
      members: Array.from(team.memberIds)
        .map(pid => room.players.get(pid))
        .filter(Boolean)
        .map(p => ({ playerId: p.playerId, name: p.name, avatar: p.avatar, score: p.score })),
      totalScore: Array.from(team.memberIds)
        .map(pid => room.players.get(pid)?.score || 0)
        .reduce((sum, s) => sum + s, 0)
    }));
  }

  /**
   * Get team leaderboard sorted by total score (sum of members).
   */
  getTeamLeaderboard(pin) {
    return this.getTeamList(pin).sort((a, b) => b.totalScore - a.totalScore);
  }
}

module.exports = new RoomManager();
module.exports.RoomManager = RoomManager;
