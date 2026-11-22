import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  Grid,
  History,
  LogOut,
  Printer,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { LANGUAGE_LABELS, SupportedLanguage, t } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type {
  CatalogData,
  CatalogExam,
  CatalogQuestion,
  ExamResultSummary,
} from '../types/app.ts';
import {
  AnswerEntry,
  formatCountdown,
  getPaletteCounts,
} from '../utils/upscRules.ts';

interface PrelimsExamEngineProps {
  language: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  istTime: string;
  catalog: CatalogData;
  activeResult: ExamResultSummary | null;
  pastResults: ExamResultSummary[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (q: CatalogQuestion) => void;
  onStartLiveSession: (exam: CatalogExam, questions: CatalogQuestion[], durationMinutes: number) => void;
  onFinishResult: (res: ExamResultSummary) => void;
  onOpenPastResult: (res: ExamResultSummary) => void;
  onBackToExams: () => void;
  liveSession: {
    exam: CatalogExam;
    questions: CatalogQuestion[];
    durationSeconds: number;
  } | null;
  mode: 'hub' | 'live' | 'result';
}

export const PrelimsExamEngine: React.FC<PrelimsExamEngineProps> = ({
  language,
  onChangeLanguage,
  istTime,
  catalog,
  activeResult,
  pastResults,
  bookmarkedIds,
  onToggleBookmark,
  onStartLiveSession,
  onFinishResult,
  onOpenPastResult,
  onBackToExams,
  liveSession,
  mode,
}) => {
  const [selectedExamForInstructions, setSelectedExamForInstructions] = useState<CatalogExam | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({});
  const [eliminatedOpts, setEliminatedOpts] = useState<Record<string, string[]>>({});
  const [secondsLeft, setSecondsLeft] = useState(7200);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAnswerReview, setShowAnswerReview] = useState(false);

  const draftKey = liveSession ? `upsc_cbt_draft_${liveSession.exam.id}` : '';

