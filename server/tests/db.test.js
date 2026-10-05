const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

function testDatabaseLayer() {
  console.log('--- Testing db.js (SQLite persistence) ---');

  // Use a separate test SQLite database file
  const testDbPath = path.join(__dirname, 'test_kaojai.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  try {
    // 1. Initialize DB with test path
    const instance = db.initDb(testDbPath);
    assert.ok(instance, 'Database instance should be initialized');
    assert.ok(fs.existsSync(testDbPath), 'Test sqlite database file should exist');

    // 2. Test saving and retrieving a room
    const mockRoom = {
      pin: '998877',
      hostToken: 'host-secret-123',
      status: 'LOBBY',
      mode: 'QUIZ',
      quizMode: 'PRETEST',
      quizSet: {
        id: 'quiz-pretest-1',
        title: 'Safety Training Pre-test',
        questions: [{ id: 'q1', questionText: 'What is step 1?' }]
      },
      pretestData: {
        completed: true,
        averageScore: 75,
        overallAccuracyPct: 80
      },
      pulseVotes: { green: 10, yellow: 2, red: 0 },
      pulseRound: 3,
      teamsEnabled: true,
      teams: [
        { id: 'team-1', name: 'Alpha', color: '#ff0000', memberIds: ['p1', 'p2'] },
        { id: 'team-2', name: 'Beta', color: '#00ff00', memberIds: [] }
      ],
      createdAt: 1700000000000
    };

    const saveResult = db.saveRoom(mockRoom);
    assert.equal(saveResult.success, true, 'saveRoom should return success true');
    assert.equal(saveResult.pin, '998877');

    const loaded = db.getRoom('998877');
    assert.ok(loaded, 'getRoom should return the stored room');
    assert.equal(loaded.pin, '998877');
    assert.equal(loaded.hostToken, 'host-secret-123');
    assert.equal(loaded.mode, 'QUIZ');
    assert.equal(loaded.quizMode, 'PRETEST');
    assert.equal(loaded.pulseRound, 3);
    assert.equal(loaded.pulseVotes.green, 10);
    assert.equal(loaded.teamsEnabled, true);
    assert.equal(loaded.teams.length, 2);
    assert.equal(loaded.teams[0].name, 'Alpha');
    assert.equal(loaded.quizSet.title, 'Safety Training Pre-test');
    assert.equal(loaded.pretestData.averageScore, 75);

    // 3. Test saving single player to roster
    const p1 = {
      playerId: 'player-001',
      name: 'Alice Cooper',
      avatar: 'avatar_alice.png',
      teamId: 'team-1',
      pretestScore: 50,
      pretestAccuracy: 70
    };
    const playerSaveRes = db.saveRosterPlayer('998877', p1);
    assert.equal(playerSaveRes.success, true, 'saveRosterPlayer should succeed');

    // 4. Test batch pretest roster save
    const batchData = [
      {
        playerId: 'player-001',
        name: 'Alice Cooper',
        avatar: 'avatar_alice.png',
        teamId: 'team-1',
        score: 95,
        accuracyPct: 95
      },
      {
        playerId: 'player-002',
        name: 'Bob Marley',
        avatar: 'avatar_bob.png',
        teamId: 'team-2',
        score: 60,
        accuracyPct: 60
      }
    ];

    const batchRes = db.savePretestRoster('998877', { averageScore: 77.5 }, batchData);
    assert.equal(batchRes.success, true, 'savePretestRoster should succeed');
    assert.equal(batchRes.count, 2);

    // 5. Test getRosterByPin
    const roster = db.getRosterByPin('998877');
    assert.equal(roster.length, 2, 'Roster should contain 2 players');
    assert.equal(roster[0].playerId, 'player-001', 'Alice should be first due to higher pretest score (95)');
    assert.equal(roster[0].pretestScore, 95);
    assert.equal(roster[0].pretestAccuracy, 95);
    assert.equal(roster[0].hasPretest, true);
    assert.equal(roster[1].playerId, 'player-002');
    assert.equal(roster[1].pretestScore, 60);

    // 6. Test getAllRooms
    const all = db.getAllRooms();
    assert.ok(Array.isArray(all), 'getAllRooms should return an array');
    assert.ok(all.some(r => r.pin === '998877'), 'getAllRooms should include 998877');

    // 7. Test deleteRoom
    const deleted = db.deleteRoom('998877');
    assert.equal(deleted, true, 'deleteRoom should return true');
    const verifyNull = db.getRoom('998877');
    assert.equal(verifyNull, null, 'Deleted room should be null');

    console.log('✅ All db.test.js assertions passed successfully!');
  } finally {
    db.closeDb();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (e) {}
    }
  }
}

if (require.main === module) {
  testDatabaseLayer();
}

module.exports = { testDatabaseLayer };
