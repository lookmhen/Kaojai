// server/src/aiService.js
// Handles AI Quiz generation using Google Gemini 1.5 Flash REST API with Smart Mock Fallback

// Prefer gemini-flash-latest, with fallback options
const GEMINI_MODELS = [
  'gemini-flash-latest', // ให้ระบบเลือก Flash ตัวล่าสุดที่เสถียร
  'gemini-3.8-flash',    // Fallback หรือเจาะจงรุ่นใหม่
  'gemini-2.5-flash'     // Fallback ตัวสำรองกรณีตัวบนติดโหลดสูง (503)
];

const QUIZ_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'ชื่อชุดแบบทดสอบที่กระชับและดึงดูดความสนใจ' },
    description: { type: 'STRING', description: 'คำอธิบายวัตถุประสงค์และขอบเขตเนื้อหาของชุดแบบทดสอบ' },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          questionType: {
            type: 'STRING',
            enum: ['CHOICE', 'SEQUENCE'],
            description: 'ประเภทคำถาม: CHOICE (ปรนัย 4 ตัวเลือก) หรือ SEQUENCE (จัดลำดับ 3-5 ขั้นตอน)'
          },
          questionText: { type: 'STRING', description: 'โจทย์คำถามที่ชัดเจน ไม่กำกวม' },
          timeLimitSeconds: { type: 'INTEGER', description: 'เวลาที่กำหนดในข้อนี้ (วินาที เช่น 20 หรือ 30)' },
          options: {
            type: 'ARRAY',
            description: 'สำหรับ CHOICE: รายการตัวเลือก 4 ข้อ โดยมี isCorrect: true เพียง 1 ข้อ',
            items: {
              type: 'OBJECT',
              properties: {
                text: { type: 'STRING' },
                isCorrect: { type: 'BOOLEAN' }
              },
              required: ['text', 'isCorrect']
            }
          },
          sequenceItems: {
            type: 'ARRAY',
            description: 'สำหรับ SEQUENCE: รายการ 3-5 ขั้นตอน เรียงตามลำดับที่ถูกต้อง 100% จากต้นไปจบ',
            items: {
              type: 'OBJECT',
              properties: {
                text: { type: 'STRING' }
              },
              required: ['text']
            }
          }
        },
        required: ['questionType', 'questionText', 'timeLimitSeconds']
      }
    }
  },
  required: ['title', 'description', 'questions']
};

function buildSystemPrompt(questionTypes, difficulty, language = 'th') {
  const typeInstruction = questionTypes === 'CHOICE'
    ? '- ให้สร้างเฉพาะคำถามประเภท CHOICE เท่านั้น'
    : questionTypes === 'SEQUENCE'
    ? '- ให้สร้างเฉพาะคำถามประเภท SEQUENCE (จัดลำดับขั้นตอน) เท่านั้น'
    : '- ให้สร้างผสมผสานระหว่าง CHOICE และ SEQUENCE อย่างสมดุล';

  return 'คุณคือ AI Instructional Designer ผู้เชี่ยวชาญการออกแบบข้อสอบ Gamification ของแพลตฟอร์ม "KaoJai (เข้าใจ)"\n' +
    'หน้าที่ของคุณคือออกแบบชุดข้อสอบที่มีคุณภาพสูง ท้าทาย ชวนคิด และส่งคืนโครงสร้าง JSON ตาม Schema ที่กำหนดเท่านั้น\n\n' +
    'กฎเหล็กสำคัญ:\n' +
    '1. ชนิดคำถาม (Question Types):\n' + typeInstruction + '\n' +
    '2. สำหรับคำถามประเภท CHOICE:\n' +
    '   - ต้องมีตัวเลือก options จำนวน 4 ข้อเสมอ\n' +
    '   - ต้องมีตัวเลือกที่ถูกต้อง (isCorrect: true) เพียงข้อเดียวเท่านั้น อีก 3 ข้อเป็น false\n' +
    '   - ช้อยส์ตัวลวงต้องสมเหตุสมผล ไม่กำกวม และไม่ง่ายจนเกินไป\n' +
    '   - กำหนด timeLimitSeconds ระหว่าง 15 ถึง 25 วินาที\n' +
    '3. สำหรับคำถามประเภท SEQUENCE (จัดลำดับขั้นตอน):\n' +
    '   - ต้องกำหนด sequenceItems จำนวน 3 ถึง 5 ขั้นตอน\n' +
    '   - สำคัญที่สุด: คุณต้องเรียงลำดับขั้นตอนใน sequenceItems ตามลำดับที่ถูกต้อง 100% จากแรกสุดไปยังท้ายสุด\n' +
    '   - กำหนด timeLimitSeconds ระหว่าง 30 ถึง 45 วินาที\n' +
    '4. ระดับความยาก: ' + (difficulty || 'medium') + '\n' +
    '5. ภาษา: ใช้ภาษา' + (language === 'en' ? 'อังกฤษ' : 'ไทย') + 'ที่มีสำนวนสละสลวย ชัดเจน กระชับ';
}

