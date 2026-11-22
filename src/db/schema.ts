import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('student'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  mobileNumber: text('mobile_number').default(''),
  preferredLanguage: text('preferred_language').notNull().default('en'),
  prepLevel: text('prep_level').notNull().default('foundation'),
  optionalSubject: text('optional_subject').notNull().default('PSIR'),
  targetYear: integer('target_year').notNull().default(2027),
  dailyStudyHours: integer('daily_study_hours').notNull().default(6),
  homeState: text('home_state').notNull().default('Delhi'),
  dafSummary: jsonb('daf_summary').$type<{
    hobbies?: string;
    graduationStream?: string;
    servicePreference?: string;
    cadrePreference?: string;
  }>().default({}),
  leaderboardOptOut: boolean('leaderboard_opt_out').notNull().default(false),
  streakDays: integer('streak_days').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameHi: text('name_hi').notNull(),
  nameGu: text('name_gu').notNull(),
  stage: text('stage').notNull().default('prelims'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const syllabusTopics = pgTable('syllabus_topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  titleEn: text('title_en').notNull(),
  titleHi: text('title_hi').notNull(),
  titleGu: text('title_gu').notNull(),
  paperCode: text('paper_code').notNull().default('GS1'),
  weightage: integer('weightage').notNull().default(10),
});

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    externalCode: text('external_code').notNull().unique(),
    subjectSlug: text('subject_slug').notNull(),
    topicName: text('topic_name').notNull(),
    difficulty: integer('difficulty').notNull().default(2),
    questionType: text('question_type').notNull().default('single_mcq'),
    marks: numeric('marks', { precision: 6, scale: 2 }).notNull().default('2.00'),
    negativeMarks: numeric('negative_marks', { precision: 6, scale: 2 }).notNull().default('0.67'),
    isPyq: boolean('is_pyq').notNull().default(false),
    pyqYear: integer('pyq_year'),
    examStage: text('exam_stage').notNull().default('prelims'),
    paperCode: text('paper_code').notNull().default('GS_I'),
    status: text('status').notNull().default('approved'),
    version: integer('version').notNull().default(1),
    isAiGenerated: boolean('is_ai_generated').notNull().default(false),
    createdBy: text('created_by').default('system'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_questions_subject_status').on(table.subjectSlug, table.status),
    index('idx_questions_paper_pyq').on(table.paperCode, table.isPyq),
  ]
);

export const questionTranslations = pgTable(
  'question_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    language: text('language').notNull(),
    questionText: text('question_text').notNull(),
    explanation: text('explanation').notNull(),
    isOfficialTranslation: boolean('is_official_translation').notNull().default(true),
    translationSource: text('translation_source').notNull().default('editorial'),
  },
  (table) => [index('idx_qt_question_lang').on(table.questionId, table.language)]
);

export const questionOptions = pgTable(
  'question_options',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    language: text('language').notNull(),
    optionKey: text('option_key').notNull(),
    optionText: text('option_text').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
  },
  (table) => [index('idx_qo_question_lang').on(table.questionId, table.language)]
);

export const questionSources = pgTable('question_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  sourceTitle: text('source_title').notNull(),
  sourceUrl: text('source_url').default(''),
  citationText: text('citation_text').notNull(),
});

export const questionReviews = pgTable('question_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  reviewerEmail: text('reviewer_email').notNull(),
  decision: text('decision').notNull(),
  notes: text('notes').default(''),
  reviewedAt: timestamp('reviewed_at').defaultNow().notNull(),
});

