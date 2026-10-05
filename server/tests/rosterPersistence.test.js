/**
 * Roster Persistence & Pre/Post-Test Claim Automated Test Suite
 * 
 * Verifies:
 * 1. Room creation and snapshot persistence to SQLite database
 * 2. Pre-test execution with 3 players (Alice, Bob, Charlie) submitting answers
 * 3. Pre-test completion: saving pretestData snapshot to SQLite and roster_players
 * 4. Simulated server crash / memory wipe (rm.rooms.clear())
 * 5. Rehydration of room from SQLite via getRoom(pin) with complete pretestData
 * 6. Fetching roster of pre-test players via getRoster(pin) with accurate scores & accuracy
 * 7. Post-test execution: Alice & Bob claiming roster identities, Charlie absent, David joining as new player
 * 8. Running Post-test to completion and computing getQuizAnalytics(pin)
 * 9. Accurate Learning Gain calculation:
 *    - Alice & Bob have exact Pre vs Post comparisons
 *    - Charlie is categorized in the Post-test absent group
 *    - David is identified as a new learner without Pre-test
 *    - Bob is identified as the Most Improved Learner
 * 10. Edge cases:
 *     - Non-existent PIN handling
 *     - Duplicate roster claim / socket reconnect
 *     - Room deletion (deleteRoom) cleaning memory and SQLite
 */
process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const { RoomManager } = require('../src/roomManager');

// Sample Quiz: 2 questions for deterministic scoring and accuracy
const SAMPLE_FIRE_SAFETY_QUIZ = {
  id: 'quiz-safety-101',
  title: 'การป้องกันและระงับอัคคีภัยในสถานประกอบการ',
  questions: [
    {
      id: 'q1',
      questionText: 'อุปกรณ์ดับเพลิงชนิดผงเคมีแห้ง (Dry Chemical) เหมาะสำหรับดับไฟประเภทใด?',
      timeLimitSeconds: 10,
      options: [
        { id: 'opt_1a', text: 'Class A, B, C', isCorrect: true },
        { id: 'opt_1b', text: 'Class D เท่านั้น', isCorrect: false },
        { id: 'opt_1c', text: 'Class K เท่านั้น', isCorrect: false },
        { id: 'opt_1d', text: 'ไม่เหมาะกับไฟทุกประเภท', isCorrect: false }
      ]
    },
    {
      id: 'q2',
      questionText: 'เมื่อเกิดเหตุเพลิงไหม้ สิ่งแรกที่ต้องปฏิบัติตามมาตรฐานความปลอดภัยคืออะไร?',
      timeLimitSeconds: 10,
      options: [
        { id: 'opt_2a', text: 'รีบกลับไปเก็บของมีค่าในตู้ล็อกเกอร์', isCorrect: false },
        { id: 'opt_2b', text: 'กดสัญญาณเตือนภัยและตะโกนแจ้งเตือนทุกคน', isCorrect: true },
        { id: 'opt_2c', text: 'ถ่ายรูปโพสต์ลงโซเชียลมีเดีย', isCorrect: false },
        { id: 'opt_2d', text: 'ปิดประตูขังตัวเองอยู่ในห้อง', isCorrect: false }
      ]
    }
  ]
};

