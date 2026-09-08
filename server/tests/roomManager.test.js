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

  // Test 11: Sequence Race Question Shuffling, Evaluation, and Scoring
  {
    console.log('  Testing Sequence Race Question Shuffling, Evaluation, and Scoring...');
    const rm = new RoomManager();
    const customQuiz = {
      id: 'quiz-seq-test',
      title: 'Sequence Test Quiz',
      questions: [
        {
          id: 'q-seq',
          questionType: 'SEQUENCE',
          questionText: 'Order the steps 1-4',
          timeLimitSeconds: 20,
          sequenceItems: [
            { id: 's1', text: 'Step 1' },
            { id: 's2', text: 'Step 2' },
            { id: 's3', text: 'Step 3' },
            { id: 's4', text: 'Step 4' }
          ]
        }
      ]
    };

    const room = rm.createRoom('host-seq', customQuiz);
    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Player Perfect' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Player Partial' }).player;

    const startInfo = rm.startQuestion(room.pin, 0);
    assert.strictEqual(startInfo.question.questionType, 'SEQUENCE');
    assert.strictEqual(startInfo.question.sequenceItems.length, 4);

    // Player 1 submits 100% correct order
    const p1Ans = rm.submitAnswer(room.pin, p1.playerId, { orderedItemIds: ['s1', 's2', 's3', 's4'] });
    assert.strictEqual(p1Ans.isCorrect, true);
    assert.strictEqual(p1Ans.details.isPerfect, true);
    assert.strictEqual(p1Ans.details.correctPositions, 4);
    assert.ok(p1Ans.pointsEarned >= 900, 'Perfect sequence with fast speed earns near 1000 points');

    // Player 2 submits partial correct order (e.g. s1 and s4 in correct spots, s3 and s2 swapped)
    const p2Ans = rm.submitAnswer(room.pin, p2.playerId, { orderedItemIds: ['s1', 's3', 's2', 's4'] });
    assert.strictEqual(p2Ans.isCorrect, false);
    assert.strictEqual(p2Ans.details.isPerfect, false);
    assert.strictEqual(p2Ans.details.correctPositions, 2);
    assert.ok(p2Ans.pointsEarned > 0, 'Partial sequence earns proportional points');
    assert.ok(p2Ans.pointsEarned < p1Ans.pointsEarned, 'Partial earns less than perfect');

    // Check Question Results
    const res = rm.getQuestionResult(room.pin);
    assert.strictEqual(res.questionType, 'SEQUENCE');
    assert.strictEqual(res.perfectCount, 1);
    assert.strictEqual(res.partialCount, 1);
    assert.deepStrictEqual(res.correctSequence.map(s => s.id), ['s1', 's2', 's3', 's4']);
    console.log('    ✓ Sequence Race question shuffling, evaluation, and scoring passed');
  }

  // Test 12: Team Management — createTeam, assign, remove, autoAssign, leaderboard, toggle
  {
    console.log('  Testing Team Management...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-team');
    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Alice', playerId: 'p1' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Bob',   playerId: 'p2' }).player;
    const p3 = rm.joinPlayer(room.pin, 's3', { name: 'Carol', playerId: 'p3' }).player;

    // teamsEnabled toggle
    assert.strictEqual(room.teamsEnabled, false, 'Teams should be disabled by default');
    rm.setTeamsEnabled(room.pin, true);
    assert.strictEqual(room.teamsEnabled, true, 'Teams should be enabled after toggle on');
    rm.setTeamsEnabled(room.pin, false);
    assert.strictEqual(room.teamsEnabled, false, 'Teams should be disabled after toggle off');
    rm.setTeamsEnabled(room.pin, true); // re-enable for rest of test

    // createTeam
    const teamA = rm.createTeam(room.pin, { name: 'ทีมแดง', color: '#E11D48' });
    const teamB = rm.createTeam(room.pin, { name: 'ทีมน้ำเงิน', color: '#2563EB' });
    assert.ok(teamA.id, 'Team A should have id');
    assert.strictEqual(teamA.name, 'ทีมแดง');
    assert.strictEqual(room.teams.size, 2, 'Room should have 2 teams');

    // createTeam with invalid name throws
    assert.throws(() => rm.createTeam(room.pin, { name: '' }), /ชื่อทีมไม่ถูกต้อง/);

    // assignPlayerToTeam
    rm.assignPlayerToTeam(room.pin, p1.playerId, teamA.id);
    rm.assignPlayerToTeam(room.pin, p2.playerId, teamA.id);
    rm.assignPlayerToTeam(room.pin, p3.playerId, teamB.id);
    assert.strictEqual(p1.teamId, teamA.id);
    assert.strictEqual(p3.teamId, teamB.id);
    assert.strictEqual(teamA.memberIds.size, 2);
    assert.strictEqual(teamB.memberIds.size, 1);

    // Re-assign p2 to teamB (should move from A to B)
    rm.assignPlayerToTeam(room.pin, p2.playerId, teamB.id);
    assert.strictEqual(p2.teamId, teamB.id);
    assert.strictEqual(teamA.memberIds.size, 1, 'Team A should have 1 member after p2 moved');
    assert.strictEqual(teamB.memberIds.size, 2);

    // Unassign p3
    rm.assignPlayerToTeam(room.pin, p3.playerId, null);
    assert.strictEqual(p3.teamId, null);
    assert.strictEqual(teamB.memberIds.size, 1);

    // assignPlayerToTeam with invalid playerId throws
    assert.throws(() => rm.assignPlayerToTeam(room.pin, 'nonexistent', teamA.id), /ไม่พบผู้เล่นดังกล่าว/);

    // getTeamList
    const teamList = rm.getTeamList(room.pin);
    assert.strictEqual(teamList.length, 2);
    const tA = teamList.find(t => t.id === teamA.id);
    assert.ok(tA);
    assert.strictEqual(tA.members.length, 1);

    // removeTeam — unassigns members
    rm.removeTeam(room.pin, teamA.id);
    assert.strictEqual(room.teams.size, 1, 'Room should have 1 team after removal');
    assert.strictEqual(p1.teamId, null, 'p1 should be unassigned after team removal');

    // removeTeam nonexistent throws
    assert.throws(() => rm.removeTeam(room.pin, 'fake-team-id'), /ไม่พบทีมดังกล่าว/);

    // autoAssignTeams — creates teams and distributes players evenly
    const rm2 = new RoomManager();
    const room2 = rm2.createRoom('host-auto');
    for (let i = 1; i <= 5; i++) {
      rm2.joinPlayer(room2.pin, `s${i}`, { name: `Player${i}` });
    }
    const autoTeams = rm2.autoAssignTeams(room2.pin, 2);
    assert.strictEqual(autoTeams.length, 2, 'Should create 2 teams');
    const totalAssigned = autoTeams.reduce((sum, t) => sum + t.memberIds.length, 0);
    assert.strictEqual(totalAssigned, 5, 'All 5 players should be assigned');
    // Each team should have 2 or 3 members (evenly distributed)
    autoTeams.forEach(t => {
      assert.ok(t.memberIds.length >= 2 && t.memberIds.length <= 3, `Team ${t.name} should have 2-3 members, got ${t.memberIds.length}`);
    });

    // getTeamLeaderboard — sorted by totalScore desc
    const lb = rm2.getTeamLeaderboard(room2.pin);
    assert.ok(Array.isArray(lb));
    if (lb.length > 1) {
      assert.ok(lb[0].totalScore >= lb[1].totalScore, 'Leaderboard should be sorted by totalScore desc');
    }

    // getPlayerList includes teamId
    const playerList = rm2.getPlayerList(room2.pin);
    assert.ok(playerList.every(p => 'teamId' in p), 'getPlayerList should include teamId for all players');

    console.log('    ✓ Team management passed');
  }

  // Test 13: Answer Streak & Comeback Gamification
  {
    console.log('  Testing Answer Streak & Comeback Gamification...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-gamify');
    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Player 1' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Player 2' }).player;

    // Question 1
    rm.startQuestion(room.pin, 0);
    const q1 = room.quizSet.questions[0];
    const correctOpt1 = q1.options.find(o => o.isCorrect).id;
    const wrongOpt1 = q1.options.find(o => !o.isCorrect).id;

    // P1 answers correct on Q1
    const p1Ans1 = rm.submitAnswer(room.pin, p1.playerId, correctOpt1);
    assert.strictEqual(p1Ans1.isCorrect, true);
    assert.strictEqual(p1Ans1.streak, 1);
    assert.strictEqual(p1Ans1.streakBonus, 0, 'Streak 1 has no bonus');
    assert.strictEqual(p1Ans1.comebackBonus, 0, 'Q1 has no comeback bonus');

    // P2 answers wrong on Q1
    const p2Ans1 = rm.submitAnswer(room.pin, p2.playerId, wrongOpt1);
    assert.strictEqual(p2Ans1.isCorrect, false);
    assert.strictEqual(p2Ans1.streak, 0);

    // Question 2
    rm.startQuestion(room.pin, 1);
    const q2 = room.quizSet.questions[1];
    const correctOpt2 = q2.options.find(o => o.isCorrect).id;

    // P1 answers correct again on Q2 -> Streak 2!
    const p1Ans2 = rm.submitAnswer(room.pin, p1.playerId, correctOpt2);
    assert.strictEqual(p1Ans2.isCorrect, true);
    assert.strictEqual(p1Ans2.streak, 2);
    assert.strictEqual(p1Ans2.streakBonus, 50, 'Streak 2 should receive +50 bonus');

    // P2 answers correct on Q2 -> Was in bottom half prior to Q2 -> Comeback bonus!
    const p2Ans2 = rm.submitAnswer(room.pin, p2.playerId, correctOpt2);
    assert.strictEqual(p2Ans2.isCorrect, true);
    assert.strictEqual(p2Ans2.streak, 1);
    assert.strictEqual(p2Ans2.isComeback, true, 'P2 should receive comeback bonus');
    assert.strictEqual(p2Ans2.comebackBonus, 40, 'Comeback bonus should be +40');

    // Leaderboard contains streak info
    const lb = rm.getLeaderboard(room.pin);
    const lbP1 = lb.find(p => p.playerId === p1.playerId);
    assert.strictEqual(lbP1.streak, 2);
    assert.strictEqual(lbP1.highestStreak, 2);

    console.log('    ✓ Answer streak & comeback gamification passed');
  }

  // Test 14: Question History Recording & In-depth Quiz Analytics
  {
    console.log('  Testing Question History Recording & getQuizAnalytics...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-analytics');

    const p1 = rm.joinPlayer(room.pin, 's1', { name: 'Alice', playerId: 'p1' }).player;
    const p2 = rm.joinPlayer(room.pin, 's2', { name: 'Bob', playerId: 'p2' }).player;

    // Start Q0
    rm.startQuestion(room.pin, 0);
    const q0 = room.quizSet.questions[0];
    const correct0 = q0.options.find(o => o.isCorrect).id;
    const wrong0 = q0.options.find(o => !o.isCorrect).id;

    rm.submitAnswer(room.pin, p1.playerId, correct0);
    rm.submitAnswer(room.pin, p2.playerId, wrong0);

    // Call getQuestionResult
    const q0Res = rm.getQuestionResult(room.pin);
    assert.ok(q0Res);
    assert.strictEqual(room.questionHistory.length, 1);

    const hist0 = room.questionHistory[0];
    assert.strictEqual(hist0.questionIndex, 0);
    assert.strictEqual(hist0.correctCount, 1);
    assert.strictEqual(hist0.incorrectCount, 1);
    assert.strictEqual(hist0.accuracyPct, 50);
    assert.strictEqual(hist0.playerResponses[p1.playerId].isCorrect, true);
    assert.strictEqual(hist0.playerResponses[p2.playerId].isCorrect, false);

    // Get analytics
    const analytics = rm.getQuizAnalytics(room.pin);
    assert.ok(analytics);
    assert.strictEqual(analytics.totalPlayers, 2);
    assert.strictEqual(analytics.questionHistory.length, 1);
    assert.strictEqual(analytics.overallAccuracyPct, 50);
    assert.ok(analytics.hardestQuestion);
    assert.ok(analytics.easiestQuestion);

    console.log('    ✓ Question History & Quiz Analytics passed');
  }

  // 15. Score and Streak Reset on Replay and Reset to Lobby
  {
    console.log('  Testing Score & Streak Reset on Replay and Reset to Lobby...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-reset-test');
    const p1 = rm.joinPlayer(room.pin, 'sock-reset-1', { name: 'Player One' }).player;

    rm.startQuestion(room.pin, 0);
    const correctOpt = room.quizSet.questions[0].options.find(o => o.isCorrect).id;
    const ans = rm.submitAnswer(room.pin, p1.playerId, correctOpt);
    assert.strictEqual(ans.isCorrect, true);
    assert.ok(p1.score > 0);
    assert.strictEqual(p1.streak, 1);

    const qResult = rm.getQuestionResult(room.pin);
    assert.strictEqual(qResult.isLastQuestion, false);

    // Test resetRoomToLobby
    rm.resetRoomToLobby(room.pin);
    assert.strictEqual(room.status, 'LOBBY');
    assert.strictEqual(p1.score, 0);
    assert.strictEqual(p1.streak, 0);
    assert.strictEqual(p1.highestStreak, 0);
    assert.strictEqual(room.questionHistory.length, 0);

    // Replay: startQuestion at 0 should start with 0 score and 0 streak
    p1.score = 500;
    p1.streak = 3;
    rm.startQuestion(room.pin, 0);
    assert.strictEqual(p1.score, 0, 'Starting Q0 must reset score to 0');
    assert.strictEqual(p1.streak, 0, 'Starting Q0 must reset streak to 0');

    // Last question check
    const lastQIdx = room.quizSet.questions.length - 1;
    rm.startQuestion(room.pin, lastQIdx);
    const lastQRes = rm.getQuestionResult(room.pin);
    assert.strictEqual(lastQRes.isLastQuestion, true, 'Final question must flag isLastQuestion = true');

    console.log('    ✓ Score & Streak Reset on Replay and Reset to Lobby passed');
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
