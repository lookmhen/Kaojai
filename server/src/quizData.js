let quizStore = [
  {
    id: "quiz-1",
    title: "แบบทดสอบทบทวนความรู้การทำงาน (General Work Review)",
    description: "ทดสอบความเข้าใจเกี่ยวกับกระบวนการทำงานและเป้าหมายองค์กร",
    questions: [
      {
        id: "q1",
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

function getAllQuizzes() {
  return quizStore;
}

function saveQuiz(quiz) {
  const existingIdx = quizStore.findIndex(q => q.id === quiz.id);
  if (existingIdx >= 0) {
    quizStore[existingIdx] = quiz;
  } else {
    quizStore.push(quiz);
  }
  return quiz;
}

function deleteQuiz(quizId) {
  quizStore = quizStore.filter(q => q.id !== quizId);
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
  return duplicated;
}

module.exports = {
  defaultQuizSets: quizStore,
  getAllQuizzes,
  saveQuiz,
  deleteQuiz,
  duplicateQuiz
};
