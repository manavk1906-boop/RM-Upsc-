import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
} from 'lucide-react';
import {
  MAINS_EVALUATION_RUBRIC,
  OPTIONAL_SUBJECTS,
  SEED_MAINS_PAPERS,
  SeedMainsPaper,
} from '../data/upscSeed.ts';
import { SupportedLanguage, t } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type { MainsEvalRecord, StudentProfile } from '../types/app.ts';
import { countWords, formatCountdown } from '../utils/upscRules.ts';

interface MainsEngineProps {
  language: SupportedLanguage;
  profile: StudentProfile;
  onUpdateOptional: (subject: string) => void;
  history: MainsEvalRecord[];
  onAddHistory: (record: MainsEvalRecord) => void;
}

export const MainsEngine: React.FC<MainsEngineProps> = ({
  language,
  profile,
  onUpdateOptional,
  history,
  onAddHistory,
}) => {
  const [selectedPaper, setSelectedPaper] = useState<SeedMainsPaper | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [attachment, setAttachment] = useState<{
    name: string;
    mime: string;
    base64: string;
  } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [latestEval, setLatestEval] = useState<MainsEvalRecord | null>(null);

  useEffect(() => {
    if (!selectedPaper || latestEval) return;
    const id = window.setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [selectedPaper, latestEval]);

  const currentPrompt = selectedPaper?.samplePrompts[0];
  const wordCount = countWords(answerText);

  const handleOpenPaper = (paper: SeedMainsPaper) => {
    setSelectedPaper(paper);
    setAnswerText('');
    setSecondsElapsed(0);
    setAttachment(null);
    setEvalError(null);
    setLatestEval(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setEvalError('Please upload a PDF or handwritten image under 6 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setAttachment({
        name: file.name,
        mime: file.type || 'application/pdf',
        base64,
      });
      setEvalError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEvaluate = async () => {
    if (!selectedPaper || !currentPrompt) return;
    if (!answerText.trim() && !attachment) {
      setEvalError('Write your descriptive answer or upload a PDF/image answer sheet before evaluating.');
      return;
    }
    setEvaluating(true);
    setEvalError(null);
    try {
      const promptText =
        language === 'hi'
          ? currentPrompt.promptHi
          : language === 'gu'
          ? currentPrompt.promptGu
          : currentPrompt.promptEn;

      const res = (await api.evaluateMains({
        paperCode: selectedPaper.paperCode,
        optionalSubject: profile.optionalSubject,
        promptText,
        answerText,
        wordLimit: currentPrompt.wordLimit,
        maxMarks: currentPrompt.marks,
        timeSpentSeconds: secondsElapsed,
        language,
        attachmentBase64: attachment?.base64,
        attachmentMime: attachment?.mime,
        attachmentName: attachment?.name,
      })) as {
        overallScore: number;
        maxMarks: number;
        aiEval: {
          rubric: Record<string, { score: number; max: number; note: string }>;
          strengths: string[];
          improvements: string[];
          modelAnswer: string;
        };
      };

      const record: MainsEvalRecord = {
        id: `mains-${Date.now()}`,
        paperCode: selectedPaper.paperCode,
        promptText,
        answerText,
        wordCount,
        overallScore: res.overallScore,
        maxMarks: res.maxMarks,
        createdAt: new Date().toISOString(),
        rubric: res.aiEval.rubric,
        strengths: res.aiEval.strengths,
        improvements: res.aiEval.improvements,
        modelAnswer: res.aiEval.modelAnswer,
      };
      setLatestEval(record);
      onAddHistory(record);
    } catch (err: unknown) {
      setEvalError(err instanceof Error ? err.message : 'Mains evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  // EVALUATION REPORT SCREEN
  if (selectedPaper && latestEval) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {t(language, 'aiEstimateBadge')}
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {selectedPaper.titleEn} · Evaluation Report
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Word Count: {latestEval.wordCount} · Time: {formatCountdown(secondsElapsed)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">Practice Score Estimate</div>
              <div className="font-mono text-3xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                {latestEval.overallScore} / {latestEval.maxMarks}
              </div>
            </div>
          </div>

          {/* Rubric Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAINS_EVALUATION_RUBRIC.map((dim) => {
              const item = latestEval.rubric[dim.key] || { score: 0, max: dim.max, note: '' };
              return (
                <div
                  key={dim.key}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {dim.label}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Strengths & Improvements */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20">
              <h2 className="font-display text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                Key Strengths
              </h2>
              <ul className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200 list-disc pl-4">
                {latestEval.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20">
              <h2 className="font-display text-sm font-bold text-amber-900 dark:text-amber-300 mb-2">
                Targeted Improvements
              </h2>
              <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200 list-disc pl-4">
                {latestEval.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer Comparison */}
          <div className="mt-6 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">
              Model Answer Structure & Comparison
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {latestEval.modelAnswer}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedPaper(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Back to All 9 Mains Papers
            </button>
            <button
              type="button"
              onClick={() => handleOpenPaper(selectedPaper)}
              className="px-5 py-2 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold"
            >
              Write Another Attempt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DESCRIPTIVE ANSWER EDITOR SCREEN
  if (selectedPaper && currentPrompt) {
    const promptText =
      language === 'hi'
        ? currentPrompt.promptHi
        : language === 'gu'
        ? currentPrompt.promptGu
        : currentPrompt.promptEn;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {selectedPaper.paperCode} · Max {currentPrompt.marks} Marks · Target {currentPrompt.wordLimit} Words
              </p>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                {language === 'hi'
                  ? selectedPaper.titleHi
                  : language === 'gu'
                  ? selectedPaper.titleGu
                  : selectedPaper.titleEn}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-semibold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{formatCountdown(secondsElapsed)}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaper(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                All Papers
              </button>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Question Directive · {currentPrompt.topic}
            </div>
            <p className="text-base font-medium text-slate-900 dark:text-white leading-relaxed">
              {promptText}
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="mains-answer-box" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Descriptive Answer Sheet ({language.toUpperCase()})
              </label>
              <span
                className={`font-mono text-xs font-semibold tabular-nums ${
                  wordCount > currentPrompt.wordLimit + 40
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {wordCount} / {currentPrompt.wordLimit} words
              </span>
            </div>
            <textarea
              id="mains-answer-box"
              rows={10}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Structure your answer with a crisp constitutional/contextual Introduction, sub-headed Body arguments with examples, and a balanced Way Forward..."
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0B1E3D] dark:focus:ring-amber-400"
            />
          </div>

          {/* PDF / Handwritten Image Upload */}
          <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-slate-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Upload Handwritten Answer Image or PDF (Optional)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {attachment ? `Attached: ${attachment.name}` : 'Supports PNG, JPG, or PDF up to 6 MB for AI vision evaluation'}
                </div>
              </div>
            </div>
            <label className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
              <span>Choose File</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {evalError && (
            <div className="mt-4 p-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{evalError}</span>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t(language, 'aiEstimateBadge')}
            </span>
            <button
              type="button"
              disabled={evaluating}
              onClick={handleEvaluate}
              className="px-6 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {evaluating ? 'Evaluating Rubric with AI...' : 'Submit for Rubric Evaluation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAINS DASHBOARD (ALL 9 PAPERS + OPTIONAL SELECTION + HISTORY)
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Stage 2 · Main Examination Answer Writing Engine
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {t(language, 'mainsPrep')} (All 9 Official Papers)
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="mains-optional" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Optional Subject:
          </label>
          <select
            id="mains-optional"
            value={profile.optionalSubject}
            onChange={(e) => onUpdateOptional(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            {OPTIONAL_SUBJECTS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SEED_MAINS_PAPERS.map((paper) => (
          <div
            key={paper.paperCode}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold">{paper.paperCode}</span>
                <span className="font-mono tabular-nums">{paper.maxMarks} Marks · 3 Hrs</span>
              </div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-2">
                {language === 'hi' ? paper.titleHi : language === 'gu' ? paper.titleGu : paper.titleEn}
              </h2>
              {paper.isQualifying && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {paper.qualifyingNote}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                {language === 'hi'
                  ? paper.samplePrompts[0]?.promptHi
                  : language === 'gu'
                  ? paper.samplePrompts[0]?.promptGu
                  : paper.samplePrompts[0]?.promptEn}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPaper(paper)}
              className="mt-4 w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0B1E3D] hover:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open Answer Editor</span>
            </button>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
            Recent Evaluated Mains Attempts
          </h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-500">
                    {item.paperCode} · {item.wordCount} words
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate mt-0.5">
                    {item.promptText}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-sm font-bold text-[#0B1E3D] dark:text-amber-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {item.overallScore}/{item.maxMarks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
