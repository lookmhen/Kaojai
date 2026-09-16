import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

/**
 * Common data structure preparation for Excel & PDF reports
 */
function prepareReportData({ pin, leaderboard = [], pulseVotes, totalPlayers, quizAnalytics = null, pretestData = null }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH');
  const questionHistory = quizAnalytics?.questionHistory || [];
  const totalCount = totalPlayers || leaderboard.length;
  const cleanTitle = (quizAnalytics?.quizTitle || 'Game').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_').slice(0, 30);
  const fileNameDate = now.toISOString().slice(0, 10);

  return {
    now,
    dateStr,
    timeStr,
    pin: pin || '-',
    title: quizAnalytics?.quizTitle || 'แบบทดสอบ KaoJai',
    cleanTitle,
    fileNameDate,
    totalCount,
    questionHistory,
    totalQuestions: quizAnalytics?.totalQuestions || questionHistory.length,
    averageScore: quizAnalytics?.averageScore || 0,
    overallAccuracyPct: quizAnalytics?.overallAccuracyPct ?? 0,
    hardestQuestion: quizAnalytics?.hardestQuestion,
    easiestQuestion: quizAnalytics?.easiestQuestion,
    leaderboard,
    pulseVotes: pulseVotes || quizAnalytics?.pulseVotes,
    pulseRound: quizAnalytics?.pulseRound || 1,
    pulseHistory: quizAnalytics?.pulseHistory || [],
    learningGain: quizAnalytics?.learningGain || null,
    pretestData
  };
}

/**
 * 📊 EXPORT TO REAL MICROSOFT EXCEL (.xlsx) WITH MULTI-SHEET WORKBOOK
 */
