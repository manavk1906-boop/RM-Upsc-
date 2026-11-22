import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  createNewRuleVersion,
  getAdminOverview,
  getExamLeaderboard,
  getFullCatalog,
  getOrCreatePublicAspirant,
  getOrCreateUser,
  getPastRecordsWorkspace,
  getUserWorkspaceData,
  isEmailAdmin,
  persistAiQuestionPendingReview,
  persistInterviewSessionRecord,
  persistMainsSubmissionAndEval,
  reviewPendingQuestion,
  scoreAndPersistPrelimsAttempt,
  toggleBookmarkRecord,
  updateStudentProfile,
  upsertCurrentAffairsBriefs,
  upsertStudyTask,
} from './src/db/repository.ts';
import {
  evaluateInterviewSession,
  evaluateMainsAnswer,
  fetchLiveCurrentAffairs,
  generateInterviewTurn,
  generateUpscQuestion,
  synthesizeSpeechWav,
  transcribeAudio,
} from './src/lib/gemini.ts';
import { AuthRequest, optionalAuth, requireAuth } from './src/middleware/auth.ts';
import { computeWeightedMainsScore } from './src/utils/upscRules.ts';
import type { SupportedLanguage } from './src/i18n/translations.ts';

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '10mb' }));

// Simple in-memory rate limiter for AI and mutation routes
const rateBucket = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxPerMinute: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const item = rateBucket.get(key);
    if (!item || item.resetAt < now) {
      rateBucket.set(key, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    if (item.count >= maxPerMinute) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment before retrying.' });
    }
    item.count += 1;
    next();
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'upsc-elite-api' });
});

