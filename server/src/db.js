const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = process.env.NODE_ENV === 'test' ? ':memory:' : path.resolve(DATA_DIR, 'kaojai.sqlite');

let db = null;
let activeDbPath = null;

/**
 * Initialize or get database instance
 * @param {string} [customPath] - Optional custom SQLite file path or ':memory:'
 * @returns {DatabaseSync}
 */
function initDb(customPath = DB_PATH) {
  if (db && activeDbPath === customPath) {
    return db;
  }

  // If already open on different path, close before opening new one
  if (db) {
    closeDb();
  }

  activeDbPath = customPath;

  if (customPath !== ':memory:') {
    const parentDir = path.dirname(customPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  db = new DatabaseSync(customPath);

  // Enable WAL mode for optimal concurrent performance (ignore error for in-memory)
  try {
    if (customPath !== ':memory:') {
      db.exec('PRAGMA journal_mode = WAL;');
    }
  } catch (e) {
    // Some platforms / memory DBs may not support WAL
  }

  // Enable foreign keys
  try {
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {}

  initSchema();
  return db;
}

/**
 * Accessor for database connection (ensures db is initialized)
 */
function getDb() {
  if (!db) {
    return initDb(DB_PATH);
  }
  return db;
}

/**
 * Create tables, indexes, and views
 */
function initSchema() {
  const d = db || initDb(DB_PATH);

  d.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      pin TEXT PRIMARY KEY,
      hostToken TEXT,
      status TEXT,
      mode TEXT,
      quizMode TEXT,
      quizSetJson TEXT,
      pretestDataJson TEXT,
      pulseVotesJson TEXT,
      pulseRound INTEGER DEFAULT 1,
      teamsEnabled INTEGER DEFAULT 0,
      teamsJson TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS roster_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pin TEXT NOT NULL,
      playerId TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      teamId TEXT,
      pretestScore INTEGER DEFAULT 0,
      pretestAccuracy REAL DEFAULT 0,
      posttestScore INTEGER DEFAULT 0,
      posttestAccuracy REAL DEFAULT 0,
      hasPretest INTEGER DEFAULT 0,
      updatedAt INTEGER,
      UNIQUE(pin, playerId)
    );

    CREATE INDEX IF NOT EXISTS idx_roster_pin ON roster_players (pin);
    CREATE INDEX IF NOT EXISTS idx_roster_player ON roster_players (playerId);
    CREATE INDEX IF NOT EXISTS idx_rooms_updated ON rooms (updatedAt);

    CREATE VIEW IF NOT EXISTS players AS SELECT * FROM roster_players;
  `);
}

/**
 * Save or update a room snapshot in SQLite
 * @param {object} room
 */
function saveRoom(room) {
  if (!room || !room.pin) return { success: false, error: 'Invalid room object or missing PIN' };
  try {
    const d = getDb();
    const now = Date.now();
    const createdAt = Number(room.createdAt) || now;
    const updatedAt = now;

    // Serialize teams safely (Map, Array, or Object)
    let teamsJson = null;
    if (room.teams instanceof Map) {
      teamsJson = JSON.stringify(Array.from(room.teams.values()));
    } else if (Array.isArray(room.teams)) {
      teamsJson = JSON.stringify(room.teams);
    } else if (room.teams && typeof room.teams === 'object') {
      teamsJson = JSON.stringify(room.teams);
    }

    const stmt = d.prepare(`
      INSERT INTO rooms (
        pin, hostToken, status, mode, quizMode, quizSetJson,
        pretestDataJson, pulseVotesJson, pulseRound, teamsEnabled,
        teamsJson, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(pin) DO UPDATE SET
        hostToken = excluded.hostToken,
        status = excluded.status,
        mode = excluded.mode,
        quizMode = excluded.quizMode,
        quizSetJson = excluded.quizSetJson,
        pretestDataJson = excluded.pretestDataJson,
        pulseVotesJson = excluded.pulseVotesJson,
        pulseRound = excluded.pulseRound,
        teamsEnabled = excluded.teamsEnabled,
        teamsJson = excluded.teamsJson,
        updatedAt = excluded.updatedAt;
    `);

    stmt.run(
      String(room.pin),
      room.hostToken || null,
      room.status || 'LOBBY',
      room.mode || 'QUIZ',
      room.quizMode || 'NORMAL',
      room.quizSet ? JSON.stringify(room.quizSet) : null,
      room.pretestData ? JSON.stringify(room.pretestData) : null,
      room.pulseVotes ? JSON.stringify(room.pulseVotes) : null,
      Number(room.pulseRound) || 1,
      room.teamsEnabled ? 1 : 0,
      teamsJson,
      createdAt,
      updatedAt
    );

    return { success: true, pin: room.pin };
  } catch (err) {
    console.error('[DB Error] saveRoom:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve room snapshot from SQLite
 * @param {string} pin
 * @returns {object|null}
 */
function getRoom(pin) {
  if (!pin) return null;
  try {
    const d = getDb();
    const row = d.prepare('SELECT * FROM rooms WHERE pin = ?').get(String(pin));
    if (!row) return null;

    let quizSet = null;
    if (row.quizSetJson) {
      try { quizSet = JSON.parse(row.quizSetJson); } catch (e) {}
    }

    let pretestData = null;
    if (row.pretestDataJson) {
      try { pretestData = JSON.parse(row.pretestDataJson); } catch (e) {}
    }

    let pulseVotes = { green: 0, yellow: 0, red: 0 };
    if (row.pulseVotesJson) {
      try { pulseVotes = JSON.parse(row.pulseVotesJson); } catch (e) {}
    }

    let teams = [];
    if (row.teamsJson) {
      try { teams = JSON.parse(row.teamsJson); } catch (e) {}
    }

    return {
      pin: row.pin,
      hostToken: row.hostToken,
      status: row.status,
      mode: row.mode,
      quizMode: row.quizMode,
      quizSet,
      pretestData,
      pulseVotes,
      pulseRound: row.pulseRound || 1,
      teamsEnabled: Boolean(row.teamsEnabled),
      teams,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  } catch (err) {
    console.error('[DB Error] getRoom:', err.message);
    return null;
  }
}

/**
 * Get all room snapshots
 * @returns {Array<object>}
 */
function getAllRooms() {
  try {
    const d = getDb();
    const rows = d.prepare('SELECT * FROM rooms ORDER BY updatedAt DESC').all();
    return rows.map(row => {
      let quizSet = null;
      if (row.quizSetJson) {
        try { quizSet = JSON.parse(row.quizSetJson); } catch (e) {}
      }

      let pretestData = null;
      if (row.pretestDataJson) {
        try { pretestData = JSON.parse(row.pretestDataJson); } catch (e) {}
      }

      let pulseVotes = { green: 0, yellow: 0, red: 0 };
      if (row.pulseVotesJson) {
        try { pulseVotes = JSON.parse(row.pulseVotesJson); } catch (e) {}
      }

      let teams = [];
      if (row.teamsJson) {
        try { teams = JSON.parse(row.teamsJson); } catch (e) {}
      }

      return {
        pin: row.pin,
        hostToken: row.hostToken,
        status: row.status,
        mode: row.mode,
        quizMode: row.quizMode,
        quizSet,
        pretestData,
        pulseVotes,
        pulseRound: row.pulseRound || 1,
        teamsEnabled: Boolean(row.teamsEnabled),
        teams,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
    });
  } catch (err) {
    console.error('[DB Error] getAllRooms:', err.message);
    return [];
  }
}

/**
 * Delete a room snapshot from SQLite
 * @param {string} pin
 * @returns {boolean}
 */
function deleteRoom(pin) {
  if (!pin) return false;
  try {
    const d = getDb();
    d.prepare('DELETE FROM roster_players WHERE pin = ?').run(String(pin));
    const res = d.prepare('DELETE FROM rooms WHERE pin = ?').run(String(pin));
    return res.changes > 0;
  } catch (err) {
    console.error('[DB Error] deleteRoom:', err.message);
    return false;
  }
}

/**
 * Save or update a single player in the roster
 * @param {string} pin
 * @param {object} player
 */
function saveRosterPlayer(pin, player) {
  if (!pin || !player) return { success: false, error: 'PIN and player data required' };
  const playerId = player.playerId || player.id;
  if (!playerId) return { success: false, error: 'Player ID required' };

  try {
    const d = getDb();
    const stmt = d.prepare(`
      INSERT INTO roster_players (
        pin, playerId, name, avatar, teamId,
        pretestScore, pretestAccuracy, posttestScore, posttestAccuracy,
        hasPretest, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
      ON CONFLICT(pin, playerId) DO UPDATE SET
        name = COALESCE(excluded.name, roster_players.name),
        avatar = COALESCE(excluded.avatar, roster_players.avatar),
        teamId = COALESCE(excluded.teamId, roster_players.teamId),
        pretestScore = CASE WHEN excluded.hasPretest = 1 THEN excluded.pretestScore ELSE roster_players.pretestScore END,
        pretestAccuracy = CASE WHEN excluded.hasPretest = 1 THEN excluded.pretestAccuracy ELSE roster_players.pretestAccuracy END,
        posttestScore = CASE WHEN excluded.posttestScore != 0 THEN excluded.posttestScore ELSE roster_players.posttestScore END,
        posttestAccuracy = CASE WHEN excluded.posttestAccuracy != 0 THEN excluded.posttestAccuracy ELSE roster_players.posttestAccuracy END,
        hasPretest = CASE WHEN excluded.hasPretest = 1 THEN 1 ELSE roster_players.hasPretest END,
        updatedAt = excluded.updatedAt;
    `);

    const hasPretest = (player.hasPretest || player.pretestScore !== undefined || player.score !== undefined) ? 1 : 0;
    const pretestScore = player.pretestScore ?? player.score ?? 0;
    const pretestAccuracy = player.pretestAccuracy ?? player.accuracy ?? player.accuracyPct ?? 0;
    const posttestScore = player.posttestScore ?? 0;
    const posttestAccuracy = player.posttestAccuracy ?? 0;

    stmt.run(
      String(pin),
      String(playerId),
      player.name || 'Anonymous',
      player.avatar || '0291dcc0ce.svg',
      player.teamId || null,
      Number(pretestScore) || 0,
      Number(pretestAccuracy) || 0,
      Number(posttestScore) || 0,
      Number(posttestAccuracy) || 0,
      hasPretest,
      Date.now()
    );

    return { success: true };
  } catch (err) {
    console.error('[DB Error] saveRosterPlayer:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save pretest scores snapshot for players
 * Supports signatures:
 * - savePretestRoster(pin, playerScores)
 * - savePretestRoster(pin, pretestData, playerScores)
 * @param {string} pin
 * @param {object|Array} arg2 - pretestData object OR playerScores array
 * @param {Array} [arg3] - playerScores array (if arg2 is pretestData)
 */
function savePretestRoster(pin, arg2, arg3) {
  if (!pin) return { success: false, error: 'Missing PIN' };

  let scores = [];
  let pretestData = null;

  if (Array.isArray(arg2) || arg2 instanceof Map) {
    scores = Array.isArray(arg2) ? arg2 : Array.from(arg2.values());
    pretestData = (arg3 && typeof arg3 === 'object') ? arg3 : null;
  } else if (arg2 && typeof arg2 === 'object') {
    pretestData = arg2;
    if (Array.isArray(arg3) || arg3 instanceof Map) {
      scores = Array.isArray(arg3) ? arg3 : Array.from(arg3.values());
    } else if (Array.isArray(arg2.playerScores)) {
      scores = arg2.playerScores;
    } else if (Array.isArray(arg2.scores)) {
      scores = arg2.scores;
    }
  }

  try {
    const d = getDb();
    const now = Date.now();

    // If pretestData provided, update rooms table if room exists
    if (pretestData) {
      try {
        d.prepare('UPDATE rooms SET pretestDataJson = ?, updatedAt = ? WHERE pin = ?')
         .run(JSON.stringify(pretestData), now, String(pin));
      } catch (e) {}
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return { success: true, count: 0 };
    }

    const stmt = d.prepare(`
      INSERT INTO roster_players (
        pin, playerId, name, avatar, teamId,
        pretestScore, pretestAccuracy, posttestScore, posttestAccuracy,
        hasPretest, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, 0, 0,
        1, ?
      )
      ON CONFLICT(pin, playerId) DO UPDATE SET
        name = COALESCE(excluded.name, roster_players.name),
        avatar = COALESCE(excluded.avatar, roster_players.avatar),
        teamId = COALESCE(excluded.teamId, roster_players.teamId),
        pretestScore = excluded.pretestScore,
        pretestAccuracy = excluded.pretestAccuracy,
        hasPretest = 1,
        updatedAt = excluded.updatedAt;
    `);

    d.exec('BEGIN TRANSACTION');
    try {
      for (const p of scores) {
        const playerId = p.playerId || p.id;
        if (!playerId) continue;

        stmt.run(
          String(pin),
          String(playerId),
          p.name || 'Anonymous',
          p.avatar || '0291dcc0ce.svg',
          p.teamId || null,
          Number(p.score ?? p.pretestScore ?? 0),
          Number(p.accuracyPct ?? p.accuracy ?? p.pretestAccuracy ?? 0),
          now
        );
      }
      d.exec('COMMIT');
    } catch (txErr) {
      d.exec('ROLLBACK');
      throw txErr;
    }

    return { success: true, count: scores.length };
  } catch (err) {
    console.error('[DB Error] savePretestRoster:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save player pretest helper
 * @param {string} pin
 * @param {object|Array} playerPretestData
 */
function savePlayerPretest(pin, playerPretestData) {
  if (Array.isArray(playerPretestData)) {
    return savePretestRoster(pin, playerPretestData);
  }
  return saveRosterPlayer(pin, { ...playerPretestData, hasPretest: 1 });
}

/**
 * Get roster of players who completed pretest or registered in this PIN
 * @param {string} pin
 * @returns {Array<object>}
 */
function getRosterByPin(pin) {
  if (!pin) return [];
  try {
    const d = getDb();
    const rows = d.prepare(`
      SELECT playerId, name, avatar, teamId, pretestScore, pretestAccuracy, posttestScore, posttestAccuracy, hasPretest, updatedAt
      FROM roster_players
      WHERE pin = ?
      ORDER BY pretestScore DESC, name COLLATE NOCASE ASC
    `).all(String(pin));

    return rows.map(r => ({
      playerId: r.playerId,
      name: r.name,
      avatar: r.avatar,
      teamId: r.teamId,
      pretestScore: r.pretestScore,
      pretestAccuracy: r.pretestAccuracy,
      posttestScore: r.posttestScore,
      posttestAccuracy: r.posttestAccuracy,
      hasPretest: Boolean(r.hasPretest),
      updatedAt: r.updatedAt
    }));
  } catch (err) {
    console.error('[DB Error] getRosterByPin:', err.message);
    return [];
  }
}

/**
 * Close database connection
 */
function closeDb() {
  if (db) {
    try {
      db.close();
    } catch (e) {}
    db = null;
    activeDbPath = null;
  }
}

// Aliases for system specification compliance
const saveRoomSnapshot = saveRoom;
const getRoomSnapshot = getRoom;
const deleteRoomSnapshot = deleteRoom;

// Self test when run directly
function runSelfTest() {
  const assert = require('node:assert/strict');
  console.log('--- Running db.js Self Test ---');

  initDb(':memory:');

  // 1. Test saveRoom & getRoom
  const testRoom = {
    pin: '123456',
    hostToken: 'token-abc',
    status: 'LOBBY',
    mode: 'QUIZ',
    quizMode: 'PRETEST',
    quizSet: { id: 'q1', title: 'Test Quiz', questions: [{ id: 'q1-1', questionText: 'Q1' }] },
    pretestData: { completed: true, averageScore: 85 },
    pulseVotes: { green: 5, yellow: 2, red: 1 },
    pulseRound: 2,
    teamsEnabled: true,
    teams: [{ id: 't1', name: 'Team Alpha', color: '#ff0000', memberIds: ['p1'] }]
  };

  const saveRes = saveRoom(testRoom);
  assert.equal(saveRes.success, true, 'saveRoom should succeed');

  const loadedRoom = getRoom('123456');
  assert.ok(loadedRoom, 'getRoom should return saved room');
  assert.equal(loadedRoom.pin, '123456');
  assert.equal(loadedRoom.hostToken, 'token-abc');
  assert.equal(loadedRoom.quizMode, 'PRETEST');
  assert.equal(loadedRoom.pulseRound, 2);
  assert.equal(loadedRoom.teamsEnabled, true);
  assert.equal(loadedRoom.quizSet.title, 'Test Quiz');
  assert.equal(loadedRoom.pulseVotes.green, 5);
  assert.equal(loadedRoom.teams[0].name, 'Team Alpha');
  console.log('[PASS] saveRoom & getRoom verified');

  // 2. Test saveRosterPlayer
  const p1 = {
    playerId: 'p1',
    name: 'Somchai',
    avatar: 'avatar1.png',
    teamId: 't1',
    pretestScore: 100,
    pretestAccuracy: 95.5
  };
  saveRosterPlayer('123456', p1);

  // 3. Test savePretestRoster batch
  const batchScores = [
    { playerId: 'p1', name: 'Somchai', score: 120, accuracyPct: 100 },
    { playerId: 'p2', name: 'Somsri', score: 90, accuracyPct: 80 }
  ];
  savePretestRoster('123456', { playerScores: batchScores });

  const roster = getRosterByPin('123456');
  assert.equal(roster.length, 2, 'Roster should contain 2 players');
  assert.equal(roster[0].playerId, 'p1', 'Somchai with score 120 should be first');
  assert.equal(roster[0].pretestScore, 120);
  assert.equal(roster[0].pretestAccuracy, 100);
  assert.equal(roster[0].hasPretest, true);
  assert.equal(roster[1].playerId, 'p2');
  console.log('[PASS] saveRosterPlayer & savePretestRoster verified');

  // 4. Test getAllRooms
  const allRooms = getAllRooms();
  assert.equal(allRooms.length, 1, 'getAllRooms should return 1 room');
  assert.equal(allRooms[0].pin, '123456');
  console.log('[PASS] getAllRooms verified');

  // 5. Test deleteRoom
  const deleted = deleteRoom('123456');
  assert.equal(deleted, true, 'deleteRoom should return true');
  const checkDeleted = getRoom('123456');
  assert.equal(checkDeleted, null, 'Deleted room should be null');
  console.log('[PASS] deleteRoom verified');

  closeDb();
  console.log('🎉 All db.js Self Tests Passed Successfully!');
}

if (require.main === module) {
  runSelfTest();
}

module.exports = {
  DB_PATH,
  DATA_DIR,
  initDb,
  getDb,
  initSchema,
  saveRoom,
  saveRoomSnapshot,
  getRoom,
  getRoomSnapshot,
  getAllRooms,
  deleteRoom,
  deleteRoomSnapshot,
  saveRosterPlayer,
  savePretestRoster,
  savePlayerPretest,
  getRosterByPin,
  closeDb,
  runSelfTest
};
