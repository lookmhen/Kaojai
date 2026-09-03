process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const setupSocketHandlers = require('../src/socketHandler');
const roomManager = require('../src/roomManager');

// Helper to create mock io and socket
function createMockSocketEnvironment() {
  const rooms = new Map(); // roomPin -> Set of socket instances
  const broadcasts = []; // captured broadcasts: { room, event, payload }

  let connectionListener = null;

  const mockIo = {
    on(event, handler) {
      if (event === 'connection') {
        connectionListener = handler;
      }
    },
    to(roomPin) {
      return {
        emit(event, payload) {
          broadcasts.push({ roomPin, event, payload });
          const roomSockets = rooms.get(roomPin) || new Set();
          for (const socket of roomSockets) {
            socket.emit(event, payload);
          }
        }
      };
    },
    connectSocket(socketId) {
      const socket = createMockSocket(socketId, rooms);
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

  // Test 7: submit_pulse handler (Player)
  console.log('  Testing submit_pulse event...');
  await player1Socket.fire('submit_pulse', { pin: roomPin, playerId: p1Ack.player.playerId, choice: 'green' });

  const pulseAck = player1Socket.getLastEmitted('pulse_ack');
  assert.ok(pulseAck);
  assert.strictEqual(pulseAck.choice, 'green');
  assert.strictEqual(pulseAck.success, true);

  const pulseUpdated = broadcasts.find(b => b.roomPin === roomPin && b.event === 'pulse_updated');
  assert.ok(pulseUpdated, 'pulse_updated broadcast should be emitted');
  assert.deepStrictEqual(pulseUpdated.payload.pulseVotes, { green: 1, yellow: 0, red: 0 });
  console.log('    ✓ submit_pulse passed');

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

  console.log('✅ socketHandler tests passed cleanly!');
}

module.exports = { testSocketHandlers };

if (require.main === module) {
  testSocketHandlers().catch(err => {
    console.error('❌ socketHandler test failed:', err);
    process.exit(1);
  });
}
