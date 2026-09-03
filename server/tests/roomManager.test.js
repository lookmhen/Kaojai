const assert = require('node:assert/strict');
const { RoomManager } = require('../src/roomManager');

async function testRoomManager() {
  console.log('--- Testing RoomManager ---');

  // Test 1: PIN Generation & Uniqueness
  {
    console.log('  Testing PIN Generation...');
    const rm = new RoomManager();
    const pin1 = rm.generatePin();
    assert.match(pin1, /^\d{6}$/, 'PIN should be 6 digits');
    
    // Simulate occupied PIN to test loop collision handling
    rm.rooms.set('123456', { pin: '123456' });
    const pin2 = rm.generatePin();
    assert.notStrictEqual(pin2, '123456', 'Generated PIN should not collide with existing room PIN');
    console.log('    ✓ PIN generation passed');
  }

  // Test 2: Room Creation
  {
    console.log('  Testing Room Creation...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-socket-1');
    assert.ok(room.pin, 'Room should have a PIN');
    assert.strictEqual(room.hostSocketId, 'host-socket-1');
    assert.strictEqual(room.mode, 'QUIZ');
    assert.strictEqual(room.status, 'LOBBY');
    assert.strictEqual(room.currentQuestionIndex, -1);
    assert.deepStrictEqual(room.pulseVotes, { green: 0, yellow: 0, red: 0 });

    const retrieved = rm.getRoom(room.pin);
    assert.strictEqual(retrieved, room, 'getRoom should return the created room');

    const byHost = rm.getRoomByHostSocketId('host-socket-1');
    assert.strictEqual(byHost, room, 'getRoomByHostSocketId should return the room');

    assert.strictEqual(rm.getRoomByHostSocketId('non-existent-host'), null);
    console.log('    ✓ Room creation passed');
  }

  // Test 3: Custom Quiz Set in Room Creation
  {
    console.log('  Testing Room Creation with Custom Quiz Set...');
    const rm = new RoomManager();
    const customQuiz = {
      id: 'custom-1',
      title: 'Custom Test Quiz',
      questions: [
        {
          id: 'cq1',
          questionText: 'Custom Question 1',
          timeLimitSeconds: 15,
          options: [
            { id: 'copt1', text: 'Option A', isCorrect: true },
            { id: 'copt2', text: 'Option B', isCorrect: false }
          ]
        }
      ]
    };
    const room = rm.createRoom('host-socket-2', customQuiz);
    assert.strictEqual(room.quizSet.id, 'custom-1');
    assert.strictEqual(room.quizSet.questions.length, 1);
    console.log('    ✓ Custom quiz set passed');
  }

  // Test 4: Player Joining, Nickname Trimming, Avatar Handling
  {
    console.log('  Testing Player Joining, Nickname Trimming, and Avatar Handling...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');

    // Invalid PIN throws
    assert.throws(() => {
      rm.joinPlayer('999999', 'socket-p1', { name: 'Player 1' });
    }, /ไม่พบห้องดังกล่าว/);

    // Trimming leading/trailing whitespace
    const res1 = rm.joinPlayer(room.pin, 's1', { name: '  John Doe  ', avatar: 'avatar1.png' });
    assert.strictEqual(res1.player.name, 'John Doe', 'Name should be trimmed');
    assert.strictEqual(res1.player.avatar, 'avatar1.png', 'Avatar should match provided value');
    assert.strictEqual(res1.isReconnect, false);

    // Falsy name defaults to Anonymous
    const res2 = rm.joinPlayer(room.pin, 's2', { name: '', avatar: '' });
    assert.strictEqual(res2.player.name, 'Anonymous', 'Empty name should default to Anonymous');
    assert.strictEqual(res2.player.avatar, '0291dcc0ce.svg', 'Empty avatar should default to default svg');

    // Long name truncation (>30 chars)
    const longName = 'A'.repeat(50);
    const res3 = rm.joinPlayer(room.pin, 's3', { name: longName });
    assert.strictEqual(res3.player.name.length, 30, 'Name should be capped at 30 characters');
    assert.strictEqual(res3.player.name, 'A'.repeat(30));

    console.log('    ✓ Player joining, trimming, and avatar handling passed');
  }

  // Test 5: Reconnection & Disconnect Grace Period
  {
    console.log('  Testing Reconnection & Disconnect Grace Period...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');

    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Alice', playerId: 'p1_id' });
    assert.strictEqual(p1.isReconnect, false);

    // Reconnection via same playerId
    const reconnect1 = rm.joinPlayer(room.pin, 's1_new', { name: 'Alice', playerId: 'p1_id' });
    assert.strictEqual(reconnect1.isReconnect, true);
    assert.strictEqual(reconnect1.player.socketId, 's1_new');
    assert.strictEqual(reconnect1.player.isConnected, true);

    // Reconnection via case-insensitive name match when client token lost
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Bob Builder' });
    assert.strictEqual(p2.isReconnect, false);

    const reconnect2 = rm.joinPlayer(room.pin, 's2_new', { name: 'bob builder' }); // lower case
    assert.strictEqual(reconnect2.isReconnect, true);
    assert.strictEqual(reconnect2.player.playerId, p2.player.playerId);
    assert.strictEqual(reconnect2.player.socketId, 's2_new');

    // Handle Disconnect & Grace Period expiry
    const dcResult = rm.handleDisconnect('s2_new', 100); // 100ms grace period for quick test
    assert.ok(dcResult, 'Disconnect info returned');
    assert.strictEqual(dcResult.player.isConnected, false);
    assert.ok(dcResult.player.disconnectTimeout !== null);

    // Wait for grace period timeout to trigger
    await new Promise(r => setTimeout(r, 150));
    assert.strictEqual(room.players.has(p2.player.playerId), false, 'Player should be deleted after grace period');

    // Non-existent socket disconnect returns null
    const nullDc = rm.handleDisconnect('unknown_socket');
    assert.strictEqual(nullDc, null);

    // Test canceling disconnect timeout on reconnection before expiry
    const p3 = rm.joinPlayer(room.pin, 's3', { name: 'Charlie', playerId: 'p3_id' });
    rm.handleDisconnect('s3', 5000); // long grace period
    assert.strictEqual(p3.player.isConnected, false);
    assert.ok(p3.player.disconnectTimeout !== null);

    const reconnect3 = rm.joinPlayer(room.pin, 's3_new', { name: 'Charlie', playerId: 'p3_id' });
    assert.strictEqual(reconnect3.isReconnect, true);
    assert.strictEqual(reconnect3.player.isConnected, true);
    assert.strictEqual(reconnect3.player.disconnectTimeout, null, 'disconnectTimeout should be cleared');

    // Host Reconnection test
    const hostRec = rm.reconnectHost(room.pin, 'host-new-socket');
    assert.strictEqual(hostRec.success, true);
    assert.strictEqual(room.hostSocketId, 'host-new-socket', 'hostSocketId should be updated');
    assert.strictEqual(hostRec.pin, room.pin);
    assert.ok(Array.isArray(hostRec.players));

    console.log('    ✓ Reconnection & Disconnect grace period passed');
  }

  // Test 6: Answer Submission, Speed-based Score Calculation, and Answered/Total Tracking
  {
    console.log('  Testing Answer Submission & Speed Scoring...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');

    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Player 1', playerId: 'p1' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Player 2', playerId: 'p2' }).player;

    // Cannot submit before startQuestion
    assert.throws(() => {
      rm.submitAnswer(room.pin, p1.playerId, 'opt1');
    }, /ไม่ได้อยู่ในช่วงเวลาตอบคำถาม/);

    // Start question 0
    const qResult = rm.startQuestion(room.pin, 0);
    assert.strictEqual(qResult.isEnded, false);
    assert.strictEqual(qResult.question.questionIndex, 0);
    assert.strictEqual(room.status, 'QUESTION');
    // Ensure safeQuestion options do NOT leak isCorrect
    assert.strictEqual(qResult.question.options[0].isCorrect, undefined);

    // Correct option for q1 in defaultQuizSets is 'opt1'
    const correctOptId = qResult.currentQuestion.options.find(o => o.isCorrect).id;
    const wrongOptId = qResult.currentQuestion.options.find(o => !o.isCorrect).id;

    // Immediate correct answer -> high score (~1000 pts)
    const ans1 = rm.submitAnswer(room.pin, p1.playerId, correctOptId);
    assert.strictEqual(ans1.alreadyAnswered, false);
    assert.strictEqual(ans1.isCorrect, true);
    assert.ok(ans1.pointsEarned >= 900 && ans1.pointsEarned <= 1000, `Points earned should be ~1000, got ${ans1.pointsEarned}`);
    assert.strictEqual(ans1.totalScore, ans1.pointsEarned);
    assert.strictEqual(ans1.answeredCount, 1);
    assert.strictEqual(ans1.totalPlayers, 2);
    assert.strictEqual(ans1.allAnswered, false);

    // Duplicate submission attempt
    const dupAns = rm.submitAnswer(room.pin, p1.playerId, correctOptId);
    assert.strictEqual(dupAns.alreadyAnswered, true);

    // Delayed incorrect answer -> 0 pts
    const ans2 = rm.submitAnswer(room.pin, p2.playerId, wrongOptId);
    assert.strictEqual(ans2.isCorrect, false);
    assert.strictEqual(ans2.pointsEarned, 0);
    assert.strictEqual(ans2.totalScore, 0);
    assert.strictEqual(ans2.answeredCount, 2);
    assert.strictEqual(ans2.totalPlayers, 2);
    assert.strictEqual(ans2.allAnswered, true, 'allAnswered should be true when all players answered');

    // Delayed answer speed reduction test
    const rm2 = new RoomManager();
    const r2 = rm2.createRoom('h2');
    const playerSlow = rm2.joinPlayer(r2.pin, 'sSlow', { name: 'Slow' }).player;
    rm2.startQuestion(r2.pin, 0);
    // Artificially move questionStartTime back by 10 seconds (timeLimit is 20s)
    r2.questionStartTime = Date.now() - 10000;
    const ansSlow = rm2.submitAnswer(r2.pin, playerSlow.playerId, 'opt1');
    assert.strictEqual(ansSlow.isCorrect, true);
    // Speed ratio = (20 - 10)/20 = 0.5 -> 500 + 500*0.5 = 750 pts
    assert.ok(ansSlow.pointsEarned >= 740 && ansSlow.pointsEarned <= 760, `Points should be ~750, got ${ansSlow.pointsEarned}`);

    console.log('    ✓ Answer submission & speed scoring passed');
  }

  // Test 7: Player Counts & Disconnect Interaction
  {
    console.log('  Testing Player Counts & Disconnected Exclusions...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');
    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'P1' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'P2' }).player;

    assert.deepStrictEqual(rm.getPlayerCounts(room.pin), { totalPlayers: 2, answeredCount: 0, pulseAnsweredCount: 0 });

    // Disconnect P2
    rm.handleDisconnect('s2', 45000);
    assert.deepStrictEqual(rm.getPlayerCounts(room.pin), { totalPlayers: 1, answeredCount: 0, pulseAnsweredCount: 0 }, 'Disconnected players shouldn\'t be counted in totalPlayers');

    // Counts for non-existent room
    assert.deepStrictEqual(rm.getPlayerCounts('000000'), { totalPlayers: 0, answeredCount: 0, pulseAnsweredCount: 0 });
    console.log('    ✓ Player counts & disconnect interaction passed');
  }

  // Test 8: Pulse Vote Submission & 3-level Aggregations
  {
    console.log('  Testing Pulse Vote Submission & 3-Level Aggregations...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');
    rm.switchMode(room.pin, 'PULSE');

    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'P1' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'P2' }).player;
    const p3 = rm.joinPlayer(room.pin, 's3', { name: 'P3' }).player;

    // Invalid pulse choice
    assert.throws(() => {
      rm.submitPulse(room.pin, p1.playerId, 'blue');
    }, /ตัวเลือกไม่ถูกต้อง/);

    // Vote submission: green, yellow, red
    const resP1 = rm.submitPulse(room.pin, p1.playerId, 'green');
    assert.deepStrictEqual(resP1.pulseVotes, { green: 1, yellow: 0, red: 0 });
    assert.strictEqual(resP1.pulseAnsweredCount, 1);

    const resP2 = rm.submitPulse(room.pin, p2.playerId, 'yellow');
    assert.deepStrictEqual(resP2.pulseVotes, { green: 1, yellow: 1, red: 0 });
    assert.strictEqual(resP2.pulseAnsweredCount, 2);

    const resP3 = rm.submitPulse(room.pin, p3.playerId, 'red');
    assert.deepStrictEqual(resP3.pulseVotes, { green: 1, yellow: 1, red: 1 });
    assert.strictEqual(resP3.pulseAnsweredCount, 3);

    // P1 changes vote from 'green' to 'red'
    const resP1Change = rm.submitPulse(room.pin, p1.playerId, 'red');
    assert.deepStrictEqual(resP1Change.pulseVotes, { green: 0, yellow: 1, red: 2 });
    assert.strictEqual(resP1Change.pulseAnsweredCount, 3, 'pulseAnsweredCount should stay 3');

    console.log('    ✓ Pulse vote submission & 3-level aggregations passed');
  }

  // Test 9: Mode Switching (QUIZ <-> PULSE)
  {
    console.log('  Testing Mode Switching...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');
    assert.strictEqual(room.mode, 'QUIZ');

    rm.switchMode(room.pin, 'PULSE');
    assert.strictEqual(room.mode, 'PULSE');

    rm.switchMode(room.pin, 'QUIZ');
    assert.strictEqual(room.mode, 'QUIZ');

    assert.throws(() => {
      rm.switchMode(room.pin, 'INVALID_MODE');
    }, /Mode ไม่ถูกต้อง/);

    assert.throws(() => {
      rm.switchMode('000000', 'PULSE');
    }, /Room not found/);

    console.log('    ✓ Mode switching passed');
  }

  // Test 10: Question Results, Leaderboard, and End Quiz
  {
    console.log('  Testing Question Results, Leaderboard, and End Quiz...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1');

    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Alice' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Bob' }).player;

    rm.startQuestion(room.pin, 0);
    rm.submitAnswer(room.pin, p1.playerId, 'opt1'); // Correct
    rm.submitAnswer(room.pin, p2.playerId, 'opt2'); // Wrong

    const res = rm.getQuestionResult(room.pin);
    assert.strictEqual(room.status, 'QUESTION_RESULT');
    assert.strictEqual(res.questionId, 'q1');
    assert.strictEqual(res.correctOptionId, 'opt1');
    assert.strictEqual(res.optionCounts['opt1'], 1);
    assert.strictEqual(res.optionCounts['opt2'], 1);

    const leaderboard = rm.getLeaderboard(room.pin);
    assert.strictEqual(room.status, 'LEADERBOARD');
    assert.strictEqual(leaderboard.length, 2);
    assert.strictEqual(leaderboard[0].playerId, p1.playerId, 'Alice should be #1');
    assert.ok(leaderboard[0].score > leaderboard[1].score);

    // Advance to end of quiz
    rm.startQuestion(room.pin, 1);
    rm.startQuestion(room.pin, 2);
    rm.startQuestion(room.pin, 3);
    const endResult = rm.startQuestion(room.pin); // exceeds total questions
    assert.strictEqual(endResult.isEnded, true);
    assert.strictEqual(room.status, 'ENDED');

    console.log('    ✓ Question results, leaderboard, and end quiz passed');
  }

  console.log('✅ RoomManager tests passed cleanly!');
}

module.exports = { testRoomManager };

if (require.main === module) {
  testRoomManager().catch(err => {
    console.error('❌ RoomManager test failed:', err);
    process.exit(1);
  });
}
