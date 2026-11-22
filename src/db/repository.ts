import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminUsers,
  auditLogs,
  bookmarks,
  currentAffairs,
  evaluations,
  examAttempts,
  examQuestions,
  examRuleVersions,
  exams,
  interviewSessions,
  mainsSubmissions,
  notifications,
  questionOptions,
  questionReviews,
  questions,
  questionSources,
  questionTranslations,
  rankings,
  results,
  studentAnswers,
  studentProfiles,
  studyPlans,
  subjects,
  subscriptions,
  users,
} from './schema.ts';
import {
  DEFAULT_EXAM_RULES,
  SEED_CURRENT_AFFAIRS,
  SEED_QUESTIONS,
  SEED_SUBJECTS,
} from '../data/upscSeed.ts';
import {
  calculatePrelimsScore,
  computeWeightedMainsScore,
  countWords,
  sortLeaderboard,
} from '../utils/upscRules.ts';
import type { SupportedLanguage } from '../i18n/translations.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeedData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const existingSubjects = await db.select().from(subjects).limit(1);
        if (existingSubjects.length === 0) {
          for (const sub of SEED_SUBJECTS) {
            await db
              .insert(subjects)
              .values(sub)
              .onConflictDoNothing();
          }
        }

        const existingRules = await db.select().from(examRuleVersions).limit(1);
        let gsRuleId: string | null = null;
        let csatRuleId: string | null = null;

        if (existingRules.length === 0) {
          for (const rule of DEFAULT_EXAM_RULES) {
            const [inserted] = await db
              .insert(examRuleVersions)
              .values({
                versionName: rule.versionName,
                examYear: rule.examYear,
                paperCode: rule.paperCode,
                durationMinutes: rule.durationMinutes,
                questionCount: rule.questionCount,
                marksPerQuestion: String(rule.marksPerQuestion),
                negativeMarkingRatio: String(rule.negativeMarkingRatio.toFixed(4)),
                qualifyingPercent: rule.qualifyingPercent !== null ? String(rule.qualifyingPercent) : null,
                isActive: true,
                updatedBy: 'system',
              })
              .returning();
            if (rule.paperCode === 'GS_I') gsRuleId = inserted.id;
            if (rule.paperCode === 'CSAT_II') csatRuleId = inserted.id;
          }
        } else {
          const allRules = await db.select().from(examRuleVersions).where(eq(examRuleVersions.isActive, true));
          gsRuleId = allRules.find((r) => r.paperCode === 'GS_I')?.id || null;
          csatRuleId = allRules.find((r) => r.paperCode === 'CSAT_II')?.id || null;
        }

        const existingQuestions = await db.select({ id: questions.id, externalCode: questions.externalCode, paperCode: questions.paperCode, isPyq: questions.isPyq }).from(questions);
        const existingCodeSet = new Set(existingQuestions.map((q) => q.externalCode));

        for (const q of SEED_QUESTIONS) {
          if (existingCodeSet.has(q.externalCode)) continue;
          const [insertedQ] = await db
            .insert(questions)
            .values({
              externalCode: q.externalCode,
              subjectSlug: q.subjectSlug,
              topicName: q.topicName,
              difficulty: q.difficulty,
              questionType: q.questionType,
              marks: String(q.marks),
              negativeMarks: String(q.negativeMarks),
              isPyq: q.isPyq,
              pyqYear: q.pyqYear,
              examStage: 'prelims',
              paperCode: q.paperCode,
              status: q.status,
              version: 1,
              isAiGenerated: Boolean(q.isAiGenerated),
              createdBy: 'editorial',
            })
            .onConflictDoNothing()
            .returning();

          if (insertedQ) {
            existingCodeSet.add(q.externalCode);
            const langs: SupportedLanguage[] = ['en', 'hi', 'gu'];
            for (const lang of langs) {
              const tr = q.translations[lang];
              await db.insert(questionTranslations).values({
                questionId: insertedQ.id,
                language: lang,
                questionText: tr.questionText,
                explanation: tr.explanation,
                isOfficialTranslation: tr.isOfficialTranslation,
                translationSource: tr.isOfficialTranslation ? 'official' : 'ai',
              });
              for (const opt of tr.options) {
                await db.insert(questionOptions).values({
                  questionId: insertedQ.id,
                  language: lang,
                  optionKey: opt.key,
                  optionText: opt.text,
                  isCorrect: opt.key === q.correctOption,
                });
              }
            }
            await db.insert(questionSources).values({
              questionId: insertedQ.id,
              sourceTitle: q.sourceTitle,
              citationText: q.citationText,
            });
          }
        }

        // Idempotently ensure all 3 core exams exist (GS I, CSAT II, and Official 2018-2024 PYQ Archive)
        const desiredExams = [
          {
            slug: 'prelims-gs-paper-1-demo',
            titleEn: 'Prelims GS Paper I — National Mock (Past + Curated Set)',
            titleHi: 'प्रारंभिक परीक्षा GS पेपर I — राष्ट्रीय मॉक (विगत + अभ्यास सेट)',
            titleGu: 'પ્રિલિમ્સ GS પેપર I — રાષ્ટ્રીય મોક (અગાઉના + અભ્યાસ સેટ)',
            paperType: 'GS_I',
            ruleVersionId: gsRuleId,
            isPublished: true,
            isDemo: true,
          },
          {
            slug: 'prelims-csat-paper-2-demo',
            titleEn: 'Prelims CSAT Paper II — Qualifying Mock (33% Threshold)',
            titleHi: 'प्रारंभिक परीक्षा CSAT पेपर II — अर्हक मॉक (33% न्यूनतम)',
            titleGu: 'પ્રિલિમ્સ CSAT પેપર II — ક્વોલિફાઇંગ મોક (33% લાયકાત)',
            paperType: 'CSAT_II',
            ruleVersionId: csatRuleId,
            isPublished: true,
            isDemo: true,
          },
          {
            slug: 'prelims-pyq-archive',
            titleEn: 'UPSC CSE Past Year Papers Archive (2018–2024 Official PYQs)',
            titleHi: 'UPSC CSE विगत वर्ष प्रश्न पत्र संग्रह (2018–2024 आधिकारिक PYQ)',
            titleGu: 'UPSC CSE પાછલા વર્ષોના પેપર્સ સંગ્રહ (2018–2024 સત્તાવાર PYQ)',
            paperType: 'GS_I',
            ruleVersionId: gsRuleId,
            isPublished: true,
            isDemo: false,
          },
        ];

        for (const examSpec of desiredExams) {
          await db.insert(exams).values(examSpec).onConflictDoNothing();
        }

        const [allExamsAfter, allQsAfter, existingLinks] = await Promise.all([
          db.select().from(exams),
          db.select().from(questions),
          db.select().from(examQuestions),
        ]);
        const linkKeys = new Set(existingLinks.map((l) => `${l.examId}:${l.questionId}`));

        for (const ex of allExamsAfter) {
          const matchingQs =
            ex.slug === 'prelims-pyq-archive'
              ? allQsAfter.filter((q) => q.isPyq)
              : allQsAfter.filter((q) => q.paperCode === ex.paperType);
          for (let i = 0; i < matchingQs.length; i++) {
            const key = `${ex.id}:${matchingQs[i].id}`;
            if (!linkKeys.has(key)) {
              await db.insert(examQuestions).values({
                examId: ex.id,
                questionId: matchingQs[i].id,
                sortOrder: i + 1,
              });
              linkKeys.add(key);
            }
          }
        }

        const existingCa = await db.select().from(currentAffairs).limit(1);
        if (existingCa.length === 0) {
          for (const ca of SEED_CURRENT_AFFAIRS) {
            await db.insert(currentAffairs).values(ca).onConflictDoNothing();
          }
        }

        await db
          .insert(adminUsers)
          .values({
            email: 'pm4846833@gmail.com',
            adminRole: 'Super Admin',
            isActive: true,
          })
          .onConflictDoNothing();
      } catch (err) {
        seedPromise = null;
        console.error('Database seed error:', err);
        throw new Error('Failed to initialize examination catalog.', { cause: err });
      }
    })();
  }
  return seedPromise;
}

