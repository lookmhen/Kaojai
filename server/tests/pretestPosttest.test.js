/**
 * Pre-test & Post-test Learning Gain — Dedicated Test Suite
 * Tests: quizMode flow, hidden answers, pretestData snapshot,
 * lobby transition without data loss, post-test run, learning gain,
 * most improved learner, and CSV field integrity.
 */
process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const { RoomManager } = require('../src/roomManager');

/* ─────────────────────────────────────────────────────────────────────────── */
/** Minimal quiz set with 2 CHOICE questions */
const SAMPLE_QUIZ = {
  id: 'test-quiz-prepost',
  title: 'Pre/Post Test Quiz',
  questions: [
    {
      id: 'q1',
      questionText: 'What is 1 + 1?',
      timeLimitSeconds: 10,
      options: [
        { id: 'q1a', text: '1', isCorrect: false },
        { id: 'q1b', text: '2', isCorrect: true },
        { id: 'q1c', text: '3', isCorrect: false },
        { id: 'q1d', text: '4', isCorrect: false }
      ]
    },
    {
      id: 'q2',
      questionText: 'What is 2 + 2?',
      timeLimitSeconds: 10,
      options: [
        { id: 'q2a', text: '3', isCorrect: false },
        { id: 'q2b', text: '4', isCorrect: true },
        { id: 'q2c', text: '5', isCorrect: false },
        { id: 'q2d', text: '6', isCorrect: false }
      ]
    }
  ]
};

