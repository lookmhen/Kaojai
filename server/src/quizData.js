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
        questionText: "การสื่อสารที่ดีในการทำงานร่วมกันควรเน้นเรื่องใดมากที่สุด?",
        timeLimitSeconds: 20,
        imageUrl: "",
        options: [
          { id: "opt1", text: "ความชัดเจนและความโปร่งใส", isCorrect: true },
          { id: "opt2", text: "ความเร็วโดยไม่ตรวจทาน", isCorrect: false },
          { id: "opt3", text: "การสั่งงานฝ่ายเดียว", isCorrect: false },
          { id: "opt4", text: "การส่งอีเมลอย่างเดียว", isCorrect: false }
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

module.exports = {
  defaultQuizSets: quizStore,
  getAllQuizzes,
  saveQuiz,
  deleteQuiz
};