export async function getOrCreatePublicAspirant() {
  return getOrCreateUser('public-aspirant', 'aspirant@upsc-elite.local', 'Open Aspirant Session');
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const [user] = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    const existingProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, user.id))
      .limit(1);

    if (existingProfile.length === 0) {
      await db
        .insert(studentProfiles)
        .values({
          userId: user.id,
          fullName: displayName || email.split('@')[0],
          email,
          preferredLanguage: 'en',
          prepLevel: 'foundation',
          optionalSubject: 'PSIR',
          targetYear: 2027,
          dailyStudyHours: 6,
          homeState: 'Delhi',
        })
        .onConflictDoNothing();

      await db
        .insert(subscriptions)
        .values({
          userId: user.id,
          planCode: 'free',
          status: 'active',
        })
        .onConflictDoNothing();

      await db.insert(notifications).values({
        userId: user.id,
        category: 'study_reminder',
        title: 'Welcome to UPSC ELITE',
        body: 'Your Prelims, Mains, and Personality Test workspace is ready. Begin with today’s 10-question challenge.',
      });
    }

    return user;
  } catch (err) {
    console.error('getOrCreateUser error:', err);
    throw new Error('Failed to synchronize user account.', { cause: err });
  }
}

export async function getFullCatalog() {
  try {
    await ensureSeedData();
    const [allSubjects, allRules, allExams, allQuestions, allTranslations, allOptions, allSources, allCa] =
      await Promise.all([
        db.select().from(subjects).orderBy(subjects.sortOrder),
        db.select().from(examRuleVersions).orderBy(desc(examRuleVersions.createdAt)),
        db.select().from(exams).where(eq(exams.isPublished, true)),
        db.select().from(questions).where(eq(questions.status, 'approved')).orderBy(desc(questions.createdAt)),
        db.select().from(questionTranslations),
        db.select().from(questionOptions),
        db.select().from(questionSources),
        db.select().from(currentAffairs).orderBy(desc(currentAffairs.publishedDate)),
      ]);

    const translationsByQ = new Map<string, typeof allTranslations>();
    for (const tr of allTranslations) {
      const list = translationsByQ.get(tr.questionId) || [];
      list.push(tr);
      translationsByQ.set(tr.questionId, list);
    }

    const optionsByQ = new Map<string, typeof allOptions>();
    for (const opt of allOptions) {
      const list = optionsByQ.get(opt.questionId) || [];
      list.push(opt);
      optionsByQ.set(opt.questionId, list);
    }

    const sourcesByQ = new Map<string, typeof allSources>();
    for (const src of allSources) {
      const list = sourcesByQ.get(src.questionId) || [];
      list.push(src);
      sourcesByQ.set(src.questionId, list);
    }

    const hydratedQuestions = allQuestions.map((q) => {
      const trs = translationsByQ.get(q.id) || [];
      const opts = optionsByQ.get(q.id) || [];
      const srcs = sourcesByQ.get(q.id) || [];
      const enCorrect = opts.find((o) => o.isCorrect)?.optionKey || 'A';

      const translations: Record<string, {
        questionText: string;
        explanation: string;
        isOfficialTranslation: boolean;
        options: Array<{ key: string; text: string }>;
      }> = {};

      for (const lang of ['en', 'hi', 'gu'] as const) {
        const tr = trs.find((t) => t.language === lang) || trs[0];
        const langOpts = opts
          .filter((o) => o.language === lang)
          .sort((a, b) => a.optionKey.localeCompare(b.optionKey));
        const fallbackOpts = opts
          .filter((o) => o.language === 'en')
          .sort((a, b) => a.optionKey.localeCompare(b.optionKey));
        const activeOpts = langOpts.length >= 4 ? langOpts : fallbackOpts;

        if (tr) {
          translations[lang] = {
            questionText: tr.questionText,
            explanation: tr.explanation,
            isOfficialTranslation: tr.isOfficialTranslation,
            options: activeOpts.map((o) => ({ key: o.optionKey, text: o.optionText })),
          };
        }
      }

      return {
        id: q.id,
        externalCode: q.externalCode,
        subjectSlug: q.subjectSlug,
        topicName: q.topicName,
        difficulty: q.difficulty,
        questionType: q.questionType,
        paperCode: q.paperCode,
        isPyq: q.isPyq,
        pyqYear: q.pyqYear,
        marks: Number(q.marks),
        negativeMarks: Number(q.negativeMarks),
        isAiGenerated: q.isAiGenerated,
        sourceTitle: srcs[0]?.sourceTitle || 'UPSC Reference',
        citationText: srcs[0]?.citationText || '',
        correctOption: enCorrect,
        translations,
      };
    });

    return {
      subjects: allSubjects,
      rules: allRules.filter((r) => r.isActive),
      ruleHistory: allRules,
      exams: allExams,
      questions: hydratedQuestions,
      currentAffairs: allCa,
    };
  } catch (err) {
    console.error('getFullCatalog error:', err);
    throw new Error('Failed to load examination catalog.', { cause: err });
  }
}

