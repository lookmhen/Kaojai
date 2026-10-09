const roomManager = require('./roomManager');

/**
 * Strip all answer-revealing data from a question_result payload for PRETEST mode.
 * Players should only know "time's up / answered" but NOT which positions were right.
 */
function maskPretestResult(questionResult) {
  if (!questionResult) return questionResult;
  return {
    questionId: questionResult.questionId,
    questionType: questionResult.questionType,
    quizMode: 'PRETEST',
    answeredCount: questionResult.answeredCount,
    totalPlayers: questionResult.totalPlayers,
    isLastQuestion: questionResult.isLastQuestion,
    // CHOICE: hide correct option and blank option counts
    correctOptionId: null,
    optionCounts: null,
    // SEQUENCE: hide correct sequence and zero the counts so no info leaks
    correctSequence: null,
    perfectCount: 0,
    partialCount: 0
  };
}

module.exports = function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    function verifyHost(pin, token = null) {
      const room = roomManager.getRoom(pin);
      if (!room) throw new Error('ไม่พบห้องดังกล่าว');
      if (token && room.hostToken && token === room.hostToken) {
        if (room.hostSocketId !== socket.id) {
          room.hostSocketId = socket.id;
        }
        socket.join(pin);
        return room;
      }
      if (room.hostSocketId === socket.id) {
        socket.join(pin);
        return room;
      }
      throw new Error('คุณไม่มีสิทธิ์ในการควบคุมห้องนี้ (Unauthorized Host Action)');
    }

    // --- HOST HANDLERS ---
    socket.on('create_room', (customQuizSet, ackCallback) => {
      try {
        const room = roomManager.createRoom(socket.id, customQuizSet);
        socket.join(room.pin);
        
        const response = {
          success: true,
          pin: room.pin,
          hostToken: room.hostToken,
          mode: room.mode,
          status: room.status,
          quizSet: room.quizSet,
          players: roomManager.getPlayerList(room.pin),
          counts: roomManager.getPlayerCounts(room.pin),
          pulseVotes: room.pulseVotes,
          pulseRound: room.pulseRound || 1,
          teamsEnabled: room.teamsEnabled,
          teams: roomManager.getTeamList(room.pin)
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

    socket.on('get_active_sessions', (ackCallback) => {
      try {
        const rooms = roomManager.getAllActiveSessions();
        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, sessions: rooms });
        }
        socket.emit('active_sessions_data', { success: true, sessions: rooms });
      } catch (err) {
        console.error('[Socket Error] get_active_sessions:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    socket.on('reconnect_host', ({ pin, hostToken }, ackCallback) => {
      try {
        if (!pin) return;
        const snapshot = roomManager.reconnectHost(pin, socket.id, hostToken);
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
        console.log(`[Socket Info] reconnect_host failed: ${err.message}`);
        const errPayload = { success: false, message: err.message };
        if (typeof ackCallback === 'function') ackCallback(errPayload);
        socket.emit('error_message', errPayload);
      }
    });

    socket.on('select_quiz', ({ pin, hostToken, quizId }, ackCallback) => {
      try {
        const room = verifyHost(pin, hostToken);
        const updatedQuiz = roomManager.setRoomQuiz(pin, quizId);

        io.to(pin).emit('quiz_selected', {
          quizId: updatedQuiz.id,
          quizTitle: updatedQuiz.title,
          totalQuestions: updatedQuiz.questions.length
        });

        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, quizId: updatedQuiz.id, quizTitle: updatedQuiz.title });
        }
      } catch (err) {
        console.error('[Socket Error] select_quiz:', err);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('clear_pretest', ({ pin, hostToken }, ackCallback) => {
      try {
        const room = verifyHost(pin, hostToken);
        room.pretestData = null;
        io.to(pin).emit('pretest_cleared');
        if (typeof ackCallback === 'function') {
          ackCallback({ success: true });
        }
      } catch (err) {
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
      }
    });

    socket.on('start_quiz', ({ pin, hostToken, quizId, quizMode = 'NORMAL' }) => {
      try {
        const room = verifyHost(pin, hostToken);

        // If host provided a specific quizId, update the room's quizSet
        if (quizId) {
          try {
            roomManager.setRoomQuiz(pin, quizId);
          } catch (qErr) {
            console.warn(`[Socket Warn] start_quiz setRoomQuiz failed for ${quizId}:`, qErr.message);
          }
        }

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }
        if (room.prepareTimer) {
          clearTimeout(room.prepareTimer);
          room.prepareTimer = null;
        }

        if (!room.quizSet?.questions?.length) {
          return socket.emit('error_message', { message: 'ชุดคำถามนี้ไม่มีข้อคำถาม' });
        }

        // Set the room's quizMode ('NORMAL' | 'PRETEST' | 'POSTTEST')
        room.quizMode = quizMode;

        // Reset all player scores, streaks, and question history for the new game session
        // If starting PRETEST, clear any old pretest data. If starting POSTTEST or NORMAL, preserve pretestData.
        roomManager.resetRoomScores(pin, { clearPretest: quizMode === 'PRETEST' });

        function launchQuestion(roomPin, targetIdx) {
          try {
            const currentRoom = roomManager.getRoom(roomPin);
            if (!currentRoom) return;

            const result = roomManager.startQuestion(roomPin, targetIdx);
            if (result.isEnded) {
              if (currentRoom.quizMode === 'PRETEST') {
                roomManager.savePretestSnapshot(roomPin);
              }
              const leaderboard = roomManager.getLeaderboard(roomPin);
              const quizAnalytics = roomManager.getQuizAnalytics(roomPin);
              return io.to(roomPin).emit('quiz_ended', {
                leaderboard,
                quizAnalytics,
                status: 'ENDED',
                isEnded: true,
                quizMode: currentRoom.quizMode,
                pretestData: currentRoom.pretestData
              });
            }

            const counts = roomManager.getPlayerCounts(roomPin);
            io.to(roomPin).emit('question_start', {
              question: result.question,
              currentQuestionIndex: currentRoom.currentQuestionIndex,
              totalQuestions: currentRoom.quizSet.questions.length,
              answeredCount: 0,
              totalPlayers: counts.totalPlayers,
              quizMode: currentRoom.quizMode
            });

            const durationSec = Math.max(5, Number(result.question?.timeLimitSeconds) || 30);
            const timeLimitMs = (durationSec + 1) * 1000;
            currentRoom.questionTimer = setTimeout(() => {
              try {
                currentRoom.questionTimer = null;
                const questionResult = roomManager.getQuestionResult(roomPin);
                if (currentRoom.quizMode === 'PRETEST') {
                  io.to(roomPin).emit('question_result', maskPretestResult(questionResult));
                } else {
                  io.to(roomPin).emit('question_result', questionResult);
                }
              } catch (tErr) {
                console.error('[Socket Timer Error] questionTimer:', tErr);
              }
            }, timeLimitMs);
          } catch (launchErr) {
            console.error('[Socket Error] launchQuestion:', launchErr);
          }
        }

        function triggerQuestionTransition(currentRoom, targetIdx) {
          if (currentRoom.questionTimer) {
            clearTimeout(currentRoom.questionTimer);
            currentRoom.questionTimer = null;
          }
          if (currentRoom.prepareTimer) {
            clearTimeout(currentRoom.prepareTimer);
            currentRoom.prepareTimer = null;
          }

          const targetQuestion = currentRoom.quizSet?.questions?.[targetIdx];
          const isSequence = (targetQuestion?.questionType === 'SEQUENCE' || targetQuestion?.type === 'SEQUENCE');
          const isFirstSequence = isSequence && !currentRoom.hasIntroducedSequence;

          if (isFirstSequence) {
            currentRoom.hasIntroducedSequence = true;
            currentRoom.status = 'SEQUENCE_INTRO';
            currentRoom.pendingQuestionIndex = targetIdx;

            io.to(currentRoom.pin).emit('sequence_intro', {
              nextQuestionIndex: targetIdx,
              totalQuestions: currentRoom.quizSet.questions.length,
              questionText: targetQuestion.questionText || '',
              quizMode: currentRoom.quizMode
            });
            return;
          }

          const prepareDurationMs = process.env.NODE_ENV === 'test' ? 20 : 5000;
          currentRoom.status = 'PREPARE';
          io.to(currentRoom.pin).emit('question_prepare', {
            nextQuestionIndex: targetIdx,
            totalQuestions: currentRoom.quizSet.questions.length,
            countdownSeconds: 5,
            quizMode: currentRoom.quizMode
          });

          currentRoom.prepareTimer = setTimeout(() => {
            currentRoom.prepareTimer = null;
            launchQuestion(currentRoom.pin, targetIdx);
          }, prepareDurationMs);
        }

        triggerQuestionTransition(room, 0);

      } catch (err) {
        console.error('[Socket Error] start_quiz:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('start_sequence_question', ({ pin, hostToken }) => {
      try {
        const room = verifyHost(pin, hostToken);
        if (room.status !== 'SEQUENCE_INTRO') return;

        const targetIdx = (room.pendingQuestionIndex !== null && room.pendingQuestionIndex !== undefined)
          ? room.pendingQuestionIndex
          : 0;

        room.pendingQuestionIndex = null;

        const prepareDurationMs = process.env.NODE_ENV === 'test' ? 20 : 3000;
        room.status = 'PREPARE';
        io.to(pin).emit('question_prepare', {
          nextQuestionIndex: targetIdx,
          totalQuestions: room.quizSet.questions.length,
          countdownSeconds: 3,
          quizMode: room.quizMode
        });

        room.prepareTimer = setTimeout(() => {
          room.prepareTimer = null;
          try {
            const currentRoom = roomManager.getRoom(pin);
            if (!currentRoom) return;

            const result = roomManager.startQuestion(pin, targetIdx);
            if (result.isEnded) {
              if (currentRoom.quizMode === 'PRETEST') {
                roomManager.savePretestSnapshot(pin);
              }
              const leaderboard = roomManager.getLeaderboard(pin);
              const quizAnalytics = roomManager.getQuizAnalytics(pin);
              return io.to(pin).emit('quiz_ended', {
                leaderboard,
                quizAnalytics,
                status: 'ENDED',
                isEnded: true,
                quizMode: currentRoom.quizMode,
                pretestData: currentRoom.pretestData
              });
            }

            const counts = roomManager.getPlayerCounts(pin);
            io.to(pin).emit('question_start', {
              question: result.question,
              currentQuestionIndex: currentRoom.currentQuestionIndex,
              totalQuestions: currentRoom.quizSet.questions.length,
              answeredCount: 0,
              totalPlayers: counts.totalPlayers,
              quizMode: currentRoom.quizMode
            });

            const durationSec = Math.max(5, Number(result.question?.timeLimitSeconds) || 30);
            const timeLimitMs = (durationSec + 1) * 1000;
            currentRoom.questionTimer = setTimeout(() => {
              try {
                currentRoom.questionTimer = null;
                const questionResult = roomManager.getQuestionResult(pin);
                if (currentRoom.quizMode === 'PRETEST') {
                  io.to(pin).emit('question_result', maskPretestResult(questionResult));
                } else {
                  io.to(pin).emit('question_result', questionResult);
                }
              } catch (tErr) {
                console.error('[Socket Timer Error] questionTimer:', tErr);
              }
            }, timeLimitMs);
          } catch (lErr) {
            console.error('[Socket Error] start_sequence_question launch:', lErr);
          }
        }, prepareDurationMs);
      } catch (err) {
        console.error('[Socket Error] start_sequence_question:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('next_question', ({ pin, hostToken }) => {
      try {
        const room = verifyHost(pin, hostToken);

        if (room.status === 'ENDED') {
          const leaderboard = roomManager.getLeaderboard(pin);
          const quizAnalytics = roomManager.getQuizAnalytics(pin);
          return io.to(pin).emit('quiz_ended', { leaderboard, quizAnalytics, status: 'ENDED', isEnded: true, quizMode: room.quizMode, pretestData: room.pretestData });
        }

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }
        if (room.prepareTimer) {
          clearTimeout(room.prepareTimer);
          room.prepareTimer = null;
        }

        const nextIdx = (room.currentQuestionIndex !== null && room.currentQuestionIndex !== undefined)
          ? room.currentQuestionIndex + 1
          : 0;

        if (nextIdx >= room.quizSet.questions.length) {
          room.status = 'ENDED';
          if (room.quizMode === 'PRETEST') {
            roomManager.savePretestSnapshot(pin);
          }
          const leaderboard = roomManager.getLeaderboard(pin);
          const quizAnalytics = roomManager.getQuizAnalytics(pin);
          return io.to(pin).emit('quiz_ended', {
            leaderboard,
            quizAnalytics,
            status: 'ENDED',
            isEnded: true,
            quizMode: room.quizMode,
            pretestData: room.pretestData
          });
        }

        const targetQuestion = room.quizSet?.questions?.[nextIdx];
        const isSequence = (targetQuestion?.questionType === 'SEQUENCE' || targetQuestion?.type === 'SEQUENCE');
        const isFirstSequence = isSequence && !room.hasIntroducedSequence;

        if (isFirstSequence) {
          room.hasIntroducedSequence = true;
          room.status = 'SEQUENCE_INTRO';
          room.pendingQuestionIndex = nextIdx;

          io.to(room.pin).emit('sequence_intro', {
            nextQuestionIndex: nextIdx,
            totalQuestions: room.quizSet.questions.length,
            questionText: targetQuestion.questionText || '',
            quizMode: room.quizMode
          });
          return;
        }

        const prepareDurationMs = process.env.NODE_ENV === 'test' ? 20 : 5000;

        room.status = 'PREPARE';
        io.to(pin).emit('question_prepare', {
          nextQuestionIndex: nextIdx,
          totalQuestions: room.quizSet.questions.length,
          countdownSeconds: 5,
          quizMode: room.quizMode
        });

        room.prepareTimer = setTimeout(() => {
          room.prepareTimer = null;
          try {
            const currentRoom = roomManager.getRoom(pin);
            if (!currentRoom) return;

            const result = roomManager.startQuestion(pin, nextIdx);
            if (result.isEnded) {
              if (currentRoom.quizMode === 'PRETEST') {
                roomManager.savePretestSnapshot(pin);
              }
              const leaderboard = roomManager.getLeaderboard(pin);
              const quizAnalytics = roomManager.getQuizAnalytics(pin);
              return io.to(pin).emit('quiz_ended', {
                leaderboard,
                quizAnalytics,
                status: 'ENDED',
                isEnded: true,
                quizMode: currentRoom.quizMode,
                pretestData: currentRoom.pretestData
              });
            }

            const counts = roomManager.getPlayerCounts(pin);
            io.to(pin).emit('question_start', {
              question: result.question,
              currentQuestionIndex: currentRoom.currentQuestionIndex,
              totalQuestions: currentRoom.quizSet.questions.length,
              answeredCount: 0,
              totalPlayers: counts.totalPlayers,
              quizMode: currentRoom.quizMode
            });

            const durationSec = Math.max(5, Number(result.question?.timeLimitSeconds) || 30);
            const timeLimitMs = (durationSec + 1) * 1000;
            currentRoom.questionTimer = setTimeout(() => {
              try {
                currentRoom.questionTimer = null;
                const questionResult = roomManager.getQuestionResult(pin);
                if (currentRoom.quizMode === 'PRETEST') {
                  io.to(pin).emit('question_result', maskPretestResult(questionResult));
                } else {
                  io.to(pin).emit('question_result', questionResult);
                }
              } catch (tErr) {
                console.error('[Socket Timer Error] next_question timer:', tErr);
              }
            }, timeLimitMs);
          } catch (nextErr) {
            console.error('[Socket Error] next_question launch:', nextErr);
          }
        }, prepareDurationMs);

      } catch (err) {
        console.error('[Socket Error] next_question:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('show_leaderboard', ({ pin, hostToken }) => {
      try {
        const room = verifyHost(pin, hostToken);

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }
        if (room.prepareTimer) {
          clearTimeout(room.prepareTimer);
          room.prepareTimer = null;
        }

        const leaderboard = roomManager.getLeaderboard(pin);
        const quizAnalytics = roomManager.getQuizAnalytics(pin);

        const isLastQuestion = (room.currentQuestionIndex !== null && room.currentQuestionIndex !== undefined)
          && room.currentQuestionIndex >= (room.quizSet?.questions?.length || 1) - 1;

        if (room.status === 'ENDED' || isLastQuestion) {
          room.status = 'ENDED';
          if (room.quizMode === 'PRETEST') {
            roomManager.savePretestSnapshot(pin);
          }
          const finalAnalytics = roomManager.getQuizAnalytics(pin);
          return io.to(pin).emit('quiz_ended', {
            leaderboard,
            quizAnalytics: finalAnalytics,
            status: 'ENDED',
            isEnded: true,
            quizMode: room.quizMode,
            pretestData: room.pretestData
          });
        }

        room.status = 'LEADERBOARD';
        io.to(pin).emit('show_leaderboard', {
          leaderboard,
          quizAnalytics,
          status: 'LEADERBOARD',
          quizMode: room.quizMode,
          pretestData: room.pretestData
        });
      } catch (err) {
        console.error('[Socket Error] show_leaderboard:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('get_quiz_analytics', ({ pin }, ackCallback) => {
      try {
        const analytics = roomManager.getQuizAnalytics(pin);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, quizAnalytics: analytics });
        }
        socket.emit('quiz_analytics_data', { success: true, quizAnalytics: analytics });
      } catch (err) {
        console.error('[Socket Error] get_quiz_analytics:', err);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('switch_mode', ({ pin, mode, hostToken }) => {
      try {
        const room = verifyHost(pin, hostToken);

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }
        if (room.prepareTimer) {
          clearTimeout(room.prepareTimer);
          room.prepareTimer = null;
        }

        roomManager.switchMode(pin, mode);
        const counts = roomManager.getPlayerCounts(pin);

        io.to(pin).emit('mode_switched', {
          mode: room.mode,
          status: room.status,
          pulseVotes: room.pulseVotes,
          pulseRound: room.pulseRound || 1,
          pulseAnsweredCount: counts.pulseAnsweredCount,
          totalPlayers: counts.totalPlayers
        });
      } catch (err) {
        console.error('[Socket Error] switch_mode:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('send_pulse_nudge', ({ pin, hostToken }) => {
      try {
        const room = verifyHost(pin, hostToken);

        const unvotedPlayers = Array.from(room.players.values()).filter(
          p => p.isConnected && !room.votedPulseUsers.has(p.playerId)
        );

        unvotedPlayers.forEach(p => {
          if (p.socketId) {
            io.to(p.socketId).emit('pulse_nudge_alert', {
              message: '🔔 วิทยากรกำลังรอสัญญาณตอบรับจากคุณอยู่นะครับ! ✨',
              timestamp: Date.now()
            });
          }
        });
      } catch (err) {
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('reset_pulse', ({ pin, hostToken }, ackCallback) => {
      try {
        const room = verifyHost(pin, hostToken);
        const result = roomManager.resetPulse(pin);

        io.to(pin).emit('pulse_reset', {
          pulseVotes: result.pulseVotes,
          pulseRound: result.pulseRound,
          round: result.pulseRound,
          pulseAnsweredCount: 0,
          totalPlayers: result.totalPlayers,
          pulseHistory: result.pulseHistory
        });

        io.to(pin).emit('pulse_updated', {
          pulseVotes: result.pulseVotes,
          pulseRound: result.pulseRound,
          pulseAnsweredCount: 0,
          totalPlayers: result.totalPlayers
        });

        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, pulseRound: result.pulseRound });
        }
      } catch (err) {
        console.error('[Socket Error] reset_pulse:', err);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('reset_to_lobby', ({ pin, hostToken }) => {
      try {
        const room = verifyHost(pin, hostToken);

        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
          room.questionTimer = null;
        }
        if (room.prepareTimer) {
          clearTimeout(room.prepareTimer);
          room.prepareTimer = null;
        }

        roomManager.resetRoomToLobby(pin);
        const playerList = roomManager.getPlayerList(pin);
        const counts = roomManager.getPlayerCounts(pin);

        io.to(pin).emit('room_reset_to_lobby', {
          status: 'LOBBY',
          players: playerList,
          counts,
          quizMode: room.quizMode,
          quizSet: room.quizSet,
          pretestData: room.pretestData
        });
        io.to(pin).emit('room_updated', { players: playerList, counts });
      } catch (err) {
        console.error('[Socket Error] reset_to_lobby:', err);
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('clear_pretest', ({ pin, hostToken }, ackCallback) => {
      try {
        const room = verifyHost(pin, hostToken);
        roomManager.clearPretestData(pin);
        io.to(pin).emit('pretest_cleared', { success: true, pretestData: null });
        if (typeof ackCallback === 'function') ackCallback({ success: true });
      } catch (err) {
        console.error('[Socket Error] clear_pretest:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('host_spin_lucky_draw', ({ pin, hostToken, prizeName, winner, candidateNames, durationMs, drawStyle }, ackCallback) => {
      try {
        const room = verifyHost(pin, hostToken);
        if (!room) {
          throw new Error('ไม่พบห้องดังกล่าว');
        }

        // Auto-lock registration if not already locked
        room.isLuckyDrawLocked = true;
        io.to(pin).emit('luckydraw_lock_updated', { isLocked: true });

        const safePayload = {
          prizeName: (prizeName && String(prizeName).trim()) || 'รางวัลพิเศษ 🎉',
          winner: winner || null,
          candidateNames: Array.isArray(candidateNames) ? candidateNames : [],
          durationMs: (typeof durationMs === 'number' && durationMs > 0) ? durationMs : 4500,
          drawStyle: drawStyle === 'POOL' ? 'POOL' : 'WHEEL'
        };

        io.to(pin).emit('lucky_draw_spin', safePayload);

        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, payload: safePayload });
        }
      } catch (err) {
        console.error('[Socket Error] host_spin_lucky_draw:', err);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('host_toggle_luckydraw_lock', ({ pin, hostToken, isLocked }, ackCallback) => {
      try {
        const room = verifyHost(pin, hostToken);
        room.isLuckyDrawLocked = Boolean(isLocked);
        io.to(pin).emit('luckydraw_lock_updated', { isLocked: room.isLuckyDrawLocked });
        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, isLocked: room.isLuckyDrawLocked });
        }
      } catch (err) {
        console.error('[Socket Error] host_toggle_luckydraw_lock:', err);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('get_luckydraw_status', ({ pin }, ackCallback) => {
      try {
        const room = roomManager.getRoom(pin);
        const isLocked = Boolean(room?.isLuckyDrawLocked);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: true, isLocked });
        }
      } catch (e) {
        if (typeof ackCallback === 'function') ackCallback({ success: false, isLocked: false });
      }
    });

    socket.on('host_close_lucky_draw', ({ pin, hostToken }, ackCallback) => {
      try {
        verifyHost(pin, hostToken);
        io.to(pin).emit('lucky_draw_closed', { closedAt: Date.now() });
        if (typeof ackCallback === 'function') {
          ackCallback({ success: true });
        }
      } catch (err) {
        console.error('[Socket Error] host_close_lucky_draw:', err);
        if (typeof ackCallback === 'function') {
          ackCallback({ success: false, message: err.message });
        }
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('close_room', ({ pin, hostToken }) => {
      try {
        verifyHost(pin, hostToken);
        io.to(pin).emit('room_closed', { message: 'วิทยากรได้ปิดห้องหรือออกจากห้องแล้ว' });
        roomManager.deleteRoom(pin);
      } catch (err) {
        console.error('[Socket Error] close_room:', err);
      }
    });

    socket.on('leave_room', ({ pin, playerId }) => {
      try {
        if (!pin || !playerId) return;
        const result = roomManager.removePlayer(pin, playerId);
        if (typeof socket.leave === 'function') {
          socket.leave(pin);
        }

        if (result && result.room) {
          const playerList = roomManager.getPlayerList(pin);
          const counts = roomManager.getPlayerCounts(pin);

          io.to(pin).emit('room_updated', {
            players: playerList,
            counts
          });

          io.to(pin).emit('answered_count_update', {
            answeredCount: counts.answeredCount,
            totalPlayers: counts.totalPlayers
          });

          io.to(pin).emit('pulse_updated', {
            pulseVotes: result.room.pulseVotes,
            pulseAnsweredCount: counts.pulseAnsweredCount,
            totalPlayers: counts.totalPlayers
          });

          if (result.room.status === 'QUESTION' && counts.totalPlayers > 0 && counts.answeredCount >= counts.totalPlayers) {
            if (result.room.questionTimer) {
              clearTimeout(result.room.questionTimer);
              result.room.questionTimer = null;
            }
            const questionResult = roomManager.getQuestionResult(pin);
            io.to(pin).emit('question_result', questionResult);
          }
        }
      } catch (err) {
        console.error('[Socket Error] leave_room:', err);
      }
    });

    // --- PLAYER HANDLERS ---
    socket.on('get_roster', ({ pin }, ackCallback) => {
      try {
        if (!pin || !pin.trim()) {
          const res = { success: false, message: 'กรุณาระบุ PIN' };
          if (typeof ackCallback === 'function') ackCallback(res);
          return socket.emit('error_message', res);
        }
        const cleanPin = pin.trim();
        const room = roomManager.getRoom(cleanPin);
        if (!room) {
          const res = { success: false, message: 'ไม่พบห้องดังกล่าว' };
          if (typeof ackCallback === 'function') ackCallback(res);
          return;
        }

        const roster = roomManager.getRoster(cleanPin);
        const res = {
          success: true,
          pin: cleanPin,
          quizTitle: room.quizSet?.title || 'แบบทดสอบ KaoJai',
          quizMode: room.quizMode || 'NORMAL',
          hasPretest: Boolean(room.pretestData),
          roster: roster || []
        };
        if (typeof ackCallback === 'function') ackCallback(res);
        socket.emit('roster_data', res);
      } catch (err) {
        console.error('[Socket Error] get_roster:', err);
        const res = { success: false, message: err.message };
        if (typeof ackCallback === 'function') ackCallback(res);
      }
    });

    socket.on('join_room', ({ pin, name, avatar, playerId }, ackCallback) => {
      try {
        if (!pin || !pin.trim()) {
          const res = { success: false, message: 'กรุณากรอกรหัส PIN' };
          if (typeof ackCallback === 'function') ackCallback(res);
          return socket.emit('error_message', res);
        }

        const cleanPin = pin.trim();
        const joinData = roomManager.joinPlayer(cleanPin, socket.id, { name, avatar, playerId });
        
        // If player was already connected on an old socket (e.g. from previous tab/browser), disconnect the old socket
        if (joinData.previousSocketId && joinData.previousSocketId !== socket.id) {
          try {
            const oldSocket = (io.sockets && io.sockets.sockets && io.sockets.sockets.get)
              ? io.sockets.sockets.get(joinData.previousSocketId)
              : null;
            if (oldSocket) {
              if (typeof oldSocket.leave === 'function') oldSocket.leave(cleanPin);
              oldSocket.emit('session_replaced', { message: 'เซสชันของคุณได้เปิดใช้งานบนแท็บหรือหน้าต่างใหม่แล้ว' });
              if (typeof oldSocket.disconnect === 'function') oldSocket.disconnect(true);
            }
          } catch (cleanErr) {
            console.warn('[Socket Cleanup] Previous socket disconnect:', cleanErr.message);
          }
        }

        socket.join(cleanPin);

        const playerList = roomManager.getPlayerList(cleanPin);

        const successPayload = {
          success: true,
          pin: cleanPin,
          player: {
            playerId: joinData.player.playerId,
            name: joinData.player.name,
            avatar: joinData.player.avatar,
            score: joinData.player.score,
            teamId: joinData.player.teamId || null
          },
          mode: joinData.mode,
          status: joinData.status,
          currentQuestion: joinData.currentQuestion,
          questionResult: joinData.questionResult,
          pulseVotes: joinData.pulseVotes,
          pulseRound: joinData.room.pulseRound || 1,
          leaderboard: joinData.leaderboard,
          isReconnect: joinData.isReconnect,
          counts: joinData.counts,
          quizMode: joinData.quizMode || 'NORMAL',
          teamsEnabled: joinData.room.teamsEnabled,
          teams: roomManager.getTeamList(cleanPin),
          isLuckyDrawLocked: Boolean(joinData.room.isLuckyDrawLocked)
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
        console.log(`[Socket Info] join_room failed: ${err.message}`);
        const res = { success: false, message: err.message };
        if (typeof ackCallback === 'function') ackCallback(res);
        socket.emit('error_message', res);
      }
    });

    socket.on('submit_answer', ({ pin, playerId, optionId, orderedItemIds, questionId }) => {
      try {
        const roomBefore = roomManager.getRoom(pin);
        const currentQ = roomBefore?.quizSet?.questions[roomBefore?.currentQuestionIndex];
        console.log('[DEBUG Server submit_answer RECEIVED]', {
          pin,
          playerId,
          optionId,
          orderedItemIds,
          submittedQuestionId: questionId,
          currentQuestionId: currentQ?.id,
          currentQuestionIndex: roomBefore?.currentQuestionIndex,
          roomQuizMode: roomBefore?.quizMode,
          roomStatus: roomBefore?.status
        });

        const answerPayload = orderedItemIds ? { orderedItemIds, questionId } : { optionId, questionId };
        const result = roomManager.submitAnswer(pin, playerId, answerPayload);

        console.log('[DEBUG Server submit_answer RESULT]', {
          alreadyAnswered: result.alreadyAnswered,
          staleQuestion: result.staleQuestion,
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned,
          allAnswered: result.allAnswered,
          answeredCount: result.answeredCount,
          totalPlayers: result.totalPlayers
        });

        const room = roomManager.getRoom(pin);
        const isPretest = room?.quizMode === 'PRETEST';

        // In PRETEST mode: hide isCorrect so learners can't see right/wrong feedback
        socket.emit('answer_feedback', {
          isCorrect: isPretest ? null : result.isCorrect,
          pointsEarned: isPretest ? 0 : result.pointsEarned,
          basePoints: isPretest ? 0 : result.basePoints,
          streak: isPretest ? 0 : result.streak,
          highestStreak: isPretest ? 0 : result.highestStreak,
          streakBonus: isPretest ? 0 : result.streakBonus,
          comebackBonus: isPretest ? 0 : result.comebackBonus,
          isComeback: isPretest ? false : result.isComeback,
          totalScore: isPretest ? 0 : result.totalScore,
          alreadyAnswered: result.alreadyAnswered,
          details: result.details,
          isPretest
        });

        io.to(pin).emit('answered_count_update', {
          answeredCount: result.answeredCount,
          totalPlayers: result.totalPlayers
        });

        if (result.allAnswered) {
          if (room && room.questionTimer) {
            clearTimeout(room.questionTimer);
            room.questionTimer = null;
          }
          const questionResult = roomManager.getQuestionResult(pin);
          if (isPretest) {
            io.to(pin).emit('question_result', maskPretestResult(questionResult));
          } else {
            io.to(pin).emit('question_result', questionResult);
          }
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

    socket.on('send_pulse_reaction', ({ pin, emoji, playerId }) => {
      try {
        if (!pin || !emoji) return;
        io.to(pin).emit('pulse_reaction_received', {
          emoji,
          playerId,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        });
      } catch (err) {
        console.error('[Socket Error] send_pulse_reaction:', err);
      }
    });

    // ─── TEAM HANDLERS (Host) ────────────────────────────────────────────────

    socket.on('toggle_teams', ({ pin, enabled }, ackCallback) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return;
        const teamsEnabled = roomManager.setTeamsEnabled(pin, enabled);
        const teams = roomManager.getTeamList(pin);
        const playerList = roomManager.getPlayerList(pin);
        io.to(pin).emit('teams_toggled', { teamsEnabled, teams, players: playerList });
        if (typeof ackCallback === 'function') ackCallback({ success: true, teamsEnabled });
      } catch (err) {
        console.error('[Socket Error] toggle_teams:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    socket.on('create_team', ({ pin, name, color }, ackCallback) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return;
        const team = roomManager.createTeam(pin, { name, color });
        const teams = roomManager.getTeamList(pin);
        const playerList = roomManager.getPlayerList(pin);
        io.to(pin).emit('teams_updated', { teams, players: playerList });
        if (typeof ackCallback === 'function') ackCallback({ success: true, team });
      } catch (err) {
        console.error('[Socket Error] create_team:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    socket.on('remove_team', ({ pin, teamId }, ackCallback) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return;
        roomManager.removeTeam(pin, teamId);
        const teams = roomManager.getTeamList(pin);
        const playerList = roomManager.getPlayerList(pin);
        io.to(pin).emit('teams_updated', { teams, players: playerList });
        if (typeof ackCallback === 'function') ackCallback({ success: true });
      } catch (err) {
        console.error('[Socket Error] remove_team:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    socket.on('assign_team', ({ pin, playerId, teamId }, ackCallback) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return;
        roomManager.assignPlayerToTeam(pin, playerId, teamId);
        const teams = roomManager.getTeamList(pin);
        const playerList = roomManager.getPlayerList(pin);
        io.to(pin).emit('teams_updated', { teams, players: playerList });
        if (typeof ackCallback === 'function') ackCallback({ success: true });
      } catch (err) {
        console.error('[Socket Error] assign_team:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    socket.on('auto_assign_teams', ({ pin, teamCount }, ackCallback) => {
      try {
        const room = roomManager.getRoom(pin);
        if (!room) return;
        const teams = roomManager.autoAssignTeams(pin, teamCount || 2);
        const playerList = roomManager.getPlayerList(pin);
        io.to(pin).emit('teams_updated', { teams, players: playerList });
        if (typeof ackCallback === 'function') ackCallback({ success: true, teams });
      } catch (err) {
        console.error('[Socket Error] auto_assign_teams:', err);
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    socket.on('get_teams', ({ pin }, ackCallback) => {
      try {
        const teams = roomManager.getTeamList(pin);
        if (typeof ackCallback === 'function') ackCallback({ success: true, teams });
      } catch (err) {
        if (typeof ackCallback === 'function') ackCallback({ success: false, message: err.message });
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] ID: ${socket.id}`);
      const info = roomManager.handleDisconnect(socket.id, undefined, (expiredRoom, expiredPlayerId) => {
        try {
          const counts = roomManager.getPlayerCounts(expiredRoom.pin);
          const playerList = roomManager.getPlayerList(expiredRoom.pin);
          io.to(expiredRoom.pin).emit('room_updated', {
            players: playerList,
            counts
          });
          io.to(expiredRoom.pin).emit('answered_count_update', {
            answeredCount: counts.answeredCount,
            totalPlayers: counts.totalPlayers
          });
          io.to(expiredRoom.pin).emit('pulse_updated', {
            pulseVotes: expiredRoom.pulseVotes,
            pulseAnsweredCount: counts.pulseAnsweredCount,
            totalPlayers: counts.totalPlayers
          });
        } catch (e) {
          console.error('[Socket Cleanup Error]:', e);
        }
      });

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

        // If in QUESTION phase and all remaining connected players have answered, close question immediately
        if (info.room.status === 'QUESTION' && counts.totalPlayers > 0 && counts.answeredCount >= counts.totalPlayers) {
          if (info.room.questionTimer) {
            clearTimeout(info.room.questionTimer);
            info.room.questionTimer = null;
          }
          const questionResult = roomManager.getQuestionResult(info.room.pin);
          if (info.room.quizMode === 'PRETEST') {
            io.to(info.room.pin).emit('question_result', maskPretestResult(questionResult));
          } else {
            io.to(info.room.pin).emit('question_result', questionResult);
          }
        }
      }
    });
  });
};

module.exports.maskPretestResult = maskPretestResult;