async function testRosterPersistence() {
  console.log('--- Testing SQLite Persistence & Pre/Post-test Roster Claim ---');

  const testDbPath = path.join(__dirname, 'test_roster_persistence.sqlite');
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (e) {}
  }

  // Initialize isolated test database
  db.initDb(testDbPath);

  try {
    const rm = new RoomManager();

    /* ─── 1. Room Creation & SQLite Persistence ──────────────────────────── */
    console.log('  [RP-01] Creating room and verifying immediate SQLite persistence...');
    const room = rm.createRoom('host-socket-pre', SAMPLE_FIRE_SAFETY_QUIZ);
    const pin = room.pin;

    assert.ok(pin, 'Room must have a valid PIN');
    assert.strictEqual(room.mode, 'QUIZ', 'Default mode should be QUIZ');
    assert.strictEqual(room.status, 'LOBBY', 'Initial status should be LOBBY');
    assert.strictEqual(room.quizMode, 'NORMAL', 'Default quizMode should be NORMAL');

    // Verify room was persisted into SQLite database immediately
    const dbRoom = db.getRoom(pin);
    assert.ok(dbRoom, 'Room must exist in SQLite database');
    assert.strictEqual(dbRoom.pin, pin, 'Persisted PIN must match');
    assert.strictEqual(dbRoom.hostToken, room.hostToken, 'Persisted hostToken must match');
    assert.strictEqual(dbRoom.quizSet.id, 'quiz-safety-101', 'Persisted quizSet ID must match');
    assert.strictEqual(dbRoom.status, 'LOBBY', 'Persisted status must be LOBBY');
    console.log('    ✓ RP-01 passed');

    /* ─── 2. Pre-test Simulation: Alice, Bob, Charlie ───────────────────── */
    console.log('  [RP-02] Simulating Pre-test with 3 players (Alice, Bob, Charlie)...');
    room.quizMode = 'PRETEST';

    // 3 Players join
    rm.joinPlayer(pin, 'sock-alice', { name: 'Alice', avatar: 'alice.svg', playerId: 'p_alice' });
    rm.joinPlayer(pin, 'sock-bob', { name: 'Bob', avatar: 'bob.svg', playerId: 'p_bob' });
    rm.joinPlayer(pin, 'sock-charlie', { name: 'Charlie', avatar: 'charlie.svg', playerId: 'p_charlie' });

    assert.strictEqual(rm.getPlayerCounts(pin).totalPlayers, 3, 'Room must contain 3 players');

    // Question 0
    rm.startQuestion(pin, 0);
    // Alice: Correct (opt_1a)
    const ansA0 = rm.submitAnswer(pin, 'p_alice', 'opt_1a');
    assert.strictEqual(ansA0.isCorrect, true);
    assert.strictEqual(ansA0.pointsEarned, 0, 'PRETEST mode must award 0 game points');

    // Bob: Incorrect (opt_1b)
    const ansB0 = rm.submitAnswer(pin, 'p_bob', 'opt_1b');
    assert.strictEqual(ansB0.isCorrect, false);

    // Charlie: Incorrect (opt_1c)
    const ansC0 = rm.submitAnswer(pin, 'p_charlie', 'opt_1c');
    assert.strictEqual(ansC0.isCorrect, false);

    rm.getQuestionResult(pin);

    // Question 1
    rm.startQuestion(pin, 1);
    // Alice: Correct (opt_2b) -> Alice total: 2/2 = 100%
    const ansA1 = rm.submitAnswer(pin, 'p_alice', 'opt_2b');
    assert.strictEqual(ansA1.isCorrect, true);

    // Bob: Correct (opt_2b) -> Bob total: 1/2 = 50%
    const ansB1 = rm.submitAnswer(pin, 'p_bob', 'opt_2b');
    assert.strictEqual(ansB1.isCorrect, true);

    // Charlie: Incorrect (opt_2a) -> Charlie total: 0/2 = 0%
    const ansC1 = rm.submitAnswer(pin, 'p_charlie', 'opt_2a');
    assert.strictEqual(ansC1.isCorrect, false);

    rm.getQuestionResult(pin);
    console.log('    ✓ RP-02 passed');

    /* ─── 3. End Pre-test & Save Snapshot to SQLite ─────────────────────── */
    console.log('  [RP-03] Ending Pre-test and saving snapshot pretestData to SQLite and roster_players...');
    room.status = 'ENDED';
    const snapshot = rm.savePretestSnapshot(pin);

    assert.ok(snapshot, 'savePretestSnapshot must return valid snapshot');
    assert.strictEqual(snapshot.completed, true, 'Snapshot must be marked completed');
    assert.strictEqual(snapshot.totalPlayers, 3, 'Snapshot must record 3 players');
    assert.strictEqual(snapshot.totalQuestions, 2, 'Snapshot must record 2 questions');
    // Class accuracy: (2 + 1 + 0) / (3 * 2) = 3 / 6 = 50%
    assert.strictEqual(snapshot.overallAccuracyPct, 50, 'Overall Pre-test accuracy must be 50%');

    // Verify snapshot saved in SQLite rooms table
    const dbRoomAfterPre = db.getRoom(pin);
    assert.ok(dbRoomAfterPre.pretestData, 'SQLite rooms record must contain pretestData');
    assert.strictEqual(dbRoomAfterPre.pretestData.overallAccuracyPct, 50);

    // Verify SQLite roster_players table has all 3 players
    const dbRoster = db.getRosterByPin(pin);
    assert.strictEqual(dbRoster.length, 3, 'roster_players must contain 3 records');
    
    const dbAlice = dbRoster.find(r => r.playerId === 'p_alice');
    const dbBob = dbRoster.find(r => r.playerId === 'p_bob');
    const dbCharlie = dbRoster.find(r => r.playerId === 'p_charlie');

    assert.ok(dbAlice && dbBob && dbCharlie, 'All 3 players must exist in SQLite roster');
    assert.strictEqual(dbAlice.pretestAccuracy, 100, 'Alice Pre-test accuracy in SQLite must be 100%');
    assert.strictEqual(dbBob.pretestAccuracy, 50, 'Bob Pre-test accuracy in SQLite must be 50%');
    assert.strictEqual(dbCharlie.pretestAccuracy, 0, 'Charlie Pre-test accuracy in SQLite must be 0%');
    assert.strictEqual(dbAlice.hasPretest, true, 'Alice hasPretest flag must be true');
    console.log('    ✓ RP-03 passed');

    /* ─── 4. Simulate Server Crash / Memory Wipe ────────────────────────── */
    console.log('  [RP-04] Simulating Server Crash / Memory Cleared (clearing rm.rooms Map)...');
    rm.rooms.clear();
    assert.strictEqual(rm.rooms.size, 0, 'RoomManager memory map must be completely empty');
    assert.strictEqual(rm.rooms.has(pin), false, 'Room PIN must not be in memory');
    console.log('    ✓ RP-04 passed');

    /* ─── 5. Test getRoom(pin) Rehydration from SQLite ──────────────────── */
    console.log('  [RP-05] Rehydrating room from SQLite via getRoom(pin)...');
    const rehydratedRoom = rm.getRoom(pin);

    assert.ok(rehydratedRoom, 'getRoom(pin) must rehydrate room from SQLite');
    assert.strictEqual(rehydratedRoom.pin, pin, 'Rehydrated PIN must match');
    assert.strictEqual(rehydratedRoom.quizSet.id, 'quiz-safety-101', 'Rehydrated quizSet must match');
    assert.strictEqual(rehydratedRoom.status, 'LOBBY', 'Rehydrated status must be reset to LOBBY for next session');
    assert.ok(rehydratedRoom.pretestData, 'Rehydrated room must contain pretestData');
    assert.strictEqual(rehydratedRoom.pretestData.completed, true);
    assert.strictEqual(rehydratedRoom.pretestData.overallAccuracyPct, 50);
    assert.strictEqual(rehydratedRoom.pretestData.playerScores.length, 3);
    assert.ok(rm.rooms.has(pin), 'Room must now be re-cached into rm.rooms memory');
    console.log('    ✓ RP-05 passed');

    /* ─── 6. Test getRoster(pin) ────────────────────────────────────────── */
    console.log('  [RP-06] Fetching roster via getRoster(pin) after simulated crash...');
    const roster = rm.getRoster(pin);

    assert.strictEqual(roster.length, 3, 'getRoster must return 3 players');

    const rAlice = roster.find(p => p.playerId === 'p_alice');
    const rBob = roster.find(p => p.playerId === 'p_bob');
    const rCharlie = roster.find(p => p.playerId === 'p_charlie');

    assert.ok(rAlice, 'Alice must be in roster');
    assert.strictEqual(rAlice.name, 'Alice');
    assert.strictEqual(rAlice.pretestAccuracy, 100);
    assert.strictEqual(rAlice.hasPretest, true);

    assert.ok(rBob, 'Bob must be in roster');
    assert.strictEqual(rBob.name, 'Bob');
    assert.strictEqual(rBob.pretestAccuracy, 50);
    assert.strictEqual(rBob.hasPretest, true);

    assert.ok(rCharlie, 'Charlie must be in roster');
    assert.strictEqual(rCharlie.name, 'Charlie');
    assert.strictEqual(rCharlie.pretestAccuracy, 0);
    assert.strictEqual(rCharlie.hasPretest, true);
    console.log('    ✓ RP-06 passed');

    /* ─── 7. Post-test: Claiming Roster & New Learner ───────────────────── */
    console.log('  [RP-07] Setting Post-test mode: Alice & Bob claim roster, Charlie absent, David joins as new player...');
    rehydratedRoom.quizMode = 'POSTTEST';

    // Alice claims her identity
    const joinAlice = rm.joinPlayer(pin, 'sock-alice-post', {
      name: 'Alice',
      avatar: 'alice.svg',
      playerId: 'p_alice'
    });
    assert.strictEqual(joinAlice.player.playerId, 'p_alice');
    assert.strictEqual(joinAlice.player.name, 'Alice');

    // Bob claims his identity
    const joinBob = rm.joinPlayer(pin, 'sock-bob-post', {
      name: 'Bob',
      avatar: 'bob.svg',
      playerId: 'p_bob'
    });
    assert.strictEqual(joinBob.player.playerId, 'p_bob');
    assert.strictEqual(joinBob.player.name, 'Bob');

    // Charlie is ABSENT: Does not join

    // David joins as NEW player (not in pre-test roster)
    const joinDavid = rm.joinPlayer(pin, 'sock-david-post', {
      name: 'David',
      avatar: 'david.svg',
      playerId: 'p_david'
    });
    assert.strictEqual(joinDavid.player.playerId, 'p_david');
    assert.strictEqual(joinDavid.player.name, 'David');

    const activeCounts = rm.getPlayerCounts(pin);
    assert.strictEqual(activeCounts.totalPlayers, 3, 'Post-test must have 3 active players (Alice, Bob, David)');
    console.log('    ✓ RP-07 passed');

    /* ─── 8. Run Post-test to Completion & getQuizAnalytics ─────────────── */
    console.log('  [RP-08] Running Post-test questions to completion...');
    // Question 0
    rm.startQuestion(pin, 0);
    // Alice: Correct (opt_1a)
    const ansPostA0 = rm.submitAnswer(pin, 'p_alice', 'opt_1a');
    assert.strictEqual(ansPostA0.isCorrect, true);
    assert.ok(ansPostA0.pointsEarned > 0, 'POSTTEST mode must award points');

    // Bob: Correct (opt_1a) -> Improved from Pre-test!
    const ansPostB0 = rm.submitAnswer(pin, 'p_bob', 'opt_1a');
    assert.strictEqual(ansPostB0.isCorrect, true);
    assert.ok(ansPostB0.pointsEarned > 0);

    // David: Correct (opt_1a)
    const ansPostD0 = rm.submitAnswer(pin, 'p_david', 'opt_1a');
    assert.strictEqual(ansPostD0.isCorrect, true);
    assert.ok(ansPostD0.pointsEarned > 0);

    rm.getQuestionResult(pin);

    // Question 1
    rm.startQuestion(pin, 1);
    // Alice: Correct (opt_2b) -> Alice Post: 2/2 = 100%
    const ansPostA1 = rm.submitAnswer(pin, 'p_alice', 'opt_2b');
    assert.strictEqual(ansPostA1.isCorrect, true);

    // Bob: Correct (opt_2b) -> Bob Post: 2/2 = 100% (Pre was 50%, now 100%!)
    const ansPostB1 = rm.submitAnswer(pin, 'p_bob', 'opt_2b');
    assert.strictEqual(ansPostB1.isCorrect, true);

    // David: Incorrect (opt_2c) -> David Post: 1/2 = 50%
    const ansPostD1 = rm.submitAnswer(pin, 'p_david', 'opt_2c');
    assert.strictEqual(ansPostD1.isCorrect, false);

    rm.getQuestionResult(pin);
    rehydratedRoom.status = 'ENDED';

    const analytics = rm.getQuizAnalytics(pin);
    assert.ok(analytics, 'getQuizAnalytics must return full report');
    console.log('    ✓ RP-08 passed');

    /* ─── 9. Verify 100% Accurate Learning Gain Calculation ─────────────── */
    console.log('  [RP-09] Verifying Learning Gain, Pre vs Post comparison, absent Charlie, and new learner David...');
    assert.ok(analytics.learningGain, 'learningGain must be computed when pretestData exists');

    const lg = analytics.learningGain;
    assert.strictEqual(lg.preOverallAccuracyPct, 50, 'Pre-test class accuracy was 50%');
    // Post-test class accuracy: 3 players, 2 questions = 6 total answers. Correct: Alice (2) + Bob (2) + David (1) = 5/6 = 83%
    assert.strictEqual(lg.postOverallAccuracyPct, 83, 'Post-test class accuracy should be 83%');
    assert.strictEqual(lg.classGainPct, 33, 'Class Gain must be +33%');

    const comparisons = lg.learnerComparisons;
    assert.ok(Array.isArray(comparisons), 'learnerComparisons must be an array');
    assert.strictEqual(comparisons.length, 4, 'Should contain 4 learners: Alice, Bob, Charlie (absent), David (new)');

    // 9.1 Alice: Claimed, Pre 100%, Post 100%, Diff 0%
    const compAlice = comparisons.find(c => c.playerId === 'p_alice');
    assert.ok(compAlice, 'Alice must exist in learner comparisons');
    assert.strictEqual(compAlice.hasPretest, true, 'Alice hasPretest must be true');
    assert.strictEqual(compAlice.preAccuracyPct, 100, 'Alice Pre accuracy must be 100%');
    assert.strictEqual(compAlice.postAccuracyPct, 100, 'Alice Post accuracy must be 100%');
    assert.strictEqual(compAlice.accuracyDiff, 0, 'Alice accuracyDiff must be 0%');

    // 9.2 Bob: Claimed, Pre 50%, Post 100%, Diff +50%
    const compBob = comparisons.find(c => c.playerId === 'p_bob');
    assert.ok(compBob, 'Bob must exist in learner comparisons');
    assert.strictEqual(compBob.hasPretest, true, 'Bob hasPretest must be true');
    assert.strictEqual(compBob.preAccuracyPct, 50, 'Bob Pre accuracy must be 50%');
    assert.strictEqual(compBob.postAccuracyPct, 100, 'Bob Post accuracy must be 100%');
    assert.strictEqual(compBob.accuracyDiff, 50, 'Bob accuracyDiff must be +50%');
    assert.ok(compBob.postScore > 0, 'Bob postScore must be positive');

    // 9.3 Charlie: ABSENT from Post-test
    const compCharlie = comparisons.find(c => c.playerId === 'p_charlie');
    assert.ok(compCharlie, 'Charlie must appear in learner comparisons (absent tracking)');
    assert.strictEqual(compCharlie.hasPretest, true, 'Charlie hasPretest must be true');
    assert.strictEqual(compCharlie.postScore, 0, 'Charlie Post score must be 0');
    assert.strictEqual(compCharlie.postAccuracyPct, 0, 'Charlie Post accuracy must be 0%');

    // 9.4 David: NEW Learner (no Pre-test)
    const compDavid = comparisons.find(c => c.playerId === 'p_david');
    assert.ok(compDavid, 'David must appear in learner comparisons');
    assert.strictEqual(compDavid.hasPretest, false, 'David hasPretest must be false');
    assert.strictEqual(compDavid.preAccuracyPct, 0, 'David Pre accuracy must be 0%');
    assert.strictEqual(compDavid.postAccuracyPct, 50, 'David Post accuracy must be 50%');
    assert.ok(compDavid.postScore > 0, 'David Post score must be positive');

    // 9.5 Most Improved Learner: Bob (+50% accuracy gain)
    assert.ok(lg.mostImprovedLearner, 'mostImprovedLearner must be present');
    assert.strictEqual(lg.mostImprovedLearner.playerId, 'p_bob', 'Bob must be the most improved learner');
    assert.strictEqual(lg.mostImprovedLearner.name, 'Bob');
    assert.strictEqual(lg.mostImprovedLearner.accuracyDiff, 50);
    console.log('    ✓ RP-09 passed');

    /* ─── 10. Edge Cases ────────────────────────────────────────────────── */
    console.log('  [RP-10] Verifying Edge cases: non-existent PIN, duplicate claiming, deleteRoom...');

    // 10.1 Non-existent PIN
    const nonExistentRoom = rm.getRoom('000000');
    assert.strictEqual(nonExistentRoom, undefined, 'getRoom on non-existent PIN must return undefined');

    const nonExistentRoster = rm.getRoster('000000');
    assert.deepStrictEqual(nonExistentRoster, [], 'getRoster on non-existent PIN must return empty array');

    assert.throws(() => {
      rm.joinPlayer('000000', 'sock-ghost', { name: 'Ghost' });
    }, /ไม่พบห้องดังกล่าว/, 'joinPlayer with invalid PIN must throw error');

    // 10.2 Duplicate Claim / Reconnect
    // If Bob reconnects / re-claims on a new socket
    const dupBobJoin = rm.joinPlayer(pin, 'sock-bob-new-tab', {
      name: 'Bob',
      avatar: 'bob.svg',
      playerId: 'p_bob'
    });
    assert.strictEqual(dupBobJoin.isReconnect, true, 'Duplicate claim should be identified as reconnect');
    assert.strictEqual(dupBobJoin.previousSocketId, 'sock-bob-post', 'Previous socket must be returned for cleanup');
    assert.strictEqual(rm.getPlayerCounts(pin).totalPlayers, 3, 'Total player count must not increase on duplicate claim');

    // 10.3 deleteRoom
    const deleteResult = rm.deleteRoom(pin);
    assert.strictEqual(deleteResult, true, 'deleteRoom must return true');

    // Verify room is deleted from memory
    assert.strictEqual(rm.rooms.has(pin), false, 'Room must be removed from rm.rooms memory');

    // Verify room cannot be rehydrated from SQLite (it was purged from SQLite)
    const deadRoom = rm.getRoom(pin);
    assert.strictEqual(deadRoom, undefined, 'Deleted room must return undefined on getRoom');
    assert.strictEqual(db.getRoom(pin), null, 'Room must be deleted from SQLite database');

    // Verify roster is cleared
    const deadRoster = rm.getRoster(pin);
    assert.strictEqual(deadRoster.length, 0, 'Roster must be empty after deleteRoom');
    console.log('    ✓ RP-10 passed');

    console.log('✅ All rosterPersistence.test.js assertions passed successfully!');
  } finally {
    db.closeDb();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  }
}

if (require.main === module) {
  testRosterPersistence();
}

module.exports = { testRosterPersistence };
