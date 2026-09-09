process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const setupSocketHandlers = require('../src/socketHandler');
const roomManager = require('../src/roomManager');

// Helper to create mock io and socket
function createMockSocketEnvironment() {
  const rooms = new Map(); // roomPin -> Set of socket instances
  const allSockets = new Map(); // socketId -> socket
  const broadcasts = []; // captured broadcasts: { room, event, payload }

  let connectionListener = null;

  const mockIo = {
    on(event, handler) {
      if (event === 'connection') {
        connectionListener = handler;
      }
    },
    to(target) {
      return {
        emit(event, payload) {
          broadcasts.push({ roomPin: target, event, payload });
          const roomSockets = rooms.get(target) || new Set();
          for (const socket of roomSockets) {
            socket.emit(event, payload);
          }
          const directSocket = allSockets.get(target);
          if (directSocket) {
            directSocket.emit(event, payload);
          }
        }
      };
    },
    connectSocket(socketId) {
      const socket = createMockSocket(socketId, rooms);
      allSockets.set(socketId, socket);
      if (connectionListener) {
        connectionListener(socket);
      }
      return socket;
    }
  };

  function createMockSocket(id, roomMap) {
    const listeners = new Map();
    const emitted = [];
    const joinedRooms = new Set();

    const socket = {
      id,
      joinedRooms,
      emitted,
      listeners,
      on(event, handler) {
        listeners.set(event, handler);
      },
      emit(event, payload) {
        emitted.push({ event, payload });
      },
      join(roomPin) {
        joinedRooms.add(roomPin);
        if (!roomMap.has(roomPin)) {
          roomMap.set(roomPin, new Set());
        }
        roomMap.get(roomPin).add(socket);
      },
      leave(roomPin) {
        joinedRooms.delete(roomPin);
        if (roomMap.has(roomPin)) {
          roomMap.get(roomPin).delete(socket);
        }
      },
      // Trigger a socket event asynchronously or synchronously
      async fire(event, data, ackCallback) {
        const handler = listeners.get(event);
        if (!handler) {
          throw new Error(`No handler registered for event: ${event}`);
        }
        return handler(data, ackCallback);
      },
      getEmitted(event) {
        return emitted.filter(e => e.event === event).map(e => e.payload);
      },
      getLastEmitted(event) {
        const list = socket.getEmitted(event);
        return list.length > 0 ? list[list.length - 1] : undefined;
      }
    };

    return socket;
  }

  return { mockIo, broadcasts };
}

