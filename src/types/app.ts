import type { SupportedLanguage } from '../i18n/translations.ts';
import type { PrelimsScoreResult } from '../utils/upscRules.ts';

export type ScreenId =
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'home'
  | 'practice'
  | 'exams'
  | 'prelims_live'
  | 'prelims_result'
  | 'mains'
  | 'interview'
  | 'ranking'
  | 'analytics'
  | 'planner'
  | 'bookmarks'
  | 'notifications'
  | 'records'
  | 'profile'
  | 'admin';

export interface CatalogSubject {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  nameGu: string;
  stage: string;
  sortOrder: number;
}

export interface ExamRuleVersion {
  id: string;
  versionName: string;
  examYear: number;
  paperCode: string;
  durationMinutes: number;
  questionCount: number;
  marksPerQuestion: string | number;
  negativeMarkingRatio: string | number;
  qualifyingPercent: string | number | null;
  isActive: boolean;
  updatedBy: string;
  createdAt: string;
}

export interface CatalogExam {
  id: string;
  slug: string;
  titleEn: string;
  titleHi: string;
  titleGu: string;
  paperType: string;
  ruleVersionId: string | null;
  isDemo: boolean;
}

export interface CatalogQuestion {
  id: string;
  externalCode: string;
  subjectSlug: string;
  topicName: string;
  difficulty: number;
  questionType: string;
  paperCode: string;
  isPyq: boolean;
  pyqYear: number | null;
  marks: number;
  negativeMarks: number;
  isAiGenerated: boolean;
  sourceTitle: string;
  citationText: string;
  correctOption: string;
  translations: Record<
    string,
    {
      questionText: string;
      explanation: string;
      isOfficialTranslation: boolean;
      options: Array<{ key: string; text: string }>;
    }
  >;
}

export interface CurrentAffairItem {
  id: string;
  slug: string;
  publishedDate: string;
  subjectSlug: string;
  gsPaper: string;
  titleEn: string;
  titleHi: string;
  titleGu: string;
  summaryEn: string;
  summaryHi: string;
  summaryGu: string;
  sourceCitation: string;
}

export interface CatalogData {
  subjects: CatalogSubject[];
  rules: ExamRuleVersion[];
  ruleHistory: ExamRuleVersion[];
  exams: CatalogExam[];
  questions: CatalogQuestion[];
  currentAffairs: CurrentAffairItem[];
}

export interface StudentProfile {
  fullName: string;
  email: string;
  mobileNumber: string;
  preferredLanguage: SupportedLanguage;
  prepLevel: string;
  optionalSubject: string;
  targetYear: number;
  dailyStudyHours: number;
  homeState: string;
  leaderboardOptOut: boolean;
  streakDays: number;
  dafSummary: {
    hobbies?: string;
    graduationStream?: string;
    servicePreference?: string;
    cadrePreference?: string;
  };
}

export interface ExamResultSummary {
  id: string;
  examTitle: string;
  paperCode: string;
  createdAt: string;
  timeSpentSeconds: number;
  computed: PrelimsScoreResult;
  questions: CatalogQuestion[];
  answers: Record<string, { selectedOption: string | null; isMarkedForReview: boolean }>;
}

export interface MainsEvalRecord {
  id: string;
  paperCode: string;
  promptText: string;
  answerText: string;
  wordCount: number;
  overallScore: number;
  maxMarks: number;
  createdAt: string;
  rubric: Record<string, { score: number; max: number; note: string }>;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface InterviewTurn {
  role: 'board' | 'candidate';
  text: string;
  category?: string;
  timestamp: string;
}

export interface InterviewReport {
  practiceScoreOutOf275: number;
  dimensions: Array<{ name: string; score: number; max: number; feedback: string }>;
  overallSummary: string;
  disclaimer: string;
}

export interface InterviewSessionRecord {
  id: string;
  dafSummary: Record<string, string>;
  transcript: InterviewTurn[];
  evaluationReport: InterviewReport;
  practiceScore: number;
  maxScore: number;
  createdAt: string;
}

export interface PastRecordsPayload {
  prelimsResults: ExamResultSummary[];
  mainsSubmissions: MainsEvalRecord[];
  interviewSessions: InterviewSessionRecord[];
  platformTotals: {
    prelimsAttempts: number;
    mainsEvaluations: number;
    interviewSessions: number;
    approvedQuestions: number;
    pyqCount: number;
  };
}

export interface StudyTask {
  id: string;
  dayLabel: string;
  taskTitle: string;
  subjectSlug: string;
  plannedMinutes: number;
  isCompleted: boolean;
}

export interface BookmarkItem {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  subtitle: string;
}

export interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
