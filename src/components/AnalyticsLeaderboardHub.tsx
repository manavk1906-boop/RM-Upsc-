import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bookmark,
  Calendar,
  Check,
  FileText,
  History,
  Mic,
  Printer,
  Shield,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { LANGUAGE_LABELS, SupportedLanguage, t } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type {
  BookmarkItem,
  CatalogData,
  ExamResultSummary,
  InterviewSessionRecord,
  MainsEvalRecord,
  NotificationItem,
  PastRecordsPayload,
  ScreenId,
  StudentProfile,
  StudyTask,
} from '../types/app.ts';
import { formatCountdown } from '../utils/upscRules.ts';

interface LeaderboardRow {
  id: string;
  rank: number;
  aspirantName: string;
  stateName: string;
  totalScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
}

interface AnalyticsLeaderboardHubProps {
  screen:
    | 'ranking'
    | 'analytics'
    | 'planner'
    | 'bookmarks'
    | 'notifications'
    | 'records'
    | 'profile'
    | 'admin';
  language: SupportedLanguage;
  darkMode: boolean;
  onToggleDark: () => void;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  profile: StudentProfile;
  onSaveProfile: (next: StudentProfile) => Promise<void>;
  catalog: CatalogData;
  results: ExamResultSummary[];
  mainsHistory: MainsEvalRecord[];
  interviewHistory: InterviewSessionRecord[];
  platformTotals: PastRecordsPayload['platformTotals'];
  onOpenPastResult: (res: ExamResultSummary) => void;
  studyTasks: StudyTask[];
  onAddStudyTask: (title: string, mins: number) => void;
  onToggleStudyTask: (id: string) => void;
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (id: string) => void;
  notifications: NotificationItem[];
  isSignedIn: boolean;
  adminRole: string | null;
  onNavigate: (s: ScreenId) => void;
  onRefreshCatalog: () => Promise<void>;
}

