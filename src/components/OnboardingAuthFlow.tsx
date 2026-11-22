import React, { useState } from 'react';
import { ArrowRight, Check, Globe, ShieldCheck, Sun, Moon } from 'lucide-react';
import { LANGUAGE_LABELS, SupportedLanguage, t } from '../i18n/translations.ts';
import { OPTIONAL_SUBJECTS } from '../data/upscSeed.ts';
import type { StudentProfile } from '../types/app.ts';

interface OnboardingAuthFlowProps {
  step: 'splash' | 'onboarding' | 'auth';
  language: SupportedLanguage;
  darkMode: boolean;
  onToggleDark: () => void;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  onAdvanceStep: (next: 'splash' | 'onboarding' | 'auth') => void;
  onGoogleSignIn: () => Promise<void>;
  onCompleteDemoSetup: (profile: StudentProfile) => void;
  authLoading: boolean;
  authError: string | null;
  initialProfile: StudentProfile;
}

const STAGES = [
  {
    code: '01',
    title: 'Preliminary Examination (GS I & CSAT II)',
    desc: 'Timed full-screen simulation with official 1/3rd negative marking, question palette states, and 33% CSAT qualifying validation.',
  },
  {
    code: '02',
    title: 'Main Examination (All 9 Official Papers)',
    desc: 'Structured Essay, GS I–IV, Optional, and Qualifying language editors with word counters, PDF/handwritten uploads, and rubric feedback.',
  },
  {
    code: '03',
    title: 'Personality Test (AI Interview Board)',
    desc: 'Voice-enabled DAF, current affairs, and ethical dilemma questioning with multi-dimensional practice scoring out of 275.',
  },
];