function buildUserPrompt(topic, textContent, questionCount) {
  let prompt = 'โปรดสร้างชุดแบบทดสอบจำนวน ' + (questionCount || 5) + ' ข้อ ในหัวข้อ: "' + (topic || 'ความรู้ทั่วไป') + '"\n';
  if (textContent && textContent.trim()) {
    prompt += '\nโดยอ้างอิงและสกัดใจความสำคัญจากเนื้อหาต่อไปนี้:\n"""\n' + textContent.slice(0, 12000) + '\n"""\n';
  }
  return prompt;
}

async function callGeminiApi(systemPrompt, userPrompt, apiKey, timeoutMs = (process.env.NODE_ENV === 'test' ? 5000 : 30000)) {
  const payload = {
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n---\n' + userPrompt }] }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: QUIZ_RESPONSE_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  };

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!res.ok) {
        const errBody = await res.text();
        lastError = new Error(`Gemini API (${model}) returned status ${res.status}: ${errBody}`);
        console.warn(`[AI Service] Model ${model} failed, trying fallback:`, lastError.message);
        continue;
      }

      const data = await res.json();
      const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) {
        throw new Error(`Gemini API (${model}) did not return text content in candidates`);
      }

      return JSON.parse(rawContent);
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

function generateMockQuiz(topic, textContent, questionCount = 5, questionTypes = 'MIXED') {
  const safeTopic = topic && topic.trim() ? topic.trim() : 'ความรู้การทำงานและทักษะการสื่อสาร';
  const count = Math.min(Math.max(Number(questionCount) || 5, 1), 10);
  const questions = [];

  for (let i = 1; i <= count; i++) {
    const wantSequence = questionTypes === 'SEQUENCE' || (questionTypes === 'MIXED' && i % 3 === 0);

    if (wantSequence) {
      questions.push({
        id: 'q-mock-' + Date.now() + '-' + i,
        questionType: 'SEQUENCE',
        questionText: 'จงจัดเรียงลำดับขั้นตอนที่ถูกต้องของ: ' + safeTopic + ' (ข้อที่ ' + i + ')',
        timeLimitSeconds: 30,
        imageUrl: '',
        sequenceItems: [
          { id: 'seq-' + Date.now() + '-1', text: 'ขั้นตอนที่ 1: กำหนดเป้าหมายและรวบรวมข้อมูลสำหรับ ' + safeTopic },
          { id: 'seq-' + Date.now() + '-2', text: 'ขั้นตอนที่ 2: วิเคราะห์แนวทางและวางแผนการดำเนินงาน' },
          { id: 'seq-' + Date.now() + '-3', text: 'ขั้นตอนที่ 3: ลงมือปฏิบัติตามแผนงานที่กำหนดไว้' },
          { id: 'seq-' + Date.now() + '-4', text: 'ขั้นตอนที่ 4: ตรวจสอบและประเมินผลลัพธ์เพื่อพัฒนาต่อเนื่อง' }
        ]
      });
    } else {
      questions.push({
        id: 'q-mock-' + Date.now() + '-' + i,
        questionType: 'CHOICE',
        questionText: 'ประเด็นสำคัญที่สุดเกี่ยวกับ "' + safeTopic + '" ในข้อที่ ' + i + ' คือข้อใด?',
        timeLimitSeconds: 20,
        imageUrl: '',
        options: [
          { id: 'opt1', text: 'แนวทางที่ถูกต้องและเป็นมาตรฐานตามหลักการของ ' + safeTopic, isCorrect: true },
          { id: 'opt2', text: 'การดำเนินการโดยไม่คำนึงถึงผลกระทบต่อผู้อื่น', isCorrect: false },
          { id: 'opt3', text: 'การละเว้นขั้นตอนสำคัญเพื่อเน้นความเร็วสูงสุด', isCorrect: false },
          { id: 'opt4', text: 'การทำงานแบบแยกส่วนโดยไม่ประสานงานร่วมกัน', isCorrect: false }
        ]
      });
    }
  }

  return {
    title: 'แบบทดสอบ: ' + safeTopic + ' (สร้างโดย AI)',
    description: 'ชุดข้อสอบทบทวนและวัดความเข้าใจในหัวข้อ "' + safeTopic + '" พร้อมเฉลยและเกณฑ์มาตรฐาน',
    questions
  };
}