export async function getUserWorkspaceData(userId: string, email: string) {
  try {
    const [profileRows, resultRows, mainsRows, interviewRows, subRows, notifRows, bookmarkRows, planRows, adminRows] =
      await Promise.all([
        db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1),
        db.select().from(results).where(eq(results.userId, userId)).orderBy(desc(results.createdAt)).limit(25),
        db
          .select()
          .from(mainsSubmissions)
          .where(eq(mainsSubmissions.userId, userId))
          .orderBy(desc(mainsSubmissions.createdAt))
          .limit(20),
        db
          .select()
          .from(interviewSessions)
          .where(eq(interviewSessions.userId, userId))
          .orderBy(desc(interviewSessions.createdAt))
          .limit(15),
        db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1),
        db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(25),
        db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt)),
        db.select().from(studyPlans).where(eq(studyPlans.userId, userId)).orderBy(studyPlans.createdAt),
        db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1),
      ]);

    const mainsIds = mainsRows.map((m) => m.id);
    const evalRows =
      mainsIds.length > 0
        ? await db.select().from(evaluations).where(inArray(evaluations.submissionId, mainsIds))
        : [];

    return {
      profile: profileRows[0] || null,
      results: resultRows,
      mainsSubmissions: mainsRows.map((m) => ({
        ...m,
        evaluation: evalRows.find((e) => e.submissionId === m.id) || null,
      })),
      interviewSessions: interviewRows,
      subscription: subRows[0] || { planCode: 'free', status: 'active' },
      notifications: notifRows,
      bookmarks: bookmarkRows,
      studyPlans: planRows,
      adminRole: adminRows[0]?.isActive ? adminRows[0].adminRole : null,
    };
  } catch (err) {
    console.error('getUserWorkspaceData error:', err);
    throw new Error('Failed to load aspirant workspace.', { cause: err });
  }
}

