const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const setupSocketHandlers = require('./socketHandler');
const { getAllQuizzes, saveQuiz, deleteQuiz, duplicateQuiz, importQuizzes } = require('./quizData');

const app = express();
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
  }
});



// REST Health Check & Quiz CRUD Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'KaoJai Real-time Quiz Engine' });
});

app.get('/api/quizzes', (req, res) => {
  res.json({ quizzes: getAllQuizzes() });
});

app.post('/api/quizzes', (req, res) => {
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

app.post('/api/quizzes/:id/duplicate', (req, res) => {
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

app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    deleteQuiz(quizId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Import & Export Quizzes
app.get('/api/quizzes/export', (req, res) => {
  try {
    const quizzes = getAllQuizzes();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kaojai_quizzes_${Date.now()}.json"`);
    res.send(JSON.stringify(quizzes, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/quizzes/import', (req, res) => {
  try {
    const { quizzes, replaceAll } = req.body;
    if (!quizzes) {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลชุดคำถามที่ต้องการนำเข้า' });
    }
    const updated = importQuizzes(quizzes, Boolean(replaceAll));
    res.json({ success: true, count: Array.isArray(quizzes) ? quizzes.length : 0, quizzes: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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

// Image Upload Endpoint with Strict MIME Whitelist and 5MB Limit
app.post('/api/upload', (req, res) => {
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
    const byteLength = Buffer.byteLength(base64Data, 'base64');
    if (byteLength > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'ขนาดรูปภาพต้องไม่เกิน 5MB' });
    }

    const safeFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, base64Data, 'base64');
    
    const imageUrl = `/uploads/${safeFileName}`;
    res.json({ success: true, imageUrl });

  } catch (err) {
    console.error('[Upload Error]:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถอัปโหลดรูปภาพได้' });
  }
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 KaoJai Server running on port ${PORT}`);
});
