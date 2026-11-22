import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  FileText,
  History,
  Mic,
  Newspaper,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { SupportedLanguage, t } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type {
  CatalogData,
  ExamResultSummary,
  InterviewSessionRecord,
  MainsEvalRecord,
  PastRecordsPayload,
  ScreenId,
  StudentProfile,
  StudyTask,
} from '../types/app.ts';

interface HomeDashboardProps {
  language: SupportedLanguage;
  profile: StudentProfile;
  catalog: CatalogData;
  recentResults: ExamResultSummary[];
  mainsHistory: MainsEvalRecord[];
  interviewHistory: InterviewSessionRecord[];
  platformTotals: PastRecordsPayload['platformTotals'];
  studyTasks: StudyTask[];
  onNavigate: (screen: ScreenId) => void;
  onOpenPastResult: (res: ExamResultSummary) => void;
  onRefreshCatalog: () => Promise<void>;
  onLaunchDailyChallenge: () => void;
  onToggleStudyTask: (taskId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  language,
  profile,
  catalog,
  recentResults,
  mainsHistory,
  interviewHistory,
  platformTotals,
  studyTasks,
  onNavigate,
  onOpenPastResult,
  onRefreshCatalog,
  onLaunchDailyChallenge,
  onToggleStudyTask,
}) => {
  const [caRefreshing, setCaRefreshing] = useState(false);
  const [caError, setCaError] = useState<string | null>(null);
  const [caNotice, setCaNotice] = useState<string | null>(null);

  const completedTasks = studyTasks.filter((item) => item.isCompleted).length;
  const dailyProgressPct =
    studyTasks.length > 0 ? Math.round((completedTasks / studyTasks.length) * 100) : 40;

  const handleFetchLiveCa = async () => {
    setCaRefreshing(true);
    setCaError(null);
    setCaNotice(null);
    try {
      const res = (await api.refreshCurrentAffairs(language)) as { insertedCount?: number };
      await onRefreshCatalog();
      setCaNotice(`Live briefs updated (${res.insertedCount || 0} new UPSC items archived).`);
    } catch (err: unknown) {
      setCaError(err instanceof Error ? err.message : 'Unable to fetch live current affairs.');
    } finally {
      setCaRefreshing(false);
    }
  };

  // Deterministic chart points from user's persisted attempts or baseline
  const chartPoints =
    recentResults.length > 0
      ? recentResults
          .slice(0, 6)
          .reverse()
          .map((r, i) => ({
            label: `Test ${i + 1}`,
            pct: Math.max(
              0,
              Math.min(100, Math.round((r.computed.totalScore / Math.max(1, r.computed.maxScore)) * 100))
            ),
          }))
      : [
          { label: 'M1', pct: 46 },
          { label: 'M2', pct: 52 },
          { label: 'M3', pct: 58 },
          { label: 'M4', pct: 64 },
        ];

  const svgWidth = 420;
  const svgHeight = 140;
  const padX = 28;
  const padY = 20;
  const coords = chartPoints.map((pt, idx) => {
    const x =
      chartPoints.length === 1
        ? svgWidth / 2
        : padX + (idx / (chartPoints.length - 1)) * (svgWidth - padX * 2);
    const y = svgHeight - padY - (pt.pct / 100) * (svgHeight - padY * 2);
    return { ...pt, x, y };
  });
  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Hero Banner & Daily Focus */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-[#0B1E3D] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-medium text-amber-300">
              {t(language, 'freeAccessBadge')} · CSE {profile.targetYear} · {profile.optionalSubject}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2 tracking-tight [text-wrap:balance]">
              {t(language, 'welcomeBack')}, {profile.fullName}
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              {t(language, 'heroSubtitle')}
            </p>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span>{t(language, 'dailyProgress')}</span>
                <span className="font-mono tabular-nums font-semibold text-amber-300">{dailyProgressPct}%</span>
              </div>
              <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${dailyProgressPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('records')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap"
              >
                {t(language, 'navRecords')}
              </button>
              <button
                type="button"
                onClick={onLaunchDailyChallenge}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t(language, 'dailyChallenge')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="h-36 overflow-hidden relative">
            <img
              src="/src/assets/images/aspirant_study_desk_1795376372858.jpg"
              alt="Civil services scholar study desk"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {t(language, 'continueLearning')}
              </p>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                UPSC CSE Prelims & 2018–2024 PYQ Archive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {platformTotals.pyqCount || catalog.questions.filter((q) => q.isPyq).length} Official Past Questions · 1/3rd Negative Marking
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="mt-4 w-full py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t(language, 'openExamHall')}
            </button>
          </div>
        </div>
      </section>

      {/* Primary Three-Stage & Core Modules Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            id: 'exams' as ScreenId,
            title: t(language, 'prelimsPrep'),
            meta: 'GS I · CSAT II · PYQ Archive',
            icon: Target,
          },
          {
            id: 'mains' as ScreenId,
            title: t(language, 'mainsPrep'),
            meta: '9 Papers · AI Rubric',
            icon: FileText,
          },
          {
            id: 'interview' as ScreenId,
            title: t(language, 'aiInterview'),
            meta: '275 Marks · Voice Board',
            icon: Mic,
          },
          {
            id: 'records' as ScreenId,
            title: t(language, 'navRecords'),
            meta: `${recentResults.length} Prelims · ${mainsHistory.length} Mains · ${interviewHistory.length} Board`,
            icon: History,
          },
          {
            id: 'analytics' as ScreenId,
            title: t(language, 'analytics'),
            meta: `${platformTotals.approvedQuestions || catalog.questions.length} Curated Items`,
            icon: TrendingUp,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.id)}
              className="text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B1E3D] dark:hover:border-amber-400 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-[#0B1E3D] dark:text-amber-400" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white mt-3">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.meta}</p>
            </button>
          );
        })}
      </section>

      {/* Persisted Past Records & Latest Results Strip */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#0B1E3D] dark:text-amber-400" />
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {t(language, 'latestResults')} & {t(language, 'navRecords')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real persisted attempts stored in PostgreSQL ({platformTotals.prelimsAttempts} Prelims · {platformTotals.mainsEvaluations} Mains · {platformTotals.interviewSessions} Interviews platform-wide)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('records')}
            className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
          >
            View Complete Past Records →
          </button>
        </div>

        {recentResults.length === 0 && mainsHistory.length === 0 && interviewHistory.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              No saved test attempts in this session yet. Attempt the 2018–2024 PYQ Archive or Daily 10-Question Challenge to save your first permanent scorecard.
            </div>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="px-4 py-2 rounded-lg bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
            >
              Attempt Past Year Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentResults.slice(0, 3).map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{res.paperCode}</span>
                    <span>{new Date(res.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {res.examTitle}
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-mono text-xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                      {res.computed.totalScore} / {res.computed.maxScore}
                    </span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {res.computed.accuracyPercent}% Acc
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPastResult(res)}
                  className="mt-3 text-left text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline"
                >
                  Open Detailed Scorecard & Solutions →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Analytics Trajectory + Upcoming Mocks + Study Planner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {t(language, 'performanceGraph')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {recentResults.length > 0 ? 'Your recorded mock scores (%)' : 'Sample trajectory baseline · Complete a test to plot live'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
            >
              {t(language, 'fullAnalytics')}
            </button>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 overflow-visible">
            {[25, 50, 75].map((tick) => {
              const y = svgHeight - padY - (tick / 100) * (svgHeight - padY * 2);
              return (
                <g key={tick}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={svgWidth - padX}
                    y2={y}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={4}
                    y={y + 4}
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-[#0B1E3D] dark:text-amber-400"
              points={polylinePoints}
            />
            {coords.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  className="fill-[#0B1E3D] dark:fill-amber-400"
                />
                <text
                  x={pt.x}
                  y={svgHeight - 2}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {t(language, 'studyPlanner')}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
            >
              {t(language, 'managePlan')}
            </button>
          </div>
          <div className="space-y-2.5">
            {studyTasks.slice(0, 4).map((task) => (
              <label
                key={task.id}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onToggleStudyTask(task.id)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      task.isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {task.taskTitle}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {task.dayLabel} · {task.plannedMinutes} mins
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {t(language, 'upcomingMocks')}
              </h2>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {catalog.exams.map((exam) => (
                <div
                  key={exam.id}
                  className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-none last:pb-0"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {language === 'hi' ? exam.titleHi : language === 'gu' ? exam.titleGu : exam.titleEn}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {exam.paperType === 'CSAT_II'
                      ? '80 Q · 200 Marks · 33% Qualifying'
                      : exam.slug === 'prelims-pyq-archive'
                      ? 'Official 2018–2024 UPSC Past Papers'
                      : '100 Q · 200 Marks · 120 Mins'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('ranking')}
            className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 transition-colors"
          >
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{t(language, 'allIndiaLeaderboard')}</span>
          </button>
        </div>
      </section>

      {/* Current Affairs Briefs + Live Search Trigger */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#0B1E3D] dark:text-amber-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {t(language, 'currentAffairs')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={caRefreshing}
              onClick={handleFetchLiveCa}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${caRefreshing ? 'animate-spin' : ''}`} />
              <span>{caRefreshing ? 'Fetching Live...' : t(language, 'fetchLiveNews')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
            >
              {t(language, 'exploreAllBriefs')}
            </button>
          </div>
        </div>

        {caError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {caError}
          </div>
        )}
        {caNotice && (
          <div className="mb-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
            {caNotice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.currentAffairs.slice(0, 2).map((ca) => (
            <div
              key={ca.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {ca.gsPaper} · {ca.publishedDate}
              </div>
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white mt-1.5">
                {language === 'hi' ? ca.titleHi : language === 'gu' ? ca.titleGu : ca.titleEn}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {language === 'hi' ? ca.summaryHi : language === 'gu' ? ca.summaryGu : ca.summaryEn}
              </p>
              <div className="text-[11px] text-slate-400 mt-2">{ca.sourceCitation}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
