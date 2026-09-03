const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const setupSocketHandlers = require('./socketHandler');
const { getAllQuizzes, saveQuiz, deleteQuiz } = require('./quizData');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Static uploads serving
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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

app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    deleteQuiz(quizId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Image Upload Endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { imageData, fileName } = req.body;
    if (!imageData) {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลรูปภาพ' });
    }

    const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
      // If it's already a URL or raw base64, handle gracefully
      return res.json({ success: true, imageUrl: imageData });
    }

    const ext = matches[1] || 'png';
    const base64Data = matches[2];
    const safeFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, base64Data, 'base64');
    
    // Return relative static URL
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
