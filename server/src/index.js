require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const setupSocketHandlers = require('./socketHandler');
const { getAllQuizzes, saveQuiz, deleteQuiz, duplicateQuiz, importQuizzes } = require('./quizData');
const { generateAiQuiz } = require('./aiService');
const { authRouter, authenticateToken, optionalAuthenticateToken } = require('./auth');

function createRateLimiter({ windowMs = 60000, max = 15, message = 'คำขอมากเกินไป กรุณารอสักครู่' }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(key);
      }
    }
  }, 120000);
  if (timer.unref) timer.unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = hits.get(ip);
    if (!record || (now - record.startTime > windowMs)) {
      record = { count: 1, startTime: now };
      hits.set(ip, record);
      return next();
    }
    record.count++;
    if (record.count > max) {
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

const loginLimiter = createRateLimiter({ windowMs: 60000, max: 15, message: 'ลองเข้าสู่ระบบถี่เกินไป กรุณารอ 1 นาที' });
const aiGenLimiter = createRateLimiter({ windowMs: 60000, max: 10, message: 'เรียกสร้างข้อสอบ AI ถี่เกินไป กรุณารอ 1 นาที' });
const uploadLimiter = createRateLimiter({ windowMs: 60000, max: 30, message: 'อัปโหลดรูปภาพถี่เกินไป กรุณารอสักครู่' });

function sanitizeQuizForPublic(quiz) {
  if (!quiz) return null;
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description || '',
    questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    questions: Array.isArray(quiz.questions)
      ? quiz.questions.map(q => ({
          id: q.id,
          questionType: q.questionType,
          questionText: q.questionText,
          timeLimitSeconds: q.timeLimitSeconds,
          imageUrl: q.imageUrl || '',
          options: Array.isArray(q.options)
            ? q.options.map(opt => ({ id: opt.id, text: opt.text }))
            : undefined,
          sequenceItems: Array.isArray(q.sequenceItems)
            ? q.sequenceItems.map(item => ({ id: item.id, text: item.text }))
            : undefined
        }))
      : []
  };
}

function isValidImageBuffer(buffer, ext) {
  if (!buffer || buffer.length < 8) return false;
  if (ext === 'png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (ext === 'jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === 'gif') {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  }
  if (ext === 'webp') {
    return buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        // Prioritize common Wi-Fi and Ethernet adapters
        const lowerName = name.toLowerCase();
        const isVirtual = lowerName.includes('vethernet') || lowerName.includes('virtual') || lowerName.includes('wsl');
        candidates.push({ address: net.address, isVirtual, name });
      }
    }
  }

  // Sort physical adapters first
  candidates.sort((a, b) => (a.isVirtual === b.isVirtual ? 0 : a.isVirtual ? 1 : -1));
  return candidates[0]?.address || 'localhost';
}

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const server = http.createServer(app);

// Suppress noisy ECONNRESET / ECONNABORTED socket disconnect logs when client tabs close or refresh
server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
    return;
  }
  console.error('[HTTP Client Error]:', err.message);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});



// Auth API routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);

// REST Health Check & Server Info
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'KaoJai Real-time Quiz Engine' });
});

app.get('/api/server-info', (req, res) => {
  const localIp = getLocalIpAddress();
  const configuredHost = process.env.PUBLIC_HOST || process.env.SERVER_HOST || null;
  res.json({
    success: true,
    localIp,
    configuredHost,
    serverPort: process.env.PORT || 4000
  });
});

app.get('/api/quizzes', optionalAuthenticateToken, (req, res) => {
  const all = getAllQuizzes();
  if (req.user && ['ADMIN', 'TEACHER'].includes(req.user.role)) {
    return res.json({ quizzes: all });
  }
  res.json({ quizzes: all.map(sanitizeQuizForPublic) });
});

