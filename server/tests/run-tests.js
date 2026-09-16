process.env.NODE_ENV = 'test';
const { testQuizData } = require('./quizData.test');
const { testRoomManager } = require('./roomManager.test');
const { testSocketHandlers } = require('./socketHandler.test');
const { testApiEndpoints } = require('./api.test');
const { testAnalyticsReport } = require('./analyticsReport.test');
const { testPretestPosttest } = require('./pretestPosttest.test');

async function runAllTests() {
  console.log('============ KAOJAI SERVER TEST SUITE ============');
  const startTime = Date.now();
  let passedSuites = 0;
  let totalSuites = 6;

  try {
    console.log('\n[1/6] Running quizData unit tests...');
    await testQuizData();
    passedSuites++;

    console.log('\n[2/6] Running RoomManager unit tests...');
    await testRoomManager();
    passedSuites++;

    console.log('\n[3/6] Running socketHandler integration tests...');
    await testSocketHandlers();
    passedSuites++;

    console.log('\n[4/6] Running API endpoint tests...');
    await testApiEndpoints();
    passedSuites++;

    console.log('\n[5/6] Running Analytics & CSV Report unit tests...');
    await testAnalyticsReport();
    passedSuites++;

    console.log('\n[6/6] Running Pre-test & Post-test Learning Gain tests...');
    await testPretestPosttest();
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