  // Initialize timer, draft restore, & visited state when entering live mode
  useEffect(() => {
    if (mode === 'live' && liveSession) {
      setCurrentIdx(0);
      setEliminatedOpts({});
      setShowConfirmModal(false);
      setShowExitModal(false);
      setShowMobilePalette(false);
      setSubmitError(null);

      let restored = false;
      try {
        const raw = sessionStorage.getItem(`upsc_cbt_draft_${liveSession.exam.id}`);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            answers?: Record<string, AnswerEntry>;
            secondsLeft?: number;
          };
          if (parsed.answers && Object.keys(parsed.answers).length > 0 && typeof parsed.secondsLeft === 'number' && parsed.secondsLeft > 10) {
            setAnswers(parsed.answers);
            setSecondsLeft(parsed.secondsLeft);
            restored = true;
          }
        }
      } catch {
        // ignore storage errors
      }

      if (!restored) {
        const firstId = liveSession.questions[0]?.id;
        setAnswers(
          firstId
            ? { [firstId]: { selectedOption: null, isMarkedForReview: false, visited: true } }
            : {}
        );
        setSecondsLeft(liveSession.durationSeconds);
      }
    }
  }, [mode, liveSession]);

  // Auto-save live CBT draft to sessionStorage every change
  useEffect(() => {
    if (mode !== 'live' || !liveSession || !draftKey) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ answers, secondsLeft }));
    } catch {
      // ignore storage quota errors
    }
  }, [mode, liveSession, draftKey, answers, secondsLeft]);

  // Countdown tick + auto-submit
  useEffect(() => {
    if (mode !== 'live' || !liveSession) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, liveSession]);

  const currentQuestion = liveSession?.questions[currentIdx];

  // Real exam keyboard shortcuts (1-4 / A-D select option, Left/Right navigate)
  useEffect(() => {
    if (mode !== 'live' || !liveSession || !currentQuestion || showConfirmModal || showExitModal) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      const key = e.key.toUpperCase();
      const map: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', A: 'A', B: 'B', C: 'C', D: 'D' };
      if (map[key]) {
        selectOption(currentQuestion.id, map[key]);
      } else if (e.key === 'ArrowRight') {
        handleSaveAndNext();
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        goToIndex(currentIdx - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, liveSession, currentQuestion, currentIdx, showConfirmModal, showExitModal]);

  const activeRule = (paperType: string) =>
    catalog.rules.find((r) => r.paperCode === paperType);

  const getExamQuestions = (exam: CatalogExam) => {
    if (exam.slug === 'prelims-pyq-archive') {
      return catalog.questions.filter((q) => q.isPyq);
    }
    return catalog.questions.filter((q) => q.paperCode === exam.paperType);
  };

  const handleLaunchExam = (exam: CatalogExam) => {
    const paperQuestions = getExamQuestions(exam);
    const rule = activeRule(exam.paperType);
    const durationMins = rule?.durationMinutes || 120;
    onStartLiveSession(exam, paperQuestions, durationMins);
    setSelectedExamForInstructions(null);
  };

  const markVisited = (qId: string) => {
    setAnswers((prev) => {
      const existing = prev[qId];
      if (existing?.visited) return prev;
      return {
        ...prev,
        [qId]: {
          selectedOption: existing?.selectedOption || null,
          isMarkedForReview: existing?.isMarkedForReview || false,
          visited: true,
        },
      };
    });
  };

  const selectOption = (qId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedOption: optionKey,
        isMarkedForReview: prev[qId]?.isMarkedForReview || false,
        visited: true,
      },
    }));
  };

  const toggleEliminateOption = (qId: string, optionKey: string) => {
    setEliminatedOpts((prev) => {
      const list = prev[qId] || [];
      const next = list.includes(optionKey)
        ? list.filter((k) => k !== optionKey)
        : [...list, optionKey];
      return { ...prev, [qId]: next };
    });
  };

  const clearResponse = (qId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedOption: null,
        isMarkedForReview: prev[qId]?.isMarkedForReview || false,
        visited: true,
      },
    }));
  };

  const goToIndex = (nextIdx: number) => {
    if (!liveSession) return;
    const clamped = Math.max(0, Math.min(liveSession.questions.length - 1, nextIdx));
    setCurrentIdx(clamped);
    const targetId = liveSession.questions[clamped]?.id;
    if (targetId) markVisited(targetId);
  };

  const handleSaveAndNext = () => {
    if (!liveSession || !currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOption: prev[currentQuestion.id]?.selectedOption || null,
        isMarkedForReview: false,
        visited: true,
      },
    }));
    if (currentIdx < liveSession.questions.length - 1) {
      goToIndex(currentIdx + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!liveSession || !currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOption: prev[currentQuestion.id]?.selectedOption || null,
        isMarkedForReview: true,
        visited: true,
      },
    }));
    if (currentIdx < liveSession.questions.length - 1) {
      goToIndex(currentIdx + 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!liveSession || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const timeSpentSeconds = Math.max(1, liveSession.durationSeconds - secondsLeft);
    try {
      const response = (await api.submitPrelims({
        examId: liveSession.exam.id,
        paperCode: liveSession.exam.paperType,
        questionIds: liveSession.questions.map((q) => q.id),
        answers,
        timeSpentSeconds,
        language,
      })) as { computed: ExamResultSummary['computed'] };

      if (draftKey) {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
      }

      onFinishResult({
        id: `res-${Date.now()}`,
        examTitle:
          language === 'hi'
            ? liveSession.exam.titleHi
            : language === 'gu'
            ? liveSession.exam.titleGu
            : liveSession.exam.titleEn,
        paperCode: liveSession.exam.paperType,
        createdAt: new Date().toISOString(),
        timeSpentSeconds,
        computed: response.computed,
        questions: liveSession.questions,
        answers,
      });
      setShowConfirmModal(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitWithoutSubmit = () => {
    if (draftKey) {
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
    }
    setShowExitModal(false);
    onBackToExams();
  };

  const paletteCounts = useMemo(() => {
    if (!liveSession) return null;
    return getPaletteCounts(
      liveSession.questions.map((q) => q.id),
      answers
    );
  }, [liveSession, answers]);

  // 1. LIVE EXAMINATION INTERFACE (REAL CBT HALL)
  if (mode === 'live' && liveSession && currentQuestion) {
    const tr = currentQuestion.translations[language] || currentQuestion.translations.en;
    const currentAns = answers[currentQuestion.id];
    const currentEliminated = eliminatedOpts[currentQuestion.id] || [];

    const palettePanel = (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Question Navigation Palette
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Keys: A–D / ← →
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {liveSession.questions.map((q, idx) => {
            const ans = answers[q.id];
            const isCurrent = idx === currentIdx;
            let style =
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            if (ans?.selectedOption && ans.isMarkedForReview) {
              style = 'bg-indigo-600 text-white border-indigo-600';
            } else if (ans?.selectedOption) {
              style = 'bg-emerald-600 text-white border-emerald-600';
            } else if (ans?.isMarkedForReview) {
              style = 'bg-amber-500 text-slate-950 border-amber-500';
            } else if (ans?.visited) {
              style = 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  goToIndex(idx);
                  setShowMobilePalette(false);
                }}
                aria-label={`Question ${idx + 1}`}
                className={`h-10 rounded-lg border font-mono text-xs font-bold transition-transform ${style} ${
                  isCurrent ? 'ring-2 ring-[#0B1E3D] dark:ring-amber-400 ring-offset-2 dark:ring-offset-slate-900' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {paletteCounts && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
              <span>Answered</span>
              <span className="font-mono font-bold tabular-nums">{paletteCounts.answered}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300">
              <span>Not Answered</span>
              <span className="font-mono font-bold tabular-nums">{paletteCounts.notAnswered}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
              <span>Marked</span>
              <span className="font-mono font-bold tabular-nums">{paletteCounts.markedForReview}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300">
              <span>Ans + Marked</span>
              <span className="font-mono font-bold tabular-nums">{paletteCounts.answeredAndMarked}</span>
            </div>
            <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Not Visited</span>
              <span className="font-mono font-bold tabular-nums">{paletteCounts.notVisited}</span>
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Top CBT Bar */}
        <header className="bg-[#0B1E3D] text-white px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4 border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-[11px] text-amber-300 font-medium truncate">
              {liveSession.exam.paperType === 'CSAT_II'
                ? 'CSAT Paper II · 33% Qualifying'
                : 'GS Paper I · 1/3rd Negative Marking'} · {istTime} IST
            </p>
            <h1 className="font-display text-sm sm:text-base font-bold truncate max-w-[210px] sm:max-w-md">
              {language === 'hi'
                ? liveSession.exam.titleHi
                : language === 'gu'
                ? liveSession.exam.titleGu
                : liveSession.exam.titleEn}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* In-exam bilingual / trilingual switcher just like real UPSC bilingual paper */}
            <div className="flex items-center gap-0.5 p-0.5 bg-white/10 rounded-lg border border-white/15">
              {(['en', 'hi', 'gu'] as SupportedLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLanguage(code)}
                  aria-label={`Exam medium ${LANGUAGE_LABELS[code].nativeName}`}
                  className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                    language === code ? 'bg-amber-500 text-slate-950' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {LANGUAGE_LABELS[code].shortName}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-mono text-xs sm:text-sm font-semibold tabular-nums" data-testid="exam-timer">
                {formatCountdown(secondsLeft)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMobilePalette(true)}
              className="lg:hidden p-2 rounded-lg bg-white/10 border border-white/15 text-white"
              aria-label="Open Question Palette"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              aria-label="Exit examination"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-3 sm:px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
            >
              {t(language, 'submitExam')}
            </button>
          </div>
        </header>

        {/* Main CBT Split */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Stage */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    Q.{currentIdx + 1} / {liveSession.questions.length}
                  </span>
                  <span> · {currentQuestion.topicName}</span>
                  {currentQuestion.isPyq && currentQuestion.pyqYear && (
                    <span className="font-mono text-amber-700 dark:text-amber-400">
                      {' '}· UPSC {currentQuestion.pyqYear}
                    </span>
                  )}
                  <span> · +{currentQuestion.marks} / -{currentQuestion.negativeMarks}</span>
                </div>
                {!tr.isOfficialTranslation && (
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    AI Translated Reference
                  </span>
                )}
              </div>

              <div className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-900 dark:text-slate-100 font-medium">
                {tr.questionText}
              </div>

              <div className="mt-6 space-y-3">
                {tr.options.map((opt) => {
                  const isSelected = currentAns?.selectedOption === opt.key;
                  const isEliminated = currentEliminated.includes(opt.key);
                  return (
                    <div
                      key={opt.key}
                      className={`rounded-xl border transition-colors flex items-stretch ${
                        isSelected
                          ? 'border-[#0B1E3D] bg-[#0B1E3D]/5 dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectOption(currentQuestion.id, opt.key)}
                        className="flex-1 text-left p-4 flex items-start gap-3"
                      >
                        <span
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#0B1E3D] text-white dark:bg-amber-500 dark:text-slate-950'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span
                          className={`text-sm leading-relaxed pt-0.5 ${
                            isEliminated
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {opt.text}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleEliminateOption(currentQuestion.id, opt.key)}
                        aria-label={`Eliminate option ${opt.key}`}
                        title="Eliminate / Strike-out option"
                        className={`px-3 border-l border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs ${
                          isEliminated
                            ? 'text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => goToIndex(currentIdx - 1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t(language, 'previous')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => clearResponse(currentQuestion.id)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t(language, 'clearResponse')}
                </button>
                <button
                  type="button"
                  onClick={handleMarkForReviewAndNext}
                  className="px-3 py-2 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40"
                >
                  {t(language, 'markForReview')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>{currentIdx === liveSession.questions.length - 1 ? 'Save Answer' : t(language, 'saveAndNext')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Question Navigation Palette */}
          <aside className="hidden lg:flex lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex-col justify-between">
            {palettePanel}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="mt-6 w-full py-3 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors"
            >
              {t(language, 'submitExam')}
            </button>
          </aside>
        </div>

        {/* Mobile Question Palette Drawer Modal */}
        {showMobilePalette && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-end sm:items-center justify-center p-4 lg:hidden" role="dialog" aria-modal="true">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setShowMobilePalette(false)}
                  aria-label="Close palette"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {palettePanel}
            </div>
          </div>
        )}

        {/* Exit Confirmation Modal */}
        {showExitModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Leave Live Examination Hall?
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                You can submit your current answers for scoring or discard this in-progress attempt and return to the examination hall.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Resume Exam
                </button>
                <button
                  type="button"
                  onClick={handleExitWithoutSubmit}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
                >
                  Discard & Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Confirmation Modal */}
        {showConfirmModal && paletteCounts && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {t(language, 'confirmSubmitTitle')}
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                {t(language, 'confirmSubmitDesc')}
              </p>

              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Total Questions</span>
                  <span className="font-mono font-bold tabular-nums">{liveSession.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answered (incl. Marked)</span>
                  <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {paletteCounts.answered + paletteCounts.answeredAndMarked}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review (Unanswered)</span>
                  <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
                    {paletteCounts.markedForReview}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Unattempted</span>
                  <span className="font-mono font-bold tabular-nums">
                    {paletteCounts.notAnswered + paletteCounts.notVisited}
                  </span>
                </div>
              </div>

              {submitError && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{submitError}</p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t(language, 'cancel')}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 rounded-lg bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Scoring...' : t(language, 'confirmSubmitBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. RESULT SCREEN & ANSWER REVIEW
  if (mode === 'result' && activeResult) {
    const c = activeResult.computed;
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                PostgreSQL Verified Scorecard · {activeResult.paperCode === 'CSAT_II' ? 'CSAT Qualifying Rules' : 'GS Paper I Rules'}
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {activeResult.examTitle}
              </h1>
              {c.passedQualifying !== null && (
                <p
                  className={`mt-2 text-sm font-semibold ${
                    c.passedQualifying ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {c.passedQualifying
                    ? 'CSAT Qualifying Status: QUALIFIED (≥ 33% Threshold Met)'
                    : 'CSAT Qualifying Status: NOT QUALIFIED (< 33% Threshold)'}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" />
                <span>{t(language, 'downloadPdf')}</span>
              </button>
              <button
                type="button"
                onClick={onBackToExams}
                className="px-4 py-2 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
              >
                Back to Examinations
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'scoreOutOf')}</div>
              <div className="font-mono text-2xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums mt-1">
                {c.totalScore} / {c.maxScore}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'accuracy')}</div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {c.accuracyPercent}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <div className="text-xs text-emerald-700 dark:text-emerald-400">{t(language, 'correct')}</div>
              <div className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
                {c.correctCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="text-xs text-red-700 dark:text-red-400">{t(language, 'incorrect')}</div>
              <div className="font-mono text-2xl font-bold text-red-700 dark:text-red-400 tabular-nums mt-1">
                {c.incorrectCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'negativeMarks')}</div>
              <div className="font-mono text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums mt-1">
                -{c.negativeMarks}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'timeSpent')}</div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {formatCountdown(activeResult.timeSpentSeconds)}
              </div>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="mt-8">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">
              Subject-Wise Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(c.subjectBreakdown).map(([slug, stats]) => {
                const subj = catalog.subjects.find((s) => s.slug === slug);
                const subjectName = subj
                  ? language === 'hi'
                    ? subj.nameHi
                    : language === 'gu'
                    ? subj.nameGu
                    : subj.nameEn
                  : slug.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
                return (
                  <div
                    key={slug}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {subjectName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                        {stats.correct} Correct · {stats.incorrect} Wrong · {stats.unattempted} Skip
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                      {stats.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
            <button
              type="button"
              onClick={() => setShowAnswerReview((s) => !s)}
              className="px-5 py-2.5 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-xs sm:text-sm"
            >
              {showAnswerReview ? 'Hide Detailed Solutions' : t(language, 'answerReview')}
            </button>
          </div>
        </div>

        {/* Detailed Answer Review */}
        {showAnswerReview && (
          <div className="space-y-4">
            {activeResult.questions.map((q, idx) => {
              const tr = q.translations[language] || q.translations.en;
              const userChoice = activeResult.answers[q.id]?.selectedOption || null;
              const isCorrect = userChoice === q.correctOption;
              const isBookmarked = bookmarkedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="font-mono font-bold">Q.{idx + 1}</span>
                      <span>· {q.topicName}</span>
                      {userChoice ? (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct ({userChoice})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect (Selected {userChoice} · Correct {q.correctOption})
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">Unattempted · Correct {q.correctOption}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(q)}
                      aria-label={`Bookmark question ${idx + 1}`}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                        isBookmarked
                          ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line">
                    {tr.questionText}
                  </p>

                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 mb-1">
                      Detailed Explanation
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {tr.explanation}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      Source: {q.citationText || q.sourceTitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. EXAM INSTRUCTIONS VIEW
  if (selectedExamForInstructions) {
    const rule = activeRule(selectedExamForInstructions.paperType);
    const paperQuestions = getExamQuestions(selectedExamForInstructions);

    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Official UPSC CSE Examination Rules Engine · 100% Free</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-2">
          {language === 'hi'
            ? selectedExamForInstructions.titleHi
            : language === 'gu'
            ? selectedExamForInstructions.titleGu
            : selectedExamForInstructions.titleEn}
        </h1>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">Paper Standard</div>
            <div className="font-mono text-sm font-bold mt-1">
              {selectedExamForInstructions.paperType === 'CSAT_II' ? '80 Q · 200M' : '100 Q · 200M'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">Loaded Items</div>
            <div className="font-mono text-sm font-bold mt-1">{paperQuestions.length} Questions</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">Duration</div>
            <div className="font-mono text-sm font-bold mt-1">{rule?.durationMinutes || 120} Minutes</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">Negative Marking</div>
            <div className="font-mono text-sm font-bold mt-1">1/3rd per wrong</div>
          </div>
        </div>

        <ul className="mt-6 space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
          <li>Each question carries equal marks ({rule?.marksPerQuestion || 2} marks).</li>
          <li>One-third (1/3) of the marks assigned to a question will be deducted as penalty for each incorrect answer.</li>
          <li>Unanswered questions carry zero penalty. Use the option eye icon to strike out eliminated choices.</li>
          <li>Switch freely between English, हिन्दी, and ગુજરાતી inside the live exam header anytime.</li>
          {selectedExamForInstructions.paperType === 'CSAT_II' && (
            <li className="font-semibold text-slate-900 dark:text-white">
              CSAT Paper II is qualifying in nature with a minimum 33% score requirement.
            </li>
          )}
          <li>The examination auto-submits when the countdown timer reaches 00:00:00 and saves permanently to Past Records.</li>
        </ul>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedExamForInstructions(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Back
          </button>
          <button
            type="button"
            disabled={paperQuestions.length === 0}
            onClick={() => handleLaunchExam(selectedExamForInstructions)}
            className="px-6 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {t(language, 'startExam')}
          </button>
        </div>
      </div>
    );
  }

  // 4. PRELIMS DASHBOARD (GS I, CSAT II, & 2018-2024 PYQ ARCHIVE + PAST SCORECARDS)
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Stage 1 · Preliminary Examination Simulator · Official Past Year Papers & Mocks
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {t(language, 'prelimsPrep')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
          Practice real UPSC CSE Past Year Questions (2018–2024), GS Paper I, and CSAT Paper II with authentic CBT controls, in-exam trilingual switching, and permanent PostgreSQL scorecard archiving.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalog.exams.map((exam) => {
          const rule = activeRule(exam.paperType);
          const count = getExamQuestions(exam).length;
          const isPyqArchive = exam.slug === 'prelims-pyq-archive';
          return (
            <div
              key={exam.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                  {isPyqArchive
                    ? 'Official Past Year Archive (2018–2024)'
                    : exam.paperType === 'CSAT_II'
                    ? 'Paper II · Qualifying (33%)'
                    : 'Paper I · Merit Ranking'}
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-2">
                  {language === 'hi' ? exam.titleHi : language === 'gu' ? exam.titleGu : exam.titleEn}
                </h2>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-500">Standard</div>
                    <div className="font-mono font-bold mt-0.5">
                      {rule?.questionCount || (exam.paperType === 'CSAT_II' ? 80 : 100)} Qs
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-500">Questions</div>
                    <div className="font-mono font-bold mt-0.5">{count} Qs</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-500">Duration</div>
                    <div className="font-mono font-bold mt-0.5">{rule?.durationMinutes || 120}m</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  -1/3rd Penalty
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedExamForInstructions(exam)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-xs transition-colors"
                >
                  Read Instructions & Start
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Persisted Past Prelims Attempts */}
      {pastResults.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-[#0B1E3D] dark:text-amber-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Recorded Past Prelims Attempts ({pastResults.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-2.5 pr-4 font-semibold">Date</th>
                  <th className="py-2.5 pr-4 font-semibold">Examination</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Score</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Accuracy</th>
                  <th className="py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastResults.slice(0, 8).map((res) => (
                  <tr key={res.id}>
                    <td className="py-3 pr-4 font-mono text-slate-500">
                      {new Date(res.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                      {res.examTitle}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-bold tabular-nums">
                      {res.computed.totalScore} / {res.computed.maxScore}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">
                      {res.computed.accuracyPercent}%
                    </td>
                    <td className="py-3 text-right">
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
        </div>
      )}
    </div>
  );
};