export function exportGameReportExcel(params) {
  const data = prepareReportData(params);
  const wb = XLSX.utils.book_new();

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 1: ภาพรวมกิจกรรม (Overview)
  // ─────────────────────────────────────────────────────────────────────────────
  const overviewRows = [
    ['📊 รายงานสรุปผลกิจกรรมการประเมินการเรียนรู้ KaoJai'],
    ['ระบบประเมินและพัฒนาความเข้าใจในการอบรมแบบเรียลไทม์'],
    [],
    ['หัวข้อ / กิจกรรม', data.title],
    ['รหัสห้อง (Game PIN)', data.pin],
    ['วันที่จัดกิจกรรม', `${data.dateStr} เวลา ${data.timeStr}`],
    ['จำนวนผู้เรียนทั้งหมด', `${data.totalCount} คน`],
    ['จำนวนข้อคำถามทั้งหมด', `${data.totalQuestions} ข้อ`],
    ['คะแนนเฉลี่ยทั้งห้อง', `${data.averageScore} คะแนน`],
    ['ความแม่นยำรวมทั้งห้อง (Overall Accuracy)', `${data.overallAccuracyPct}%`],
    []
  ];

  if (data.hardestQuestion) {
    overviewRows.push([
      'ข้อที่ยากที่สุด (ตอบถูกน้อยสุด)',
      `ข้อ ${data.hardestQuestion.questionIndex + 1}: ${data.hardestQuestion.questionText} (ตอบถูก ${data.hardestQuestion.accuracyPct}%)`
    ]);
  }
  if (data.easiestQuestion) {
    overviewRows.push([
      'ข้อง่ายที่สุด (ตอบถูกมากสุด)',
      `ข้อ ${data.easiestQuestion.questionIndex + 1}: ${data.easiestQuestion.questionText} (ตอบถูก ${data.easiestQuestion.accuracyPct}%)`
    ]);
  }

  // If learning gain exists, include in overview
  if (data.learningGain) {
    overviewRows.push([]);
    overviewRows.push(['ผลสัมฤทธิ์ทางการเรียนรู้ (Pre-test vs Post-test Learning Gain)']);
    overviewRows.push(['Pre-test Accuracy', `${data.learningGain.preOverallAccuracyPct}%`]);
    overviewRows.push(['Post-test Accuracy', `${data.learningGain.postOverallAccuracyPct}%`]);
    overviewRows.push(['Learning Gain', `${data.learningGain.classGainPct >= 0 ? '+' : ''}${data.learningGain.classGainPct}%`]);
    if (data.learningGain.mostImprovedLearner) {
      overviewRows.push([
        'ผู้เรียนที่พัฒนาสูงสุด',
        `${data.learningGain.mostImprovedLearner.name} (+${data.learningGain.mostImprovedLearner.accuracyDiff}%)`
      ]);
    }
  }

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'ภาพรวมกิจกรรม');

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 2: อันดับคะแนนผู้เรียน (Leaderboard)
  // ─────────────────────────────────────────────────────────────────────────────
  const lbHeaders = ['อันดับ', 'ชื่อผู้เรียน', 'คะแนนรวม', 'ตอบถูก (ข้อ)', 'อัตราตอบถูก (%)', 'Streak สูงสุด', 'สถานะ'];
  const lbRows = [lbHeaders];

  if (data.leaderboard.length === 0) {
    lbRows.push(['-', 'ไม่มีข้อมูลผู้เรียน', 0, '0/0', '0%', 0, '-']);
  } else {
    data.leaderboard.forEach((player, idx) => {
      let correctCount = 0;
      data.questionHistory.forEach(q => {
        if (q.playerResponses?.[player.playerId]?.isCorrect) {
          correctCount++;
        }
      });
      const totalQ = data.questionHistory.length || 1;
      const accPct = Math.round((correctCount / totalQ) * 100);

      lbRows.push([
        idx + 1,
        player.name || 'ไม่ระบุชื่อ',
        player.score || 0,
        `${correctCount}/${totalQ}`,
        `${accPct}%`,
        player.highestStreak || 0,
        player.connected !== false ? 'ออนไลน์' : 'ออฟไลน์'
      ]);
    });
  }

  const wsLeaderboard = XLSX.utils.aoa_to_sheet(lbRows);
  wsLeaderboard['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsLeaderboard, 'อันดับคะแนน');

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 3: วิเคราะห์ข้อสอบรายข้อ (Item Analysis)
  // ─────────────────────────────────────────────────────────────────────────────
  const itemRows = [
    ['ข้อที่', 'คำถาม', 'ประเภทคำถาม', 'เวลา (วิ)', 'คนส่งคำตอบ', 'คนตอบถูก', 'คนตอบผิด', 'อัตราตอบถูก (%)', 'เฉลย / ลำดับที่ถูกต้อง']
  ];

  if (data.questionHistory.length > 0) {
    data.questionHistory.forEach((q, idx) => {
      const isSeq = q.questionType === 'SEQUENCE';
      const answerSolution = isSeq
        ? (q.sequenceItems || []).map((s, i) => `${i + 1}.${s.text}`).join(' ➔ ')
        : (q.correctOptionText || '-');

      itemRows.push([
        idx + 1,
        q.questionText || '',
        isSeq ? 'Sequence Race (เรียงลำดับ)' : 'ปรนัย (Choice)',
        q.timeLimitSeconds || 20,
        q.answeredCount || 0,
        q.correctCount || 0,
        q.incorrectCount || 0,
        `${q.accuracyPct || 0}%`,
        answerSolution
      ]);
    });
  }

  const wsItem = XLSX.utils.aoa_to_sheet(itemRows);
  wsItem['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsItem, 'วิเคราะห์รายข้อ');

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 4: ตารางตอบรายบุคคล (Answer Matrix)
  // ─────────────────────────────────────────────────────────────────────────────
  if (data.questionHistory.length > 0 && data.leaderboard.length > 0) {
    const matrixHeader = ['ชื่อผู้เรียน', 'คะแนนรวม'];
    data.questionHistory.forEach((_, idx) => {
      matrixHeader.push(`ข้อ ${idx + 1} (ผล)`);
      matrixHeader.push(`ข้อ ${idx + 1} (คำตอบ)`);
      matrixHeader.push(`ข้อ ${idx + 1} (เวลาใช้)`);
    });

    const matrixRows = [matrixHeader];
    data.leaderboard.forEach(player => {
      const pRow = [player.name, player.score || 0];
      data.questionHistory.forEach(q => {
        const resp = q.playerResponses?.[player.playerId];
        if (!resp || !resp.hasAnswered) {
          pRow.push('ไม่ได้ตอบ');
          pRow.push('-');
          pRow.push('-');
        } else {
          pRow.push(resp.isCorrect ? 'ถูก' : 'ผิด');
          pRow.push(resp.chosenLabel || '-');
          pRow.push(`${((resp.timeUsedMs || 0) / 1000).toFixed(1)}s`);
        }
      });
      matrixRows.push(pRow);
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
    wsMatrix['!cols'] = [{ wch: 22 }, { wch: 12 }, ...data.questionHistory.flatMap(() => [{ wch: 12 }, { wch: 25 }, { wch: 10 }])];
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'การตอบรายบุคคล');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 5: ผลประเมินความเข้าใจ (Pulse History)
  // ─────────────────────────────────────────────────────────────────────────────
  if (data.pulseVotes || data.pulseHistory.length > 0) {
    const pulseRows = [
      ['รอบที่', 'เข้าใจดี (🟢)', 'ขอตัวอย่าง (🟡)', 'ทบทวนใหม่ (🔴)', 'รวมผู้ตอบ', 'ดัชนีความเข้าใจ (Clarity Index)']
    ];

    data.pulseHistory.forEach(h => {
      pulseRows.push([
        `รอบที่ ${h.round}`,
        `${h.pulseVotes?.green || 0} คน`,
        `${h.pulseVotes?.yellow || 0} คน`,
        `${h.pulseVotes?.red || 0} คน`,
        `${h.totalVoted || 0} คน`,
        `${h.clarityIndex || 0}%`
      ]);
    });

    if (data.pulseVotes) {
      const g = data.pulseVotes.green || 0;
      const y = data.pulseVotes.yellow || 0;
      const r = data.pulseVotes.red || 0;
      const tot = g + y + r;
      const clar = tot > 0 ? Math.round(((g * 1.0 + y * 0.5) / tot) * 100) : 0;
      pulseRows.push([
        `รอบที่ ${data.pulseRound} (ล่าสุด)`,
        `${g} คน`,
        `${y} คน`,
        `${r} คน`,
        `${tot} คน`,
        `${clar}%`
      ]);
    }

    const wsPulse = XLSX.utils.aoa_to_sheet(pulseRows);
    wsPulse['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsPulse, 'ผลประเมินความเข้าใจ');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 6: ผลสัมฤทธิ์ Pre-test vs Post-test (Learning Gain)
  // ─────────────────────────────────────────────────────────────────────────────
  if (data.learningGain) {
    const lgRows = [
      ['ตัวชี้วัดการเรียนรู้', 'ค่าสถิติ'],
      ['Pre-test Accuracy (%)', `${data.learningGain.preOverallAccuracyPct}%`],
      ['Post-test Accuracy (%)', `${data.learningGain.postOverallAccuracyPct}%`],
      ['Learning Gain (%)', `${data.learningGain.classGainPct >= 0 ? '+' : ''}${data.learningGain.classGainPct}%`],
      [],
      ['รายชื่อผู้เรียน', 'Pre-test Score', 'Post-test Score', 'ส่วนต่างคะแนน', 'Pre Accuracy', 'Post Accuracy', 'Accuracy Gain']
    ];

    if (Array.isArray(data.learningGain.learnerComparisons)) {
      data.learningGain.learnerComparisons.forEach(lc => {
        lgRows.push([
          lc.name || 'ไม่ระบุชื่อ',
          lc.preScore || 0,
          lc.postScore || 0,
          `${lc.scoreDiff >= 0 ? '+' : ''}${lc.scoreDiff || 0}`,
          `${lc.preAccuracyPct || 0}%`,
          `${lc.postAccuracyPct || 0}%`,
          `${lc.accuracyDiff >= 0 ? '+' : ''}${lc.accuracyDiff || 0}%`
        ]);
      });
    }

    const wsLG = XLSX.utils.aoa_to_sheet(lgRows);
    wsLG['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsLG, 'ผลสัมฤทธิ์ Pre-Post');
  }

  // Write file to download
  const excelFileName = `KaoJai_Report_${data.cleanTitle}_PIN_${data.pin}_${data.fileNameDate}.xlsx`;
  XLSX.writeFile(wb, excelFileName);
}

/**
 * 📄 EXPORT TO CLEAN BEAUTIFULLY-STYLED PDF REPORT (.pdf)
 */
export async function exportGameReportPDF(params) {
  const data = prepareReportData(params);

  // Generate HTML Template for PDF rendering with modern clean typography and responsive layout
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.padding = '32px 36px';
  container.style.background = '#FFFFFF';
  container.style.color = '#1E293B';
  container.style.fontFamily = "'Prompt', 'Sarabun', 'Segoe UI', sans-serif";
  container.style.lineHeight = '1.45';

  container.innerHTML = `
    <div style="border-bottom: 3px solid #E2E8F0; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-size: 24px; font-weight: 800; color: #C05621; display: flex; align-items: center; gap: 8px;">
          🧡 KaoJai (เข้าใจ)
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #1E293B; margin-top: 4px;">
          รายงานสรุปผลการประเมินและการเรียนรู้ (Comprehensive Learning Report)
        </div>
        <div style="font-size: 13px; color: #64748B; margin-top: 2px;">
          ชุดแบบทดสอบ: <strong>${data.title}</strong>
        </div>
      </div>
      <div style="text-align: right; font-size: 12px; color: #64748B;">
        <div>Game PIN: <strong style="color: #1E293B; font-size: 14px;">${data.pin}</strong></div>
        <div>วันที่: ${data.dateStr}</div>
        <div>เวลา: ${data.timeStr}</div>
      </div>
    </div>

    <!-- Overview KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; text-align: center;">
        <div style="font-size: 11px; color: #64748B; font-weight: 700;">ผู้เรียนทั้งหมด</div>
        <div style="font-size: 22px; font-weight: 900; color: #1E293B; margin-top: 2px;">${data.totalCount} คน</div>
      </div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; text-align: center;">
        <div style="font-size: 11px; color: #64748B; font-weight: 700;">จำนวนข้อคำถาม</div>
        <div style="font-size: 22px; font-weight: 900; color: #1E293B; margin-top: 2px;">${data.totalQuestions} ข้อ</div>
      </div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; text-align: center;">
        <div style="font-size: 11px; color: #64748B; font-weight: 700;">คะแนนเฉลี่ย</div>
        <div style="font-size: 22px; font-weight: 900; color: #1E293B; margin-top: 2px;">${data.averageScore} pts</div>
      </div>
      <div style="background: ${data.overallAccuracyPct >= 70 ? '#DCFCE7' : '#FEF3C7'}; border: 1px solid ${data.overallAccuracyPct >= 70 ? '#86EFAC' : '#FDE68A'}; border-radius: 12px; padding: 14px; text-align: center;">
        <div style="font-size: 11px; color: ${data.overallAccuracyPct >= 70 ? '#166534' : '#92400E'}; font-weight: 700;">ความแม่นยำรวม</div>
        <div style="font-size: 22px; font-weight: 900; color: ${data.overallAccuracyPct >= 70 ? '#166534' : '#92400E'}; margin-top: 2px;">${data.overallAccuracyPct}%</div>
      </div>
    </div>

    <!-- Pre vs Post Learning Gain (if available) -->
    ${data.learningGain ? `
      <div style="background: #F5F3FF; border: 1.5px solid #DDD6FE; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 14px; font-weight: 800; color: #6D28D9; margin-bottom: 10px;">
          📈 ผลสัมฤทธิ์ทางการเรียนรู้ (Pre vs Post Learning Gain)
        </div>
        <div style="display: flex; gap: 14px; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 11px; color: #1D4ED8; font-weight: 700;">Pre-test Accuracy</div>
            <div style="font-size: 20px; font-weight: 900; color: #1D4ED8;">${data.learningGain.preOverallAccuracyPct}%</div>
          </div>
          <div style="font-size: 20px; color: #8B5CF6; align-self: center;">➔</div>
          <div>
            <div style="font-size: 11px; color: #7C3AED; font-weight: 700;">Post-test Accuracy</div>
            <div style="font-size: 20px; font-weight: 900; color: #7C3AED;">${data.learningGain.postOverallAccuracyPct}%</div>
          </div>
          <div style="font-size: 20px; color: #8B5CF6; align-self: center;">=</div>
          <div>
            <div style="font-size: 11px; color: ${data.learningGain.classGainPct >= 0 ? '#166534' : '#991B1B'}; font-weight: 700;">Learning Gain</div>
            <div style="font-size: 20px; font-weight: 900; color: ${data.learningGain.classGainPct >= 0 ? '#166534' : '#991B1B'};">
              ${data.learningGain.classGainPct >= 0 ? '+' : ''}${data.learningGain.classGainPct}%
            </div>
          </div>
        </div>
        ${data.learningGain.mostImprovedLearner ? `
          <div style="margin-top: 10px; font-size: 12px; color: #5B21B6; font-weight: 700; text-align: center;">
            🌟 ผู้เรียนที่มีพัฒนาการสูงสุด: <strong>${data.learningGain.mostImprovedLearner.name}</strong> (+${data.learningGain.mostImprovedLearner.accuracyDiff}%)
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Leaderboard Table -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 15px; font-weight: 800; color: #1E293B; margin-bottom: 10px; border-left: 4px solid #C05621; padding-left: 8px;">
        🏆 สรุปอันดับคะแนนผู้เรียน (Leaderboard)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #F1F5F9; color: #475569; text-align: left;">
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1;">อันดับ</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1;">ชื่อผู้เรียน</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: right;">คะแนนรวม</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: center;">ตอบถูก</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: right;">ความแม่นยำ</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: center;">Streak</th>
          </tr>
        </thead>
        <tbody>
          ${data.leaderboard.slice(0, 15).map((player, idx) => {
            let pCorrect = 0;
            data.questionHistory.forEach(q => {
              if (q.playerResponses?.[player.playerId]?.isCorrect) pCorrect++;
            });
            const tQ = data.questionHistory.length || 1;
            const pAcc = Math.round((pCorrect / tQ) * 100);
            return `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                <td style="padding: 8px 10px; font-weight: 800; color: ${idx === 0 ? '#D97706' : idx === 1 ? '#475569' : idx === 2 ? '#B45309' : '#64748B'};">
                  ${idx + 1}
                </td>
                <td style="padding: 8px 10px; font-weight: 700;">${player.name || 'ไม่ระบุชื่อ'}</td>
                <td style="padding: 8px 10px; font-weight: 800; text-align: right; color: #1E293B;">${(player.score || 0).toLocaleString()}</td>
                <td style="padding: 8px 10px; text-align: center;">${pCorrect}/${tQ}</td>
                <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: ${pAcc >= 70 ? '#166534' : '#B45309'};">${pAcc}%</td>
                <td style="padding: 8px 10px; text-align: center;">${player.highestStreak || 0}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Question Overview -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 15px; font-weight: 800; color: #1E293B; margin-bottom: 10px; border-left: 4px solid #2563EB; padding-left: 8px;">
        🔍 สรุปผลการตอบรายข้อ (Question Analysis)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #F1F5F9; color: #475569; text-align: left;">
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; width: 40px;">ข้อ</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1;">คำถาม</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: center;">ประเภท</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: center;">ตอบถูก/ทั้งหมด</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #CBD5E1; text-align: right;">อัตราตอบถูก</th>
          </tr>
        </thead>
        <tbody>
          ${data.questionHistory.map((q, qIdx) => `
            <tr style="border-bottom: 1px solid #E2E8F0; background: ${qIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
              <td style="padding: 8px 10px; font-weight: 800; color: #64748B;">${qIdx + 1}</td>
              <td style="padding: 8px 10px; font-weight: 600;">${q.questionText || ''}</td>
              <td style="padding: 8px 10px; text-align: center; font-size: 11px;">${q.questionType === 'SEQUENCE' ? 'Sequence' : 'Choice'}</td>
              <td style="padding: 8px 10px; text-align: center;">${q.correctCount || 0} / ${q.answeredCount || 0}</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: ${(q.accuracyPct || 0) >= 70 ? '#166534' : '#B45309'};">${q.accuracyPct || 0}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Pulse Survey (if any) -->
    ${data.pulseVotes ? `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: 800; color: #1E293B; margin-bottom: 10px;">
          💬 สรุปผลสำรวจความเข้าใจ (Pulse Check-in)
        </div>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 12px; color: #166534; font-weight: 700;">🟢 เข้าใจดีเยี่ยม</div>
            <div style="font-size: 18px; font-weight: 900; color: #166534; margin-top: 4px;">${data.pulseVotes.green || 0} คน</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #B45309; font-weight: 700;">🟡 ขอตัวอย่างเพิ่ม</div>
            <div style="font-size: 18px; font-weight: 900; color: #B45309; margin-top: 4px;">${data.pulseVotes.yellow || 0} คน</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #991B1B; font-weight: 700;">🔴 ขอทบทวนใหม่</div>
            <div style="font-size: 18px; font-weight: 900; color: #991B1B; margin-top: 4px;">${data.pulseVotes.red || 0} คน</div>
          </div>
        </div>
      </div>
    ` : ''}

    <div style="border-top: 1px solid #E2E8F0; padding-top: 12px; text-align: center; font-size: 11px; color: #94A3B8;">
      สร้างโดยระบบ KaoJai Interactive Real-time Classroom Assessment · วันที่ดาวน์โหลด: ${data.dateStr} ${data.timeStr}
    </div>
  `;

  document.body.appendChild(container);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `KaoJai_Report_${data.cleanTitle}_PIN_${data.pin}_${data.fileNameDate}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Backward-compatible CSV exporter
 */
export function exportGameReportCSV(params) {
  const data = prepareReportData(params);
  const rows = [];

  rows.push(['═══════════════════════════════════════════════════════════════════════════════']);
  rows.push(['📊 รายงานผลการประเมินและวิเคราะห์การเรียนรู้ (KaoJai Comprehensive Learning Report)']);
  rows.push(['═══════════════════════════════════════════════════════════════════════════════']);
  rows.push(['ชื่อชุดแบบทดสอบ', data.title]);
  rows.push(['รหัสห้อง (Game PIN)', data.pin]);
  rows.push(['วันที่จัดกิจกรรม', `${data.dateStr} เวลา ${data.timeStr}`]);
  rows.push(['จำนวนผู้เรียนทั้งหมด', `${data.totalCount} คน`]);
  rows.push(['จำนวนคำถามทั้งหมด', `${data.totalQuestions} ข้อ`]);
  rows.push(['คะแนนเฉลี่ยทั้งห้อง', `${data.averageScore} คะแนน`]);
  rows.push(['อัตราการตอบถูกทั้งห้อง (Overall Accuracy)', `${data.overallAccuracyPct}%`]);

  if (data.hardestQuestion) {
    rows.push([
      'ข้อที่ยากที่สุด (ตอบถูกน้อยสุด)',
      `ข้อที่ ${data.hardestQuestion.questionIndex + 1}: "${data.hardestQuestion.questionText}" (ตอบถูก ${data.hardestQuestion.accuracyPct}%)`
    ]);
  }
  if (data.easiestQuestion) {
    rows.push([
      'ข้อง่ายที่สุด (ตอบถูกมากสุด)',
      `ข้อที่ ${data.easiestQuestion.questionIndex + 1}: "${data.easiestQuestion.questionText}" (ตอบถูก ${data.easiestQuestion.accuracyPct}%)`
    ]);
  }
  rows.push([]);

  // SECTION 2: Leaderboard Summary
  rows.push(['-------------------------------------------------------------------------------']);
  rows.push(['🏆 สรุปอันดับและผลการทดสอบรายบุคคล (Leaderboard Summary)']);
  rows.push(['-------------------------------------------------------------------------------']);
  rows.push(['อันดับ', 'ชื่อผู้เรียน', 'คะแนนรวม', 'ตอบถูก (ข้อ)', 'อัตราตอบถูก (%)', 'Streak สูงสุด', 'สถานะ']);

  if (data.leaderboard.length === 0) {
    rows.push(['-', 'ไม่มีข้อมูลผู้เรียน', 0, 0, '0%', 0, '-']);
  } else {
    data.leaderboard.forEach((player, index) => {
      let playerCorrectCount = 0;
      data.questionHistory.forEach(q => {
        if (q.playerResponses?.[player.playerId]?.isCorrect) {
          playerCorrectCount++;
        }
      });
      const totalQ = data.questionHistory.length || 1;
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

  if (data.questionHistory.length === 0) {
    rows.push(['ไม่มีข้อมูลประวัติคำถามในเซสชันนี้']);
  } else {
    data.questionHistory.forEach((q, idx) => {
      const qNum = idx + 1;
      const isSeq = q.questionType === 'SEQUENCE';

      rows.push([`[ข้อที่ ${qNum}]`, q.questionText]);
      rows.push(['ประเภทคำถาม', isSeq ? 'Sequence Race (เรียงลำดับขั้นตอน)' : 'ปรนัย 4 ตัวเลือก (Choice)']);
      rows.push(['เวลาที่กำหนด', `${q.timeLimitSeconds || 20} วินาที`]);
      rows.push(['จำนวนผู้ตอบ', `${q.answeredCount || 0} / ${q.totalPlayers || data.totalCount} คน`]);
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

  // SECTION 4: Answer Matrix
  if (data.questionHistory.length > 0 && data.leaderboard.length > 0) {
    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['📋 ตารางการตอบรายบุคคลทุกข้อ (Player Detailed Answer Matrix)']);
    rows.push(['-------------------------------------------------------------------------------']);

    const matrixHeader = ['ชื่อผู้เรียน', 'คะแนนรวม'];
    data.questionHistory.forEach((_, idx) => {
      matrixHeader.push(`ข้อ ${idx + 1} (ผล)`);
      matrixHeader.push(`ข้อ ${idx + 1} (คำตอบที่เลือก)`);
      matrixHeader.push(`ข้อ ${idx + 1} (เวลาใช้ไป)`);
    });
    rows.push(matrixHeader);

    data.leaderboard.forEach(player => {
      const playerRow = [player.name, player.score || 0];

      data.questionHistory.forEach(q => {
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

  // SECTION 5: Pulse Survey
  if (data.pulseVotes || data.pulseHistory.length > 0) {
    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['💬 ผลสำรวจความเข้าใจระหว่างการอบรม (Training Pulse Survey - Multi-Round History)']);
    rows.push(['-------------------------------------------------------------------------------']);

    if (data.pulseHistory.length > 0) {
      rows.push(['--- สรุปภาพรวมทุกรอบที่ประเมิน (Pulse Check-in Rounds Summary) ---']);
      rows.push(['รอบที่', 'เข้าใจดี (🟢)', 'ขอตัวอย่าง (🟡)', 'ทบทวนใหม่ (🔴)', 'รวมผู้ตอบ', 'ดัชนีความเข้าใจ (Clarity Index)']);

      data.pulseHistory.forEach(h => {
        rows.push([
          `รอบที่ ${h.round}`,
          `${h.pulseVotes?.green || 0} คน`,
          `${h.pulseVotes?.yellow || 0} คน`,
          `${h.pulseVotes?.red || 0} คน`,
          `${h.totalVoted || 0} คน`,
          `${h.clarityIndex || 0}%`
        ]);
      });

      if (data.pulseVotes) {
        const curGreen = data.pulseVotes.green || 0;
        const curYellow = data.pulseVotes.yellow || 0;
        const curRed = data.pulseVotes.red || 0;
        const curTotal = curGreen + curYellow + curRed;
        const curClarity = curTotal > 0
          ? Math.round(((curGreen * 1.0 + curYellow * 0.5) / curTotal) * 100)
          : 0;

        rows.push([
          `รอบที่ ${data.pulseRound} (รอบปัจจุบัน)`,
          `${curGreen} คน`,
          `${curYellow} คน`,
          `${curRed} คน`,
          `${curTotal} คน`,
          `${curClarity}%`
        ]);
      }
      rows.push([]);
    }

    if (data.pulseVotes) {
      const green = data.pulseVotes.green || 0;
      const yellow = data.pulseVotes.yellow || 0;
      const red = data.pulseVotes.red || 0;
      const totalVoted = green + yellow + red;

      const greenPct = totalVoted > 0 ? Math.round((green / totalVoted) * 100) : 0;
      const yellowPct = totalVoted > 0 ? Math.round((yellow / totalVoted) * 100) : 0;
      const redPct = totalVoted > 0 ? Math.round((red / totalVoted) * 100) : 0;

      rows.push([`--- รายละเอียดผลการประเมินรอบปัจจุบัน (รอบที่ ${data.pulseRound}) ---`]);
      rows.push(['ระดับความเข้าใจ', 'จำนวนผู้เรียน (คน)', 'สัดส่วน (%)']);
      rows.push(['เข้าใจดีเยี่ยม (Clear & Confident) 🟢', green, `${greenPct}%`]);
      rows.push(['ขอตัวอย่างเพิ่มเติม (Need Example) 🟡', yellow, `${yellowPct}%`]);
      rows.push(['ขอให้อธิบายซ้ำอีกครั้ง (Need Recap) 🔴', red, `${redPct}%`]);
      rows.push(['รวมผู้ส่งผลตอบรับ', totalVoted, '100%']);
    }
  }

  // SECTION 6: Learning Gain
  if (data.learningGain) {
    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['📈 ผลสัมฤทธิ์ทางการเรียนรู้ Pre-test vs Post-test (Learning Gain Report)']);
    rows.push(['-------------------------------------------------------------------------------']);
    rows.push(['ดัชนีความแม่นยำ Pre-test (%)', `${data.learningGain.preOverallAccuracyPct}%`]);
    rows.push(['ดัชนีความแม่นยำ Post-test (%)', `${data.learningGain.postOverallAccuracyPct}%`]);
    rows.push(['การพัฒนา (Accuracy Gain)', `${data.learningGain.classGainPct >= 0 ? '+' : ''}${data.learningGain.classGainPct}%`]);

    if (data.learningGain.mostImprovedLearner) {
      rows.push([
        '🌟 ผู้เรียนที่พัฒนาได้มากที่สุด (Most Improved)',
        `${data.learningGain.mostImprovedLearner.name} (+${data.learningGain.mostImprovedLearner.accuracyDiff}%)`
      ]);
    }

    if (data.learningGain.topGainedQuestion) {
      rows.push([
        '📈 คำถามที่ผู้เรียนพัฒนาได้มากที่สุด',
        `ข้อที่ ${data.learningGain.topGainedQuestion.questionIndex + 1}: "${data.learningGain.topGainedQuestion.questionText || ''}" (+${data.learningGain.topGainedQuestion.diffPct}%)`
      ]);
    }

    rows.push([]);
    if (Array.isArray(data.learningGain.learnerComparisons) && data.learningGain.learnerComparisons.length > 0) {
      rows.push(['ชื่อผู้เรียน', 'Pre-test Score', 'Post-test Score', 'ส่วนต่างคะแนน', 'Pre Accuracy', 'Post Accuracy', 'Accuracy Gain']);
      data.learningGain.learnerComparisons.forEach(lc => {
        rows.push([
          lc.name || 'ไม่ระบุชื่อ',
          lc.preScore || 0,
          lc.postScore || 0,
          `${lc.scoreDiff >= 0 ? '+' : ''}${lc.scoreDiff || 0}`,
          `${lc.preAccuracyPct || 0}%`,
          `${lc.postAccuracyPct || 0}%`,
          `${lc.accuracyDiff >= 0 ? '+' : ''}${lc.accuracyDiff || 0}%`
        ]);
      });
    }
    rows.push([]);
  }

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

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KaoJai_Report_${data.cleanTitle}_PIN_${data.pin}_${data.fileNameDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
