/**
 * Utility to export game leaderboard, in-depth item analysis, and player answer matrix
 * to a UTF-8 with BOM CSV file which displays Thai characters cleanly in Microsoft Excel & Google Sheets.
 */
export function exportGameReportCSV({
  pin,
  leaderboard = [],
  pulseVotes,
  totalPlayers,
  quizAnalytics = null
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH');

  const rows = [];
  const questionHistory = quizAnalytics?.questionHistory || [];
  const totalCount = totalPlayers || leaderboard.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 1: ข้อมูลทั่วไปและการสรุปภาพรวมกิจกรรม (SESSION OVERVIEW)
  // ═════════════════════════════════════════════════════════════════════════════
  rows.push(['═══════════════════════════════════════════════════════════════════════════════']);
  rows.push(['📊 รายงานผลการประเมินและวิเคราะห์การเรียนรู้ (KaoJai Comprehensive Learning Report)']);
  rows.push(['═══════════════════════════════════════════════════════════════════════════════']);
  rows.push(['ชื่อชุดแบบทดสอบ', quizAnalytics?.quizTitle || 'แบบทดสอบ KaoJai']);
  rows.push(['รหัสห้อง (Game PIN)', pin || '-']);
  rows.push(['วันที่จัดกิจกรรม', `${dateStr} เวลา ${timeStr}`]);
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

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 2: ตารางสรุปอันดับผู้เรียน (LEADERBOARD & PLAYER ACCURACY)
  // ═════════════════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 3: การวิเคราะห์ข้อสอบรายข้อ (ITEM ANALYSIS & DISTRACTOR BREAKDOWN)
  // ═════════════════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 4: ตารางคำตอบรายบุคคลแบบละเอียด (PLAYER ANSWER MATRIX)
  // ═════════════════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════════════════
  // SECTION 5: ผลสำรวจความเข้าใจ (TRAINING PULSE SURVEY)
  // ═════════════════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════════════════
  // COMPILE TO UTF-8 BOM CSV STRING
  // ═════════════════════════════════════════════════════════════════════════════
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

  // \uFEFF is UTF-8 Byte Order Mark (BOM) ensuring MS Excel renders Thai characters cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileNameDate = now.toISOString().slice(0, 10);
  const cleanTitle = (quizAnalytics?.quizTitle || 'Game').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_').slice(0, 30);
  link.download = `KaoJai_Report_${cleanTitle}_PIN_${pin || 'Room'}_${fileNameDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
