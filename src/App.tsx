import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Award,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  FileText,
  History,
  Home,
  LogOut,
  Mic,
  Moon,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { AnalyticsLeaderboardHub } from './components/AnalyticsLeaderboardHub.tsx';
import { HomeDashboard } from './components/HomeDashboard.tsx';
import { InterviewEngine } from './components/InterviewEngine.tsx';
import { MainsEngine } from './components/MainsEngine.tsx';
import { OnboardingAuthFlow } from './components/OnboardingAuthFlow.tsx';
import { PracticeKnowledgeHub } from './components/PracticeKnowledgeHub.tsx';
import { PrelimsExamEngine } from './components/PrelimsExamEngine.tsx';
import { LANGUAGE_LABELS, SupportedLanguage, t } from './i18n/translations.ts';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { api } from './services/api.ts';
import type {
  BookmarkItem,
  CatalogData,
  CatalogExam,
  CatalogQuestion,
  ExamResultSummary,
  InterviewSessionRecord,
  MainsEvalRecord,
  NotificationItem,
  PastRecordsPayload,
  ScreenId,
  StudentProfile,
  StudyTask,
} from './types/app.ts';

const DEFAULT_PROFILE: StudentProfile = {
  fullName: 'Open Aspirant Session',
  email: 'aspirant@upsc-elite.in',
  mobileNumber: '',
  preferredLanguage: 'en',
  prepLevel: 'foundation',
  optionalSubject: 'Political Science & International Relations (PSIR)',
  targetYear: 2027,
  dailyStudyHours: 6,
  homeState: 'Delhi',
  leaderboardOptOut: false,
  streakDays: 3,
  dafSummary: {},
};

