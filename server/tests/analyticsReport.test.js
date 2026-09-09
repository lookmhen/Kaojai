process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const { RoomManager } = require('../src/roomManager');

/**
 * Builds CSV string following the exact structure of exportGameReportCSV (client/src/utils/exportReport.js)
 * allowing server-side unit validation of data representation, BOM, quoting, and accuracy.
 */
function buildReportCSVString({ pin, leaderboard = [], pulseVotes, totalPlayers, quizAnalytics = null }) {
  const rows = [];
  const questionHistory = quizAnalytics?.questionHistory || [];
  const totalCount = totalPlayers || leaderboard.length;

  // SECTION 1: Session Overview
  rows.push(['═══════════════════════════════════════════════════════════════════════════════']);
  rows.push(['📊 รายงานผลการประเมินและวิเคราะห์การเรียนรู้ (KaoJai Comprehensive Learning Report)']);
  rows.push(['═══════════════════════════════════════════════════════════════════════════════']);
  rows.push(['ชื่อชุดแบบทดสอบ', quizAnalytics?.quizTitle || 'แบบทดสอบ KaoJai']);
  rows.push(['รหัสห้อง (Game PIN)', pin || '-']);
  rows.push(['จำนวนผู้เรียนทั้งหมด', `${totalCount} คน`]);
  rows.push(['จำนวนคำถามทั้งหมด', `${quizAnalytics?.totalQuestions || questionHistory.length} ข้อ`]);
  rows.push(['คะแนนเฉลี่ยทั้งห้อง', `${quizAnalytics?.averageScore || 0} คะแนน`]);
  rows.push(['อัตราการตอบถูกทั้งห้อง (Overall Accuracy)', `${quizAnalytics?.overallAccuracyPct ?? 0}%`]);

  if (quizAnalytics?.hardestQuestion) {
    rows.push([
      'ข้อที่ยากที่สุด (ตอบถูกน้อยสุด)',
      `ข้อที่ ${quizAnalytics.hardestQuestion.questionIndex + 1}: "${quizAnalytics.hardestQuestion.questionText}" (ตอบถูก ${quizAnalytics.hardestQuestion.accuracyPct}%)`
    ]);
  }
  if (quizAnalytics?.easiestQuestion) {
    rows.push([
      'ข้อง่ายที่สุด (ตอบถูกมากสุด)',
      `ข้อที่ ${quizAnalytics.easiestQuestion.questionIndex + 1}: "${quizAnalytics.easiestQuestion.questionText}" (ตอบถูก ${quizAnalytics.easiestQuestion.accuracyPct}%)`
    ]);
  }
  rows.push([]);

  // SECTION 2: Leaderboard Summary
  rows.push(['-------------------------------------------------------------------------------']);
  rows.push(['🏆 สรุปอันดับและผลการทดสอบรายบุคคล (Leaderboard Summary)']);
  rows.push(['-------------------------------------------------------------------------------']);
  rows.push([
    'อันดับ',
    'ชื่อผู้เรียน',
    'คะแนนรวม',
    'ตอบถูก (ข้อ)',
    'อัตราตอบถูก (%)',
    'Streak สูงสุด',
    'สถานะ'
  ]);

  if (leaderboard.length === 0) {
    rows.push(['-', 'ไม่มีข้อมูลผู้เรียน', 0, 0, '0%', 0, '-']);
  } else {
    leaderboard.forEach((player, index) => {
      let playerCorrectCount = 0;
      questionHistory.forEach(q => {
        if (q.playerResponses?.[player.playerId]?.isCorrect) {
          playerCorrectCount++;
        }
      });

      const totalQ = questionHistory.length || 1;
      const playerAccPct = Math.round((playerCorrectCount / totalQ) * 100);

      rows.push([
        index + 1,
        player.name || 'ไม่ระบุชื่อ',
        player.score || 0,
        `${playerCorrectCount}/${totalQ}`,
        `${playerAccPct}%`,
        player.highestStreak || 0,
        player.connected !== false ? 'ออนไลน์' : 'ออฟไลน์'
      ]);
    });
  }
  rows.push([]);

  // SECTION 3: Item Analysis
  rows.push(['-------------------------------------------------------------------------------']);
  rows.push(['🔍 การวิเคราะห์ความยากง่ายและสถิติตัวเลือกรายข้อ (Item & Distractor Analysis)']);
  rows.push(['-------------------------------------------------------------------------------']);

  if (questionHistory.length === 0) {
    rows.push(['ไม่มีข้อมูลประวัติคำถามในเซสชันนี้']);
  } else {
    questionHistory.forEach((q, idx) => {
      const qNum = idx + 1;
      const isSeq = q.questionType === 'SEQUENCE';

      rows.push([`[ข้อที่ ${qNum}]`, q.questionText]);
      rows.push(['ประเภทคำถาม', isSeq ? 'Sequence Race (เรียงลำดับขั้นตอน)' : 'ปรนัย 4 ตัวเลือก (Choice)']);
      rows.push(['เวลาที่กำหนด', `${q.timeLimitSeconds || 20} วินาที`]);
      rows.push(['จำนวนผู้ตอบ', `${q.answeredCount || 0} / ${q.totalPlayers || totalCount} คน`]);
      rows.push(['จำนวนคนตอบถูก', `${q.correctCount || 0} คน`]);
      rows.push(['จำนวนคนตอบผิด', `${q.incorrectCount || 0} คน`]);
      rows.push(['อัตราตอบถูก (Accuracy)', `${q.accuracyPct || 0}%`]);

      if (isSeq) {
        rows.push(['ลำดับที่ถูกต้อง 100%', (q.sequenceItems || []).map((s, i) => `${i + 1}.${s.text}`).join(' ➔ ')]);
        rows.push(['ผู้เรียงถูกต้องครบ 100%', `${q.perfectCount || 0} คน`]);
        rows.push(['ผู้เรียงถูกบางส่วน', `${q.partialCount || 0} คน`]);
      } else {
        rows.push(['คำตอบที่ถูกต้อง', q.correctOptionText || '-']);
        rows.push(['--- แจกแจงการเลือกของแต่ละตัวเลือก (Distractor Breakdown) ---']);
        rows.push(['ตัวเลือก', 'ข้อความตัวเลือก', 'สถานะ', 'จำนวนคนเลือก', 'สัดส่วน (%)']);

        const optLabels = ['A', 'B', 'C', 'D'];
        (q.options || []).forEach((opt, oIdx) => {
          const selectedCount = q.optionCounts?.[opt.id] || 0;
          const pct = q.answeredCount > 0 ? Math.round((selectedCount / q.answeredCount) * 100) : 0;
          const letter = optLabels[oIdx] || `${oIdx + 1}`;
          rows.push([
            `ตัวเลือก ${letter}`,
            opt.text,
            opt.isCorrect ? '✓ ข้อที่ถูกต้อง' : 'ตัวลวง',
            `${selectedCount} คน`,
            `${pct}%`
          ]);
        });
      }
      rows.push([]);
    });
  }

  // SECTION 4: Player Detailed Answer Matrix
  if (questionHistory.length > 0 && leaderboard.length > 0) {
    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['📋 ตารางการตอบรายบุคคลทุกข้อ (Player Detailed Answer Matrix)']);
    rows.push(['-------------------------------------------------------------------------------']);

    const matrixHeader = ['ชื่อผู้เรียน', 'คะแนนรวม'];
    questionHistory.forEach((_, idx) => {
      matrixHeader.push(`ข้อ ${idx + 1} (ผล)`);
      matrixHeader.push(`ข้อ ${idx + 1} (คำตอบที่เลือก)`);
      matrixHeader.push(`ข้อ ${idx + 1} (เวลาใช้ไป)`);
    });
    rows.push(matrixHeader);

    leaderboard.forEach(player => {
      const playerRow = [player.name, player.score || 0];

      questionHistory.forEach(q => {
        const resp = q.playerResponses?.[player.playerId];
        if (!resp || !resp.hasAnswered) {
          playerRow.push('❌ ไม่ได้ตอบ');
          playerRow.push('-');
          playerRow.push('-');
        } else {
          playerRow.push(resp.isCorrect ? '✓ ถูก' : '✗ ผิด');
          playerRow.push(resp.chosenLabel || '-');
          playerRow.push(`${((resp.timeUsedMs || 0) / 1000).toFixed(1)} วิ`);
        }
      });

      rows.push(playerRow);
    });
    rows.push([]);
  }

  // SECTION 5: Training Pulse Survey
  const effectivePulse = pulseVotes || quizAnalytics?.pulseVotes;
  if (effectivePulse) {
    const green = effectivePulse.green || 0;
    const yellow = effectivePulse.yellow || 0;
    const red = effectivePulse.red || 0;
    const totalVoted = green + yellow + red;

    const greenPct = totalVoted > 0 ? Math.round((green / totalVoted) * 100) : 0;
    const yellowPct = totalVoted > 0 ? Math.round((yellow / totalVoted) * 100) : 0;
    const redPct = totalVoted > 0 ? Math.round((red / totalVoted) * 100) : 0;

    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['💬 ผลสำรวจความเข้าใจระหว่างการอบรม (Training Pulse Survey)']);
    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['ระดับความเข้าใจ', 'จำนวนผู้เรียน (คน)', 'สัดส่วน (%)']);
    rows.push(['เข้าใจดีเยี่ยม (Clear & Confident) 🟢', green, `${greenPct}%`]);
    rows.push(['ขอตัวอย่างเพิ่มเติม (Need Example) 🟡', yellow, `${yellowPct}%`]);
    rows.push(['ขอให้อธิบายซ้ำอีกครั้ง (Need Recap) 🔴', red, `${redPct}%`]);
    rows.push(['รวมผู้ส่งผลตอบรับ', totalVoted, '100%']);
  }

  // Escaping & UTF-8 with BOM
  const csvContent = rows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    )
    .join('\r\n');

  return '\uFEFF' + csvContent;
}