export const OnboardingAuthFlow: React.FC<OnboardingAuthFlowProps> = ({
  step,
  language,
  darkMode,
  onToggleDark,
  onChangeLanguage,
  onAdvanceStep,
  onGoogleSignIn,
  onCompleteDemoSetup,
  authLoading,
  authError,
  initialProfile,
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [form, setForm] = useState<StudentProfile>(initialProfile);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setValidationMsg('Please enter your full name and email address.');
      return;
    }
    setValidationMsg(null);
    onCompleteDemoSetup({ ...form, preferredLanguage: language });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/upsc_emblem_crest_1795376372849.jpg"
              alt="UPSC ELITE Crest"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-cover border border-amber-600/30"
            />
            <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
              UPSC ELITE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['en', 'hi', 'gu'] as SupportedLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLanguage(code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    language === code
                      ? 'bg-[#0B1E3D] text-white dark:bg-amber-500 dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {LANGUAGE_LABELS[code].nativeName}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onToggleDark}
              aria-label={darkMode ? t(language, 'themeLight') : t(language, 'themeDark')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {step === 'splash' && (
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-amber-700 dark:text-amber-400 mb-3">
                  National Civil Services Preparation · English · हिन्दी · ગુજરાતી
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  {t(language, 'tagline')}
                </h1>
                <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  An authentic, disciplined UPSC Civil Services simulator covering Prelims (GS I & CSAT II), all 9 Mains papers, and a voice-enabled Personality Test board.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-mono text-xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">1/3rd</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official Negative Marking</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">9 Papers</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full Mains Evaluation</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">275 Marks</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Personality Test Rubric</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAdvanceStep('onboarding')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t(language, 'getStarted')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onCompleteDemoSetup({ ...form, preferredLanguage: language })}
                  className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium text-sm transition-colors whitespace-nowrap shrink-0"
                >
                  {t(language, 'enterDemo')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0B1E3D] relative min-h-[320px]">
              <img
                src="/src/assets/images/hero_parliament_architecture_1795376372918.jpg"
                alt="Indian institutional colonnade architecture"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E3D]/90 via-[#0B1E3D]/25 to-transparent flex flex-col justify-end p-6">
                <p className="text-xs text-amber-300 font-medium">Three-Stage Examination Engine</p>
                <p className="text-white font-display text-lg font-semibold mt-1">
                  Built for rigorous aspirants across India.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'onboarding' && (
          <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  Orientation · Stage {stageIndex + 1} of {STAGES.length}
                </p>
                <h2 className="font-display text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                  {STAGES[stageIndex].title}
                </h2>
              </div>
              <Globe className="w-6 h-6 text-[#0B1E3D] dark:text-amber-400 shrink-0" />
            </div>

            <p className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed">
              {STAGES[stageIndex].desc}
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                {t(language, 'languageLabel')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['en', 'hi', 'gu'] as SupportedLanguage[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onChangeLanguage(code)}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      language === code
                        ? 'border-[#0B1E3D] bg-[#0B1E3D]/5 dark:border-amber-400 dark:bg-amber-400/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {LANGUAGE_LABELS[code].nativeName}
                      </span>
                      {language === code && <Check className="w-4 h-4 text-[#0B1E3D] dark:text-amber-400" />}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {LANGUAGE_LABELS[code].scriptNote}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {STAGES.map((s, idx) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setStageIndex(idx)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
                      idx === stageIndex
                        ? 'bg-[#0B1E3D] text-white border-[#0B1E3D] dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {s.code}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {stageIndex < STAGES.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStageIndex((i) => i + 1)}
                    className="px-5 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    {t(language, 'next')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAdvanceStep('auth')}
                    className="px-5 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    Continue to Aspirant Sign-In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'auth' && (
          <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[#0B1E3D] text-white rounded-2xl p-8 flex flex-col justify-between border border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PostgreSQL & Firebase Verified</span>
                </div>
                <h2 className="font-display text-2xl font-bold mt-4 [text-wrap:balance]">
                  Aspirant Account & Profile Setup
                </h2>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Sign in with Google to persist Prelims attempts, Mains rubric evaluations, Interview transcripts, and All-India rankings directly to your PostgreSQL record.
                </p>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={onGoogleSignIn}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>{authLoading ? 'Signing in...' : t(language, 'signInGoogle')}</span>
                </button>

                {authError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-950/70 border border-red-400/40 text-xs text-red-200">
                    {authError}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/15 text-xs text-slate-300">
                We collect only essential preparation preferences (optional subject, target year, medium). No sensitive personal documents are requested.
              </div>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit mb-6">
                <button
                  type="button"
                  onClick={() => setAuthTab('signin')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    authTab === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Quick Aspirant Setup (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    authTab === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Registration Details
                </button>
              </div>

              <form onSubmit={handleSubmitProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      placeholder="Aarav Sharma"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      placeholder="aspirant@example.in"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-mobile" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Mobile Number (Optional)
                    </label>
                    <input
                      id="reg-mobile"
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      placeholder="+91 98XXXXXX10"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-level" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Preparation Level
                    </label>
                    <select
                      id="reg-level"
                      value={form.prepLevel}
                      onChange={(e) => setForm({ ...form, prepLevel: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                      <option value="foundation">Foundation (First Attempt)</option>
                      <option value="intermediate">Intermediate (Prelims Cleared)</option>
                      <option value="veteran">Mains / Interview Veteran</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="reg-optional" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Optional Subject
                    </label>
                    <select
                      id="reg-optional"
                      value={form.optionalSubject}
                      onChange={(e) => setForm({ ...form, optionalSubject: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                      {OPTIONAL_SUBJECTS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-year" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Target Year
                    </label>
                    <select
                      id="reg-year"
                      value={form.targetYear}
                      onChange={(e) => setForm({ ...form, targetYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                    >
                      <option value={2027}>2027</option>
                      <option value={2028}>2028</option>
                      <option value={2029}>2029</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-hours" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Daily Hours
                    </label>
                    <input
                      id="reg-hours"
                      type="number"
                      min={1}
                      max={16}
                      value={form.dailyStudyHours}
                      onChange={(e) => setForm({ ...form, dailyStudyHours: Number(e.target.value) || 6 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                    />
                  </div>
                </div>

                {validationMsg && (
                  <p className="text-xs text-red-600 dark:text-red-400">{validationMsg}</p>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    {t(language, 'skipToDashboard')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