async function testSocketHandlers() {
  console.log('--- Testing socketHandler.js ---');

  // Clear roomManager internal state before running tests
  roomManager.rooms.clear();

  const { mockIo, broadcasts } = createMockSocketEnvironment();
  setupSocketHandlers(mockIo);

  // Test 1: create_room handler (Host)
  console.log('  Testing create_room event...');
  const hostSocket = mockIo.connectSocket('host-socket-1');

  let createAckResponse = null;
  await hostSocket.fire('create_room', null, (res) => {
    createAckResponse = res;
  });

  assert.ok(createAckResponse, 'create_room ACK callback should be called');
  assert.strictEqual(createAckResponse.success, true);
  assert.ok(createAckResponse.pin, 'PIN should be returned in ACK');
  const roomPin = createAckResponse.pin;

  const roomCreatedEmit = hostSocket.getLastEmitted('room_created');
  assert.ok(roomCreatedEmit);
  assert.strictEqual(roomCreatedEmit.pin, roomPin);
  assert.ok(hostSocket.joinedRooms.has(roomPin), 'Host should join socket room');
  console.log('    ✓ create_room passed');

  // Test 2: join_room validation failure
  console.log('  Testing join_room error handling...');
  const player1Socket = mockIo.connectSocket('player-socket-1');

  let errorAck = null;
  await player1Socket.fire('join_room', { pin: '', name: 'Test' }, (res) => {
    errorAck = res;
  });
  assert.strictEqual(errorAck.success, false);
  assert.strictEqual(errorAck.message, 'กรุณากรอกรหัส PIN');
  console.log('    ✓ join_room validation passed');

  // Test 3: join_room success (Player 1)
  console.log('  Testing join_room success...');
  let p1Ack = null;
  await player1Socket.fire('join_room', { pin: roomPin, name: 'Alice', avatar: 'avatar1.png' }, (res) => {
    p1Ack = res;
  });

  assert.strictEqual(p1Ack.success, true);
  assert.strictEqual(p1Ack.player.name, 'Alice');
  assert.strictEqual(p1Ack.player.avatar, 'avatar1.png');
  assert.strictEqual(p1Ack.isReconnect, false);

  const p1SuccessEmit = player1Socket.getLastEmitted('join_success');
  assert.ok(p1SuccessEmit);
  assert.strictEqual(p1SuccessEmit.pin, roomPin);

  // Check room_updated broadcast to room
  const roomUpdates = broadcasts.filter(b => b.roomPin === roomPin && b.event === 'room_updated');
  assert.ok(roomUpdates.length > 0, 'room_updated broadcast should be sent');
  console.log('    ✓ join_room success passed');

  // Test 4: start_quiz handler with 5-second countdown (Host)
  console.log('  Testing start_quiz event with 5s countdown (question_prepare)...');
  await hostSocket.fire('start_quiz', { pin: roomPin });

  // 1. Verify question_prepare event
  const qPrepareBroadcast = broadcasts.find(b => b.roomPin === roomPin && b.event === 'question_prepare');
  assert.ok(qPrepareBroadcast, 'question_prepare broadcast should be emitted for countdown');
  assert.strictEqual(qPrepareBroadcast.payload.countdownSeconds, 5, 'Should count down from 5s');
  assert.strictEqual(qPrepareBroadcast.payload.nextQuestionIndex, 0);

  // 2. Wait 35ms for test countdown timeout to trigger question_start
  await new Promise(r => setTimeout(r, 35));

  const qStartBroadcast = broadcasts.find(b => b.roomPin === roomPin && b.event === 'question_start');
  assert.ok(qStartBroadcast, 'question_start broadcast should be emitted after countdown');
  assert.strictEqual(qStartBroadcast.payload.currentQuestionIndex, 0);
  assert.ok(qStartBroadcast.payload.question, 'Question details included');
  assert.strictEqual(qStartBroadcast.payload.question.options[0].isCorrect, undefined, 'Correct answers not leaked');
  console.log('    ✓ start_quiz and 5s countdown passed');

  // Test 5: submit_answer handler & vertical bar chart stats (Player)
  console.log('  Testing submit_answer and vertical bar chart optionCounts...');
  const room = roomManager.getRoom(roomPin);
  const correctOptId = room.quizSet.questions[0].options.find(o => o.isCorrect).id;

  await player1Socket.fire('submit_answer', { pin: roomPin, playerId: p1Ack.player.playerId, optionId: correctOptId });

  const feedback = player1Socket.getLastEmitted('answer_feedback');
  assert.ok(feedback, 'answer_feedback should be emitted to player');
  assert.strictEqual(feedback.isCorrect, true);
  assert.ok(feedback.pointsEarned > 0);

  // Verify optionCounts for vertical bar chart
  const qResult = roomManager.getQuestionResult(roomPin);
  assert.ok(qResult, 'Question result should be available');
  assert.strictEqual(qResult.optionCounts[correctOptId], 1, 'Vertical bar chart count for chosen option should be 1');
  assert.strictEqual(qResult.correctOptionId, correctOptId, 'Correct option identified for bar chart indicator');

  const ansCountUpdate = broadcasts.find(b => b.roomPin === roomPin && b.event === 'answered_count_update');
  assert.ok(ansCountUpdate, 'answered_count_update broadcast should be emitted');
  assert.strictEqual(ansCountUpdate.payload.answeredCount, 1);
  console.log('    ✓ submit_answer and bar chart optionCounts passed');

  // Test 6: switch_mode handler (Host)
  console.log('  Testing switch_mode event...');
  await hostSocket.fire('switch_mode', { pin: roomPin, mode: 'PULSE' });

  const modeSwitched = broadcasts.find(b => b.roomPin === roomPin && b.event === 'mode_switched');
  assert.ok(modeSwitched, 'mode_switched broadcast should be emitted');
  assert.strictEqual(modeSwitched.payload.mode, 'PULSE');
  console.log('    ✓ switch_mode passed');

  // Test 7: send_pulse_nudge & submit_pulse handler (Player)
  console.log('  Testing send_pulse_nudge targeting unvoted players...');
  // 1. Player 1 has NOT voted yet -> Should receive nudge
  await hostSocket.fire('send_pulse_nudge', { pin: roomPin });
  const initialNudge = player1Socket.getLastEmitted('pulse_nudge_alert');
  assert.ok(initialNudge, 'Unvoted player should receive pulse_nudge_alert');

  // 2. Player 1 submits vote
  console.log('  Testing submit_pulse event...');
  await player1Socket.fire('submit_pulse', { pin: roomPin, playerId: p1Ack.player.playerId, choice: 'green' });

  const pulseAck = player1Socket.getLastEmitted('pulse_ack');
  assert.ok(pulseAck);
  assert.strictEqual(pulseAck.choice, 'green');
  assert.strictEqual(pulseAck.success, true);

  const pulseUpdated = broadcasts.find(b => b.roomPin === roomPin && b.event === 'pulse_updated');
  assert.ok(pulseUpdated, 'pulse_updated broadcast should be emitted');
  assert.deepStrictEqual(pulseUpdated.payload.pulseVotes, { green: 1, yellow: 0, red: 0 });

  // 3. Clear player1 emitted list to verify re-nudge
  player1Socket.emitted.length = 0;
  // Host nudges again -> Player 1 has ALREADY voted -> Should NOT receive nudge!
  await hostSocket.fire('send_pulse_nudge', { pin: roomPin });
  const postVoteNudge = player1Socket.getLastEmitted('pulse_nudge_alert');
  assert.strictEqual(postVoteNudge, undefined, 'Already voted player should NOT receive pulse_nudge_alert');

  // Test 7b: send_pulse_reaction handler
  console.log('  Testing send_pulse_reaction event...');
  const testP1Id = p1Ack.player.playerId;
  await player1Socket.fire('send_pulse_reaction', { pin: roomPin, emoji: '🔥', playerId: testP1Id });
  const reactionBroadcast = broadcasts.find(b => b.roomPin === roomPin && b.event === 'pulse_reaction_received');
  assert.ok(reactionBroadcast, 'pulse_reaction_received broadcast should be emitted');
  assert.strictEqual(reactionBroadcast.payload.emoji, '🔥');
  assert.strictEqual(reactionBroadcast.payload.playerId, testP1Id);
  console.log('    ✓ submit_pulse & send_pulse_reaction passed');

  // Test 8: show_leaderboard handler (Host)
  console.log('  Testing show_leaderboard event...');
  await hostSocket.fire('show_leaderboard', { pin: roomPin });

  const lbBroadcast = broadcasts.find(b => b.roomPin === roomPin && b.event === 'show_leaderboard');
  assert.ok(lbBroadcast, 'show_leaderboard broadcast should be emitted');
  assert.ok(Array.isArray(lbBroadcast.payload.leaderboard));
  console.log('    ✓ show_leaderboard passed');

  // Test 9: disconnect handler
  console.log('  Testing disconnect handler...');
  const initialUpdatesCount = broadcasts.filter(b => b.event === 'room_updated').length;
  await player1Socket.fire('disconnect');

  const afterUpdatesCount = broadcasts.filter(b => b.event === 'room_updated').length;
  assert.strictEqual(afterUpdatesCount, initialUpdatesCount + 1, 'room_updated broadcast on disconnect');
  console.log('    ✓ disconnect handler passed');

  // Test 10: Sequence Race submit_answer handler with orderedItemIds
  console.log('  Testing Sequence Race submit_answer with orderedItemIds...');
  const seqHostSocket = mockIo.connectSocket('host-seq-sock');
  let seqRoomPin = null;
  await seqHostSocket.fire('create_room', null, (res) => {
    seqRoomPin = res.pin;
  });

  const seqPlayerSocket = mockIo.connectSocket('player-seq-sock');
  let seqPlayerId = null;
  await seqPlayerSocket.fire('join_room', { pin: seqRoomPin, name: 'SeqRacer', avatar: '/avatars/avatar-1.svg' }, (res) => {
    seqPlayerId = res.player.playerId;
  });

  // Start question index 2 (which is the SEQUENCE question in quiz-1)
  roomManager.startQuestion(seqRoomPin, 2);
  const correctSeqIds = ['seq1', 'seq2', 'seq3', 'seq4', 'seq5'];

  await seqPlayerSocket.fire('submit_answer', {
    pin: seqRoomPin,
    playerId: seqPlayerId,
    orderedItemIds: correctSeqIds
  });

  const seqFeedback = seqPlayerSocket.getLastEmitted('answer_feedback');
  assert.ok(seqFeedback, 'answer_feedback should be emitted for sequence answer');
  assert.strictEqual(seqFeedback.isCorrect, true);
  assert.strictEqual(seqFeedback.details.questionType, 'SEQUENCE');
  assert.strictEqual(seqFeedback.details.isPerfect, true);
  assert.strictEqual(seqFeedback.details.correctPositions, 5);
  assert.ok(seqFeedback.pointsEarned > 0);
  console.log('    ✓ Sequence Race submit_answer passed');

  // Test 11: leave_room event
  console.log('  Testing leave_room event...');
  await seqPlayerSocket.fire('leave_room', { pin: seqRoomPin, playerId: seqPlayerId });
  assert.strictEqual(roomManager.getPlayerCounts(seqRoomPin).totalPlayers, 0, 'Player removed from room on leave_room');
  console.log('    ✓ leave_room passed');

  // Test 12: close_room event
  console.log('  Testing close_room event...');
  const roomCloseBroadCastCount = broadcasts.filter(b => b.event === 'room_closed').length;
  await seqHostSocket.fire('close_room', { pin: seqRoomPin, hostToken: seqHostSocket.getLastEmitted('room_created')?.hostToken });
  assert.strictEqual(roomManager.getRoom(seqRoomPin), undefined, 'Room deleted on close_room');
  assert.strictEqual(broadcasts.filter(b => b.event === 'room_closed').length, roomCloseBroadCastCount + 1, 'room_closed broadcast to room');
  console.log('    ✓ close_room passed');

  // Test 13: Final question show_leaderboard emits quiz_ended
  console.log('  Testing final question show_leaderboard emitting quiz_ended...');
  const finalHostSocket = mockIo.connectSocket('host-final-sock');
  let finalPin = null;
  let finalToken = null;
  await finalHostSocket.fire('create_room', null, (res) => {
    finalPin = res.pin;
    finalToken = res.hostToken;
  });

  const finalPlayerSocket = mockIo.connectSocket('player-final-sock');
  let finalPlayerId = null;
  await finalPlayerSocket.fire('join_room', { pin: finalPin, name: 'LastRunner' }, (res) => {
    finalPlayerId = res.player.playerId;
  });

  const finalRoom = roomManager.getRoom(finalPin);
  const lastIndex = finalRoom.quizSet.questions.length - 1;
  roomManager.startQuestion(finalPin, lastIndex);

  // Submit answer for last question
  const lastQ = finalRoom.quizSet.questions[lastIndex];
  const lastOpt = lastQ.options ? lastQ.options[0].id : null;
  if (lastOpt) {
    await finalPlayerSocket.fire('submit_answer', { pin: finalPin, playerId: finalPlayerId, optionId: lastOpt });
  }

  // Host shows leaderboard on final question -> should emit quiz_ended
  await finalHostSocket.fire('show_leaderboard', { pin: finalPin, hostToken: finalToken });
  const quizEndedBroadcast = broadcasts.find(b => b.roomPin === finalPin && b.event === 'quiz_ended');
  assert.ok(quizEndedBroadcast, 'quiz_ended broadcast must be emitted on final question');
  assert.strictEqual(quizEndedBroadcast.payload.isEnded, true);
  assert.strictEqual(quizEndedBroadcast.payload.status, 'ENDED');
  assert.ok(Array.isArray(quizEndedBroadcast.payload.leaderboard));
  assert.ok(quizEndedBroadcast.payload.quizAnalytics);
  console.log('    ✓ final question show_leaderboard emitting quiz_ended passed');

  // Test 14: Disconnect during QUESTION phase triggers immediate question_result
  console.log('  Testing disconnect during QUESTION phase triggering immediate question_result...');
  const dcHostSocket = mockIo.connectSocket('host-dc-sock');
  let dcPin = null;
  let dcToken = null;
  await dcHostSocket.fire('create_room', null, (res) => {
    dcPin = res.pin;
    dcToken = res.hostToken;
  });

  const dcPlayer1 = mockIo.connectSocket('player-dc-1');
  let dcP1Id = null;
  await dcPlayer1.fire('join_room', { pin: dcPin, name: 'P1-Fast' }, (res) => {
    dcP1Id = res.player.playerId;
  });

  const dcPlayer2 = mockIo.connectSocket('player-dc-2');
  let dcP2Id = null;
  await dcPlayer2.fire('join_room', { pin: dcPin, name: 'P2-Quitter' }, (res) => {
    dcP2Id = res.player.playerId;
  });

  roomManager.startQuestion(dcPin, 0);
  const dcRoom = roomManager.getRoom(dcPin);
  const dcCorrectOptId = dcRoom.quizSet.questions[0].options.find(o => o.isCorrect).id;

  // P1 submits answer
  await dcPlayer1.fire('submit_answer', { pin: dcPin, playerId: dcP1Id, optionId: dcCorrectOptId });

  // P2 disconnects instead of submitting
  const beforeQResultCount = broadcasts.filter(b => b.roomPin === dcPin && b.event === 'question_result').length;
  await dcPlayer2.fire('disconnect');

  // Immediate question_result should be fired because all remaining connected players (1 of 1) answered!
  const afterQResultCount = broadcasts.filter(b => b.roomPin === dcPin && b.event === 'question_result').length;
  assert.strictEqual(afterQResultCount, beforeQResultCount + 1, 'question_result should trigger immediately upon disconnect of remaining unanswered players');
  console.log('    ✓ disconnect during QUESTION triggering immediate question_result passed');

  // Test 15: Team Socket Events (toggle_teams, create_team, assign_team, auto_assign_teams, remove_team)
  console.log('  Testing team socket events...');
  const teamHostSocket = mockIo.connectSocket('host-tm-sock');
  let teamPin = null;
  let teamToken = null;
  await teamHostSocket.fire('create_room', null, (res) => {
    teamPin = res.pin;
    teamToken = res.hostToken;
  });

  const pTeam1 = mockIo.connectSocket('p-tm-1');
  let p1TeamId = null;
  await pTeam1.fire('join_room', { pin: teamPin, name: 'TeamMember1' }, (res) => {
    p1TeamId = res.player.playerId;
  });

  // toggle_teams
  await teamHostSocket.fire('toggle_teams', { pin: teamPin, enabled: true }, (res) => {
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.teamsEnabled, true);
  });
  const toggleBroadcast = broadcasts.find(b => b.roomPin === teamPin && b.event === 'teams_toggled');
  assert.ok(toggleBroadcast);
  assert.strictEqual(toggleBroadcast.payload.teamsEnabled, true);

  // create_team
  let createdTeamId = null;
  await teamHostSocket.fire('create_team', { pin: teamPin, name: 'Falcon Squad', color: '#10B981' }, (res) => {
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.team.name, 'Falcon Squad');
    createdTeamId = res.team.id;
  });
  const createBroadcast = broadcasts.filter(b => b.roomPin === teamPin && b.event === 'teams_updated');
  assert.ok(createBroadcast.length > 0);

  // assign_team
  await teamHostSocket.fire('assign_team', { pin: teamPin, playerId: p1TeamId, teamId: createdTeamId }, (res) => {
    assert.strictEqual(res.success, true);
  });

  // auto_assign_teams
  await teamHostSocket.fire('auto_assign_teams', { pin: teamPin, teamCount: 2 }, (res) => {
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.teams));
  });

  // remove_team
  await teamHostSocket.fire('remove_team', { pin: teamPin, teamId: createdTeamId }, (res) => {
    assert.strictEqual(res.success, true);
  });
  console.log('    ✓ team socket events passed');

  // Test 16: Host Reconnect (reconnect_host)
  console.log('  Testing reconnect_host event...');
  const newHostSocket = mockIo.connectSocket('new-host-sock');
  
  // Valid token
  let reconnectedSnapshot = null;
  await newHostSocket.fire('reconnect_host', { pin: teamPin, hostToken: teamToken }, (res) => {
    reconnectedSnapshot = res;
  });
  assert.ok(reconnectedSnapshot);
  assert.strictEqual(reconnectedSnapshot.success, true);
  assert.strictEqual(reconnectedSnapshot.pin, teamPin);

  // Invalid token
  let failedReconnect = null;
  await newHostSocket.fire('reconnect_host', { pin: teamPin, hostToken: 'wrong-token' }, (res) => {
    failedReconnect = res;
  });
  assert.strictEqual(failedReconnect.success, false);
  console.log('    ✓ reconnect_host passed');

  // Test 17: reset_to_lobby event
  console.log('  Testing reset_to_lobby event...');
  await newHostSocket.fire('reset_to_lobby', { pin: teamPin, hostToken: teamToken });
  const resetBroadcast = broadcasts.find(b => b.roomPin === teamPin && b.event === 'room_reset_to_lobby');
  assert.ok(resetBroadcast, 'room_reset_to_lobby must be emitted');
  assert.strictEqual(resetBroadcast.payload.status, 'LOBBY');
  console.log('    ✓ reset_to_lobby passed');

  console.log('✅ socketHandler tests passed cleanly!');
}

module.exports = { testSocketHandlers };

if (require.main === module) {
  testSocketHandlers().catch(err => {
    console.error('❌ socketHandler test failed:', err);
    process.exit(1);
  });
}