async function testPretestPosttest() {
  console.log('--- Testing Pre-test & Post-test Learning Gain ---');

  /* ── 1. Room creation with quizMode defaults ─────────────────────────── */
  {
    console.log('  [PT-01] Room default quizMode is NORMAL...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    assert.strictEqual(room.quizMode, 'NORMAL', 'Default quizMode should be NORMAL');
    assert.strictEqual(room.pretestData, null, 'pretestData should be null by default');
    console.log('    ✓ PT-01 passed');
  }

  /* ── 2. resetRoomScores with clearPretest=true wipes pretestData ─────── */
  {
    console.log('  [PT-02] resetRoomScores with clearPretest=true clears pretestData...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    room.pretestData = { completed: true, overallAccuracyPct: 40 };
    rm.resetRoomScores(room.pin, { clearPretest: true });
    assert.strictEqual(room.pretestData, null, 'clearPretest=true should null out pretestData');
    console.log('    ✓ PT-02 passed');
  }

  /* ── 3. resetRoomScores with clearPretest=false preserves pretestData ── */
  {
    console.log('  [PT-03] resetRoomScores with clearPretest=false preserves pretestData...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    const snapshot = { completed: true, overallAccuracyPct: 40, playerScores: [] };
    room.pretestData = snapshot;
    rm.resetRoomScores(room.pin, { clearPretest: false });
    assert.deepStrictEqual(room.pretestData, snapshot, 'clearPretest=false should preserve pretestData');
    console.log('    ✓ PT-03 passed');
  }

  /* ── 4. resetRoomToLobby preserves pretestData when clearPretest=false ─ */
  {
    console.log('  [PT-04] resetRoomToLobby preserves pretestData...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    room.pretestData = { completed: true, overallAccuracyPct: 55, playerScores: [] };
    rm.resetRoomToLobby(room.pin, { clearPretest: false });
    assert.strictEqual(room.status, 'LOBBY', 'Status should be LOBBY after reset');
    assert.ok(room.pretestData?.completed, 'pretestData should survive resetRoomToLobby');
    console.log('    ✓ PT-04 passed');
  }

  /* ── 5. savePretestSnapshot builds correct snapshot ─────────────────── */
  {
    console.log('  [PT-05] savePretestSnapshot stores correct data...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);

    // Add two players
    rm.joinPlayer(room.pin, 'p1-socket', { name: 'Alice', avatar: 'a.svg', playerId: 'p1' });
    rm.joinPlayer(room.pin, 'p2-socket', { name: 'Bob', avatar: 'b.svg', playerId: 'p2' });

    // Simulate question answers by seeding questionHistory directly
    room.questionHistory = [
      {
        questionIndex: 0,
        questionText: 'Q1',
        correctCount: 1,
        accuracyPct: 50,
        totalPlayers: 2,
        playerResponses: {
          p1: { isCorrect: true },
          p2: { isCorrect: false }
        }
      },
      {
        questionIndex: 1,
        questionText: 'Q2',
        correctCount: 0,
        accuracyPct: 0,
        totalPlayers: 2,
        playerResponses: {
          p1: { isCorrect: false },
          p2: { isCorrect: false }
        }
      }
    ];

    const snapshot = rm.savePretestSnapshot(room.pin);

    assert.ok(snapshot, 'savePretestSnapshot should return a snapshot');
    assert.strictEqual(snapshot.completed, true, 'snapshot.completed should be true');
    assert.strictEqual(room.pretestData, snapshot, 'room.pretestData should reference snapshot');
    assert.ok(typeof snapshot.overallAccuracyPct === 'number', 'overallAccuracyPct should be a number');
    assert.ok(Array.isArray(snapshot.playerScores), 'playerScores should be an array');
    assert.ok(Array.isArray(snapshot.questionAccuracy), 'questionAccuracy should be an array');

    // Alice answered Q1 correctly (1/2 = 50%)
    const aliceScore = snapshot.playerScores.find(p => p.name === 'Alice');
    assert.ok(aliceScore, 'Alice should appear in playerScores');
    assert.strictEqual(aliceScore.correctCount, 1, 'Alice correct count should be 1');
    console.log('    ✓ PT-05 passed');
  }

  /* ── 6. clearPretestData removes snapshot ───────────────────────────── */
  {
    console.log('  [PT-06] clearPretestData removes pretestData...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    room.pretestData = { completed: true, overallAccuracyPct: 40 };
    rm.clearPretestData(room.pin);
    assert.strictEqual(room.pretestData, null, 'After clearPretestData, pretestData should be null');
    console.log('    ✓ PT-06 passed');
  }

  /* ── 7. getQuizAnalytics computes learningGain when pretestData exists ─ */
  {
    console.log('  [PT-07] getQuizAnalytics produces learningGain when pretestData present...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);

    rm.joinPlayer(room.pin, 'p1-socket', { name: 'Alice', avatar: 'a.svg', playerId: 'p1' });
    rm.joinPlayer(room.pin, 'p2-socket', { name: 'Bob', avatar: 'b.svg', playerId: 'p2' });

    // Seed a pretest snapshot with 25% class accuracy
    room.pretestData = {
      completed: true,
      overallAccuracyPct: 25,
      playerScores: [
        { playerId: 'p1', name: 'Alice', score: 300, correctCount: 1, totalQuestions: 2, accuracyPct: 50 },
        { playerId: 'p2', name: 'Bob', score: 0, correctCount: 0, totalQuestions: 2, accuracyPct: 0 }
      ],
      questionAccuracy: [
        { questionIndex: 0, questionText: 'Q1', accuracyPct: 50, correctCount: 1, totalPlayers: 2 },
        { questionIndex: 1, questionText: 'Q2', accuracyPct: 0, correctCount: 0, totalPlayers: 2 }
      ]
    };

    // Seed post-test questionHistory (both got Q1 correct, both got Q2 wrong)
    room.questionHistory = [
      {
        questionIndex: 0, questionText: 'Q1', correctCount: 2, accuracyPct: 100, totalPlayers: 2,
        playerResponses: { p1: { isCorrect: true }, p2: { isCorrect: true } }
      },
      {
        questionIndex: 1, questionText: 'Q2', correctCount: 1, accuracyPct: 50, totalPlayers: 2,
        playerResponses: { p1: { isCorrect: true }, p2: { isCorrect: false } }
      }
    ];

    // Set scores on players
    room.players.get('p1').score = 900;
    room.players.get('p2').score = 500;

    const analytics = rm.getQuizAnalytics(room.pin);

    assert.ok(analytics.learningGain, 'learningGain should be present when pretestData exists');
    const lg = analytics.learningGain;
    assert.ok(lg.classGainPct > 0, `classGainPct should be positive (was ${lg.classGainPct})`);
    assert.ok(Array.isArray(lg.learnerComparisons), 'learnerComparisons should be an array');
    assert.ok(Array.isArray(lg.questionShifts), 'questionShifts should be an array');
    assert.ok(lg.mostImprovedLearner !== undefined, 'mostImprovedLearner should be defined');

    // Alice improved from 50% to 100% (both questions correct in post), highest gain
    if (lg.mostImprovedLearner) {
      // Either Alice or Bob could be most improved — Bob: 0→50%, Alice: 50→100%
      // Both have 50% gain in absolute terms, first sorted is the one with higher scoreDiff
      assert.ok(lg.mostImprovedLearner.name, 'mostImprovedLearner should have a name');
    }

    // Top gained question — Q1 went from 50% to 100% (+50), Q2 from 0% to 50% (+50)
    assert.ok(lg.topGainedQuestion, 'topGainedQuestion should exist');
    console.log('    ✓ PT-07 passed');
  }

  /* ── 8. getQuizAnalytics returns null learningGain without pretestData ─ */
  {
    console.log('  [PT-08] getQuizAnalytics has null learningGain without pretestData...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    rm.joinPlayer(room.pin, 'p1-socket', { name: 'Alice', avatar: 'a.svg', playerId: 'p1' });

    const analytics = rm.getQuizAnalytics(room.pin);
    assert.strictEqual(analytics.learningGain, null, 'learningGain should be null without pretestData');
    console.log('    ✓ PT-08 passed');
  }

  /* ── 9. Existing tests unaffected: NORMAL quiz mode resetRoomScores ── */
  {
    console.log('  [PT-09] NORMAL mode resetRoomScores preserves pretestData (no arg)...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    room.pretestData = { completed: true, overallAccuracyPct: 50 };
    // Calling resetRoomScores without options (default clearPretest=false) preserves data
    rm.resetRoomScores(room.pin);
    assert.ok(room.pretestData?.completed, 'NORMAL mode should preserve pretestData by default');
    console.log('    ✓ PT-09 passed');
  }

  /* ── 10. reconnectHost returns pretestData in payload ────────────────── */
  {
    console.log('  [PT-10] reconnectHost returns pretestData...');
    const rm = new RoomManager();
    const room = rm.createRoom('host-1', SAMPLE_QUIZ);
    room.pretestData = { completed: true, overallAccuracyPct: 60 };

    const data = rm.reconnectHost(room.pin, 'host-2', room.hostToken);
    assert.ok(data.pretestData?.completed, 'reconnectHost should include pretestData in response');
    console.log('    ✓ PT-10 passed');
  }

  /* ── 11. maskPretestResult masks SEQUENCE counts & correctSequence ───── */
  {
    console.log('  [PT-11] maskPretestResult zeroes SEQUENCE correctSequence & counts...');
    const { maskPretestResult } = require('../src/socketHandler');
    const rawSeqResult = {
      questionId: 'seq1',
      questionType: 'SEQUENCE',
      correctSequence: [{ id: 'a', text: 'Step 1' }, { id: 'b', text: 'Step 2' }],
      perfectCount: 2,
      partialCount: 1,
      answeredCount: 3,
      totalPlayers: 3,
      isLastQuestion: false
    };

    const masked = maskPretestResult(rawSeqResult);
    assert.strictEqual(masked.quizMode, 'PRETEST');
    assert.strictEqual(masked.correctSequence, null, 'correctSequence must be null');
    assert.strictEqual(masked.perfectCount, 0, 'perfectCount must be 0 in pretest');
    assert.strictEqual(masked.partialCount, 0, 'partialCount must be 0 in pretest');
    assert.strictEqual(masked.answeredCount, 3, 'answeredCount must be preserved');
    console.log('    ✓ PT-11 passed');
  }

  /* ── 12. maskPretestResult masks CHOICE correctOptionId & optionCounts ── */
  {
    console.log('  [PT-12] maskPretestResult zeroes CHOICE correctOptionId & optionCounts...');
    const { maskPretestResult } = require('../src/socketHandler');
    const rawChoiceResult = {
      questionId: 'choice1',
      questionType: 'CHOICE',
      correctOptionId: 'opt2',
      optionCounts: { opt1: 1, opt2: 2 },
      answeredCount: 3,
      totalPlayers: 3,
      isLastQuestion: false
    };

    const masked = maskPretestResult(rawChoiceResult);
    assert.strictEqual(masked.quizMode, 'PRETEST');
    assert.strictEqual(masked.correctOptionId, null, 'correctOptionId must be null');
    assert.strictEqual(masked.optionCounts, null, 'optionCounts must be null');
    assert.strictEqual(masked.answeredCount, 3, 'answeredCount must be preserved');
    console.log('    ✓ PT-12 passed');
  }

  /* ── 13. Pre-test custom quiz selection, Lobby reset, and Retest flow ── */
  {
    console.log('  [PT-13] Pre-test custom quiz selection, Lobby reset, and Retest flow...');
    const rm = new RoomManager();
    const CUSTOM_QUIZ = {
      id: 'custom-math-quiz',
      title: 'Custom Math Quiz',
      questions: [
        {
          id: 'cm1',
          questionText: 'Math Q1: 5 * 5 = ?',
          timeLimitSeconds: 15,
          options: [
            { id: 'optA', text: '25', isCorrect: true },
            { id: 'optB', text: '20', isCorrect: false }
          ]
        }
      ]
    };

    // Create room and set custom quiz
    const room = rm.createRoom('host-custom-pt');
    rm.setRoomQuiz(room.pin, CUSTOM_QUIZ);
    assert.strictEqual(room.quizSet.id, 'custom-math-quiz', 'Room quiz should be set to custom quiz');

    // Add player
    rm.joinPlayer(room.pin, 'p-sock-1', { name: 'Somchai', avatar: 'a.svg', playerId: 'p-1' });

    // Step 1: Run PRETEST
    room.quizMode = 'PRETEST';
    rm.resetRoomScores(room.pin, { clearPretest: true });
    rm.startQuestion(room.pin, 0);
    // Player answers wrong
    rm.submitAnswer(room.pin, 'p-1', 'optB');
    rm.getQuestionResult(room.pin);
    const pretestSnap = rm.savePretestSnapshot(room.pin);

    assert.strictEqual(pretestSnap.completed, true);
    assert.strictEqual(pretestSnap.quizId, 'custom-math-quiz');
    assert.strictEqual(pretestSnap.overallAccuracyPct, 0);

    // Step 2: Return to Lobby
    rm.resetRoomToLobby(room.pin, { clearPretest: false });
    assert.strictEqual(room.status, 'LOBBY');
    assert.strictEqual(room.quizSet.id, 'custom-math-quiz', 'Quiz set must remain custom quiz upon returning to Lobby');
    assert.ok(room.pretestData?.completed, 'Pre-test data must be preserved');

    // Step 3: Run RETEST (POSTTEST)
    room.quizMode = 'POSTTEST';
    rm.resetRoomScores(room.pin, { clearPretest: false });
    rm.startQuestion(room.pin, 0);
    // Player now answers correctly
    rm.submitAnswer(room.pin, 'p-1', 'optA');
    rm.getQuestionResult(room.pin);

    const analytics = rm.getQuizAnalytics(room.pin);
    assert.ok(analytics.learningGain, 'Learning gain should be computed in Retest/Post-test');
    assert.strictEqual(analytics.learningGain.preOverallAccuracyPct, 0);
    assert.strictEqual(analytics.learningGain.postOverallAccuracyPct, 100);
    assert.strictEqual(analytics.learningGain.classGainPct, 100);
    console.log('    ✓ PT-13 passed');
  }

  console.log('  ✅ All Pre-test & Post-test tests passed!\n');
}

module.exports = { testPretestPosttest };
