const assert = require('node:assert/strict');
const { defaultQuizSets } = require('../src/quizData');

function testQuizData() {
  console.log('--- Testing quizData.js ---');

  // 1. Structure check
  assert.ok(Array.isArray(defaultQuizSets), 'defaultQuizSets should be an array');
  assert.ok(defaultQuizSets.length >= 2, 'Should have at least 2 quiz sets');

  // 2. Validate individual quiz sets
  defaultQuizSets.forEach((quiz, index) => {
    assert.ok(quiz.id, `Quiz #${index} should have an id`);
    assert.ok(quiz.title, `Quiz ${quiz.id} should have a title`);
    assert.ok(quiz.description, `Quiz ${quiz.id} should have a description`);
    assert.ok(Array.isArray(quiz.questions), `Quiz ${quiz.id} should have a questions array`);
    assert.ok(quiz.questions.length > 0, `Quiz ${quiz.id} should have at least 1 question`);

    // 3. Validate questions in quiz
    quiz.questions.forEach((q, qIndex) => {
      assert.ok(q.id, `Quiz ${quiz.id} Q#${qIndex} should have an id`);
      assert.ok(q.questionText, `Quiz ${quiz.id} Q#${qIndex} should have questionText`);
      assert.ok(typeof q.timeLimitSeconds === 'number' && q.timeLimitSeconds > 0, `Quiz ${quiz.id} Q#${qIndex} timeLimitSeconds should be positive number`);
      const isSequence = q.questionType === 'SEQUENCE' || Boolean(q.sequenceItems);

      if (isSequence) {
        assert.ok(Array.isArray(q.sequenceItems), `Quiz ${quiz.id} Q#${qIndex} should have sequenceItems array`);
        assert.ok(q.sequenceItems.length >= 3, `Quiz ${quiz.id} Q#${qIndex} should have at least 3 sequence items`);
        q.sequenceItems.forEach((item, itemIdx) => {
          assert.ok(item.id, `Sequence item #${itemIdx} should have an id`);
          assert.ok(typeof item.text === 'string' && item.text.length > 0, `Sequence item #${itemIdx} should have text`);
        });
      } else {
        assert.ok(Array.isArray(q.options), `Quiz ${quiz.id} Q#${qIndex} should have options array`);
        assert.ok(q.options.length >= 2, `Quiz ${quiz.id} Q#${qIndex} should have at least 2 options`);

        // Check correct option
        const hasCorrect = q.options.some(opt => opt.isCorrect === true);
        assert.ok(hasCorrect, `Quiz ${quiz.id} Q#${qIndex} must have at least one correct option`);

        // Validate option fields
        q.options.forEach((opt, optIndex) => {
          assert.ok(opt.id, `Quiz ${quiz.id} Q#${qIndex} Opt#${optIndex} should have id`);
          assert.ok(typeof opt.text === 'string', `Quiz ${quiz.id} Q#${qIndex} Opt#${optIndex} should have text`);
          assert.ok(typeof opt.isCorrect === 'boolean', `Quiz ${quiz.id} Q#${qIndex} Opt#${optIndex} should have boolean isCorrect`);
        });
      }
    });
  });

  console.log('✅ quizData tests passed!');
}

module.exports = { testQuizData };

if (require.main === module) {
  testQuizData();
}