export const AnalyticsLeaderboardHub: React.FC<AnalyticsLeaderboardHubProps> = ({
  screen,
  language,
  darkMode,
  onToggleDark,
  onChangeLanguage,
  profile,
  onSaveProfile,
  catalog,
  results,
  mainsHistory,
  interviewHistory,
  platformTotals,
  onOpenPastResult,
  studyTasks,
  onAddStudyTask,
  onToggleStudyTask,
  bookmarks,
  onRemoveBookmark,
  notifications,
  isSignedIn,
  adminRole,
  onNavigate,
  onRefreshCatalog,
}) => {
  // Past Records tab state
  const [recordsTab, setRecordsTab] = useState<'all' | 'prelims' | 'mains' | 'interview' | 'pyq'>('all');

  // Leaderboard state
  const [lbExamId, setLbExamId] = useState(catalog.exams[0]?.id || '');
  const [lbState, setLbState] = useState('ALL');
  const [lbEntries, setLbEntries] = useState<LeaderboardRow[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  // Study planner form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMins, setNewTaskMins] = useState(60);

  // Profile editor state
  const [editProfile, setEditProfile] = useState<StudentProfile>(profile);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    dailyReminder: true,
    mockAlerts: true,
    resultAlerts: true,
    currentAffairs: true,
  });

  // Admin state
  const [adminData, setAdminData] = useState<{
    adminRole: string;
    totalRegisteredUsers: number;
    pendingQuestions: Array<{
      id: string;
      externalCode: string;
      subjectSlug: string;
      topicName: string;
      difficulty: number;
      questionText: string;
      explanation: string;
      citationText: string;
    }>;
    rules: Array<{
      id: string;
      versionName: string;
      examYear: number;
      paperCode: string;
      durationMinutes: number;
      questionCount: number;
      marksPerQuestion: string;
      negativeMarkingRatio: string;
      qualifyingPercent: string | null;
      isActive: boolean;
      updatedBy: string;
    }>;
    auditLogs: Array<{
      id: string;
      actorEmail: string;
      action: string;
      entityType: string;
      createdAt: string;
    }>;
  } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [rulePaper, setRulePaper] = useState('GS_I');
  const [ruleVersionName, setRuleVersionName] = useState('UPSC CSE 2026 Revised Rule');
  const [ruleDuration, setRuleDuration] = useState(120);
  const [ruleQCount, setRuleQCount] = useState(100);
  const [ruleMarks, setRuleMarks] = useState(2);

  useEffect(() => {
    setEditProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (screen !== 'ranking') return;
    setLbLoading(true);
    api
      .getLeaderboard(lbExamId || undefined, lbState)
      .then((data) => {
        const typed = data as { entries?: LeaderboardRow[] };
        setLbEntries(typed.entries || []);
      })
      .catch(() => setLbEntries([]))
      .finally(() => setLbLoading(false));
  }, [screen, lbExamId, lbState]);

  const loadAdmin = () => {
    setAdminError(null);
    api
      .getAdminOverview()
      .then((res) => setAdminData(res as typeof adminData))
      .catch((err: unknown) =>
        setAdminError(err instanceof Error ? err.message : 'Admin verification required.')
      );
  };

  useEffect(() => {
    if (screen === 'admin' && isSignedIn) {
      loadAdmin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, isSignedIn]);

  // 0. PAST RECORDS & EXAM ARCHIVE (100% FREE PERSISTED LEDGER)
  if (screen === 'records') {
    const pyqQuestions = catalog.questions
      .filter((q) => q.isPyq)
      .sort((a, b) => (b.pyqYear || 0) - (a.pyqYear || 0));

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {t(language, 'freeAccessBadge')} · Permanent PostgreSQL Exam & PYQ Ledger
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {t(language, 'pastRecordsTitle')}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="w-4 h-4" />
            <span>{t(language, 'downloadPdf')}</span>
          </button>
        </div>

        {/* Archive Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Prelims Scorecards</span>
              <Target className="w-4 h-4 text-[#0B1E3D] dark:text-amber-400" />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1">{results.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {platformTotals.prelimsAttempts} attempts platform-wide
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Mains Evaluations</span>
              <FileText className="w-4 h-4 text-[#0B1E3D] dark:text-amber-400" />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1">{mainsHistory.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {platformTotals.mainsEvaluations} evaluated platform-wide
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>AI Interview Reports</span>
              <Mic className="w-4 h-4 text-[#0B1E3D] dark:text-amber-400" />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1">{interviewHistory.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {platformTotals.interviewSessions} boardrooms archived
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Official PYQs (2018–2024)</span>
              <History className="w-4 h-4 text-[#0B1E3D] dark:text-amber-400" />
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1 text-[#0B1E3D] dark:text-amber-400">
              {pyqQuestions.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Trilingual EN · HI · GU</div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit max-w-full overflow-x-auto no-print">
          {(
            [
              ['all', 'All Past Records'],
              ['prelims', `Prelims (${results.length})`],
              ['mains', `Mains (${mainsHistory.length})`],
              ['interview', `Interviews (${interviewHistory.length})`],
              ['pyq', `2018–2024 PYQ Bank (${pyqQuestions.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRecordsTab(id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                recordsTab === id
                  ? 'bg-[#0B1E3D] text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Prelims Scorecards */}
        {(recordsTab === 'all' || recordsTab === 'prelims') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Prelims Examination Scorecards</h2>
              <button
                type="button"
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline no-print"
              >
                Take New Exam →
              </button>
            </div>
            {results.length === 0 ? (
              <p className="text-xs text-slate-500">
                No Prelims tests submitted yet in this workspace. Launch the 2018–2024 PYQ Archive or GS Paper I to create your first saved record.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="py-2.5 pr-4 font-semibold">Date</th>
                      <th className="py-2.5 pr-4 font-semibold">Paper</th>
                      <th className="py-2.5 pr-4 font-semibold">Examination</th>
                      <th className="py-2.5 pr-4 font-semibold text-right">Score</th>
                      <th className="py-2.5 pr-4 font-semibold text-right">Accuracy</th>
                      <th className="py-2.5 pr-4 font-semibold text-right">Negative</th>
                      <th className="py-2.5 text-right font-semibold no-print">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.map((res) => (
                      <tr key={res.id}>
                        <td className="py-3 pr-4 font-mono text-slate-500">
                          {new Date(res.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 pr-4 font-mono">{res.paperCode}</td>
                        <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                          {res.examTitle}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-bold tabular-nums">
                          {res.computed.totalScore} / {res.computed.maxScore}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums">
                          {res.computed.accuracyPercent}%
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">
                          -{res.computed.negativeMarks}
                        </td>
                        <td className="py-3 text-right no-print">
                          <button
                            type="button"
                            onClick={() => onOpenPastResult(res)}
                            className="font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline"
                          >
                            Review Solutions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Mains Evaluations */}
        {(recordsTab === 'all' || recordsTab === 'mains') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Mains Answer Writing Evaluations</h2>
              <button
                type="button"
                onClick={() => onNavigate('mains')}
                className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline no-print"
              >
                Open Mains Editor →
              </button>
            </div>
            {mainsHistory.length === 0 ? (
              <p className="text-xs text-slate-500">
                No evaluated Mains answers archived yet. Submit any GS, Essay, or Optional paper answer for rubric scoring.
              </p>
            ) : (
              <div className="space-y-3">
                {mainsHistory.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        {m.paperCode} · {m.wordCount} words · {new Date(m.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      <span className="font-mono font-bold text-sm text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                        {m.overallScore} / {m.maxMarks} (Practice Est.)
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1.5">
                      {m.promptText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Interview Sessions */}
        {(recordsTab === 'all' || recordsTab === 'interview') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Personality Test (AI Board) History</h2>
              <button
                type="button"
                onClick={() => onNavigate('interview')}
                className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline no-print"
              >
                Enter Boardroom →
              </button>
            </div>
            {interviewHistory.length === 0 ? (
              <p className="text-xs text-slate-500">
                No completed AI Personality Test sessions recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {interviewHistory.map((iv) => (
                  <div key={iv.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500">
                        {new Date(iv.createdAt).toLocaleDateString('en-IN')} · {iv.dafSummary.optionalSubject || 'DAF Board'}
                      </span>
                      <span className="font-mono font-bold text-sm text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                        {iv.practiceScore} / {iv.maxScore}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {iv.evaluationReport.overallSummary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2018-2024 Official PYQ Bank Summary */}
        {(recordsTab === 'all' || recordsTab === 'pyq') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Official UPSC CSE Past Year Question Ledger (2018–2024)
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline no-print"
              >
                Practice Full PYQ Bank →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pyqQuestions.map((q) => {
                const tr = q.translations[language] || q.translations.en;
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400">
                      <span>{q.externalCode}</span>
                      <span>UPSC {q.pyqYear} · {q.paperCode}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                      {q.topicName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {tr.questionText}
                    </p>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-2">
                      Answer Key: Option {q.correctOption} · {q.sourceTitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 1. ALL INDIA LEADERBOARD
  if (screen === 'ranking') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Identical Scoring Rules Comparison · Tie-break: Score → Accuracy → Time
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
              All India Ranking
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter ranking by test"
              value={lbExamId}
              onChange={(e) => setLbExamId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {catalog.exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.titleEn}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter ranking by state"
              value={lbState}
              onChange={(e) => setLbState(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="ALL">All India</option>
              <option value="Delhi">Delhi</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {lbLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading verified rankings...</div>
          ) : lbEntries.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                No Ranked Attempts Recorded Yet for This Filter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                UPSC ELITE never generates fake students or fabricated toppers. Submit an official mock test or past year paper to appear on the verified ranking table.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Rank</th>
                    <th className="py-3 px-4 font-semibold">Aspirant</th>
                    <th className="py-3 px-4 font-semibold">State</th>
                    <th className="py-3 px-4 font-semibold text-right">Score</th>
                    <th className="py-3 px-4 font-semibold text-right">Accuracy</th>
                    <th className="py-3 px-4 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lbEntries.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold tabular-nums">#{row.rank}</td>
                      <td className="py-3 px-4 font-medium">{row.aspirantName}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{row.stateName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {row.totalScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {row.accuracyPercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-500">
                        {formatCountdown(row.timeSpentSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. PERFORMANCE ANALYTICS
  if (screen === 'analytics') {
    const totalMocks = results.length;
    const avgScore =
      totalMocks > 0
        ? (results.reduce((sum, r) => sum + r.computed.totalScore, 0) / totalMocks).toFixed(2)
        : '0.00';
    const highestScore =
      totalMocks > 0
        ? Math.max(...results.map((r) => r.computed.totalScore)).toFixed(2)
        : '0.00';
    const avgAcc =
      totalMocks > 0
        ? (results.reduce((sum, r) => sum + r.computed.accuracyPercent, 0) / totalMocks).toFixed(1)
        : '0.0';

    const subjectAgg: Record<string, { correct: number; total: number }> = {};
    for (const r of results) {
      for (const [slug, stats] of Object.entries(r.computed.subjectBreakdown)) {
        if (!subjectAgg[slug]) subjectAgg[slug] = { correct: 0, total: 0 };
        subjectAgg[slug].correct += stats.correct;
        subjectAgg[slug].total += stats.total;
      }
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Diagnostic Insights & Weakness Tracking
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {t(language, 'analytics')}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="w-4 h-4" />
            <span>{t(language, 'downloadPdf')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-xs text-slate-500">Total Mock Tests</div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1">{totalMocks}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-xs text-slate-500">Average Score</div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1">{avgScore}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-xs text-slate-500">Highest Score</div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1 text-[#0B1E3D] dark:text-amber-400">
              {highestScore}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-xs text-slate-500">Mean Accuracy</div>
            <div className="font-mono text-2xl font-bold tabular-nums mt-1">{avgAcc}%</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold mb-4">Subject-Wise Accuracy Matrix</h2>
          {Object.keys(subjectAgg).length === 0 ? (
            <p className="text-sm text-slate-500">
              Complete at least one Prelims mock or Daily Challenge to unlock subject-wise diagnostic accuracy bars.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(subjectAgg).map(([slug, st]) => {
                const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
                const subj = catalog.subjects.find((s) => s.slug === slug);
                const subjectLabel = subj
                  ? language === 'hi'
                    ? subj.nameHi
                    : language === 'gu'
                    ? subj.nameGu
                    : subj.nameEn
                  : slug.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
                return (
                  <div key={slug}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{subjectLabel}</span>
                      <span className="font-mono tabular-nums">
                        {st.correct}/{st.total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B1E3D] dark:bg-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. STUDY PLANNER
  if (screen === 'planner') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Calendar className="w-4 h-4" />
            <span>Balanced UPSC Daily Timetable</span>
          </div>
          <h1 className="font-display text-2xl font-bold mt-1">{t(language, 'studyPlanner')}</h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTaskTitle.trim()) return;
              onAddStudyTask(newTaskTitle.trim(), newTaskMins);
              setNewTaskTitle('');
            }}
            className="mt-5 flex flex-wrap gap-3"
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g., Laxmikanth Parliamentary Committees + 2 Mains Answers"
              className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <input
              type="number"
              min={15}
              max={360}
              value={newTaskMins}
              onChange={(e) => setNewTaskMins(Number(e.target.value) || 60)}
              aria-label="Planned minutes"
              className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
            >
              Add Study Block
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          {studyTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onToggleStudyTask(task.id)}
                />
                <span className={task.isCompleted ? 'line-through text-slate-400 text-sm' : 'text-sm font-medium'}>
                  {task.taskTitle}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {task.dayLabel} · {task.plannedMinutes}m
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // 4. BOOKMARKS
  if (screen === 'bookmarks') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-600" />
          <h1 className="font-display text-2xl font-bold">{t(language, 'bookmarks')}</h1>
        </div>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No saved bookmarks yet. Bookmark questions or current affairs briefs during practice for quick revision.
          </p>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-slate-500 uppercase">{b.itemType.replace('_', ' ')}</div>
                  <div className="text-sm font-semibold mt-0.5">{b.title}</div>
                  {b.subtitle && <div className="text-xs text-slate-500 mt-1">{b.subtitle}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveBookmark(b.itemId)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 5. NOTIFICATIONS
  if (screen === 'notifications') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0B1E3D] dark:text-amber-400" />
            <h1 className="font-display text-xl font-bold">{t(language, 'notifications')}</h1>
          </div>
          {notifications.map((n) => (
            <div key={n.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                {n.category.replace('_', ' ')}
              </div>
              <div className="text-sm font-bold mt-1">{n.title}</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.body}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 h-fit">
          <h2 className="font-display text-base font-bold">Notification Controls</h2>
          {(
            [
              ['dailyReminder', 'Daily Study Reminders'],
              ['mockAlerts', 'New Mock Test Alerts'],
              ['resultAlerts', 'Result Announcements'],
              ['currentAffairs', 'Current Affairs Briefs'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm py-1.5 cursor-pointer">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[key]}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
              />
            </label>
          ))}
        </div>
      </div>
    );
  }

  // 6. PROFILE & SETTINGS (100% FREE OPEN ACCESS — NO PAYMENT TIERS)
  if (screen === 'profile') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSaveProfile(editProfile);
            setProfileSavedMsg('Preferences updated.');
          }}
          className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-display text-xl font-bold">Aspirant Profile & Preferences</h1>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {t(language, 'freeAccessBadge')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={editProfile.fullName}
                onChange={(e) => setEditProfile({ ...editProfile, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prof-state" className="block text-xs font-medium mb-1">
                Home State (for State Ranking)
              </label>
              <input
                id="prof-state"
                type="text"
                value={editProfile.homeState}
                onChange={(e) => setEditProfile({ ...editProfile, homeState: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prof-lang" className="block text-xs font-medium mb-1">
                Medium
              </label>
              <select
                id="prof-lang"
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value as SupportedLanguage)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                {(['en', 'hi', 'gu'] as SupportedLanguage[]).map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABELS[code].nativeName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prof-year" className="block text-xs font-medium mb-1">
                Target Year
              </label>
              <input
                id="prof-year"
                type="number"
                value={editProfile.targetYear}
                onChange={(e) => setEditProfile({ ...editProfile, targetYear: Number(e.target.value) || 2027 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>
            <div>
              <label htmlFor="prof-hours" className="block text-xs font-medium mb-1">
                Daily Hours
              </label>
              <input
                id="prof-hours"
                type="number"
                value={editProfile.dailyStudyHours}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, dailyStudyHours: Number(e.target.value) || 6 })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editProfile.leaderboardOptOut}
              onChange={(e) => setEditProfile({ ...editProfile, leaderboardOptOut: e.target.checked })}
            />
            <span>Opt out of public All-India & State Leaderboards (privacy protection)</span>
          </label>

          {profileSavedMsg && <p className="text-xs text-emerald-600">{profileSavedMsg}</p>}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
          >
            Save Profile Settings
          </button>
        </form>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold">Quick Utilities</h2>
            <button
              type="button"
              onClick={onToggleDark}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-left"
            >
              Switch to {darkMode ? t(language, 'themeLight') : t(language, 'themeDark')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('records')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-left"
            >
              View Past Records ({results.length + mainsHistory.length + interviewHistory.length})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('bookmarks')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-left"
            >
              View Bookmarks ({bookmarks.length})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-left flex items-center justify-between"
            >
              <span>{t(language, 'adminConsole')}</span>
              <Shield className="w-4 h-4 text-[#0B1E3D] dark:text-amber-400" />
            </button>
            {adminRole && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Verified Role: {adminRole}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 7. ADMIN DASHBOARD (RBAC + QUESTION APPROVAL + RULES ENGINE + AUDIT LOGS)
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Role-Based Governance · Super Admin · Question Editor · Subject Expert · Evaluator
          </p>
          <h1 className="font-display text-2xl font-bold mt-1">{t(language, 'adminConsole')}</h1>
        </div>
        {isSignedIn && (
          <button
            type="button"
            onClick={loadAdmin}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            Refresh Queue
          </button>
        )}
      </div>

      {!isSignedIn || adminError ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Shield className="w-8 h-8 text-[#0B1E3D] dark:text-amber-400 mx-auto" />
          <h2 className="font-display text-base font-bold">Admin Authentication Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {adminError ||
              'Sign in with Google using an authorized Admin email to approve pending AI questions, publish exam rule versions, and inspect audit logs in PostgreSQL.'}
          </p>
        </div>
      ) : adminData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-500">Assigned Role</div>
              <div className="font-display text-lg font-bold mt-1">{adminData.adminRole}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-500">Pending AI Questions</div>
              <div className="font-mono text-2xl font-bold mt-1 tabular-nums">
                {adminData.pendingQuestions.length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-500">Registered Aspirants</div>
              <div className="font-mono text-2xl font-bold mt-1 tabular-nums">
                {adminData.totalRegisteredUsers}
              </div>
            </div>
          </div>

          {/* Pending AI Questions Review Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold">AI Question Approval Queue</h2>
            {adminData.pendingQuestions.length === 0 ? (
              <p className="text-xs text-slate-500">No pending questions awaiting review.</p>
            ) : (
              adminData.pendingQuestions.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs text-slate-500 font-mono">
                    {q.externalCode} · {q.subjectSlug} · Difficulty {q.difficulty}/5
                  </div>
                  <p className="text-sm font-medium">{q.questionText}</p>
                  <p className="text-xs text-slate-500">{q.citationText}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await api.reviewQuestion(q.id, 'approved');
                        loadAdmin();
                        await onRefreshCatalog();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Publish
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.reviewQuestion(q.id, 'rejected');
                        loadAdmin();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Configurable UPSC Rules Engine */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold">Configurable UPSC Examination Rules Engine</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await api.publishRuleVersion({
                  paperCode: rulePaper,
                  versionName: ruleVersionName,
                  examYear: 2026,
                  durationMinutes: ruleDuration,
                  questionCount: ruleQCount,
                  marksPerQuestion: ruleMarks,
                  negativeMarkingRatio: 1 / 3,
                  qualifyingPercent: rulePaper === 'CSAT_II' ? 33 : null,
                });
                loadAdmin();
                await onRefreshCatalog();
              }}
              className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <div>
                <label className="block text-xs mb-1">Paper</label>
                <select
                  value={rulePaper}
                  onChange={(e) => setRulePaper(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="GS_I">GS Paper I</option>
                  <option value="CSAT_II">CSAT Paper II</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">Rule Version Label</label>
                <input
                  type="text"
                  value={ruleVersionName}
                  onChange={(e) => setRuleVersionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Mins / Marks</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={ruleDuration}
                    onChange={(e) => setRuleDuration(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={ruleMarks}
                    onChange={(e) => setRuleMarks(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
              >
                Publish Rule
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              {adminData.rules.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span>
                    {r.versionName} · {r.paperCode} ({r.durationMinutes}m · {r.questionCount}Q)
                  </span>
                  <span className={r.isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    {r.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2">
            <h2 className="font-display text-base font-bold mb-2">Recent Audit Logs</h2>
            {adminData.auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>
                  <span className="font-mono font-semibold">{log.action}</span> · {log.actorEmail}
                </span>
                <span className="font-mono text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
