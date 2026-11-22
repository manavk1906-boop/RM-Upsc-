import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePrelimsScore,
  computeWeightedMainsScore,
  countWords,
  formatCountdown,
  getPaletteCounts,
  sortLeaderboard,
} from './upscRules';

test('GS Paper I scoring applies 1/3rd negative marking accurately', () => {
  const questions = [
    { id: 'q1', subjectSlug: 'polity', correctOption: 'A' },
    { id: 'q2', subjectSlug: 'polity', correctOption: 'B' },
    { id: 'q3', subjectSlug: 'economy', correctOption: 'C' },
    { id: 'q4', subjectSlug: 'history', correctOption: 'D' },
  ];

  const answers = {
    q1: { selectedOption: 'A', isMarkedForReview: false, visited: true }, // +2
    q2: { selectedOption: 'C', isMarkedForReview: false, visited: true }, // -0.67
    q3: { selectedOption: null, isMarkedForReview: true, visited: true }, // 0
    // q4 unattempted
  };

  const result = calculatePrelimsScore(questions, answers, {
    paperCode: 'GS_I',
    durationMinutes: 120,
    questionCount: 100,
    marksPerQuestion: 2,
    negativeMarkingRatio: 1 / 3,
    qualifyingPercent: null,
  });

  assert.equal(result.correctCount, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unattemptedCount, 2);
  assert.equal(result.positiveMarks, 2);
  assert.equal(result.negativeMarks, 0.67);
  assert.equal(result.totalScore, 1.33);
  assert.equal(result.maxScore, 8);
  assert.equal(result.accuracyPercent, 50);
  assert.equal(result.passedQualifying, null);
  assert.equal(result.subjectBreakdown.polity.score, 1.33);
});

test('CSAT Paper II enforces 33% qualifying threshold with 2.5 marks per question', () => {
  const questions = [
    { id: 'c1', subjectSlug: 'csat', correctOption: 'A' },
    { id: 'c2', subjectSlug: 'csat', correctOption: 'B' },
    { id: 'c3', subjectSlug: 'csat', correctOption: 'C' },
  ];

  const passing = calculatePrelimsScore(
    questions,
    {
      c1: { selectedOption: 'A', isMarkedForReview: false },
      c2: { selectedOption: 'B', isMarkedForReview: false },
    },
    {
      paperCode: 'CSAT_II',
      durationMinutes: 120,
      questionCount: 80,
      marksPerQuestion: 2.5,
      negativeMarkingRatio: 1 / 3,
      qualifyingPercent: 33,
    }
  );
  assert.equal(passing.totalScore, 5);
  assert.equal(passing.passedQualifying, true);

  const failing = calculatePrelimsScore(
    questions,
    {
      c1: { selectedOption: 'D', isMarkedForReview: false },
      c2: { selectedOption: 'D', isMarkedForReview: false },
    },
    {
      paperCode: 'CSAT_II',
      durationMinutes: 120,
      questionCount: 80,
      marksPerQuestion: 2.5,
      negativeMarkingRatio: 1 / 3,
      qualifyingPercent: 33,
    }
  );
  assert.equal(failing.passedQualifying, false);
});

test('Question palette counts categorize all 5 UPSC CBT states correctly', () => {
  const counts = getPaletteCounts(['1', '2', '3', '4', '5'], {
    '1': { selectedOption: 'A', isMarkedForReview: false, visited: true },
    '2': { selectedOption: 'B', isMarkedForReview: true, visited: true },
    '3': { selectedOption: null, isMarkedForReview: true, visited: true },
    '4': { selectedOption: null, isMarkedForReview: false, visited: true },
  });

  assert.deepEqual(counts, {
    answered: 1,
    answeredAndMarked: 1,
    markedForReview: 1,
    notAnswered: 1,
    notVisited: 1,
  });
});

test('Leaderboard tie-breaker sorts by score desc, accuracy desc, time asc', () => {
  const sorted = sortLeaderboard([
    { id: 'u1', ruleVersionId: 'r1', totalScore: 112, accuracyPercent: 78, timeSpentSeconds: 5000 },
    { id: 'u2', ruleVersionId: 'r1', totalScore: 112, accuracyPercent: 84, timeSpentSeconds: 5400 },
    { id: 'u3', ruleVersionId: 'r1', totalScore: 112, accuracyPercent: 84, timeSpentSeconds: 4800 },
    { id: 'u4', ruleVersionId: 'r1', totalScore: 120, accuracyPercent: 75, timeSpentSeconds: 6000 },
  ]);

  assert.deepEqual(
    sorted.map((x) => x.id),
    ['u4', 'u3', 'u2', 'u1']
  );
});

test('Multilingual word counter and Mains weighted rubric scoring work cleanly', () => {
  assert.equal(countWords('The doctrine of basic structure preserves constitutional supremacy.'), 8);
  assert.equal(countWords('ભારતીય બંધારણનું મૂળભૂત માળખું સર્વોપરી છે.'), 6);
  assert.equal(countWords('भारतीय संविधान का मूल ढांचा सर्वोच्च है।'), 7);

  const score = computeWeightedMainsScore(
    {
      relevance: { score: 8, max: 10 },
      accuracy: { score: 7, max: 10 },
      structure: { score: 8, max: 10 },
    },
    15
  );
  assert.equal(score, 11.5);
  assert.equal(formatCountdown(3665), '01:01:05');
});