function normalizeAndValidateQuiz(rawQuiz) {
  if (!rawQuiz || typeof rawQuiz !== 'object') {
    throw new Error('โครงสร้างข้อมูลชุดข้อสอบไม่ถูกต้อง');
  }

  const now = Date.now();
  const title = String(rawQuiz.title || 'ชุดแบบทดสอบใหม่').trim();
  const description = String(rawQuiz.description || '').trim();

  let questions = Array.isArray(rawQuiz.questions) ? rawQuiz.questions : [];
  if (questions.length === 0) {
    throw new Error('ชุดข้อสอบไม่มีคำถาม');
  }

  const validatedQuestions = questions.map((q, qIdx) => {
    const qId = q.id || ('q-ai-' + now + '-' + (qIdx + 1));
    const questionText = String(q.questionText || ('คำถามข้อที่ ' + (qIdx + 1))).trim();
    const isSequence = q.questionType === 'SEQUENCE' || Boolean(q.sequenceItems);

    if (isSequence) {
      let seqItems = Array.isArray(q.sequenceItems) ? q.sequenceItems : [];
      if (seqItems.length < 3) {
        seqItems = [
          { text: 'ขั้นตอนเริ่มต้น' },
          { text: 'ขั้นตอนปฏิบัติการ' },
          { text: 'ขั้นตอนตรวจสอบ' }
        ];
      }
      return {
        id: qId,
        questionType: 'SEQUENCE',
        questionText,
        timeLimitSeconds: Number(q.timeLimitSeconds) > 0 ? Number(q.timeLimitSeconds) : 30,
        imageUrl: q.imageUrl || '',
        sequenceItems: seqItems.slice(0, 5).map((item, sIdx) => ({
          id: item.id || ('seq-' + now + '-' + qIdx + '-' + (sIdx + 1)),
          text: String(item.text || ('ขั้นตอนที่ ' + (sIdx + 1))).trim()
        }))
      };
    } else {
      let options = Array.isArray(q.options) ? q.options : [];
      // Ensure exactly 4 options
      while (options.length < 4) {
        options.push({ text: 'ตัวเลือกเพิ่มเติม ' + (options.length + 1), isCorrect: false });
      }
      options = options.slice(0, 4);

      // Ensure exactly one isCorrect === true
      let correctCount = options.filter(o => Boolean(o.isCorrect)).length;
      if (correctCount === 0) {
        options[0].isCorrect = true;
      } else if (correctCount > 1) {
        let firstFound = false;
        options.forEach(o => {
          if (o.isCorrect && !firstFound) {
            firstFound = true;
          } else {
            o.isCorrect = false;
          }
        });
      }

      return {
        id: qId,
        questionType: 'CHOICE',
        questionText,
        timeLimitSeconds: Number(q.timeLimitSeconds) > 0 ? Number(q.timeLimitSeconds) : 20,
        imageUrl: q.imageUrl || '',
        options: options.map((opt, oIdx) => ({
          id: opt.id || ('opt' + (oIdx + 1)),
          text: String(opt.text || ('ตัวเลือก ' + (oIdx + 1))).trim(),
          isCorrect: Boolean(opt.isCorrect)
        }))
      };
    }
  });

  return {
    id: 'quiz-ai-' + now,
    title,
    description,
    questions: validatedQuestions
  };
}

async function generateAiQuiz({ topic, textContent, questionCount = 5, questionTypes = 'MIXED', difficulty = 'medium', language = 'th' }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log('[AI Service] No GEMINI_API_KEY found, using Smart Mock Quiz Generator');
    const mock = generateMockQuiz(topic, textContent, questionCount, questionTypes);
    const normalized = normalizeAndValidateQuiz(mock);
    return {
      success: true,
      source: 'mock',
      message: 'สร้างข้อสอบผ่าน Smart Mock Generator เรียบร้อย (ใส่ GEMINI_API_KEY ใน .env เพื่อเปิดใช้ Gemini AI)',
      quiz: normalized
    };
  }

  try {
    console.log('[AI Service] Calling Gemini 1.5 Flash for topic: "' + topic + '" (' + questionCount + ' questions)...');
    const systemPrompt = buildSystemPrompt(questionTypes, difficulty, language);
    const userPrompt = buildUserPrompt(topic, textContent, questionCount);
    const rawAiOutput = await callGeminiApi(systemPrompt, userPrompt, apiKey);
    const normalized = normalizeAndValidateQuiz(rawAiOutput);
    console.log('[AI Service] Gemini successfully generated ' + normalized.questions.length + ' questions.');
    return {
      success: true,
      source: 'gemini',
      message: 'สร้างข้อสอบด้วย Google Gemini AI สำเร็จ',
      quiz: normalized
    };
  } catch (err) {
    console.warn('[AI Service] Gemini API call failed, falling back to Smart Mock Generator:', err.message);
    const mock = generateMockQuiz(topic, textContent, questionCount, questionTypes);
    const normalized = normalizeAndValidateQuiz(mock);
    return {
      success: true,
      source: 'mock_fallback',
      message: 'Gemini ไม่สามารถให้บริการได้ในขณะนี้ (' + err.message + ') สลับมาใช้ Smart Mock สำเร็จ',
      quiz: normalized
    };
  }
}

module.exports = {
  generateAiQuiz,
  generateMockQuiz,
  normalizeAndValidateQuiz
};
