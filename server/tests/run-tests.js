process.env.NODE_ENV = 'test';
const { testQuizData } = require('./quizData.test');
const { testRoomManager } = require('./roomManager.test');
const { testSocketHandlers } = require('./socketHandler.test');
const { testApiEndpoints } = require('./api.test');

async function runAllTests() {
  console.log('============ KAOJAI SERVER TEST SUITE ============');
  const startTime = Date.now();
  let passedSuites = 0;
  let totalSuites = 4;

  try {
    console.log('\n[1/4] Running quizData unit tests...');
    await testQuizData();
    passedSuites++;

    console.log('\n[2/4] Running RoomManager unit tests...');
    await testRoomManager();
    passedSuites++;

    console.log('\n[3/4] Running socketHandler integration tests...');
    await testSocketHandlers();
    passedSuites++;

    console.log('\n[4/4] Running API endpoint tests...');
    await testApiEndpoints();
    passedSuites++;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n==================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passedSuites}/${totalSuites} test suites passed in ${duration}s)`);
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED!');
    console.error(error);
    process.exit(1);
  }
}

runAllTests();
