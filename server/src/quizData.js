const fs = require('fs');
const path = require('path');

const INITIAL_SEED_QUIZZES = [
  {
    id: "quiz-1",
    title: "แบบทดสอบทบทวนความรู้การทำงาน (General Work Review)",
    description: "ทดสอบความเข้าใจเกี่ยวกับกระบวนการทำงานและเป้าหมายองค์กร",
    questions: [
      {
        id: "q1",
        questionType: "CHOICE",
        questionText: "หลักการ 5ส. ในการจัดระเบียบสถานที่ทำงานประกอบด้วยอะไรเป็นอันดับแรก?",
        timeLimitSeconds: 20,
        imageUrl: "",
        options: [
          { id: "opt1", text: "สะสาง (Sort)", isCorrect: true },
          { id: "opt2", text: "สะดวก (Set in order)", isCorrect: false },
          { id: "opt3", text: "สะอาด (Shine)", isCorrect: false },
          { id: "opt4", text: "สร้างมาตรฐาน (Standardize)", isCorrect: false }
        ]
      },
      {
        id: "q2",
        questionType: "CHOICE",
        questionText: "การสื่อสารที่ดีในการทำงานร่วมกันควรเน้นเรื่องใดมากที่สุด?",
        timeLimitSeconds: 20,
        imageUrl: "",
        options: [
          { id: "opt1", text: "ความชัดเจนและความโปร่งใส", isCorrect: true },
          { id: "opt2", text: "ความเร็วโดยไม่ตรวจทาน", isCorrect: false },
          { id: "opt3", text: "การสั่งงานฝ่ายเดียว", isCorrect: false },
          { id: "opt4", text: "การส่งอีเมลอย่างเดียว", isCorrect: false }
        ]
      },
      {
        id: "q3",
        questionType: "SEQUENCE",
        questionText: "จงเรียงลำดับขั้นตอนมาตรฐานการแก้ปัญหา Network Incident (SOP)",
        timeLimitSeconds: 30,
        imageUrl: "",
        sequenceItems: [
          { id: "seq1", text: "รับแจ้งเหตุและระบุขอบเขตผลกระทบ (Triage & Assess)" },
          { id: "seq2", text: "ตรวจสอบสถานะอุปกรณ์และวิเคราะห์ Logs (Diagnose)" },
          { id: "seq3", text: "ดำเนินการแก้ไขหรือ Failover ระบบสำรอง (Mitigate)" },
          { id: "seq4", text: "ทดสอบความเสถียรและความพร้อมใช้งาน (Verify)" },
          { id: "seq5", text: "สรุปรายงานและบันทึกบทเรียน Post-Mortem (Document)" }
        ]
      }
    ]
  },
  {
    id: "quiz-2",
    title: "ความรู้ทั่วไปและไอทีน่ารู้ (Tech & Digital Quiz)",
    description: "ทายความรู้รอบตัวด้านไอทีและเทคโนโลยีดิจิทัล",
    questions: [
      {
        id: "q1",
        questionType: "CHOICE",
        questionText: "สัญลักษณ์ HTML ย่อมาจากอะไร?",
        timeLimitSeconds: 20,
        imageUrl: "",
        options: [
          { id: "opt1", text: "HyperText Markup Language", isCorrect: true },
          { id: "opt2", text: "High Tech Multi Language", isCorrect: false },
          { id: "opt3", text: "Hyper Transfer Main Link", isCorrect: false },
          { id: "opt4", text: "Home Tool Management Line", isCorrect: false }
        ]
      }
    ]
  }
];

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'quizzes.json');

let quizStore = [];

function initQuizStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        quizStore = parsed
          .filter(q => q && q.title)
          .map((q, idx) => ({
            ...q,
            id: q.id || `quiz-${Date.now()}-${idx}`,
            description: q.description || ''
          }));
        return;
      }
    }

    // Seed file if not exists or empty
    quizStore = JSON.parse(JSON.stringify(INITIAL_SEED_QUIZZES));
    persistQuizzes();
  } catch (err) {
    console.error('[QuizData Error] Failed to initialize quizzes.json:', err);
    quizStore = JSON.parse(JSON.stringify(INITIAL_SEED_QUIZZES));
  }
}

function persistQuizzes() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(quizStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[QuizData Error] Failed to persist quizzes to disk:', err);
  }
}

// Initial load on server startup
initQuizStore();

function getAllQuizzes() {
  return quizStore;
}

function saveQuiz(quiz) {
  if (!quiz || !quiz.title) {
    throw new Error('ข้อมูลชุดคำถามไม่ถูกต้อง');
  }

  if (!quiz.id) {
    quiz.id = `quiz-${Date.now()}`;
  }

  if (quiz.description === undefined || quiz.description === null) {
    quiz.description = '';
  }

  const existingIdx = quizStore.findIndex(q => q.id === quiz.id);
  if (existingIdx >= 0) {
    quizStore[existingIdx] = quiz;
  } else {
    quizStore.push(quiz);
  }

  persistQuizzes();
  return quiz;
}

function deleteQuiz(quizId) {
  quizStore = quizStore.filter(q => q.id !== quizId);
  persistQuizzes();
  return true;
}

function duplicateQuiz(quizId) {
  const original = quizStore.find(q => q.id === quizId);
  if (!original) return null;

  const duplicated = {
    ...JSON.parse(JSON.stringify(original)),
    id: `quiz-${Date.now()}`,
    title: `${original.title} (คัดลอก)`,
    questions: (original.questions || []).map((q, qIdx) => ({
      ...q,
      id: `q-${Date.now()}-${qIdx + 1}`,
      questionType: q.questionType || (q.sequenceItems ? 'SEQUENCE' : 'CHOICE'),
      options: q.options ? q.options.map((opt, optIdx) => ({
        ...opt,
        id: `opt${optIdx + 1}`
      })) : undefined,
      sequenceItems: q.sequenceItems ? q.sequenceItems.map((item, itemIdx) => ({
        ...item,
        id: `seq-${Date.now()}-${itemIdx + 1}`
      })) : undefined
    }))
  };

  quizStore.push(duplicated);
  persistQuizzes();
  return duplicated;
}

/**
 * Import an array of quizzes.
 * @param {Array} importedList
 * @param {boolean} replaceAll - If true, replaces existing store. If false, merges/upserts by quiz ID.
 */
function importQuizzes(importedList, replaceAll = false) {
  if (!Array.isArray(importedList)) {
    throw new Error('รูปแบบไฟล์ไม่ถูกต้อง: ต้องเป็น Array ของชุดคำถาม');
  }

  // Validate basic schema
  for (const item of importedList) {
    if (!item.title || !Array.isArray(item.questions)) {
      throw new Error(`ชุดคำถาม "${item.title || 'ไม่มีชื่อ'}" มีโครงสร้างไม่ถูกต้อง`);
    }
  }

  if (replaceAll) {
    quizStore = importedList;
  } else {
    for (const item of importedList) {
      const idx = quizStore.findIndex(q => q.id === item.id);
      if (idx >= 0) {
        quizStore[idx] = item;
      } else {
        quizStore.push(item);
      }
    }
  }

  persistQuizzes();
  return quizStore;
}

module.exports = {
  defaultQuizSets: quizStore,
  getAllQuizzes,
  saveQuiz,
  deleteQuiz,
  duplicateQuiz,
  importQuizzes,
  initQuizStore,
  persistQuizzes,
  DATA_FILE
};
