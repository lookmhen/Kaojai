const defaultQuizSets = [
  {
    id: "quiz-1",
    title: "แบบทดสอบทบทวนความรู้การทำงาน (General Work Review)",
    description: "ทดสอบความเข้าใจเกี่ยวกับกระบวนการทำงานและเป้าหมายองค์กร",
    questions: [
      {
        id: "q1",
        questionText: "หลักการ 5ส. ในการจัดระเบียบสถานที่ทำงานประกอบด้วยอะไรเป็นอันดับแรก?",
        timeLimitSeconds: 20,
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
        options: [
          { id: "opt1", text: "ความชัดเจนและความโปร่งใส", isCorrect: true },
          { id: "opt2", text: "ความเร็วโดยไม่ตรวจทาน", isCorrect: false },
          { id: "opt3", text: "การสั่งงานฝ่ายเดียว", isCorrect: false },
          { id: "opt4", text: "การส่งอีเมลอย่างเดียว", isCorrect: false }
        ]
      },
      {
        id: "q3",
        questionText: "แนวคิดแบบ Agile ให้ความสำคัญกับสิ่งใดมากที่สุด?",
        timeLimitSeconds: 20,
        options: [
          { id: "opt1", text: "การปรับเปลี่ยนตามข้อกำหนดที่เปลี่ยนแปลง", isCorrect: true },
          { id: "opt2", text: "การทำตามแผนเดิมโดยไม่เปลี่ยนแปลง", isCorrect: false },
          { id: "opt3", text: "เอกสารที่สมบูรณ์แบบก่อนลงมือทำ", isCorrect: false },
          { id: "opt4", text: "การเจรจาต่อรองสัญญา", isCorrect: false }
        ]
      },
      {
        id: "q4",
        questionText: "การตอบสนองต่อข้อผิดพลาดในการทำงานควรทำอย่างไร?",
        timeLimitSeconds: 20,
        options: [
          { id: "opt1", text: "วิเคราะห์สาเหตุเชิงลึกและปรับปรุงร่วมกัน (Blameless Retrospective)", isCorrect: true },
          { id: "opt2", text: "หาผู้รับผิดชอบและลงโทษทันที", isCorrect: false },
          { id: "opt3", text: "มองข้ามปัญหาหากผลลัพธ์ยังใช้ได้", isCorrect: false },
          { id: "opt4", text: "ปิดบังข้อมูลไม่ให้ทีมอื่นทราบ", isCorrect: false }
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
        options: [
          { id: "opt1", text: "HyperText Markup Language", isCorrect: true },
          { id: "opt2", text: "High Tech Multi Language", isCorrect: false },
          { id: "opt3", text: "Hyper Transfer Main Link", isCorrect: false },
          { id: "opt4", text: "Home Tool Management Line", isCorrect: false }
        ]
      },
      {
        id: "q2",
        questionText: "ข้อใดคือโปรโตคอลหลักสำหรับการรับส่งข้อมูลเว็บที่มีความปลอดภัย (Encrypted)?",
        timeLimitSeconds: 20,
        options: [
          { id: "opt1", text: "HTTPS", isCorrect: true },
          { id: "opt2", text: "HTTP", isCorrect: false },
          { id: "opt3", text: "FTP", isCorrect: false },
          { id: "opt4", text: "TELNET", isCorrect: false }
        ]
      },
      {
        id: "q3",
        questionText: "ข้อใดไม่ใช่ระบบปฏิบัติการสำหรับสมาร์ทโฟน?",
        timeLimitSeconds: 20,
        options: [
          { id: "opt1", text: "PostgreSQL", isCorrect: true },
          { id: "opt2", text: "Android", isCorrect: false },
          { id: "opt3", text: "iOS", isCorrect: false },
          { id: "opt4", text: "KaiOS", isCorrect: false }
        ]
      }
    ]
  }
];

module.exports = {
  defaultQuizSets
};
