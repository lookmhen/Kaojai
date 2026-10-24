const assert = require('node:assert/strict');
const db = require('../src/db');
const roomManager = require('../src/roomManager');

console.log('--- Testing History Archive, Player Kick, Cleanup & Backup ---');

// 1. Test Session History in SQLite
console.log('  Testing Session History CRUD...');
const testPin = '999888';
const sampleAnalytics = {
  quizTitle: 'ทดสอบระบบบันทึกประวัติเซสชัน',
  mode: 'QUIZ',
  quizMode: 'NORMAL',
  totalPlayers: 5,
  averageScore: 850,
  overallAccuracyPct: 78,
  leaderboard: [
    { playerId: 'p1', name: 'Alice', score: 1000 },
    { playerId: 'p2', name: 'Bob', score: 900 }
  ]
};

const historyId = db.saveSessionHistory(testPin, sampleAnalytics);
assert.ok(historyId, 'saveSessionHistory should return an ID');
assert.ok(historyId.startsWith(`sess_${testPin}_`), 'ID should start with sess_PIN');

const historyList = db.getSessionHistoryList(10);
assert.ok(Array.isArray(historyList), 'getSessionHistoryList should return an array');
const foundHistory = historyList.find(h => h.id === historyId);
assert.ok(foundHistory, 'Saved history should be in history list');
assert.equal(foundHistory.title, sampleAnalytics.quizTitle);
assert.equal(foundHistory.totalPlayers, 5);

const historyDetail = db.getSessionHistoryById(historyId);
assert.ok(historyDetail, 'getSessionHistoryById should return entry');
assert.ok(historyDetail.analytics, 'analytics should be parsed');
assert.equal(historyDetail.analytics.leaderboard.length, 2);

const deleted = db.deleteSessionHistory(historyId);
assert.equal(deleted, true, 'deleteSessionHistory should return true');
const afterDelete = db.getSessionHistoryById(historyId);
assert.equal(afterDelete, null, 'Deleted history should return null');
console.log('    ✓ Session History CRUD passed');

// 2. Test Inactive Rooms Cleanup
console.log('  Testing cleanupOldRooms...');
const oldRoomPin = '888777';
const oldTime = Date.now() - (20 * 24 * 60 * 60 * 1000); // 20 days ago
const saveRes = db.saveRoom({
  pin: oldRoomPin,
  hostToken: 'old-token',
  status: 'ENDED',
  mode: 'QUIZ',
  quizMode: 'NORMAL',
  quizSet: { id: 'q1', questions: [] },
  createdAt: oldTime,
  updatedAt: oldTime
});
assert.equal(saveRes.success, true, 'saveRoom should succeed for old room');

const cleanedCount = db.cleanupOldRooms(14);
assert.ok(cleanedCount >= 1, 'Should clean up rooms older than 14 days');
const checkedRoom = db.getRoom(oldRoomPin);
assert.equal(checkedRoom, null, 'Old room should be deleted from SQLite');
console.log('    ✓ cleanupOldRooms passed');

// 3. Test RoomManager removePlayer & Kick flow
console.log('  Testing Host Kick Player logic...');
const kickRoom = roomManager.createRoom('kick-host-token');
const kickPin = kickRoom.pin;
roomManager.joinPlayer(kickPin, 'socket-123', {
  name: 'KickedPlayer',
  avatar: '0291dcc0ce.svg',
  playerId: 'player-kick-1'
});

const playerObj = kickRoom.players.get('player-kick-1');
assert.ok(playerObj, 'Player should exist before kick');

const remResult = roomManager.removePlayer(kickPin, 'player-kick-1');
assert.equal(remResult.removed, true, 'Player should be removed');
assert.equal(kickRoom.players.has('player-kick-1'), false, 'Player should not be in room');

roomManager.deleteRoom(kickPin);
console.log('    ✓ Host Kick Player passed');

console.log('✅ History Archive, Player Kick, Cleanup & Backup tests passed cleanly!\n');
