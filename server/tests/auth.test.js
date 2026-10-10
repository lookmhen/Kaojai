const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { app } = require('../src/index.js');
const {
  getUserByUsername,
  getUserById,
  createUser,
  updateUserPassword,
  getAllUsers,
  deleteUser,
  hashPassword,
  verifyPassword
} = require('../src/db');
const { generateToken, JWT_SECRET } = require('../src/auth');

function makeRequest(url, method = 'GET', payload = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = payload ? JSON.stringify(payload) : null;
    const urlObj = new URL(url);
    const headers = {};

    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function testAuth() {
  console.log('--- Testing Backend JWT Authentication (ADMIN & TEACHER) ---');

  // 1. Test db.js crypto and user functions
  console.log('  Testing hashPassword & verifyPassword...');
  const testPw = 'secretPass123';
  const hashed = hashPassword(testPw);
  assert.ok(hashed.includes(':'), 'Hash must contain salt:key delimiter');
  assert.equal(verifyPassword(testPw, hashed), true, 'Correct password must verify');
  assert.equal(verifyPassword('wrongPassword', hashed), false, 'Wrong password must fail');
  assert.equal(verifyPassword('', hashed), false, 'Empty password must fail');
  console.log('    ✓ hashPassword & verifyPassword passed');

  // 2. Test auto-seeded users
  console.log('  Testing auto-seeded ADMIN and TEACHER users...');
  const seededAdmin = getUserByUsername('admin');
  assert.ok(seededAdmin, 'Default admin user must exist');
  assert.equal(seededAdmin.role, 'ADMIN');
  assert.equal(verifyPassword('admin1234', seededAdmin.passwordHash), true);

  const seededTeacher = getUserByUsername('teacher');
  assert.ok(seededTeacher, 'Default teacher user must exist');
  assert.equal(seededTeacher.role, 'TEACHER');
  assert.equal(verifyPassword('teacher1234', seededTeacher.passwordHash), true);
  console.log('    ✓ Auto-seeded users verified');

  // 3. Test generateToken
  console.log('  Testing generateToken & JWT decode...');
  const token = generateToken(seededAdmin);
  assert.ok(typeof token === 'string' && token.length > 20);
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.username, 'admin');
  assert.equal(decoded.role, 'ADMIN');
  console.log('    ✓ generateToken passed');

  // Start HTTP test server
  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 4. POST /api/auth/login
    console.log('  Testing POST /api/auth/login...');
    // Missing credentials
    const resLoginMissing = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', { username: '' });
    assert.equal(resLoginMissing.statusCode, 400);

    // Wrong password
    const resLoginWrong = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', {
      username: 'admin',
      password: 'wrongpassword'
    });
    assert.equal(resLoginWrong.statusCode, 401);

    // Admin login success
    const resAdminLogin = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', {
      username: 'admin',
      password: 'admin1234'
    });
    assert.equal(resAdminLogin.statusCode, 200);
    assert.equal(resAdminLogin.body.success, true);
    assert.ok(resAdminLogin.body.token);
    assert.equal(resAdminLogin.body.user.role, 'ADMIN');
    const adminToken = resAdminLogin.body.token;

    // Teacher login success
    const resTeacherLogin = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', {
      username: 'teacher',
      password: 'teacher1234'
    });
    assert.equal(resTeacherLogin.statusCode, 200);
    assert.equal(resTeacherLogin.body.success, true);
    assert.ok(resTeacherLogin.body.token);
    assert.equal(resTeacherLogin.body.user.role, 'TEACHER');
    const teacherToken = resTeacherLogin.body.token;
    console.log('    ✓ POST /api/auth/login passed');

    // 5. GET /api/auth/me
    console.log('  Testing GET /api/auth/me...');
    const resMeAdmin = await makeRequest(`${baseUrl}/api/auth/me`, 'GET', null, adminToken);
    assert.equal(resMeAdmin.statusCode, 200);
    assert.equal(resMeAdmin.body.user.username, 'admin');
    assert.equal(resMeAdmin.body.user.role, 'ADMIN');

    const resMeTeacher = await makeRequest(`${baseUrl}/api/auth/me`, 'GET', null, teacherToken);
    assert.equal(resMeTeacher.statusCode, 200);
    assert.equal(resMeTeacher.body.user.username, 'teacher');
    assert.equal(resMeTeacher.body.user.role, 'TEACHER');

    const resMeInvalid = await makeRequest(`${baseUrl}/api/auth/me`, 'GET', null, 'invalid-jwt-token');
    assert.equal(resMeInvalid.statusCode, 401);
    console.log('    ✓ GET /api/auth/me passed');

    // 6. User Management: GET /api/auth/users
    console.log('  Testing GET /api/auth/users (Role Authorization)...');
    // Admin allowed
    const resUsersAdmin = await makeRequest(`${baseUrl}/api/auth/users`, 'GET', null, adminToken);
    assert.equal(resUsersAdmin.statusCode, 200);
    assert.ok(Array.isArray(resUsersAdmin.body.users));
    assert.ok(resUsersAdmin.body.users.length >= 2);
    // Teacher forbidden
    const resUsersTeacher = await makeRequest(`${baseUrl}/api/auth/users`, 'GET', null, teacherToken);
    assert.equal(resUsersTeacher.statusCode, 403);
    console.log('    ✓ GET /api/auth/users passed (Admin=200, Teacher=403)');

    // 7. POST /api/auth/users (Create User)
    console.log('  Testing POST /api/auth/users (ADMIN only)...');
    const newTeacherUsername = `test_teacher_${Date.now()}`;
    // Teacher cannot create users
    const resCreateForbidden = await makeRequest(`${baseUrl}/api/auth/users`, 'POST', {
      username: newTeacherUsername,
      password: 'password123',
      displayName: 'Test Teacher',
      role: 'TEACHER'
    }, teacherToken);
    assert.equal(resCreateForbidden.statusCode, 403);

    // Admin creates new teacher
    const resCreateAdmin = await makeRequest(`${baseUrl}/api/auth/users`, 'POST', {
      username: newTeacherUsername,
      password: 'password123',
      displayName: 'Test Teacher',
      role: 'TEACHER'
    }, adminToken);
    assert.equal(resCreateAdmin.statusCode, 201);
    assert.equal(resCreateAdmin.body.success, true);
    assert.equal(resCreateAdmin.body.user.username, newTeacherUsername);
    assert.equal(resCreateAdmin.body.user.role, 'TEACHER');
    const createdUserId = resCreateAdmin.body.user.id;

    // Login with newly created user
    const resNewUserLogin = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', {
      username: newTeacherUsername,
      password: 'password123'
    });
    assert.equal(resNewUserLogin.statusCode, 200);
    assert.equal(resNewUserLogin.body.user.username, newTeacherUsername);
    const newUserToken = resNewUserLogin.body.token;

    // Duplicate username error
    const resCreateDup = await makeRequest(`${baseUrl}/api/auth/users`, 'POST', {
      username: newTeacherUsername,
      password: 'password123',
      displayName: 'Duplicate',
      role: 'TEACHER'
    }, adminToken);
    assert.equal(resCreateDup.statusCode, 400);
    console.log('    ✓ POST /api/auth/users passed');

    // 8. POST /api/auth/change-password
    console.log('  Testing POST /api/auth/change-password...');
    const resChangePwWrong = await makeRequest(`${baseUrl}/api/auth/change-password`, 'POST', {
      currentPassword: 'incorrect-pw',
      newPassword: 'newpassword456'
    }, newUserToken);
    assert.equal(resChangePwWrong.statusCode, 400);

    const resChangePwSuccess = await makeRequest(`${baseUrl}/api/auth/change-password`, 'POST', {
      currentPassword: 'password123',
      newPassword: 'newpassword456'
    }, newUserToken);
    assert.equal(resChangePwSuccess.statusCode, 200);
    assert.equal(resChangePwSuccess.body.success, true);

    // Verify login with new password
    const resLoginAfterChange = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', {
      username: newTeacherUsername,
      password: 'newpassword456'
    });
    assert.equal(resLoginAfterChange.statusCode, 200);
    console.log('    ✓ POST /api/auth/change-password passed');

    // 9. DELETE /api/auth/users/:id
    console.log('  Testing DELETE /api/auth/users/:id...');
    // Admin cannot delete own account
    const resDelSelf = await makeRequest(`${baseUrl}/api/auth/users/${seededAdmin.id}`, 'DELETE', null, adminToken);
    assert.equal(resDelSelf.statusCode, 400);

    // Teacher cannot delete users
    const resDelForbidden = await makeRequest(`${baseUrl}/api/auth/users/${createdUserId}`, 'DELETE', null, teacherToken);
    assert.equal(resDelForbidden.statusCode, 403);

    // Admin deletes created user
    const resDelSuccess = await makeRequest(`${baseUrl}/api/auth/users/${createdUserId}`, 'DELETE', null, adminToken);
    assert.equal(resDelSuccess.statusCode, 200);
    assert.equal(resDelSuccess.body.success, true);

    // Deleted user can no longer login
    const resLoginDeleted = await makeRequest(`${baseUrl}/api/auth/login`, 'POST', {
      username: newTeacherUsername,
      password: 'newpassword456'
    });
    assert.equal(resLoginDeleted.statusCode, 401);
    console.log('    ✓ DELETE /api/auth/users/:id passed');

    // 10. Route Protection with Invalid Token
    console.log('  Testing Protected Endpoints with Invalid Token...');
    const resProtectedInvalid = await makeRequest(`${baseUrl}/api/quizzes`, 'POST', { quiz: { title: 'No auth' } }, 'bogus-token');
    assert.equal(resProtectedInvalid.statusCode, 401);
    console.log('    ✓ Protected Endpoints reject invalid token with 401');

    // 11. Security Hardening & Vulnerability Verifications
    console.log('  Testing Security Hardening & Vulnerability Protections...');
    
    // 11.1 Short password rejected for user creation
    const resShortPwUser = await makeRequest(`${baseUrl}/api/auth/users`, 'POST', {
      username: 'shortpw_user',
      password: '123',
      displayName: 'Short PW',
      role: 'TEACHER'
    }, adminToken);
    assert.equal(resShortPwUser.statusCode, 400);
    assert.ok(resShortPwUser.body.message.includes('6'));

    // 11.2 Short password rejected for password change
    const resShortPwChange = await makeRequest(`${baseUrl}/api/auth/change-password`, 'POST', {
      currentPassword: 'teacher1234',
      newPassword: 'abc'
    }, teacherToken);
    assert.equal(resShortPwChange.statusCode, 400);
    assert.ok(resShortPwChange.body.message.includes('6'));

    // 11.3 Public GET /api/quizzes strips isCorrect
    const resPublicQuizzes = await makeRequest(`${baseUrl}/api/quizzes`, 'GET');
    assert.equal(resPublicQuizzes.statusCode, 200);
    assert.ok(Array.isArray(resPublicQuizzes.body.quizzes));
    for (const q of resPublicQuizzes.body.quizzes) {
      if (q.questions) {
        for (const question of q.questions) {
          if (question.options) {
            for (const opt of question.options) {
              assert.strictEqual(opt.isCorrect, undefined, 'Public quizzes must not expose isCorrect');
            }
          }
        }
      }
    }
    console.log('    ✓ Public GET /api/quizzes sanitized (no isCorrect leaked)');

    // 11.4 Authenticated Teacher GET /api/quizzes retains isCorrect
    const resTeacherQuizzes = await makeRequest(`${baseUrl}/api/quizzes`, 'GET', null, teacherToken);
    assert.equal(resTeacherQuizzes.statusCode, 200);
    const quiz1 = resTeacherQuizzes.body.quizzes.find(q => q.id === 'quiz-1');
    assert.ok(quiz1, 'quiz-1 must exist');
    const firstQChoice = quiz1.questions.find(q => q.type === 'CHOICE');
    if (firstQChoice && firstQChoice.options) {
      const hasIsCorrect = firstQChoice.options.some(opt => opt.isCorrect === true);
      assert.ok(hasIsCorrect, 'Authenticated teacher must see isCorrect for editing');
    }
    console.log('    ✓ Authenticated Teacher retains isCorrect in quizzes');

    // 11.5 Non-admin cannot import with replaceAll: true
    const resImportForbidden = await makeRequest(`${baseUrl}/api/quizzes/import`, 'POST', {
      quizzes: [],
      replaceAll: true
    }, teacherToken);
    assert.equal(resImportForbidden.statusCode, 403);
    console.log('    ✓ Non-admin replaceAll import rejected with 403');

  } finally {
    await new Promise(resolve => testServer.close(resolve));
  }

  console.log('✅ JWT Authentication & Security Hardening unit tests passed cleanly!\n');
}

module.exports = { testAuth };

if (require.main === module) {
  testAuth();
}