const INITIAL_STUDY_TASKS: StudyTask[] = [
  {
    id: 'st-1',
    dayLabel: 'Today',
    taskTitle: 'Indian Polity · Fundamental Rights & Writ Jurisdiction (Art. 32/226)',
    subjectSlug: 'polity',
    plannedMinutes: 90,
    isCompleted: true,
  },
  {
    id: 'st-2',
    dayLabel: 'Today',
    taskTitle: 'RBI Monetary Policy & OMO Transmission Drill',
    subjectSlug: 'economy',
    plannedMinutes: 60,
    isCompleted: false,
  },
  {
    id: 'st-3',
    dayLabel: 'Today',
    taskTitle: 'Write 2 GS II Mains Answers (250 words each)',
    subjectSlug: 'polity',
    plannedMinutes: 45,
    isCompleted: false,
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'mock_alert',
    title: 'UPSC CSE Prelims GS Paper I, CSAT Paper II & 2018–2024 PYQ Archive Live',
    body: 'Practice under official 1/3rd negative marking and 33% CSAT qualifying rules — 100% free with PostgreSQL record saving.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    category: 'current_affairs',
    title: 'Real-Time Current Affairs Grounding Active',
    body: 'Fetch live UPSC current affairs briefs anytime in English, हिन्दी, and ગુજરાતી directly from verified sources.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

function formatIstTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export default function App() {
  // Real live application start: enter directly into the live examination workspace
  const [screen, setScreen] = useState<ScreenId>('home');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [istTime, setIstTime] = useState(() => formatIstTime(new Date()));

  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [results, setResults] = useState<ExamResultSummary[]>([]);
  const [activeResult, setActiveResult] = useState<ExamResultSummary | null>(null);
  const [mainsHistory, setMainsHistory] = useState<MainsEvalRecord[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<InterviewSessionRecord[]>([]);
  const [platformTotals, setPlatformTotals] = useState<PastRecordsPayload['platformTotals']>({
    prelimsAttempts: 0,
    mainsEvaluations: 0,
    interviewSessions: 0,
    approvedQuestions: 0,
    pyqCount: 0,
  });

  const [studyTasks, setStudyTasks] = useState<StudyTask[]>(INITIAL_STUDY_TASKS);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [notifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [liveExamSession, setLiveExamSession] = useState<{
    exam: CatalogExam;
    questions: CatalogQuestion[];
    durationSeconds: number;
  } | null>(null);

  // Sync Tailwind v4 `.dark` class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Live IST clock tick every second
  useEffect(() => {
    const id = window.setInterval(() => {
      setIstTime(formatIstTime(new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const loadCatalog = async () => {
    try {
      const data = (await api.getCatalog()) as CatalogData;
      setCatalog(data);
      setCatalogError(null);
    } catch (err: unknown) {
      setCatalogError(err instanceof Error ? err.message : 'Unable to load examination catalog.');
    }
  };

  const loadRecords = async () => {
    try {
      const rec = (await api.getRecords()) as PastRecordsPayload;
      if (Array.isArray(rec.prelimsResults)) setResults(rec.prelimsResults);
      if (Array.isArray(rec.mainsSubmissions)) setMainsHistory(rec.mainsSubmissions);
      if (Array.isArray(rec.interviewSessions)) setInterviewHistory(rec.interviewSessions);
      if (rec.platformTotals) setPlatformTotals(rec.platformTotals);
    } catch {
      // Keep current in-memory records if transient network issue occurs
    }
  };

  useEffect(() => {
    void loadCatalog();
    void loadRecords();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsSignedIn(true);
        try {
          const me = (await api.getMe()) as {
            profile?: StudentProfile;
            adminRole?: string | null;
            bookmarks?: BookmarkItem[];
            studyPlans?: StudyTask[];
          };
          if (me.profile) {
            setProfile(me.profile);
            if (['en', 'hi', 'gu'].includes(me.profile.preferredLanguage)) {
              setLanguage(me.profile.preferredLanguage);
            }
          }
          setAdminRole(me.adminRole || null);
          if (me.bookmarks) setBookmarks(me.bookmarks);
          if (me.studyPlans && me.studyPlans.length > 0) setStudyTasks(me.studyPlans);
          await loadRecords();
          setScreen((prev) => (prev === 'splash' || prev === 'onboarding' || prev === 'auth' ? 'home' : prev));
        } catch {
          // Keep session active even if profile sync encounters transient error
        }
      } else {
        setIsSignedIn(false);
        setAdminRole(null);
        await loadRecords();
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSignedIn) {
      await signOut(auth);
      setProfile(DEFAULT_PROFILE);
    } else {
      setScreen('auth');
    }
  };

  const handleChangeLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setProfile((p) => ({ ...p, preferredLanguage: lang }));
    if (isSignedIn) {
      void api.updateProfile({ preferredLanguage: lang }).catch(() => {});
    }
  };

  const handleSaveProfile = async (next: StudentProfile) => {
    setProfile(next);
    if (isSignedIn) {
      await api.updateProfile({
        fullName: next.fullName,
        homeState: next.homeState,
        optionalSubject: next.optionalSubject,
        targetYear: next.targetYear,
        dailyStudyHours: next.dailyStudyHours,
        leaderboardOptOut: next.leaderboardOptOut,
        preferredLanguage: language,
      });
    }
  };

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.itemId)), [bookmarks]);

  const handleToggleBookmark = async (item: {
    itemType: string;
    itemId: string;
    title: string;
    subtitle: string;
  }) => {
    if (isSignedIn) {
      try {
        await api.toggleBookmark(item);
      } catch {
        // Update local state optimistically
      }
    }
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.itemId === item.itemId);
      if (exists) return prev.filter((b) => b.itemId !== item.itemId);
      return [{ id: `bm-${Date.now()}`, ...item }, ...prev];
    });
  };

  const handleToggleStudyTask = async (taskId: string) => {
    const target = studyTasks.find((item) => item.id === taskId);
    const nextVal = target ? !target.isCompleted : true;
    setStudyTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, isCompleted: nextVal } : item))
    );
    if (isSignedIn && target && !taskId.startsWith('st-')) {
      void api.saveStudyTask({ id: taskId, isCompleted: nextVal }).catch(() => {});
    }
  };

  const handleAddStudyTask = async (title: string, mins: number) => {
    const newTask: StudyTask = {
      id: `st-${Date.now()}`,
      dayLabel: 'Today',
      taskTitle: title,
      subjectSlug: 'polity',
      plannedMinutes: mins,
      isCompleted: false,
    };
    if (isSignedIn) {
      try {
        const res = (await api.saveStudyTask({
          dayLabel: 'Today',
          taskTitle: title,
          plannedMinutes: mins,
        })) as { task?: StudyTask };
        if (res.task) {
          setStudyTasks((prev) => [...prev, res.task!]);
          return;
        }
      } catch {
        // fallback below
      }
    }
    setStudyTasks((prev) => [...prev, newTask]);
  };

  const startExamSession = (exam: CatalogExam, questions: CatalogQuestion[], durationMinutes: number) => {
    setLiveExamSession({
      exam,
      questions,
      durationSeconds: durationMinutes * 60,
    });
    setScreen('prelims_live');
  };

  // Optional Account Switch / Auth Screens (only entered on user click)
  if (screen === 'splash' || screen === 'onboarding' || screen === 'auth') {
    return (
      <OnboardingAuthFlow
        step={screen}
        language={language}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        onChangeLanguage={handleChangeLanguage}
        onAdvanceStep={(next) => setScreen(next)}
        onGoogleSignIn={handleGoogleSignIn}
        onCompleteDemoSetup={(demoProfile) => {
          setProfile(demoProfile);
          setScreen('home');
        }}
        authLoading={authLoading}
        authError={authError}
        initialProfile={profile}
      />
    );
  }

  // Full-screen Prelims CBT mode (distraction-free real exam hall)
  if (screen === 'prelims_live' && catalog && liveExamSession) {
    return (
      <PrelimsExamEngine
        language={language}
        onChangeLanguage={handleChangeLanguage}
        istTime={istTime}
        catalog={catalog}
        activeResult={activeResult}
        pastResults={results}
        bookmarkedIds={bookmarkedIds}
        onToggleBookmark={(q) => {
          const tr = q.translations[language] || q.translations.en;
          void handleToggleBookmark({
            itemType: 'question',
            itemId: q.id,
            title: q.topicName,
            subtitle: tr.questionText.slice(0, 90),
          });
        }}
        onStartLiveSession={startExamSession}
        onFinishResult={(res) => {
          setResults((prev) => [res, ...prev]);
          setActiveResult(res);
          setLiveExamSession(null);
          setScreen('prelims_result');
          void loadRecords();
        }}
        onOpenPastResult={(res) => {
          setActiveResult(res);
          setScreen('prelims_result');
        }}
        onBackToExams={() => {
          setLiveExamSession(null);
          setScreen('exams');
        }}
        liveSession={liveExamSession}
        mode="live"
      />
    );
  }

  const navGroups: Array<{ id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: t(language, 'navHome'), icon: Home },
    { id: 'practice', label: t(language, 'navPractice'), icon: BookOpen },
    { id: 'exams', label: t(language, 'navExams'), icon: ClipboardCheck },
    { id: 'records', label: t(language, 'navRecords'), icon: History },
    { id: 'mains', label: t(language, 'navMains'), icon: FileText },
    { id: 'interview', label: t(language, 'navInterview'), icon: Mic },
    { id: 'ranking', label: t(language, 'navRanking'), icon: Award },
    { id: 'analytics', label: t(language, 'navAnalytics'), icon: BarChart3 },
    { id: 'planner', label: t(language, 'navPlanner'), icon: Calendar },
    { id: 'bookmarks', label: t(language, 'navBookmarks'), icon: Bookmark },
    { id: 'notifications', label: t(language, 'navAlerts'), icon: Bell },
    { id: 'profile', label: t(language, 'navProfile'), icon: User },
    { id: 'admin', label: t(language, 'navAdmin'), icon: Shield },
  ];

  const mobileBottomNav: Array<{ id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: t(language, 'navHome'), icon: Home },
    { id: 'exams', label: t(language, 'navExams'), icon: ClipboardCheck },
    { id: 'records', label: t(language, 'navRecords'), icon: History },
    { id: 'practice', label: t(language, 'navPractice'), icon: BookOpen },
    { id: 'profile', label: t(language, 'navProfile'), icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex w-64 shrink-0 flex-col bg-[#0B1E3D] text-white border-r border-slate-800 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <img
            src="/src/assets/images/upsc_emblem_crest_1795376372849.jpg"
            alt="UPSC ELITE Crest"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover border border-amber-400/40"
          />
          <div className="min-w-0">
            <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap block">
              UPSC ELITE
            </span>
            <span className="text-[11px] text-amber-300 font-medium block truncate">
              {t(language, 'freeAccessBadge')}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {navGroups.map((item) => {
            const Icon = item.icon;
            const active =
              screen === item.id || (screen === 'prelims_result' && item.id === 'exams');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScreen(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs">
          <div className="font-semibold text-white truncate">{profile.fullName}</div>
          <div className="text-slate-400 truncate mt-0.5">
            {isSignedIn ? profile.email : 'Free Live Open Workspace'}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-medium flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSignedIn ? 'Sign Out' : 'Account Options'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
        {/* Top Bar (3-zone contract) */}
        <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="lg:hidden font-display text-sm sm:text-base font-bold text-[#0B1E3D] dark:text-amber-400 whitespace-nowrap shrink-0">
                <span className="sm:hidden">UPSC</span>
                <span className="hidden sm:inline">UPSC ELITE</span>
              </span>
              <span className="hidden lg:inline text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {navGroups.find((n) => n.id === screen)?.label || t(language, 'prelimsResultTitle')}
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums pl-2 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span data-testid="ist-clock">{istTime} IST</span>
              </span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              {(['en', 'hi', 'gu'] as SupportedLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleChangeLanguage(code)}
                  aria-label={LANGUAGE_LABELS[code].nativeName}
                  className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    language === code
                      ? 'bg-[#0B1E3D] text-white dark:bg-amber-500 dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="sm:hidden">{LANGUAGE_LABELS[code].shortName}</span>
                  <span className="hidden sm:inline">{LANGUAGE_LABELS[code].nativeName}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                aria-label={darkMode ? t(language, 'themeLight') : t(language, 'themeDark')}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {!isSignedIn && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  aria-label={t(language, 'signInGoogle')}
                  className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <span className="sm:hidden">{t(language, 'signInShort')}</span>
                  <span className="hidden sm:inline">{t(language, 'signInGoogle')}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
          {catalogError && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {catalogError}
            </div>
          )}

          {!catalog ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading live UPSC ELITE examination catalog and past records...
            </div>
          ) : (
            <>
              {screen === 'home' && (
                <HomeDashboard
                  language={language}
                  profile={profile}
                  catalog={catalog}
                  recentResults={results}
                  mainsHistory={mainsHistory}
                  interviewHistory={interviewHistory}
                  platformTotals={platformTotals}
                  studyTasks={studyTasks}
                  onNavigate={(s) => setScreen(s)}
                  onOpenPastResult={(res) => {
                    setActiveResult(res);
                    setScreen('prelims_result');
                  }}
                  onRefreshCatalog={loadCatalog}
                  onLaunchDailyChallenge={() => {
                    const dailyQs = catalog.questions
                      .filter((q) => q.paperCode === 'GS_I')
                      .slice(0, 10);
                    startExamSession(
                      {
                        id: catalog.exams[0]?.id || 'daily-10',
                        slug: 'daily-10',
                        titleEn: 'Daily 10-Question UPSC Challenge',
                        titleHi: 'दैनिक 10-प्रश्न UPSC चुनौती',
                        titleGu: 'દૈનિક 10-પ્રશ્ન UPSC પડકાર',
                        paperType: 'GS_I',
                        ruleVersionId: null,
                        isDemo: true,
                      },
                      dailyQs,
                      15
                    );
                  }}
                  onToggleStudyTask={handleToggleStudyTask}
                />
              )}

              {(screen === 'exams' || screen === 'prelims_result') && (
                <PrelimsExamEngine
                  language={language}
                  onChangeLanguage={handleChangeLanguage}
                  istTime={istTime}
                  catalog={catalog}
                  activeResult={activeResult}
                  pastResults={results}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={(q) => {
                    const tr = q.translations[language] || q.translations.en;
                    void handleToggleBookmark({
                      itemType: 'question',
                      itemId: q.id,
                      title: q.topicName,
                      subtitle: tr.questionText.slice(0, 90),
                    });
                  }}
                  onStartLiveSession={startExamSession}
                  onFinishResult={(res) => {
                    setResults((prev) => [res, ...prev]);
                    setActiveResult(res);
                    setLiveExamSession(null);
                    setScreen('prelims_result');
                    void loadRecords();
                  }}
                  onOpenPastResult={(res) => {
                    setActiveResult(res);
                    setScreen('prelims_result');
                  }}
                  onBackToExams={() => setScreen('exams')}
                  liveSession={liveExamSession}
                  mode={screen === 'prelims_result' ? 'result' : 'hub'}
                />
              )}

              {screen === 'practice' && (
                <PracticeKnowledgeHub
                  language={language}
                  catalog={catalog}
                  streakDays={profile.streakDays}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  onStartCustomQuiz={startExamSession}
                  onRefreshCatalog={loadCatalog}
                />
              )}

              {screen === 'mains' && (
                <MainsEngine
                  language={language}
                  profile={profile}
                  onUpdateOptional={(subject) => {
                    const next = { ...profile, optionalSubject: subject };
                    void handleSaveProfile(next);
                  }}
                  history={mainsHistory}
                  onAddHistory={(rec) => {
                    setMainsHistory((prev) => [rec, ...prev]);
                    void loadRecords();
                  }}
                />
              )}

              {screen === 'interview' && (
                <InterviewEngine
                  language={language}
                  profile={profile}
                  history={interviewHistory}
                  onSessionCompleted={() => {
                    void loadRecords();
                  }}
                  onUpdateDaf={(daf) => {
                    const next = { ...profile, dafSummary: daf };
                    setProfile(next);
                    if (isSignedIn) void api.updateProfile({ dafSummary: daf }).catch(() => {});
                  }}
                />
              )}

              {(screen === 'ranking' ||
                screen === 'analytics' ||
                screen === 'planner' ||
                screen === 'bookmarks' ||
                screen === 'notifications' ||
                screen === 'records' ||
                screen === 'profile' ||
                screen === 'admin') && (
                <AnalyticsLeaderboardHub
                  screen={screen}
                  language={language}
                  darkMode={darkMode}
                  onToggleDark={() => setDarkMode((d) => !d)}
                  onChangeLanguage={handleChangeLanguage}
                  profile={profile}
                  onSaveProfile={handleSaveProfile}
                  catalog={catalog}
                  results={results}
                  mainsHistory={mainsHistory}
                  interviewHistory={interviewHistory}
                  platformTotals={platformTotals}
                  onOpenPastResult={(res) => {
                    setActiveResult(res);
                    setScreen('prelims_result');
                  }}
                  studyTasks={studyTasks}
                  onAddStudyTask={handleAddStudyTask}
                  onToggleStudyTask={handleToggleStudyTask}
                  bookmarks={bookmarks}
                  onRemoveBookmark={(id) =>
                    void handleToggleBookmark({
                      itemType: 'question',
                      itemId: id,
                      title: '',
                      subtitle: '',
                    })
                  }
                  notifications={notifications}
                  isSignedIn={isSignedIn}
                  adminRole={adminRole}
                  onNavigate={(s) => setScreen(s)}
                  onRefreshCatalog={loadCatalog}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile 5-Tab Bottom Navigation (<= 15% Sticky Cap) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 h-16"
      >
        {mobileBottomNav.map((item) => {
          const Icon = item.icon;
          const active =
            screen === item.id || (screen === 'prelims_result' && item.id === 'exams');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                active
                  ? 'text-[#0B1E3D] dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[68px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