app.post('/api/quizzes', authenticateToken, (req, res) => {
  try {
    const { quiz } = req.body;
    if (!quiz || !quiz.title) {
      return res.status(400).json({ success: false, message: 'ข้อมูลชุดคำถามไม่ถูกต้อง' });
    }
    const saved = saveQuiz(quiz);
    res.json({ success: true, quiz: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/quizzes/:id/duplicate', authenticateToken, (req, res) => {
  try {
    const quizId = req.params.id;
    const duplicated = duplicateQuiz(quizId);
    if (!duplicated) {
      return res.status(404).json({ success: false, message: 'ไม่พบชุดคำถามที่ต้องการคัดลอก' });
    }
    res.json({ success: true, quiz: duplicated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/quizzes/:id', authenticateToken, (req, res) => {
  try {
    const quizId = req.params.id;
    deleteQuiz(quizId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Import & Export Quizzes
app.get('/api/quizzes/export', authenticateToken, (req, res) => {
  try {
    const quizzes = getAllQuizzes();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kaojai_quizzes_${Date.now()}.json"`);
    res.send(JSON.stringify(quizzes, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/quizzes/import', authenticateToken, (req, res) => {
  try {
    const { quizzes, replaceAll } = req.body;
    if (!quizzes) {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลชุดคำถามที่ต้องการนำเข้า' });
    }
    if (Boolean(replaceAll) && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถนำเข้าแบบแทนที่ทั้งหมดได้' });
    }
    const updated = importQuizzes(quizzes, Boolean(replaceAll));
    res.json({ success: true, count: Array.isArray(quizzes) ? quizzes.length : 0, quizzes: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// AI Quiz Generator Endpoint
app.post('/api/quizzes/generate-ai', aiGenLimiter, authenticateToken, async (req, res) => {
  try {
    const { topic, textContent, questionCount, questionTypes, difficulty, language } = req.body;
    if (!topic && !textContent) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุหัวข้อ (Topic) หรือใส่เนื้อหาที่ต้องการนำมาสร้างข้อสอบ'
      });
    }

    const clampedCount = Math.min(20, Math.max(1, Number(questionCount) || 5));

    const result = await generateAiQuiz({
      topic,
      textContent,
      questionCount: clampedCount,
      questionTypes: questionTypes || 'MIXED',
      difficulty: difficulty || 'medium',
      language: language || 'th'
    });

    res.json(result);
  } catch (err) {
    console.error('[API Error] generate-ai:', err);
    res.status(500).json({ success: false, message: err.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบด้วย AI' });
  }
});

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

// Static uploads serving with security headers
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(uploadsDir));

// Image Upload Endpoint with Strict MIME Whitelist, Magic Bytes Verification and 5MB Limit
app.post('/api/upload', uploadLimiter, authenticateToken, (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลรูปภาพ' });
    }

    const matches = imageData.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'รูปแบบ Base64 รูปภาพไม่ถูกต้อง' });
    }

    const mimeType = matches[1].toLowerCase();
    const ext = ALLOWED_MIME_TYPES[mimeType];
    if (!ext) {
      return res.status(400).json({ success: false, message: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP, GIF เท่านั้น' });
    }

    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'ขนาดรูปภาพต้องไม่เกิน 5MB' });
    }

    if (!isValidImageBuffer(imageBuffer, ext)) {
      return res.status(400).json({ success: false, message: 'ไฟล์รูปภาพไม่ถูกต้องหรือข้อมูลโครงสร้างรูปภาพเสียหาย' });
    }

    const safeFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, imageBuffer);
    
    const imageUrl = `/uploads/${safeFileName}`;
    res.json({ success: true, imageUrl });

  } catch (err) {
    console.error('[Upload Error]:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถอัปโหลดรูปภาพได้' });
  }
});

// Static files serving (Frontend React build)
const clientDistDir = path.join(__dirname, '../../client/dist');
const altClientDistDir = path.join(__dirname, '../client/dist');

const activeDistDir = fs.existsSync(clientDistDir)
  ? clientDistDir
  : fs.existsSync(altClientDistDir)
    ? altClientDistDir
    : null;

if (activeDistDir) {
  app.use(express.static(activeDistDir));
  app.get('*', (req, res, next) => {
    // Skip API and uploads routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(activeDistDir, 'index.html'));
  });
} else if (process.env.NODE_ENV === 'test') {
  app.get('/', (req, res) => {
    res.send('<!DOCTYPE html><html><body><h1>KaoJai Test Dummy</h1></body></html>');
  });
}

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test' || require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 KaoJai Server running on port ${PORT}`);
  });
}

module.exports = { app, server, getLocalIpAddress };

