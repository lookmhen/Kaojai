/**
 * Utility to export game leaderboard and pulse feedback to a UTF-8 with BOM CSV file
 * which displays Thai characters properly in Microsoft Excel and Google Sheets.
 */
export function exportGameReportCSV({ pin, leaderboard = [], pulseVotes, totalPlayers }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH');

  const rows = [];

  // Title & Session Info
  rows.push(['รายงานผลกิจกรรม KaoJai Interactive Response System']);
  rows.push(['วันที่จัดกิจกรรม', `${dateStr} เวลา ${timeStr}`]);
  rows.push(['รหัสห้อง (Game PIN)', pin || '-']);
  rows.push(['จำนวนผู้เข้าร่วมทั้งหมด', `${totalPlayers || leaderboard.length} คน`]);
  rows.push([]); // Empty row

  // Leaderboard Section
  rows.push(['=== สรุปผลคะแนนการตอบคำถาม (Leaderboard) ===']);
  rows.push(['อันดับ (Rank)', 'ชื่อผู้เรียน (Nickname)', 'คะแนนรวม (Score)', 'Avatar', 'สถานะการเชื่อมต่อ']);

  if (leaderboard.length === 0) {
    rows.push(['-', 'ไม่มีข้อมูลคะแนน', 0, '-', '-']);
  } else {
    leaderboard.forEach((player, index) => {
      rows.push([
        index + 1,
        player.name || 'ไม่ระบุชื่อ',
        player.score || 0,
        player.avatar || '-',
        player.connected !== false ? 'ออนไลน์' : 'ออฟไลน์'
      ]);
    });
  }

  rows.push([]); // Empty row

  // Pulse Feedback Section (if pulseVotes data exists)
  if (pulseVotes) {
    const green = pulseVotes.green || 0;
    const yellow = pulseVotes.yellow || 0;
    const red = pulseVotes.red || 0;
    const totalVoted = green + yellow + red;

    const greenPct = totalVoted > 0 ? Math.round((green / totalVoted) * 100) : 0;
    const yellowPct = totalVoted > 0 ? Math.round((yellow / totalVoted) * 100) : 0;
    const redPct = totalVoted > 0 ? Math.round((red / totalVoted) * 100) : 0;

    rows.push(['=== สรุปผลสำรวจความเข้าใจระหว่างการอบรม (Training Pulse) ===']);
    rows.push(['ระดับความเข้าใจ', 'จำนวนผู้เรียน (คน)', 'สัดส่วน (%)']);
    rows.push(['เข้าใจดีเยี่ยม (Clear & Confident) 🟢', green, `${greenPct}%`]);
    rows.push(['ขอตัวอย่างเพิ่มเติม (Need Example) 🟡', yellow, `${yellowPct}%`]);
    rows.push(['ขอให้อธิบายซ้ำอีกครั้ง (Need Recap) 🔴', red, `${redPct}%`]);
    rows.push(['รวมผู้ส่งผลตอบรับ', totalVoted, '100%']);
  }

  // Format as CSV with escape quotes
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
  link.download = `KaoJai_Report_PIN_${pin || 'Game'}_${fileNameDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
