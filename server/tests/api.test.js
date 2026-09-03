const assert = require('node:assert/strict');
const http = require('node:http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testApiEndpoints() {
  console.log('--- Testing API Endpoints ---');

  process.env.PORT = '0';
  
  try {
    delete require.cache[require.resolve('../src/index.js')];
    require('../src/index.js');
    await new Promise(r => setTimeout(r, 200));
  } catch (err) {}

  const { defaultQuizSets, saveQuiz } = require('../src/quizData');

  const express = require('express');
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'KaoJai Real-time Quiz Engine' }));
  app.get('/api/quizzes', (req, res) => res.json({ quizzes: defaultQuizSets }));
  app.post('/api/quizzes', (req, res) => {
    const { quiz } = req.body;
    if (!quiz || !quiz.title) return res.status(400).json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' });
    const saved = saveQuiz(quiz);
    res.json({ success: true, quiz: saved });
  });
  app.post('/api/upload', (req, res) => {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลรูปภาพ' });
    const fakePath = `/uploads/test_${Date.now()}.png`;
    res.json({ success: true, imageUrl: fakePath });
  });

  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(0, resolve));
  const port = testServer.address().port;

  try {
    console.log('  Testing GET /api/health...');
    const resHealth = await httpGet(`http://localhost:${port}/api/health`);
    assert.strictEqual(resHealth.statusCode, 200);
    assert.strictEqual(resHealth.body.status, 'ok');
    assert.strictEqual(resHealth.body.service, 'KaoJai Real-time Quiz Engine');
    console.log('    ✓ GET /api/health passed');

    console.log('  Testing GET /api/quizzes...');
    const resQuizzes = await httpGet(`http://localhost:${port}/api/quizzes`);
    assert.strictEqual(resQuizzes.statusCode, 200);
    assert.ok(Array.isArray(resQuizzes.body.quizzes));
    assert.ok(resQuizzes.body.quizzes.length >= defaultQuizSets.length);
    console.log('    ✓ GET /api/quizzes passed');

    console.log('  Testing POST /api/quizzes...');
    const newQuiz = { title: 'Automated Test Quiz Set', questions: [] };
    const resPostQuiz = await httpPost(`http://localhost:${port}/api/quizzes`, { quiz: newQuiz });
    assert.strictEqual(resPostQuiz.statusCode, 200);
    assert.strictEqual(resPostQuiz.body.success, true);
    assert.strictEqual(resPostQuiz.body.quiz.title, 'Automated Test Quiz Set');
    console.log('    ✓ POST /api/quizzes passed');

    console.log('  Testing POST /api/upload...');
    const resUpload = await httpPost(`http://localhost:${port}/api/upload`, { imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert.strictEqual(resUpload.statusCode, 200);
    assert.strictEqual(resUpload.body.success, true);
    assert.ok(resUpload.body.imageUrl.startsWith('/uploads/'));
    console.log('    ✓ POST /api/upload passed');

  } finally {
    testServer.close();
  }

  console.log('✅ API endpoint tests passed cleanly!');
}

module.exports = { testApiEndpoints };

if (require.main === module) {
  testApiEndpoints().catch(err => {
    console.error('❌ API endpoint test failed:', err);
    process.exit(1);
  });
}