async function testAnalyticsReport() {
  console.log('--- Testing Analytics & CSV Report Generation ---');

  const rm = new RoomManager();
  const testQuiz = {
    id: 'analytics-quiz-1',
    title: 'Analytics & Reporting Test Quiz',
    questions: [
      {
        id: 'q-an-1',
        questionType: 'CHOICE',
        questionText: 'What is the capital of Thailand?',
        timeLimitSeconds: 20,
        options: [
          { id: 'opt-bkk', text: 'Bangkok, "City of Angels"', isCorrect: true },
          { id: 'opt-cnx', text: 'Chiang Mai', isCorrect: false },
          { id: 'opt-hkt', text: 'Phuket', isCorrect: false },
          { id: 'opt-pattaya', text: 'Pattaya', isCorrect: false }
        ]
      },
      {
        id: 'q-an-2',
        questionType: 'CHOICE',
        questionText: 'Which protocol is used for secure web browsing?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-http', text: 'HTTP', isCorrect: false },
          { id: 'opt-https', text: 'HTTPS', isCorrect: true },
          { id: 'opt-ftp', text: 'FTP', isCorrect: false },
          { id: 'opt-telnet', text: 'Telnet', isCorrect: false }
        ]
      },
      {
        id: 'q-an-3',
        questionType: 'SEQUENCE',
        questionText: 'Order SDLC phases from start to end',
        timeLimitSeconds: 25,
        sequenceItems: [
          { id: 's-req', text: 'Requirements' },
          { id: 's-des', text: 'Design' },
          { id: 's-dev', text: 'Development' },
          { id: 's-tst', text: 'Testing' }
        ]
      }
    ]
  };

  const room = rm.createRoom('host-analytics', testQuiz);
  const p1 = rm.joinPlayer(room.pin, 's-p1', { name: 'Somchai, Developer' }).player;
  const p2 = rm.joinPlayer(room.pin, 's-p2', { name: 'Manee "Tech" Lead' }).player;
  const p3 = rm.joinPlayer(room.pin, 's-p3', { name: 'Chujai QA' }).player;

  // Question 0: CHOICE
  // p1 and p2 answer correctly, p3 answers incorrectly
  console.log('  Simulating Question 0 (CHOICE)...');
  rm.startQuestion(room.pin, 0);
  rm.submitAnswer(room.pin, p1.playerId, 'opt-bkk');
  rm.submitAnswer(room.pin, p2.playerId, 'opt-bkk');
  rm.submitAnswer(room.pin, p3.playerId, 'opt-cnx');
  const resQ0 = rm.getQuestionResult(room.pin);

  assert.strictEqual(resQ0.answeredCount, 3);
  assert.strictEqual(resQ0.optionCounts['opt-bkk'], 2);
  assert.strictEqual(resQ0.optionCounts['opt-cnx'], 1);

  // Question 1: CHOICE
  // p1 answers correctly (streak 2)
  // p3 answers correctly (comeback bonus)
  // p2 answers incorrectly (streak reset)
  console.log('  Simulating Question 1 (CHOICE & Comeback)...');
  rm.startQuestion(room.pin, 1);
  const ansP1 = rm.submitAnswer(room.pin, p1.playerId, 'opt-https');
  assert.strictEqual(ansP1.streak, 2);
  assert.strictEqual(ansP1.streakBonus, 50);

  const ansP2 = rm.submitAnswer(room.pin, p2.playerId, 'opt-http');
  assert.strictEqual(ansP2.isCorrect, false);

  const ansP3 = rm.submitAnswer(room.pin, p3.playerId, 'opt-https');
  assert.strictEqual(ansP3.isCorrect, true);
  assert.strictEqual(ansP3.isComeback, true);
  assert.strictEqual(ansP3.comebackBonus, 40);
  rm.getQuestionResult(room.pin);

  // Question 2: SEQUENCE
  // p1 perfect sequence
  // p2 partial sequence
  // p3 times out / does not submit
  console.log('  Simulating Question 2 (SEQUENCE & Timeout)...');
  rm.startQuestion(room.pin, 2);
  rm.submitAnswer(room.pin, p1.playerId, ['s-req', 's-des', 's-dev', 's-tst']);
  rm.submitAnswer(room.pin, p2.playerId, ['s-req', 's-des', 's-tst', 's-dev']); // 2 matching
  // p3 does not submit
  const resQ2 = rm.getQuestionResult(room.pin);
  assert.strictEqual(resQ2.perfectCount, 1);
  assert.strictEqual(resQ2.partialCount, 1);
  assert.strictEqual(p3.streak, 0, 'Timeout player should have streak reset to 0');

  // Submit Pulse Votes
  rm.submitPulse(room.pin, p1.playerId, 'green');
  rm.submitPulse(room.pin, p2.playerId, 'yellow');
  rm.submitPulse(room.pin, p3.playerId, 'green');

  // 1. Verify getQuizAnalytics logic
  console.log('  Testing roomManager.getQuizAnalytics()...');
  const analytics = rm.getQuizAnalytics(room.pin);

  assert.ok(analytics, 'getQuizAnalytics should return an analytics object');
  assert.strictEqual(analytics.totalQuestions, 3);
  assert.strictEqual(analytics.totalPlayers, 3);
  assert.ok(analytics.averageScore > 0, 'Average score should be calculated');
  assert.ok(analytics.overallAccuracyPct > 0 && analytics.overallAccuracyPct <= 100);
  assert.ok(analytics.hardestQuestion, 'Should identify hardest question');
  assert.ok(analytics.easiestQuestion, 'Should identify easiest question');
  assert.strictEqual(analytics.questionHistory.length, 3, 'Should record history for all 3 questions');

  // Leaderboard ranking check
  assert.strictEqual(analytics.leaderboard[0].playerId, p1.playerId, 'p1 should be rank #1');
  assert.strictEqual(analytics.leaderboard[0].highestStreak, 3);

  // Distractor analysis in question 0
  const q0History = analytics.questionHistory[0];
  assert.strictEqual(q0History.correctCount, 2);
  assert.strictEqual(q0History.incorrectCount, 1);
  assert.strictEqual(q0History.accuracyPct, 67);

  console.log('    ✓ getQuizAnalytics calculations passed');

  // 2. Verify CSV compilation logic & Excel compatibility
  console.log('  Testing CSV compilation, UTF-8 BOM, and cell escaping...');
  const csvString = buildReportCSVString({
    pin: room.pin,
    leaderboard: analytics.leaderboard,
    pulseVotes: analytics.pulseVotes,
    totalPlayers: analytics.totalPlayers,
    quizAnalytics: analytics
  });

  // Verify UTF-8 BOM is at byte 0
  assert.strictEqual(csvString.charCodeAt(0), 0xFEFF, 'CSV must start with UTF-8 BOM (0xFEFF)');

  // Verify Section headers are present
  assert.ok(csvString.includes('รายงานผลการประเมินและวิเคราะห์การเรียนรู้'), 'Must contain Section 1 header');
  assert.ok(csvString.includes('สรุปอันดับและผลการทดสอบรายบุคคล'), 'Must contain Section 2 header');
  assert.ok(csvString.includes('การวิเคราะห์ความยากง่ายและสถิติตัวเลือกรายข้อ'), 'Must contain Section 3 header');
  assert.ok(csvString.includes('ตารางการตอบรายบุคคลทุกข้อ'), 'Must contain Section 4 header');
  assert.ok(csvString.includes('ผลสำรวจความเข้าใจระหว่างการอบรม'), 'Must contain Section 5 header');

  // Verify Player Names with quotes and commas are escaped cleanly
  // e.g. Manee "Tech" Lead -> "Manee ""Tech"" Lead"
  assert.ok(csvString.includes('"Manee ""Tech"" Lead"'), 'Double quotes in player name must be escaped as ""');
  assert.ok(csvString.includes('"Somchai, Developer"'), 'Commas in player name must be quoted');

  // Verify Choice Distractor Text with quotes and commas
  // Bangkok, "City of Angels" -> "Bangkok, ""City of Angels"""
  assert.ok(csvString.includes('Bangkok, ""City of Angels""'), 'Quotes and commas in options must be escaped');

  // Verify CRLF line endings
  assert.ok(csvString.includes('\r\n'), 'CSV must use standard CRLF line breaks');

  console.log('    ✓ CSV compilation, UTF-8 BOM, and cell escaping passed');
  console.log('✅ Analytics & CSV Report tests passed cleanly!');
}

module.exports = { testAnalyticsReport, buildReportCSVString };

if (require.main === module) {
  testAnalyticsReport().catch(err => {
    console.error('❌ Analytics report test failed:', err);
    process.exit(1);
  });
}
