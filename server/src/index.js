const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const setupSocketHandlers = require('./socketHandler');
const { defaultQuizSets } = require('./quizData');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// REST Health Check & Quiz List
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'KaoJai Real-time Quiz Engine' });
});

app.get('/api/quizzes', (req, res) => {
  res.json({ quizzes: defaultQuizSets });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 KaoJai Server running on port ${PORT}`);
});