export async function updateStudentProfile(
  userId: string,
  payload: Partial<{
    fullName: string;
    mobileNumber: string;
    preferredLanguage: string;
    prepLevel: string;
    optionalSubject: string;
    targetYear: number;
    dailyStudyHours: number;
    homeState: string;
    leaderboardOptOut: boolean;
    dafSummary: Record<string, string>;
  }>
) {
  try {
    const [updated] = await db
      .update(studentProfiles)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, userId))
      .returning();
    return updated;
  } catch (err) {
    console.error('updateStudentProfile error:', err);
    throw new Error('Failed to update student profile.', { cause: err });
  }
}

export async function scoreAndPersistPrelimsAttempt(params: {
  userId: string;
  examId: string;
  paperCode: string;
  questionIds: string[];
  answers: Record<string, { selectedOption: string | null; isMarkedForReview: boolean; timeSpentSeconds?: number }>;
  timeSpentSeconds: number;
  language: SupportedLanguage;
}) {
  try {
    const activeRules = await db
      .select()
      .from(examRuleVersions)
      .where(and(eq(examRuleVersions.paperCode, params.paperCode), eq(examRuleVersions.isActive, true)))
      .limit(1);

    const rule = activeRules[0];
    const marksPerQ = rule ? Number(rule.marksPerQuestion) : params.paperCode === 'CSAT_II' ? 2.5 : 2;
    const negRatio = rule ? Number(rule.negativeMarkingRatio) : 1 / 3;
    const qualifying = rule?.qualifyingPercent ? Number(rule.qualifyingPercent) : params.paperCode === 'CSAT_II' ? 33 : null;

    const qRows = await db.select().from(questions).where(inArray(questions.id, params.questionIds));
    const optRows = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, params.questionIds));

    const scorable = qRows.map((q) => {
      const correct = optRows.find((o) => o.questionId === q.id && o.isCorrect)?.optionKey || 'A';
      return {
        id: q.id,
        subjectSlug: q.subjectSlug,
        correctOption: correct,
        marks: marksPerQ,
        negativeMarks: Number((marksPerQ * negRatio).toFixed(2)),
      };
    });

    const computed = calculatePrelimsScore(scorable, params.answers, {
      paperCode: params.paperCode,
      durationMinutes: rule?.durationMinutes || 120,
      questionCount: params.questionIds.length,
      marksPerQuestion: marksPerQ,
      negativeMarkingRatio: negRatio,
      qualifyingPercent: qualifying,
    });

    const [attempt] = await db
      .insert(examAttempts)
      .values({
        examId: params.examId,
        userId: params.userId,
        status: 'submitted',
        submittedAt: new Date(),
        timeSpentSeconds: params.timeSpentSeconds,
        language: params.language,
      })
      .returning();

    for (const qId of params.questionIds) {
      const ans = params.answers[qId];
      if (ans) {
        await db.insert(studentAnswers).values({
          attemptId: attempt.id,
          questionId: qId,
          selectedOption: ans.selectedOption,
          isMarkedForReview: Boolean(ans.isMarkedForReview),
          timeSpentSeconds: ans.timeSpentSeconds || 0,
        });
      }
    }

    const [savedResult] = await db
      .insert(results)
      .values({
        attemptId: attempt.id,
        examId: params.examId,
        userId: params.userId,
        totalQuestions: computed.totalQuestions,
        correctCount: computed.correctCount,
        incorrectCount: computed.incorrectCount,
        unattemptedCount: computed.unattemptedCount,
        positiveMarks: String(computed.positiveMarks),
        negativeMarks: String(computed.negativeMarks),
        totalScore: String(computed.totalScore),
        maxScore: String(computed.maxScore),
        accuracyPercent: String(computed.accuracyPercent),
        passedQualifying: computed.passedQualifying,
        subjectBreakdown: computed.subjectBreakdown,
      })
      .returning();

    const profileRows = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, params.userId))
      .limit(1);
    const profile = profileRows[0];

    if (!profile?.leaderboardOptOut) {
      await db.insert(rankings).values({
        resultId: savedResult.id,
        examId: params.examId,
        userId: params.userId,
        stateName: profile?.homeState || 'Delhi',
        totalScore: String(computed.totalScore),
        accuracyPercent: String(computed.accuracyPercent),
        timeSpentSeconds: params.timeSpentSeconds,
        ruleVersionId: rule?.id || null,
      });
    }

    return { attempt, result: savedResult, computed };
  } catch (err) {
    console.error('scoreAndPersistPrelimsAttempt error:', err);
    throw new Error('Failed to evaluate and save examination attempt.', { cause: err });
  }
}

