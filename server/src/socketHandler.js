const roomManager = require('./roomManager');

module.exports = function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // --- HOST HANDLERS ---
    socket.on('create_room', (customQuizSet, ackCallback) => {
      try {
        const room = roomManager.createRoom(socket.id, customQuizSet);
        socket.join(room.pin);
        
        const response = {
          success: true,
          pin: room.pin,
          mode: room.mode,
          status: room.status,
          quizSet: room.quizSet,
          players: roomManager.getPlayerList(room.pin),
          counts: roomManager.getPlayerCounts(room.pin)
        };

        if (typeof ackCallback === 'function') {
          ackCallback(response);
        }
        socket.emit('room_created', response);
      } catch (err) {
        console.error('[Socket Error] create_room:', err);
        socket.emit('error_message', { code: 'CREATE_ROOM_FAILED', message: err.message });
      }
    });

    socket.on('reconnect_host', ({ pin }, ackCallback) => {
      try {
        if (!pin) return;
        const snapshot = roomManager.reconnectHost(pin, socket.id);
        socket.join(pin);

        if (typeof ackCallback === 'function') {
          ackCallback(snapshot);
        }
        socket.emit('host_reconnected', snapshot);

        io.to(pin).emit('room_updated', {
          players: snapshot.players,
          counts: snapshot.counts
        });

      } catch (err) {
        console.error('[Socket Error] reconnect_host:', err);
        const errPayload = { success: false, message: err.message };
        if (typeof ackCallback === 'function') ackCallback(errPayload);
        socket.emit('error_message', errPayload);
      }
    });

    socket.on('start_quiz', ({ pin }) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return socket.emit('error_message', { message: 'ไม่พบห้อง' });

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }

        const result = roomManager.startQuestion(pin, 0);
        if (result.isEnded) {
          const leaderboard = roomManager.getLeaderboard(pin);
          return io.to(pin).emit('quiz_ended', { leaderboard, status: 'ENDED', isEnded: true });
        }

        const counts = roomManager.getPlayerCounts(pin);
        io.to(pin).emit('question_start', {
          question: result.question,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.quizSet.questions.length,
          answeredCount: 0,
          totalPlayers: counts.totalPlayers
        });

        const timeLimitMs = (result.question.timeLimitSeconds + 1) * 1000;
        room.questionTimer = setTimeout(() => {
          const questionResult = roomManager.getQuestionResult(pin);
          io.to(pin).emit('question_result', questionResult);
        }, timeLimitMs);

      } catch (err) {
        console.error('[Socket Error] start_quiz:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('next_question', ({ pin }) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return socket.emit('error_message', { message: 'ไม่พบห้อง' });

        if (room.status === 'ENDED') {
          const leaderboard = roomManager.getLeaderboard(pin);
          return io.to(pin).emit('quiz_ended', { leaderboard, status: 'ENDED', isEnded: true });
        }

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }

        const result = roomManager.startQuestion(pin);
        if (result.isEnded) {
          const leaderboard = roomManager.getLeaderboard(pin);
          return io.to(pin).emit('quiz_ended', { leaderboard, status: 'ENDED', isEnded: true });
        }

        const counts = roomManager.getPlayerCounts(pin);
        io.to(pin).emit('question_start', {
          question: result.question,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.quizSet.questions.length,
          answeredCount: 0,
          totalPlayers: counts.totalPlayers
        });

        const timeLimitMs = (result.question.timeLimitSeconds + 1) * 1000;
        room.questionTimer = setTimeout(() => {
          const questionResult = roomManager.getQuestionResult(pin);
          io.to(pin).emit('question_result', questionResult);
        }, timeLimitMs);

      } catch (err) {
        console.error('[Socket Error] next_question:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('show_leaderboard', ({ pin }) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return socket.emit('error_message', { message: 'ไม่พบห้อง' });

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }

        const leaderboard = roomManager.getLeaderboard(pin);

        if (room.status === 'ENDED') {
          return io.to(pin).emit('quiz_ended', { leaderboard, status: 'ENDED', isEnded: true });
        }

        room.status = 'LEADERBOARD';
        io.to(pin).emit('show_leaderboard', { leaderboard, status: 'LEADERBOARD' });
      } catch (err) {
        console.error('[Socket Error] show_leaderboard:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('switch_mode', ({ pin, mode }) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return socket.emit('error_message', { message: 'ไม่พบห้อง' });

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }

        roomManager.switchMode(pin, mode);
        const counts = roomManager.getPlayerCounts(pin);

        io.to(pin).emit('mode_switched', {
          mode: room.mode,
          status: room.status,
          pulseVotes: room.pulseVotes,
          pulseAnsweredCount: counts.pulseAnsweredCount,
          totalPlayers: counts.totalPlayers
        });
      } catch (err) {
        console.error('[Socket Error] switch_mode:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    // --- PLAYER HANDLERS ---
    socket.on('join_room', ({ pin, name, avatar, playerId }, ackCallback) => {
      try {
        if (!pin || !pin.trim()) {
          const res = { success: false, message: 'กรุณากรอกรหัส PIN' };
          if (typeof ackCallback === 'function') ackCallback(res);
          return socket.emit('error_message', res);
        }

        const cleanPin = pin.trim();
        const joinData = roomManager.joinPlayer(cleanPin, socket.id, { name, avatar, playerId });
        
        socket.join(cleanPin);

        const playerList = roomManager.getPlayerList(cleanPin);

        const successPayload = {
          success: true,
          pin: cleanPin,
          player: {
            playerId: joinData.player.playerId,
            name: joinData.player.name,
            avatar: joinData.player.avatar,
            score: joinData.player.score
          },
          mode: joinData.mode,
          status: joinData.status,
          currentQuestion: joinData.currentQuestion,
          questionResult: joinData.questionResult,
          pulseVotes: joinData.pulseVotes,
          leaderboard: joinData.leaderboard,
          isReconnect: joinData.isReconnect,
          counts: joinData.counts
        };

        if (typeof ackCallback === 'function') {
          ackCallback(successPayload);
        }
        socket.emit('join_success', successPayload);

        io.to(cleanPin).emit('room_updated', {
          players: playerList,
          counts: joinData.counts
        });

      } catch (err) {
        console.error('[Socket Error] join_room:', err);
        const res = { success: false, message: err.message };
        if (typeof ackCallback === 'function') ackCallback(res);
        socket.emit('error_message', res);
      }
    });

    socket.on('submit_answer', ({ pin, playerId, optionId }) => {
      try {
        const result = roomManager.submitAnswer(pin, playerId, optionId);
        
        socket.emit('answer_feedback', {
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned,
          totalScore: result.totalScore,
          alreadyAnswered: result.alreadyAnswered
        });

        io.to(pin).emit('answered_count_update', {
          answeredCount: result.answeredCount,
          totalPlayers: result.totalPlayers
        });

        if (result.allAnswered) {
          const room = roomManager.getRoom(pin);
          if (room && room.questionTimer) {
            clearTimeout(room.questionTimer);
            room.questionTimer = null;
          }
          const questionResult = roomManager.getQuestionResult(pin);
          io.to(pin).emit('question_result', questionResult);
        }

      } catch (err) {
        console.error('[Socket Error] submit_answer:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('submit_pulse', ({ pin, playerId, choice }) => {
      try {
        const result = roomManager.submitPulse(pin, playerId, choice);
        
        socket.emit('pulse_ack', { choice, success: true });

        io.to(pin).emit('pulse_updated', {
          pulseVotes: result.pulseVotes,
          pulseAnsweredCount: result.pulseAnsweredCount,
          totalPlayers: result.totalPlayers
        });

      } catch (err) {
        console.error('[Socket Error] submit_pulse:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] ID: ${socket.id}`);
      const info = roomManager.handleDisconnect(socket.id);
      if (info && info.room) {
        const counts = roomManager.getPlayerCounts(info.room.pin);
        const playerList = roomManager.getPlayerList(info.room.pin);
        
        io.to(info.room.pin).emit('room_updated', {
          players: playerList,
          counts
        });

        io.to(info.room.pin).emit('answered_count_update', {
          answeredCount: counts.answeredCount,
          totalPlayers: counts.totalPlayers
        });

        io.to(info.room.pin).emit('pulse_updated', {
          pulseVotes: info.room.pulseVotes,
          pulseAnsweredCount: counts.pulseAnsweredCount,
          totalPlayers: counts.totalPlayers
        });
      }
    });
  });
};
