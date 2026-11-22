export interface ExamRuleConfig {
  paperCode: string;
  durationMinutes: number;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarkingRatio: number; // e.g., 1/3 = 0.333333
  qualifyingPercent: number | null; // e.g., 33 for CSAT, null for GS I
}

export interface ScorableQuestion {
  id: string;
  subjectSlug: string;
  correctOption: string; // 'A' | 'B' | 'C' | 'D'
  marks?: number;
  negativeMarks?: number;
}

export interface AnswerEntry {
  selectedOption: string | null;
  isMarkedForReview: boolean;
  timeSpentSeconds?: number;
  visited?: boolean;
}

export interface PrelimsScoreResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  positiveMarks: number;
  negativeMarks: number;
  totalScore: number;
  maxScore: number;
  accuracyPercent: number;
  passedQualifying: boolean | null;
  subjectBreakdown: Record<
    string,
    { total: number; correct: number; incorrect: number; unattempted: number; score: number }
  >;
}

export function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePrelimsScore(
  questions: ScorableQuestion[],
  answersByQuestionId: Record<string, AnswerEntry | undefined>,
  rules: ExamRuleConfig
): PrelimsScoreResult {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let positiveMarks = 0;
  let negativeMarks = 0;
  let maxScore = 0;

  const subjectBreakdown: PrelimsScoreResult['subjectBreakdown'] = {};

  for (const q of questions) {
    const qMarks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : rules.marksPerQuestion;
    const qPenalty =
      typeof q.negativeMarks === 'number' && q.negativeMarks >= 0
        ? q.negativeMarks
        : roundToTwo(qMarks * rules.negativeMarkingRatio);

    maxScore += qMarks;

    if (!subjectBreakdown[q.subjectSlug]) {
      subjectBreakdown[q.subjectSlug] = {
        total: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        score: 0,
      };
    }
    const bucket = subjectBreakdown[q.subjectSlug];
    bucket.total += 1;

    const ans = answersByQuestionId[q.id];
    const selected = ans?.selectedOption?.trim() || null;

    if (!selected) {
      unattemptedCount += 1;
      bucket.unattempted += 1;
    } else if (selected.toUpperCase() === q.correctOption.toUpperCase()) {
      correctCount += 1;
      positiveMarks += qMarks;
      bucket.correct += 1;
      bucket.score = roundToTwo(bucket.score + qMarks);
    } else {
      incorrectCount += 1;
      negativeMarks += qPenalty;
      bucket.incorrect += 1;
      bucket.score = roundToTwo(bucket.score - qPenalty);
    }
  }

  positiveMarks = roundToTwo(positiveMarks);
  negativeMarks = roundToTwo(negativeMarks);
  maxScore = roundToTwo(maxScore);
  const totalScore = roundToTwo(positiveMarks - negativeMarks);

  const attempted = correctCount + incorrectCount;
  const accuracyPercent = attempted > 0 ? roundToTwo((correctCount / attempted) * 100) : 0;

  let passedQualifying: boolean | null = null;
  if (rules.qualifyingPercent !== null && maxScore > 0) {
    const percentageAchieved = (totalScore / maxScore) * 100;
    passedQualifying = percentageAchieved >= rules.qualifyingPercent;
  }

  return {
    totalQuestions: questions.length,
    correctCount,
    incorrectCount,
    unattemptedCount,
    positiveMarks,
    negativeMarks,
    totalScore,
    maxScore,
    accuracyPercent,
    passedQualifying,
    subjectBreakdown,
  };
}

export interface PaletteCounts {
  answered: number;
  notAnswered: number;
  markedForReview: number;
  answeredAndMarked: number;
  notVisited: number;
}

export function getPaletteCounts(
  questionIds: string[],
  answersByQuestionId: Record<string, AnswerEntry | undefined>
): PaletteCounts {
  const counts: PaletteCounts = {
    answered: 0,
    notAnswered: 0,
    markedForReview: 0,
    answeredAndMarked: 0,
    notVisited: 0,
  };

  for (const id of questionIds) {
    const entry = answersByQuestionId[id];
    if (!entry || (!entry.visited && !entry.selectedOption && !entry.isMarkedForReview)) {
      counts.notVisited += 1;
    } else if (entry.selectedOption && entry.isMarkedForReview) {
      counts.answeredAndMarked += 1;
    } else if (entry.selectedOption) {
      counts.answered += 1;
    } else if (entry.isMarkedForReview) {
      counts.markedForReview += 1;
    } else {
      counts.notAnswered += 1;
    }
  }

  return counts;
}

export interface LeaderboardCandidate {
  id: string;
  ruleVersionId: string;
  totalScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
}

export function sortLeaderboard<T extends LeaderboardCandidate>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.accuracyPercent !== a.accuracyPercent) {
      return b.accuracyPercent - a.accuracyPercent;
    }
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export interface RubricDimensionInput {
  score: number;
  max: number;
}

export function computeWeightedMainsScore(
  rubric: Record<string, RubricDimensionInput>,
  targetMaxMarks: number
): number {
  const entries = Object.values(rubric);
  if (entries.length === 0 || targetMaxMarks <= 0) return 0;

  let earned = 0;
  let possible = 0;
  for (const item of entries) {
    earned += Math.max(0, Math.min(item.score, item.max));
    possible += Math.max(0, item.max);
  }
  if (possible === 0) return 0;
  return roundToTwo((earned / possible) * targetMaxMarks);
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}
