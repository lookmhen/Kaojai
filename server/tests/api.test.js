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

function httpDelete(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'DELETE'
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
    req.end();
  });
}

async function testApiEndpoints() {
  console.log('--- Testing API Endpoints ---');

  process.env.PORT = '0';
  const { app, getLocalIpAddress } = require('../src/index.js');
  const { defaultQuizSets, deleteQuiz } = require('../src/quizData');

  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  let createdQuizId = null;
  let dupQuizId = null;

  try {
    // 1. Health check
    console.log('  Testing GET /api/health...');
    const resHealth = await httpGet(`${baseUrl}/api/health`);
    assert.strictEqual(resHealth.statusCode, 200);
    assert.strictEqual(resHealth.body.status, 'ok');
    assert.strictEqual(resHealth.body.service, 'KaoJai Real-time Quiz Engine');
    console.log('    ✓ GET /api/health passed');

    // 2. Server Info & local IP
    console.log('  Testing GET /api/server-info...');
    const resServerInfo = await httpGet(`${baseUrl}/api/server-info`);
    assert.strictEqual(resServerInfo.statusCode, 200);
    assert.strictEqual(resServerInfo.body.success, true);
    assert.ok(resServerInfo.body.localIp, 'Should return localIp');
    console.log('    ✓ GET /api/server-info passed');

    // 3. Direct getLocalIpAddress helper unit check
    console.log('  Testing getLocalIpAddress() logic...');
    const detectedIp = getLocalIpAddress();
    assert.ok(typeof detectedIp === 'string');
    assert.ok(detectedIp.length > 0);
    console.log(`    ✓ getLocalIpAddress returned: ${detectedIp}`);

    // 4. Quizzes list
    console.log('  Testing GET /api/quizzes...');
    const resQuizzes = await httpGet(`${baseUrl}/api/quizzes`);
    assert.strictEqual(resQuizzes.statusCode, 200);
    assert.ok(Array.isArray(resQuizzes.body.quizzes));
    assert.ok(resQuizzes.body.quizzes.length >= defaultQuizSets.length);
    console.log('    ✓ GET /api/quizzes passed');

    // 5. POST /api/quizzes (Success & 400 Bad Request)
    console.log('  Testing POST /api/quizzes...');
    const newQuiz = { title: 'API Integration Test Quiz', description: 'Testing POST', questions: [] };
    const resPostQuiz = await httpPost(`${baseUrl}/api/quizzes`, { quiz: newQuiz });
    assert.strictEqual(resPostQuiz.statusCode, 200);
    assert.strictEqual(resPostQuiz.body.success, true);
    assert.strictEqual(resPostQuiz.body.quiz.title, 'API Integration Test Quiz');
    createdQuizId = resPostQuiz.body.quiz.id;

    // 400 missing quiz or title
    const resPostInvalid = await httpPost(`${baseUrl}/api/quizzes`, { quiz: {} });
    assert.strictEqual(resPostInvalid.statusCode, 400);
    assert.strictEqual(resPostInvalid.body.success, false);
    console.log('    ✓ POST /api/quizzes (success & 400 validation) passed');

    // 6. Duplicate quiz (Success & 404)
    console.log('  Testing POST /api/quizzes/:id/duplicate...');
    const resDup = await httpPost(`${baseUrl}/api/quizzes/quiz-1/duplicate`, {});
    assert.strictEqual(resDup.statusCode, 200);
    assert.strictEqual(resDup.body.success, true);
    assert.ok(resDup.body.quiz.title.includes('(คัดลอก)'));
    assert.notStrictEqual(resDup.body.quiz.id, 'quiz-1');
    dupQuizId = resDup.body.quiz.id;

    const resDup404 = await httpPost(`${baseUrl}/api/quizzes/nonexistent-id-999/duplicate`, {});
    assert.strictEqual(resDup404.statusCode, 404);
    assert.strictEqual(resDup404.body.success, false);
    console.log('    ✓ POST /api/quizzes/:id/duplicate (success & 404) passed');

    // 7. DELETE /api/quizzes/:id
    console.log('  Testing DELETE /api/quizzes/:id...');
    const resDel = await httpDelete(`${baseUrl}/api/quizzes/${createdQuizId}`);
    assert.strictEqual(resDel.statusCode, 200);
    assert.strictEqual(resDel.body.success, true);
    createdQuizId = null; // deleted successfully
    console.log('    ✓ DELETE /api/quizzes/:id passed');

    // 8. Upload image (Success, missing data 400, invalid data 400)
    console.log('  Testing POST /api/upload...');
    const valid1pxPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resUpload = await httpPost(`${baseUrl}/api/upload`, { imageData: valid1pxPng });
    assert.strictEqual(resUpload.statusCode, 200);
    assert.strictEqual(resUpload.body.success, true);
    assert.ok(resUpload.body.imageUrl.startsWith('/uploads/'));

    const resUploadEmpty = await httpPost(`${baseUrl}/api/upload`, {});
    assert.strictEqual(resUploadEmpty.statusCode, 400);
    assert.strictEqual(resUploadEmpty.body.success, false);

    const resUploadBadData = await httpPost(`${baseUrl}/api/upload`, { imageData: 'not-a-valid-base64-image' });
    assert.strictEqual(resUploadBadData.statusCode, 400);
    assert.strictEqual(resUploadBadData.body.success, false);
    console.log('    ✓ POST /api/upload (success & 400 validations) passed');

    // 9. Export quizzes
    console.log('  Testing GET /api/quizzes/export...');
    const resExport = await httpGet(`${baseUrl}/api/quizzes/export`);
    assert.strictEqual(resExport.statusCode, 200);
    assert.ok(Array.isArray(resExport.body));
    console.log('    ✓ GET /api/quizzes/export passed');

    // 10. Import quizzes (Success & 400)
    console.log('  Testing POST /api/quizzes/import...');
    const testImportItem = [{ id: 'test-import-api', title: 'API Imported Quiz', questions: [] }];
    const resImport = await httpPost(`${baseUrl}/api/quizzes/import`, { quizzes: testImportItem });
    assert.strictEqual(resImport.statusCode, 200);
    assert.strictEqual(resImport.body.success, true);

    const resImportEmpty = await httpPost(`${baseUrl}/api/quizzes/import`, {});
    assert.strictEqual(resImportEmpty.statusCode, 400);
    assert.strictEqual(resImportEmpty.body.success, false);
    console.log('    ✓ POST /api/quizzes/import (success & 400 validation) passed');

    // 11. Generate AI Quiz (Success & 400 validation)
    console.log('  Testing POST /api/quizzes/generate-ai...');
    const resAiGen = await httpPost(`${baseUrl}/api/quizzes/generate-ai`, {
      topic: 'การปฐมพยาบาลเบื้องต้น CPR',
      questionCount: 3,
      questionTypes: 'MIXED'
    });
    assert.strictEqual(resAiGen.statusCode, 200);
    assert.strictEqual(resAiGen.body.success, true);
    assert.ok(resAiGen.body.quiz);
    assert.strictEqual(resAiGen.body.quiz.questions.length, 3);

    const resAiGenEmpty = await httpPost(`${baseUrl}/api/quizzes/generate-ai`, {});
    assert.strictEqual(resAiGenEmpty.statusCode, 400);
    assert.strictEqual(resAiGenEmpty.body.success, false);
    console.log('    ✓ POST /api/quizzes/generate-ai (success & 400 validation) passed');

    // Clean up
    deleteQuiz('test-import-api');
    if (dupQuizId) deleteQuiz(dupQuizId);

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