export async function getExamLeaderboard(examId?: string, stateFilter?: string) {
  try {
    const rows = await db
      .select({
        id: rankings.id,
        examId: rankings.examId,
        userId: rankings.userId,
        stateName: rankings.stateName,
        totalScore: rankings.totalScore,
        accuracyPercent: rankings.accuracyPercent,
        timeSpentSeconds: rankings.timeSpentSeconds,
        ruleVersionId: rankings.ruleVersionId,
        computedAt: rankings.computedAt,
        fullName: studentProfiles.fullName,
        optOut: studentProfiles.leaderboardOptOut,
      })
      .from(rankings)
      .innerJoin(studentProfiles, eq(rankings.userId, studentProfiles.userId));

    const filtered = rows.filter((r) => {
      if (r.optOut) return false;
      if (examId && r.examId !== examId) return false;
      if (stateFilter && stateFilter !== 'ALL' && r.stateName !== stateFilter) return false;
      return true;
    });

    const mapped = filtered.map((r) => ({
      id: r.id,
      examId: r.examId,
      ruleVersionId: r.ruleVersionId || 'default',
      aspirantName: r.fullName,
      stateName: r.stateName,
      totalScore: Number(r.totalScore),
      accuracyPercent: Number(r.accuracyPercent),
      timeSpentSeconds: r.timeSpentSeconds,
      computedAt: r.computedAt,
    }));

    return sortLeaderboard(mapped).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  } catch (err) {
    console.error('getExamLeaderboard error:', err);
    throw new Error('Failed to retrieve rankings.', { cause: err });
  }
}

export async function persistAiQuestionPendingReview(params: {
  subjectSlug: string;
  difficulty: number;
  questionType: string;
  language: SupportedLanguage;
  actorEmail: string;
  generated: {
    questionText: string;
    options: Array<{ key: string; text: string }>;
    correctOption: string;
    explanation: string;
    topicName: string;
    sourceTitle: string;
    citationText: string;
  };
}) {
  try {
    const code = `AI-${params.subjectSlug.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`;
    const [q] = await db
      .insert(questions)
      .values({
        externalCode: code,
        subjectSlug: params.subjectSlug,
        topicName: params.generated.topicName,
        difficulty: params.difficulty,
        questionType: params.questionType,
        marks: '2.00',
        negativeMarks: '0.67',
        isPyq: false,
        examStage: 'prelims',
        paperCode: 'GS_I',
        status: 'pending_review',
        version: 1,
        isAiGenerated: true,
        createdBy: params.actorEmail,
      })
      .returning();

    await db.insert(questionTranslations).values({
      questionId: q.id,
      language: params.language,
      questionText: params.generated.questionText,
      explanation: params.generated.explanation,
      isOfficialTranslation: false,
      translationSource: 'ai_generated',
    });

    for (const opt of params.generated.options) {
      await db.insert(questionOptions).values({
        questionId: q.id,
        language: params.language,
        optionKey: opt.key,
        optionText: opt.text,
        isCorrect: opt.key.toUpperCase() === params.generated.correctOption.toUpperCase(),
      });
    }

    await db.insert(questionSources).values({
      questionId: q.id,
      sourceTitle: params.generated.sourceTitle,
      citationText: params.generated.citationText,
    });

    await db.insert(auditLogs).values({
      actorEmail: params.actorEmail,
      action: 'AI_QUESTION_QUEUED',
      entityType: 'question',
      entityId: q.id,
      details: { subjectSlug: params.subjectSlug, difficulty: params.difficulty },
    });

    return q;
  } catch (err) {
    console.error('persistAiQuestionPendingReview error:', err);
    throw new Error('Failed to save generated question to review queue.', { cause: err });
  }
}

