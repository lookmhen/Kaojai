process.env.NODE_ENV = 'test';
const { testQuizData } = require('./quizData.test');
const { testRoomManager } = require('./roomManager.test');
const { testSocketHandlers } = require('./socketHandler.test');
const { testApiEndpoints } = require('./api.test');
const { testAnalyticsReport } = require('./analyticsReport.test');
const { testPretestPosttest } = require('./pretestPosttest.test');
const { testDatabaseLayer } = require('./db.test');
const { testRosterPersistence } = require('./rosterPersistence.test');
const { testAuth } = require('./auth.test');

async function runAllTests() {
  console.log('============ KAOJAI SERVER TEST SUITE ============');
  const startTime = Date.now();
  let passedSuites = 0;
  let totalSuites = 10;

  try {
    console.log('\n[1/10] Running quizData unit tests...');
    await testQuizData();
    passedSuites++;

    console.log('\n[2/10] Running RoomManager unit tests...');
    await testRoomManager();
    passedSuites++;

    console.log('\n[3/10] Running socketHandler integration tests...');
    await testSocketHandlers();
    passedSuites++;

    console.log('\n[4/10] Running API endpoint tests...');
    await testApiEndpoints();
    passedSuites++;

    console.log('\n[5/10] Running Analytics & CSV Report unit tests...');
    await testAnalyticsReport();
    passedSuites++;

    console.log('\n[6/10] Running Pre-test & Post-test Learning Gain tests...');
    await testPretestPosttest();
    passedSuites++;

    console.log('\n[7/10] Running Database (node:sqlite) persistence tests...');
    await testDatabaseLayer();
    passedSuites++;

    console.log('\n[8/10] Running SQLite Persistence & Pre/Post-test Roster Claim tests...');
    await testRosterPersistence();
    passedSuites++;

    console.log('\n[9/10] Running Backend JWT Authentication & Role Authorization tests...');
    await testAuth();
    passedSuites++;

    console.log('\n[10/10] Running History Archive, Player Kick, Cleanup & Backup tests...');
    require('./history_and_kick.test');
    passedSuites++;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n==================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passedSuites}/${totalSuites} test suites passed in ${duration}s)`);
    console.log('==================================================');
    setTimeout(() => process.exit(0), 200);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED!');
    console.error(error);
    process.exit(1);
  }
}

runAllTests();