app.get('/api/catalog', async (_req, res) => {
  try {
    const catalog = await getFullCatalog();
    res.json(catalog);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to fetch catalog.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@aspirant.local`;
    const displayName = typeof req.user!.name === 'string' ? req.user!.name : undefined;
    const user = await getOrCreateUser(uid, email, displayName);
    const workspace = await getUserWorkspaceData(user.id, email);
    res.json({ user, ...workspace });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load profile.';
    res.status(500).json({ error: message });
  }
});

app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@aspirant.local`;
    const user = await getOrCreateUser(uid, email);
    const allowed = {
      fullName: typeof req.body.fullName === 'string' ? req.body.fullName.slice(0, 120) : undefined,
      mobileNumber: typeof req.body.mobileNumber === 'string' ? req.body.mobileNumber.slice(0, 20) : undefined,
      preferredLanguage: ['en', 'hi', 'gu'].includes(req.body.preferredLanguage) ? req.body.preferredLanguage : undefined,
      prepLevel: typeof req.body.prepLevel === 'string' ? req.body.prepLevel : undefined,
      optionalSubject: typeof req.body.optionalSubject === 'string' ? req.body.optionalSubject : undefined,
      targetYear: typeof req.body.targetYear === 'number' ? req.body.targetYear : undefined,
      dailyStudyHours: typeof req.body.dailyStudyHours === 'number' ? req.body.dailyStudyHours : undefined,
      homeState: typeof req.body.homeState === 'string' ? req.body.homeState : undefined,
      leaderboardOptOut: typeof req.body.leaderboardOptOut === 'boolean' ? req.body.leaderboardOptOut : undefined,
      dafSummary: req.body.dafSummary && typeof req.body.dafSummary === 'object' ? req.body.dafSummary : undefined,
    };
    const updated = await updateStudentProfile(user.id, allowed);
    res.json({ profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Profile update failed.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/records', optionalAuth, async (req: AuthRequest, res) => {
  try {
    let targetUserId: string | undefined;
    if (req.user) {
      const user = await getOrCreateUser(req.user.uid, req.user.email || `${req.user.uid}@aspirant.local`);
      targetUserId = user.id;
    }
    const payload = await getPastRecordsWorkspace(targetUserId);
    res.json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to fetch past examination records.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/current-affairs/refresh', rateLimit(10), async (req, res) => {
  try {
    const lang = (['en', 'hi', 'gu'].includes(req.body?.language) ? req.body.language : 'en') as SupportedLanguage;
    const liveItems = await fetchLiveCurrentAffairs(lang);
    const saved = await upsertCurrentAffairsBriefs(liveItems);
    res.json(saved);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch live current affairs.';
    res.status(500).json({ error: message });
  }
});

// Server-side Prelims evaluation (always persists to PostgreSQL for real past records)
app.post('/api/exams/submit', optionalAuth, rateLimit(20), async (req: AuthRequest, res) => {
  try {
    const { examId, paperCode, questionIds, answers, timeSpentSeconds, language } = req.body || {};
    if (!Array.isArray(questionIds) || questionIds.length === 0 || !paperCode) {
      return res.status(400).json({ error: 'Invalid exam submission payload.' });
    }

    const user = req.user
      ? await getOrCreateUser(req.user.uid, req.user.email || `${req.user.uid}@aspirant.local`)
      : await getOrCreatePublicAspirant();

    const catalog = await getFullCatalog();
    const fallbackExamId =
      catalog.exams.find((e) => e.id === examId)?.id ||
      catalog.exams.find((e) => e.paperType === paperCode)?.id ||
      catalog.exams[0]?.id;

    if (!fallbackExamId) {
      return res.status(400).json({ error: 'No matching examination found in catalog.' });
    }

    const persisted = await scoreAndPersistPrelimsAttempt({
      userId: user.id,
      examId: fallbackExamId,
      paperCode,
      questionIds,
      answers: answers || {},
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      language: (['en', 'hi', 'gu'].includes(language) ? language : 'en') as SupportedLanguage,
    });
    return res.json({ persisted: true, ...persisted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to evaluate examination.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const examId = typeof req.query.examId === 'string' ? req.query.examId : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    const entries = await getExamLeaderboard(examId, state);
    res.json({ entries });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/generate-question', optionalAuth, rateLimit(15), async (req: AuthRequest, res) => {
  try {
    const { subject, topic, difficulty, questionType, language } = req.body || {};
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required.' });
    }
    const lang = (['en', 'hi', 'gu'].includes(language) ? language : 'en') as SupportedLanguage;
    const generated = await generateUpscQuestion({
      subject: String(subject),
      topic: String(topic || ''),
      difficulty: Math.min(5, Math.max(1, Number(difficulty) || 3)),
      questionType: String(questionType || 'multiple_statement'),
      language: lang,
    });

    const actorEmail = req.user?.email || 'demo-aspirant@upsc-elite.local';
    const saved = await persistAiQuestionPendingReview({
      subjectSlug: String(subject),
      difficulty: Math.min(5, Math.max(1, Number(difficulty) || 3)),
      questionType: String(questionType || 'multiple_statement'),
      language: lang,
      actorEmail,
      generated,
    });

    res.json({ question: saved, preview: generated, status: 'pending_review' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI question generation failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/mains/evaluate', optionalAuth, rateLimit(15), async (req: AuthRequest, res) => {
  try {
    const {
      paperCode,
      optionalSubject,
      promptText,
      answerText,
      wordLimit,
      maxMarks,
      timeSpentSeconds,
      language,
      attachmentBase64,
      attachmentMime,
      attachmentName,
    } = req.body || {};

    if (!paperCode || !promptText || (!answerText && !attachmentBase64)) {
      return res.status(400).json({ error: 'Provide either a written answer or an uploaded answer sheet.' });
    }

    const lang = (['en', 'hi', 'gu'].includes(language) ? language : 'en') as SupportedLanguage;
    const targetMarks = Math.min(250, Math.max(10, Number(maxMarks) || 15));

    const aiEval = await evaluateMainsAnswer({
      paperCode: String(paperCode),
      promptText: String(promptText),
      answerText: String(answerText || ''),
      wordLimit: Number(wordLimit) || 250,
      maxMarks: targetMarks,
      language: lang,
      attachmentBase64: typeof attachmentBase64 === 'string' ? attachmentBase64 : undefined,
      attachmentMime: typeof attachmentMime === 'string' ? attachmentMime : undefined,
    });

    const overallScore = computeWeightedMainsScore(aiEval.rubric, targetMarks);

    const user = req.user
      ? await getOrCreateUser(req.user.uid, req.user.email || `${req.user.uid}@aspirant.local`)
      : await getOrCreatePublicAspirant();

    const saved = await persistMainsSubmissionAndEval({
      userId: user.id,
      paperCode: String(paperCode),
      optionalSubject: typeof optionalSubject === 'string' ? optionalSubject : undefined,
      promptText: String(promptText),
      answerText: String(answerText || ''),
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      attachmentName: typeof attachmentName === 'string' ? attachmentName : undefined,
      attachmentMime: typeof attachmentMime === 'string' ? attachmentMime : undefined,
      maxMarks: targetMarks,
      aiEval,
    });
    return res.json({ persisted: true, overallScore, maxMarks: targetMarks, isPracticeEstimate: true, ...saved, aiEval });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Mains evaluation failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/interview/turn', optionalAuth, rateLimit(25), async (req: AuthRequest, res) => {
  try {
    const { dafSummary, transcript, language } = req.body || {};
    const lang = (['en', 'hi', 'gu'].includes(language) ? language : 'en') as SupportedLanguage;
    const turn = await generateInterviewTurn({
      dafSummary: dafSummary || {},
      transcript: Array.isArray(transcript) ? transcript : [],
      language: lang,
    });
    res.json(turn);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Interview turn generation failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/interview/report', optionalAuth, rateLimit(10), async (req: AuthRequest, res) => {
  try {
    const { dafSummary, transcript, language } = req.body || {};
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: 'Interview transcript is required to generate report.' });
    }
    const lang = (['en', 'hi', 'gu'].includes(language) ? language : 'en') as SupportedLanguage;
    const report = await evaluateInterviewSession({
      dafSummary: dafSummary || {},
      transcript,
      language: lang,
    });
    const fullReport = {
      ...report,
      disclaimer: 'Practice assessment only. AI evaluation does not predict or guarantee official UPSC Personality Test marks.',
    };

    const user = req.user
      ? await getOrCreateUser(req.user.uid, req.user.email || `${req.user.uid}@aspirant.local`)
      : await getOrCreatePublicAspirant();

    const saved = await persistInterviewSessionRecord({
      userId: user.id,
      dafSummary: dafSummary || {},
      transcript,
      evaluationReport: fullReport,
    });
    return res.json({ persisted: true, session: saved, report: fullReport });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Interview report generation failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/tts', rateLimit(25), async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }
    const audioBase64 = await synthesizeSpeechWav(text.slice(0, 800));
    res.json({ audioBase64, mimeType: 'audio/wav' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Speech synthesis unavailable.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/transcribe', rateLimit(20), async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Audio payload is required.' });
    }
    const transcript = await transcribeAudio(audioBase64, typeof mimeType === 'string' ? mimeType : 'audio/webm');
    res.json({ transcript });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Audio transcription failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/bookmarks/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!.uid, req.user!.email || `${req.user!.uid}@aspirant.local`);
    const { itemType, itemId, title, subtitle } = req.body || {};
    if (!itemType || !itemId || !title) {
      return res.status(400).json({ error: 'Bookmark fields missing.' });
    }
    const result = await toggleBookmarkRecord(user.id, { itemType, itemId, title, subtitle });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bookmark update failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/study-plans', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(req.user!.uid, req.user!.email || `${req.user!.uid}@aspirant.local`);
    const task = await upsertStudyTask(user.id, req.body || {});
    res.json({ task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Study plan update failed.';
    res.status(500).json({ error: message });
  }
});

// 100% Free Open Platform — no payment or Razorpay endpoints required

// Admin RBAC Routes
app.get('/api/admin/overview', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user!.email || '';
    if (!(await isEmailAdmin(email))) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    const overview = await getAdminOverview(email);
    res.json(overview);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load admin console.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/admin/questions/:id/review', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user!.email || '';
    if (!(await isEmailAdmin(email))) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    const decision = req.body?.decision === 'approved' ? 'approved' : req.body?.decision === 'rejected' ? 'rejected' : null;
    if (!decision) {
      return res.status(400).json({ error: 'Invalid review decision.' });
    }
    const updated = await reviewPendingQuestion({
      questionId: String(req.params.id),
      decision,
      reviewerEmail: email,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : '',
    });
    res.json({ question: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Review update failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/admin/rules', requireAuth, async (req: AuthRequest, res) => {
  try {
    const email = req.user!.email || '';
    if (!(await isEmailAdmin(email))) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    const { paperCode, versionName, examYear, durationMinutes, questionCount, marksPerQuestion, negativeMarkingRatio, qualifyingPercent } =
      req.body || {};
    if (!paperCode || !versionName || !durationMinutes || !questionCount || !marksPerQuestion) {
      return res.status(400).json({ error: 'All rule parameters are required.' });
    }
    const created = await createNewRuleVersion({
      paperCode: String(paperCode),
      versionName: String(versionName),
      examYear: Number(examYear) || 2026,
      durationMinutes: Number(durationMinutes),
      questionCount: Number(questionCount),
      marksPerQuestion: Number(marksPerQuestion),
      negativeMarkingRatio: Number(negativeMarkingRatio) || 1 / 3,
      qualifyingPercent: qualifyingPercent !== null && qualifyingPercent !== '' ? Number(qualifyingPercent) : null,
      actorEmail: email,
    });
    res.json({ rule: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rule update failed.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UPSC ELITE server listening on http://localhost:${PORT}`);
  });
}

startServer();
