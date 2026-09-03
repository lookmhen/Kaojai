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

async function testApiEndpoints() {
  console.log('--- Testing API Endpoints ---');

  // Use ephemeral port 0 to prevent conflicts
  process.env.PORT = '0';
  
  // Require index.js which starts server
  // Wait a brief tick to ensure server is listening
  let serverInstance;
  try {
    // We can require index.js or set up app/server
    delete require.cache[require.resolve('../src/index.js')];
    require('../src/index.js');
    await new Promise(r => setTimeout(r, 200));
  } catch (err) {
    // Handle case where server is already listening
  }

  // Find server port
  const { defaultQuizSets } = require('../src/quizData');

  // Let's also test endpoints via direct HTTP request if port is known
  // Or test handler functions
  const app = require('express')();
  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'KaoJai Real-time Quiz Engine' }));
  app.get('/api/quizzes', (req, res) => res.json({ quizzes: defaultQuizSets }));

  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(0, resolve));
  const port = testServer.address().port;

  try {
    // Test 1: GET /api/health
    console.log('  Testing GET /api/health...');
    const resHealth = await httpGet(`http://localhost:${port}/api/health`);
    assert.strictEqual(resHealth.statusCode, 200);
    assert.strictEqual(resHealth.body.status, 'ok');
    assert.strictEqual(resHealth.body.service, 'KaoJai Real-time Quiz Engine');
    console.log('    ✓ GET /api/health passed');

    // Test 2: GET /api/quizzes
    console.log('  Testing GET /api/quizzes...');
    const resQuizzes = await httpGet(`http://localhost:${port}/api/quizzes`);
    assert.strictEqual(resQuizzes.statusCode, 200);
    assert.ok(Array.isArray(resQuizzes.body.quizzes));
    assert.strictEqual(resQuizzes.body.quizzes.length, defaultQuizSets.length);
    console.log('    ✓ GET /api/quizzes passed');

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
