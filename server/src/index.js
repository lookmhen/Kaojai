const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const setupSocketHandlers = require('./socketHandler');
const { getAllQuizzes, saveQuiz, deleteQuiz } = require('./quizData');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
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

app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const quizId = req.params.id;
    deleteQuiz(quizId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 KaoJai Server running on port ${PORT}`);
});
