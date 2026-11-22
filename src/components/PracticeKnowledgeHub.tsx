import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Cpu,
  Flame,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '../data/upscSeed.ts';
import { SupportedLanguage, t } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type { CatalogData, CatalogExam, CatalogQuestion } from '../types/app.ts';

interface PracticeKnowledgeHubProps {
  language: SupportedLanguage;
  catalog: CatalogData;
  streakDays: number;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (item: { itemType: string; itemId: string; title: string; subtitle: string }) => void;
  onStartCustomQuiz: (exam: CatalogExam, questions: CatalogQuestion[], durationMinutes: number) => void;
  onRefreshCatalog: () => Promise<void>;
}

export const PracticeKnowledgeHub: React.FC<PracticeKnowledgeHubProps> = ({
  language,
  catalog,
  streakDays,
  bookmarkedIds,
  onToggleBookmark,
  onStartCustomQuiz,
  onRefreshCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'challenge' | 'pyq' | 'ai_gen' | 'ca'>('challenge');

  // PYQ filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [pyqOnly, setPyqOnly] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // AI Question Generator state
  const [genSubject, setGenSubject] = useState('polity');
  const [genTopic, setGenTopic] = useState('Judicial Review & Tenth Schedule');
  const [genDifficulty, setGenDifficulty] = useState(3);
  const [genType, setGenType] = useState('multiple_statement');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<{
    questionText: string;
    options: Array<{ key: string; text: string }>;
    correctOption: string;
    explanation: string;
    citationText: string;
  } | null>(null);

  // Custom quiz state
  const [customSubject, setCustomSubject] = useState('ALL');
  const [customCount, setCustomCount] = useState(10);

  // Live Current Affairs refresh state
  const [caRefreshing, setCaRefreshing] = useState(false);
  const [caError, setCaError] = useState<string | null>(null);
  const [caNotice, setCaNotice] = useState<string | null>(null);

  const handleFetchLiveCa = async () => {
    setCaRefreshing(true);
    setCaError(null);
    setCaNotice(null);
    try {
      const res = (await api.refreshCurrentAffairs(language)) as { insertedCount?: number };
      await onRefreshCatalog();
      setCaNotice(`Live UPSC current affairs updated (${res.insertedCount || 0} new briefs persisted).`);
    } catch (err: unknown) {
      setCaError(err instanceof Error ? err.message : 'Unable to fetch live current affairs.');
    } finally {
      setCaRefreshing(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return catalog.questions.filter((q) => {
      if (pyqOnly && !q.isPyq) return false;
      if (subjectFilter !== 'ALL' && q.subjectSlug !== subjectFilter) return false;
      if (difficultyFilter !== 'ALL' && String(q.difficulty) !== difficultyFilter) return false;
      if (searchQuery.trim()) {
        const needle = searchQuery.toLowerCase();
        const tr = q.translations[language] || q.translations.en;
        const hay = `${q.topicName} ${tr.questionText} ${q.citationText}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [catalog.questions, pyqOnly, subjectFilter, difficultyFilter, searchQuery, language]);

  const launchDrill = (title: string, list: CatalogQuestion[], mins: number) => {
    if (list.length === 0) return;
    onStartCustomQuiz(
      {
        id: catalog.exams[0]?.id || 'custom-drill',
        slug: 'custom-drill',
        titleEn: title,
        titleHi: title,
        titleGu: title,
        paperType: 'GS_I',
        ruleVersionId: null,
        isDemo: true,
      },
      list,
      mins
    );
  };

  const handleGenerateAiQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setGeneratedPreview(null);
    try {
      const res = (await api.generateQuestion({
        subject: genSubject,
        topic: genTopic,
        difficulty: genDifficulty,
        questionType: genType,
        language,
      })) as {
        preview: {
          questionText: string;
          options: Array<{ key: string; text: string }>;
          correctOption: string;
          explanation: string;
          citationText: string;
        };
      };
      setGeneratedPreview(res.preview);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Question generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Practice, PYQs, Current Affairs & AI Question Bank
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Structured Preparation Drills
          </h1>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'challenge', label: 'Daily Drills' },
            { id: 'pyq', label: 'PYQ & Question Bank' },
            { id: 'ai_gen', label: 'AI Question Engine' },
            { id: 'ca', label: 'Current Affairs' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-[#0B1E3D] dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DAILY CHALLENGES & CUSTOM DRILLS */}
      {activeTab === 'challenge' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Daily Sprint</span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> {streakDays}d steady streak
                  </span>
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-2">
                  {t(language, 'dailyChallenge')}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Balanced 10-question GS drill across Polity, Economy, Geography, and Current Affairs. Designed for focused 15-minute recall.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  launchDrill(
                    'Daily 10-Question UPSC Challenge',
                    catalog.questions.filter((q) => q.paperCode === 'GS_I').slice(0, 10),
                    15
                  )
                }
                className="mt-5 w-full py-2.5 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
              >
                Start 10-Question Sprint
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">High-Rigor Drill</span>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-2">
                  Toughest UPSC Challenge
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Advanced & Expert-level multi-statement, assertion-reason, and interdisciplinary questions with 1/3rd penalty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const hard = catalog.questions.filter((q) => q.difficulty >= 3);
                  launchDrill('Toughest UPSC Challenge', hard.length ? hard : catalog.questions, 25);
                }}
                className="mt-5 w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Launch Toughest Drill
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Custom Builder</span>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-2">
                  Custom Subject Test
                </h2>
                <div className="mt-3 space-y-2">
                  <select
                    aria-label="Custom test subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="ALL">All Subjects Mixed</option>
                    {catalog.subjects.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {language === 'hi' ? s.nameHi : language === 'gu' ? s.nameGu : s.nameEn}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Custom test length"
                    value={customCount}
                    onChange={(e) => setCustomCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  >
                    <option value={5}>5 Questions · 8 mins</option>
                    <option value={10}>10 Questions · 15 mins</option>
                    <option value={25}>25 Questions · 30 mins</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const pool =
                    customSubject === 'ALL'
                      ? catalog.questions
                      : catalog.questions.filter((q) => q.subjectSlug === customSubject);
                  launchDrill(
                    `Custom Practice (${customSubject === 'ALL' ? 'Mixed' : customSubject})`,
                    pool.slice(0, customCount),
                    Math.max(5, Math.round(customCount * 1.5))
                  );
                }}
                className="mt-5 w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Create & Start Custom Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PYQ & QUESTION BANK */}
      {activeTab === 'pyq' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search English, हिन्दी, ગુજરાતી questions or topics..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div className="md:col-span-3">
              <select
                aria-label="Filter by subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Subjects</option>
                {catalog.subjects.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {language === 'hi' ? s.nameHi : language === 'gu' ? s.nameGu : s.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <select
                aria-label="Filter by difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Levels</option>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <option key={lvl} value={String(lvl)}>
                    {DIFFICULTY_LABELS[lvl][language]}
                  </option>
                ))}
              </select>
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={pyqOnly}
                onChange={(e) => setPyqOnly(e.target.checked)}
              />
              <span>PYQs Only</span>
            </label>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
              No matching questions found. Try clearing filters or unchecking "PYQs Only".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const tr = q.translations[language] || q.translations.en;
                const isOpen = expandedQ === q.id;
                const isSaved = bookmarkedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {q.externalCode}
                        </span>
                        <span> · {q.isPyq ? `PYQ ${q.pyqYear}` : 'Practice Item'}</span>
                        <span> · {q.topicName}</span>
                        <span> · {DIFFICULTY_LABELS[q.difficulty]?.[language]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleBookmark({
                            itemType: 'question',
                            itemId: q.id,
                            title: q.topicName,
                            subtitle: tr.questionText.slice(0, 90),
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs ${
                          isSaved
                            ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                      </button>
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                      {tr.questionText}
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {tr.options.map((o) => (
                        <div
                          key={o.key}
                          className={`p-2.5 rounded-lg border ${
                            isOpen && o.key === q.correctOption
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-mono font-bold mr-2">{o.key}.</span>
                          {o.text}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Source: {q.citationText || q.sourceTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedQ(isOpen ? null : q.id)}
                        className="text-xs font-semibold text-[#0B1E3D] dark:text-amber-400 hover:underline"
                      >
                        {isOpen ? 'Hide Explanation' : 'View Answer & Explanation'}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                          Correct Answer: Option {q.correctOption}
                        </div>
                        {tr.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI QUESTION GENERATION ENGINE */}
      {activeTab === 'ai_gen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleGenerateAiQuestion}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1E3D] dark:text-amber-400">
              <Cpu className="w-4 h-4" />
              <span>AI Question Generation Pipeline</span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Generate & Queue for Editorial Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every AI-generated question enters the PostgreSQL <span className="font-mono">pending_review</span> queue and must be approved by a Subject Expert or Admin before publishing to official mocks.
            </p>

            <div>
              <label htmlFor="gen-subject" className="block text-xs font-medium mb-1">
                UPSC Subject
              </label>
              <select
                id="gen-subject"
                value={genSubject}
                onChange={(e) => setGenSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                {catalog.subjects.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gen-topic" className="block text-xs font-medium mb-1">
                Syllabus Topic
              </label>
              <input
                id="gen-topic"
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gen-diff" className="block text-xs font-medium mb-1">
                  Difficulty (1–5)
                </label>
                <select
                  id="gen-diff"
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={d}>
                      {d}. {DIFFICULTY_LABELS[d].en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="gen-type" className="block text-xs font-medium mb-1">
                  Question Format
                </label>
                <select
                  id="gen-type"
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {genError && (
              <div className="p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Generating & Queuing...' : 'Generate UPSC Question'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            {generatedPreview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Queued as Pending Review in PostgreSQL
                  </span>
                  <span className="font-mono text-slate-500">{language.toUpperCase()}</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                  {generatedPreview.questionText}
                </p>
                <div className="space-y-2 text-xs">
                  {generatedPreview.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-lg border ${
                        opt.key === generatedPreview.correctOption
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 font-semibold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="font-mono font-bold mr-2">{opt.key}.</span>
                      {opt.text}
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs leading-relaxed">
                  <div className="font-semibold mb-1">Explanation & Source Citation</div>
                  <p>{generatedPreview.explanation}</p>
                  <p className="text-slate-500 mt-2">Citation: {generatedPreview.citationText}</p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  No generated draft yet
                </p>
                <p className="text-xs mt-1 max-w-sm">
                  Configure subject, difficulty (Foundation to Expert Challenge), and format on the left to generate a verifiable question draft.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CURRENT AFFAIRS */}
      {activeTab === 'ca' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Real-Time UPSC Current Affairs Desk
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fetch latest verified PIB, RBI, Supreme Court, and International Relations briefs grounded in live web search.
              </p>
            </div>
            <button
              type="button"
              disabled={caRefreshing}
              onClick={handleFetchLiveCa}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${caRefreshing ? 'animate-spin' : ''}`} />
              <span>{caRefreshing ? 'Searching Live Sources...' : t(language, 'fetchLiveNews')}</span>
            </button>
          </div>

          {caError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{caError}</span>
            </div>
          )}
          {caNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{caNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.currentAffairs.map((ca) => {
              const title = language === 'hi' ? ca.titleHi : language === 'gu' ? ca.titleGu : ca.titleEn;
              const summary = language === 'hi' ? ca.summaryHi : language === 'gu' ? ca.summaryGu : ca.summaryEn;
              const isSaved = bookmarkedIds.has(ca.id);

              return (
                <div
                  key={ca.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {ca.gsPaper} · {ca.publishedDate}
                      </span>
                      <Newspaper className="w-4 h-4" />
                    </div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-2">
                      {title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{ca.sourceCitation}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleBookmark({
                          itemType: 'current_affairs',
                          itemId: ca.id,
                          title,
                          subtitle: ca.gsPaper,
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs ${
                        isSaved
                          ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