export const examRuleVersions = pgTable('exam_rule_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  versionName: text('version_name').notNull(),
  examYear: integer('exam_year').notNull().default(2026),
  paperCode: text('paper_code').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  questionCount: integer('question_count').notNull(),
  marksPerQuestion: numeric('marks_per_question', { precision: 6, scale: 2 }).notNull(),
  negativeMarkingRatio: numeric('negative_marking_ratio', { precision: 6, scale: 4 }).notNull(),
  qualifyingPercent: numeric('qualifying_percent', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: text('updated_by').notNull().default('system'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exams = pgTable('exams', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  titleEn: text('title_en').notNull(),
  titleHi: text('title_hi').notNull(),
  titleGu: text('title_gu').notNull(),
  paperType: text('paper_type').notNull(),
  ruleVersionId: uuid('rule_version_id').references(() => examRuleVersions.id),
  scheduledAt: timestamp('scheduled_at').defaultNow(),
  isPublished: boolean('is_published').notNull().default(true),
  isDemo: boolean('is_demo').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const examSections = pgTable('exam_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  subjectFilter: text('subject_filter'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const examQuestions = pgTable('exam_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  sectionId: uuid('section_id').references(() => examSections.id, { onDelete: 'set null' }),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const examAttempts = pgTable(
  'exam_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: text('status').notNull().default('in_progress'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    submittedAt: timestamp('submitted_at'),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    currentQuestionIndex: integer('current_question_index').notNull().default(0),
    language: text('language').notNull().default('en'),
  },
  (table) => [index('idx_attempts_user_exam').on(table.userId, table.examId)]
);

export const studentAnswers = pgTable(
  'student_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').references(() => examAttempts.id, { onDelete: 'cascade' }).notNull(),
    questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
    selectedOption: text('selected_option'),
    isMarkedForReview: boolean('is_marked_for_review').notNull().default(false),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_sa_attempt_question').on(table.attemptId, table.questionId)]
);

export const results = pgTable('results', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id').references(() => examAttempts.id, { onDelete: 'cascade' }).notNull().unique(),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctCount: integer('correct_count').notNull(),
  incorrectCount: integer('incorrect_count').notNull(),
  unattemptedCount: integer('unattempted_count').notNull(),
  positiveMarks: numeric('positive_marks', { precision: 8, scale: 2 }).notNull(),
  negativeMarks: numeric('negative_marks', { precision: 8, scale: 2 }).notNull(),
  totalScore: numeric('total_score', { precision: 8, scale: 2 }).notNull(),
  maxScore: numeric('max_score', { precision: 8, scale: 2 }).notNull(),
  accuracyPercent: numeric('accuracy_percent', { precision: 5, scale: 2 }).notNull(),
  passedQualifying: boolean('passed_qualifying'),
  subjectBreakdown: jsonb('subject_breakdown').$type<Record<string, { total: number; correct: number; incorrect: number; score: number }>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rankings = pgTable(
  'rankings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resultId: uuid('result_id').references(() => results.id, { onDelete: 'cascade' }).notNull().unique(),
    examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    stateName: text('state_name').notNull().default('Delhi'),
    totalScore: numeric('total_score', { precision: 8, scale: 2 }).notNull(),
    accuracyPercent: numeric('accuracy_percent', { precision: 5, scale: 2 }).notNull(),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    ruleVersionId: uuid('rule_version_id'),
    computedAt: timestamp('computed_at').defaultNow().notNull(),
  },
  (table) => [index('idx_rankings_exam_score').on(table.examId, table.totalScore)]
);

export const mainsSubmissions = pgTable('mains_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  paperCode: text('paper_code').notNull(),
  optionalSubject: text('optional_subject'),
  promptText: text('prompt_text').notNull(),
  answerText: text('answer_text').default(''),
  wordCount: integer('word_count').notNull().default(0),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  attachmentName: text('attachment_name'),
  attachmentMime: text('attachment_mime'),
  status: text('status').notNull().default('submitted'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const evaluations = pgTable('evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').references(() => mainsSubmissions.id, { onDelete: 'cascade' }).notNull(),
  evaluatorType: text('evaluator_type').notNull().default('ai'),
  overallScore: numeric('overall_score', { precision: 6, scale: 2 }).notNull(),
  maxScore: numeric('max_score', { precision: 6, scale: 2 }).notNull(),
  rubricScores: jsonb('rubric_scores').$type<Record<string, { score: number; max: number; note: string }>>().notNull(),
  strengths: jsonb('strengths').$type<string[]>().default([]),
  improvements: jsonb('improvements').$type<string[]>().default([]),
  modelAnswer: text('model_answer').notNull(),
  isPracticeEstimate: boolean('is_practice_estimate').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dafSummary: jsonb('daf_summary').$type<Record<string, string>>().default({}),
  status: text('status').notNull().default('active'),
  transcript: jsonb('transcript').$type<Array<{ role: 'board' | 'candidate'; text: string; category?: string; timestamp: string }>>().default([]),
  evaluationReport: jsonb('evaluation_report').$type<{
    practiceScoreOutOf275: number;
    dimensions: Array<{ name: string; score: number; max: number; feedback: string }>;
    overallSummary: string;
    disclaimer: string;
  }>(),
  practiceScore: numeric('practice_score', { precision: 6, scale: 2 }),
  maxScore: integer('max_score').notNull().default(275),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  planCode: text('plan_code').notNull().default('free'),
  status: text('status').notNull().default('active'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  email: text('email').notNull().unique(),
  adminRole: text('admin_role').notNull().default('Super Admin'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: jsonb('details').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const currentAffairs = pgTable('current_affairs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  publishedDate: text('published_date').notNull(),
  subjectSlug: text('subject_slug').notNull(),
  gsPaper: text('gs_paper').notNull(),
  titleEn: text('title_en').notNull(),
  titleHi: text('title_hi').notNull(),
  titleGu: text('title_gu').notNull(),
  summaryEn: text('summary_en').notNull(),
  summaryHi: text('summary_hi').notNull(),
  summaryGu: text('summary_gu').notNull(),
  sourceCitation: text('source_citation').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  itemType: text('item_type').notNull(),
  itemId: text('item_id').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studyPlans = pgTable('study_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dayLabel: text('day_label').notNull(),
  taskTitle: text('task_title').notNull(),
  subjectSlug: text('subject_slug').default('polity'),
  plannedMinutes: integer('planned_minutes').notNull().default(60),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questionsRelations = relations(questions, ({ many }) => ({
  translations: many(questionTranslations),
  options: many(questionOptions),
  sources: many(questionSources),
  reviews: many(questionReviews),
}));

export const questionTranslationsRelations = relations(questionTranslations, ({ one }) => ({
  question: one(questions, {
    fields: [questionTranslations.questionId],
    references: [questions.id],
  }),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const questionSourcesRelations = relations(questionSources, ({ one }) => ({
  question: one(questions, {
    fields: [questionSources.questionId],
    references: [questions.id],
  }),
}));