export async function persistMainsSubmissionAndEval(params: {
  userId: string;
  paperCode: string;
  optionalSubject?: string;
  promptText: string;
  answerText: string;
  timeSpentSeconds: number;
  attachmentName?: string;
  attachmentMime?: string;
  maxMarks: number;
  aiEval: {
    rubric: Record<string, { score: number; max: number; note: string }>;
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
  };
}) {
  try {
    const words = countWords(params.answerText);
    const [submission] = await db
      .insert(mainsSubmissions)
      .values({
        userId: params.userId,
        paperCode: params.paperCode,
        optionalSubject: params.optionalSubject || null,
        promptText: params.promptText,
        answerText: params.answerText,
        wordCount: words,
        timeSpentSeconds: params.timeSpentSeconds,
        attachmentName: params.attachmentName || null,
        attachmentMime: params.attachmentMime || null,
        status: 'evaluated',
      })
      .returning();

    const overallScore = computeWeightedMainsScore(params.aiEval.rubric, params.maxMarks);

    const [evaluation] = await db
      .insert(evaluations)
      .values({
        submissionId: submission.id,
        evaluatorType: 'ai',
        overallScore: String(overallScore),
        maxScore: String(params.maxMarks),
        rubricScores: params.aiEval.rubric,
        strengths: params.aiEval.strengths,
        improvements: params.aiEval.improvements,
        modelAnswer: params.aiEval.modelAnswer,
        isPracticeEstimate: true,
      })
      .returning();

    return { submission, evaluation };
  } catch (err) {
    console.error('persistMainsSubmissionAndEval error:', err);
    throw new Error('Failed to save Mains evaluation.', { cause: err });
  }
}

export async function getAdminOverview(actorEmail: string) {
  try {
    const [pendingQs, allTranslations, allOptions, allSources, rules, logs, allUsers] = await Promise.all([
      db.select().from(questions).where(eq(questions.status, 'pending_review')).orderBy(desc(questions.createdAt)),
      db.select().from(questionTranslations),
      db.select().from(questionOptions),
      db.select().from(questionSources),
      db.select().from(examRuleVersions).orderBy(desc(examRuleVersions.createdAt)),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40),
      db.select().from(users),
    ]);

    const adminRow = await db.select().from(adminUsers).where(eq(adminUsers.email, actorEmail)).limit(1);

    const hydratedPending = pendingQs.map((q) => {
      const tr = allTranslations.find((t) => t.questionId === q.id);
      const opts = allOptions.filter((o) => o.questionId === q.id);
      const src = allSources.find((s) => s.questionId === q.id);
      return {
        ...q,
        questionText: tr?.questionText || '',
        explanation: tr?.explanation || '',
        language: tr?.language || 'en',
        options: opts,
        sourceTitle: src?.sourceTitle || '',
        citationText: src?.citationText || '',
      };
    });

    return {
      adminRole: adminRow[0]?.adminRole || 'Super Admin',
      pendingQuestions: hydratedPending,
      rules,
      auditLogs: logs,
      totalRegisteredUsers: allUsers.length,
    };
  } catch (err) {
    console.error('getAdminOverview error:', err);
    throw new Error('Failed to load admin overview.', { cause: err });
  }
}

export async function reviewPendingQuestion(params: {
  questionId: string;
  decision: 'approved' | 'rejected';
  reviewerEmail: string;
  notes?: string;
}) {
  try {
    const [updated] = await db
      .update(questions)
      .set({ status: params.decision, updatedAt: new Date() })
      .where(eq(questions.id, params.questionId))
      .returning();

    await db.insert(questionReviews).values({
      questionId: params.questionId,
      reviewerEmail: params.reviewerEmail,
      decision: params.decision,
      notes: params.notes || '',
    });

    await db.insert(auditLogs).values({
      actorEmail: params.reviewerEmail,
      action: params.decision === 'approved' ? 'QUESTION_APPROVED' : 'QUESTION_REJECTED',
      entityType: 'question',
      entityId: params.questionId,
      details: { notes: params.notes || '' },
    });

    return updated;
  } catch (err) {
    console.error('reviewPendingQuestion error:', err);
    throw new Error('Failed to update question review status.', { cause: err });
  }
}

export async function createNewRuleVersion(params: {
  paperCode: string;
  versionName: string;
  examYear: number;
  durationMinutes: number;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarkingRatio: number;
  qualifyingPercent: number | null;
  actorEmail: string;
}) {
  try {
    await db
      .update(examRuleVersions)
      .set({ isActive: false })
      .where(eq(examRuleVersions.paperCode, params.paperCode));

    const [created] = await db
      .insert(examRuleVersions)
      .values({
        versionName: params.versionName,
        examYear: params.examYear,
        paperCode: params.paperCode,
        durationMinutes: params.durationMinutes,
        questionCount: params.questionCount,
        marksPerQuestion: String(params.marksPerQuestion),
        negativeMarkingRatio: String(params.negativeMarkingRatio),
        qualifyingPercent: params.qualifyingPercent !== null ? String(params.qualifyingPercent) : null,
        isActive: true,
        updatedBy: params.actorEmail,
      })
      .returning();

    await db.insert(auditLogs).values({
      actorEmail: params.actorEmail,
      action: 'EXAM_RULE_VERSION_PUBLISHED',
      entityType: 'exam_rule_versions',
      entityId: created.id,
      details: { paperCode: params.paperCode, versionName: params.versionName },
    });

    return created;
  } catch (err) {
    console.error('createNewRuleVersion error:', err);
    throw new Error('Failed to publish new exam rule version.', { cause: err });
  }
}

