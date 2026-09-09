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

  // 4. Test Persistence and File Operations
  const fs = require('fs');
  const { getAllQuizzes, saveQuiz, deleteQuiz, duplicateQuiz, importQuizzes, DATA_FILE } = require('../src/quizData');

  assert.ok(fs.existsSync(DATA_FILE), 'quizzes.json file should exist on disk');

  // Test saveQuiz persists to disk
  const testQuiz = {
    id: `test-quiz-${Date.now()}`,
    title: 'Test Persistence Quiz',
    description: 'Testing JSON persistence',
    questions: [
      {
        id: 't-q1',
        questionType: 'CHOICE',
        questionText: 'Test question?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt1', text: 'Yes', isCorrect: true },
          { id: 'opt2', text: 'No', isCorrect: false }
        ]
      }
    ]
  };

  saveQuiz(testQuiz);
  const fileContentAfterSave = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const foundInFile = fileContentAfterSave.find(q => q.id === testQuiz.id);
  assert.ok(foundInFile, 'Saved quiz must be found in quizzes.json on disk');
  assert.strictEqual(foundInFile.title, 'Test Persistence Quiz');

  // Test duplicateQuiz
  const duplicated = duplicateQuiz(testQuiz.id);
  assert.ok(duplicated, 'Duplicate should succeed');
  assert.ok(duplicated.id !== testQuiz.id, 'Duplicate should have new ID');
  assert.strictEqual(duplicated.title, `${testQuiz.title} (คัดลอก)`);

  // Test deleteQuiz
  deleteQuiz(testQuiz.id);
  deleteQuiz(duplicated.id);
  const fileContentAfterDelete = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  assert.ok(!fileContentAfterDelete.some(q => q.id === testQuiz.id), 'Deleted quiz should not exist in quizzes.json');

  // Test importQuizzes
  const importSet = [
    {
      id: `imported-${Date.now()}`,
      title: 'Imported Quiz',
      description: 'Import test',
      questions: [
        {
          id: 'imp-q1',
          questionType: 'CHOICE',
          questionText: 'Imported Q1',
          timeLimitSeconds: 20,
          options: [
            { id: 'opt1', text: 'Correct', isCorrect: true },
            { id: 'opt2', text: 'Wrong', isCorrect: false }
          ]
        }
      ]
    }
  ];

  importQuizzes(importSet, false);
  const afterImport = getAllQuizzes();
  assert.ok(afterImport.some(q => q.id === importSet[0].id), 'Imported quiz should be present');

  // Clean up imported quiz
  deleteQuiz(importSet[0].id);

  console.log('✅ quizData tests passed!');
}

module.exports = { testQuizData };

if (require.main === module) {
  testQuizData();
}