export async function toggleBookmarkRecord(
  userId: string,
  payload: { itemType: string; itemId: string; title: string; subtitle?: string }
) {
  try {
    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.itemId, payload.itemId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
      return { removed: true, itemId: payload.itemId };
    }

    const [created] = await db
      .insert(bookmarks)
      .values({
        userId,
        itemType: payload.itemType,
        itemId: payload.itemId,
        title: payload.title,
        subtitle: payload.subtitle || '',
      })
      .returning();
    return { removed: false, bookmark: created };
  } catch (err) {
    console.error('toggleBookmarkRecord error:', err);
    throw new Error('Failed to toggle bookmark.', { cause: err });
  }
}

export async function upsertStudyTask(
  userId: string,
  payload: { id?: string; dayLabel?: string; taskTitle?: string; subjectSlug?: string; plannedMinutes?: number; isCompleted?: boolean }
) {
  try {
    if (payload.id) {
      const [updated] = await db
        .update(studyPlans)
        .set({ isCompleted: Boolean(payload.isCompleted) })
        .where(and(eq(studyPlans.id, payload.id), eq(studyPlans.userId, userId)))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(studyPlans)
      .values({
        userId,
        dayLabel: payload.dayLabel || 'Today',
        taskTitle: payload.taskTitle || 'Revision Block',
        subjectSlug: payload.subjectSlug || 'polity',
        plannedMinutes: payload.plannedMinutes || 60,
        isCompleted: false,
      })
      .returning();
    return created;
  } catch (err) {
    console.error('upsertStudyTask error:', err);
    throw new Error('Failed to update study plan.', { cause: err });
  }
}

export async function isEmailAdmin(email: string): Promise<boolean> {
  if (email.toLowerCase() === 'pm4846833@gmail.com') return true;
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return Boolean(rows[0]?.isActive);
}

export async function upsertCurrentAffairsBriefs(
  items: Array<{
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
  }>
) {
  try {
    let insertedCount = 0;
    for (const item of items) {
      const inserted = await db
        .insert(currentAffairs)
        .values(item)
        .onConflictDoNothing()
        .returning();
      if (inserted.length > 0) insertedCount += 1;
    }
    const allCa = await db.select().from(currentAffairs).orderBy(desc(currentAffairs.publishedDate));
    return { insertedCount, currentAffairs: allCa };
  } catch (err) {
    console.error('upsertCurrentAffairsBriefs error:', err);
    throw new Error('Failed to persist live current affairs.', { cause: err });
  }
}

export async function getPastRecordsWorkspace(userId?: string) {
  try {
    await ensureSeedData();
    const targetUser = userId ? { id: userId } : await getOrCreatePublicAspirant();

    const [
      resultRows,
      attemptRows,
      allExams,
      mainsRows,
      interviewRows,
      allPrelimsCountRows,
      allMainsCountRows,
      allInterviewCountRows,
      approvedQRows,
      catalog,
    ] = await Promise.all([
      db.select().from(results).where(eq(results.userId, targetUser.id)).orderBy(desc(results.createdAt)).limit(30),
      db.select().from(examAttempts).where(eq(examAttempts.userId, targetUser.id)).orderBy(desc(examAttempts.startedAt)).limit(30),
      db.select().from(exams),
      db.select().from(mainsSubmissions).where(eq(mainsSubmissions.userId, targetUser.id)).orderBy(desc(mainsSubmissions.createdAt)).limit(25),
      db.select().from(interviewSessions).where(eq(interviewSessions.userId, targetUser.id)).orderBy(desc(interviewSessions.createdAt)).limit(20),
      db.select({ id: results.id }).from(results),
      db.select({ id: mainsSubmissions.id }).from(mainsSubmissions),
      db.select({ id: interviewSessions.id }).from(interviewSessions),
      db.select({ id: questions.id, isPyq: questions.isPyq }).from(questions).where(eq(questions.status, 'approved')),
      getFullCatalog(),
    ]);

    const attemptIds = resultRows.map((r) => r.attemptId);
    const answerRows =
      attemptIds.length > 0
        ? await db.select().from(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds))
        : [];

    const mainsIds = mainsRows.map((m) => m.id);
    const evalRows =
      mainsIds.length > 0
        ? await db.select().from(evaluations).where(inArray(evaluations.submissionId, mainsIds))
        : [];

    const qMap = new Map(catalog.questions.map((q) => [q.id, q]));

    const prelimsResults = resultRows.map((r) => {
      const ex = allExams.find((e) => e.id === r.examId);
      const att = attemptRows.find((a) => a.id === r.attemptId);
      const ansForAttempt = answerRows.filter((a) => a.attemptId === r.attemptId);
      const answersMap: Record<string, { selectedOption: string | null; isMarkedForReview: boolean }> = {};
      const qs: typeof catalog.questions = [];
      for (const a of ansForAttempt) {
        answersMap[a.questionId] = {
          selectedOption: a.selectedOption,
          isMarkedForReview: a.isMarkedForReview,
        };
        const matchedQ = qMap.get(a.questionId);
        if (matchedQ) qs.push(matchedQ);
      }

      return {
        id: r.id,
        examTitle: ex?.titleEn || 'UPSC Prelims Practice Mock',
        paperCode: ex?.paperType || 'GS_I',
        createdAt: r.createdAt.toISOString(),
        timeSpentSeconds: att?.timeSpentSeconds || 0,
        computed: {
          totalQuestions: r.totalQuestions,
          correctCount: r.correctCount,
          incorrectCount: r.incorrectCount,
          unattemptedCount: r.unattemptedCount,
          positiveMarks: Number(r.positiveMarks),
          negativeMarks: Number(r.negativeMarks),
          totalScore: Number(r.totalScore),
          maxScore: Number(r.maxScore),
          accuracyPercent: Number(r.accuracyPercent),
          passedQualifying: r.passedQualifying,
          subjectBreakdown: (r.subjectBreakdown || {}) as Record<
            string,
            { total: number; correct: number; incorrect: number; unattempted: number; score: number }
          >,
        },
        questions: qs,
        answers: answersMap,
      };
    });

    const mainsSubmissionsMapped = mainsRows.map((m) => {
      const ev = evalRows.find((e) => e.submissionId === m.id);
      return {
        id: m.id,
        paperCode: m.paperCode,
        promptText: m.promptText,
        answerText: m.answerText,
        wordCount: m.wordCount,
        overallScore: ev ? Number(ev.overallScore) : 0,
        maxMarks: ev ? Number(ev.maxScore) : 15,
        createdAt: m.createdAt.toISOString(),
        rubric: (ev?.rubricScores || {}) as Record<string, { score: number; max: number; note: string }>,
        strengths: (ev?.strengths || []) as string[],
        improvements: (ev?.improvements || []) as string[],
        modelAnswer: ev?.modelAnswer || '',
      };
    });

    const interviewMapped = interviewRows.map((iv) => ({
      id: iv.id,
      dafSummary: (iv.dafSummary || {}) as Record<string, string>,
      transcript: (iv.transcript || []) as Array<{ role: 'board' | 'candidate'; text: string; category?: string; timestamp: string }>,
      evaluationReport: (iv.evaluationReport || {
        practiceScoreOutOf275: Number(iv.practiceScore || 0),
        dimensions: [],
        overallSummary: '',
        disclaimer: '',
      }) as {
        practiceScoreOutOf275: number;
        dimensions: Array<{ name: string; score: number; max: number; feedback: string }>;
        overallSummary: string;
        disclaimer: string;
      },
      practiceScore: Number(iv.practiceScore || 0),
      maxScore: iv.maxScore || 275,
      createdAt: iv.createdAt.toISOString(),
    }));

    return {
      prelimsResults,
      mainsSubmissions: mainsSubmissionsMapped,
      interviewSessions: interviewMapped,
      platformTotals: {
        prelimsAttempts: allPrelimsCountRows.length,
        mainsEvaluations: allMainsCountRows.length,
        interviewSessions: allInterviewCountRows.length,
        approvedQuestions: approvedQRows.length,
        pyqCount: approvedQRows.filter((q) => q.isPyq).length,
      },
    };
  } catch (err) {
    console.error('getPastRecordsWorkspace error:', err);
    throw new Error('Failed to load examination past records.', { cause: err });
  }
}

export async function persistInterviewSessionRecord(params: {
  userId: string;
  dafSummary: Record<string, string>;
  transcript: Array<{ role: 'board' | 'candidate'; text: string; category?: string; timestamp: string }>;
  evaluationReport: {
    practiceScoreOutOf275: number;
    dimensions: Array<{ name: string; score: number; max: number; feedback: string }>;
    overallSummary: string;
    disclaimer: string;
  };
}) {
  try {
    const [created] = await db
      .insert(interviewSessions)
      .values({
        userId: params.userId,
        dafSummary: params.dafSummary,
        status: 'completed',
        transcript: params.transcript,
        evaluationReport: params.evaluationReport,
        practiceScore: String(params.evaluationReport.practiceScoreOutOf275),
        maxScore: 275,
        completedAt: new Date(),
      })
      .returning();
    return created;
  } catch (err) {
    console.error('persistInterviewSessionRecord error:', err);
    throw new Error('Failed to store interview session.', { cause: err });
  }
}
