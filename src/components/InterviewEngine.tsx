import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  Mic,
  MicOff,
  Send,
  Volume2,
} from 'lucide-react';
import { SupportedLanguage, t } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type {
  InterviewReport,
  InterviewSessionRecord,
  InterviewTurn,
  StudentProfile,
} from '../types/app.ts';

interface InterviewEngineProps {
  language: SupportedLanguage;
  profile: StudentProfile;
  history: InterviewSessionRecord[];
  onSessionCompleted: () => void;
  onUpdateDaf: (daf: StudentProfile['dafSummary']) => void;
}

export const InterviewEngine: React.FC<InterviewEngineProps> = ({
  language,
  profile,
  history,
  onSessionCompleted,
  onUpdateDaf,
}) => {
  const [daf, setDaf] = useState({
    homeState: profile.homeState || 'Gujarat',
    optionalSubject: profile.optionalSubject || 'PSIR',
    graduationStream: profile.dafSummary?.graduationStream || 'B.Tech / Economics',
    hobbies: profile.dafSummary?.hobbies || 'Constitutional history, Long-distance running',
    servicePreference: profile.dafSummary?.servicePreference || 'IAS · IFS · IPS',
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [transcript, setTranscript] = useState<InterviewTurn[]>([]);
  const [candidateInput, setCandidateInput] = useState('');
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playBoardVoice = async (text: string) => {
    setPlayingAudio(true);
    try {
      const res = await api.synthesizeTts(text);
      const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
      audio.onended = () => setPlayingAudio(false);
      await audio.play();
    } catch {
      setPlayingAudio(false);
      // Graceful browser speech synthesis fallback if audio playback blocked
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const startSession = async () => {
    onUpdateDaf(daf);
    setSessionActive(true);
    setReport(null);
    setErrorMsg(null);
    setLoadingTurn(true);
    try {
      const turn = (await api.interviewTurn({
        dafSummary: daf,
        transcript: [],
        language,
      })) as { boardQuestion: string; category: string };

      const firstTurn: InterviewTurn = {
        role: 'board',
        text: turn.boardQuestion,
        category: turn.category,
        timestamp: new Date().toISOString(),
      };
      setTranscript([firstTurn]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not start interview board.');
      setSessionActive(false);
    } finally {
      setLoadingTurn(false);
    }
  };

  const sendCandidateResponse = async (textOverride?: string) => {
    const text = (textOverride ?? candidateInput).trim();
    if (!text || loadingTurn) return;

    const candidateEntry: InterviewTurn = {
      role: 'candidate',
      text,
      timestamp: new Date().toISOString(),
    };
    const nextTranscript = [...transcript, candidateEntry];
    setTranscript(nextTranscript);
    setCandidateInput('');
    setLoadingTurn(true);
    setErrorMsg(null);

    try {
      const turn = (await api.interviewTurn({
        dafSummary: daf,
        transcript: nextTranscript,
        language,
      })) as { boardQuestion: string; category: string };

      const boardEntry: InterviewTurn = {
        role: 'board',
        text: turn.boardQuestion,
        category: turn.category,
        timestamp: new Date().toISOString(),
      };
      setTranscript([...nextTranscript, boardEntry]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Board response failed.');
    } finally {
      setLoadingTurn(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = String(reader.result || '');
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          try {
            setLoadingTurn(true);
            const res = await api.transcribeAudio(base64, blob.type || 'audio/webm');
            if (res.transcript) {
              setCandidateInput(res.transcript);
            }
          } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Speech transcription failed.');
          } finally {
            setLoadingTurn(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setErrorMsg('Microphone access denied or unavailable. You can type your response directly below.');
    }
  };

  const finishAndEvaluate = async () => {
    if (transcript.length === 0) return;
    setLoadingTurn(true);
    setErrorMsg(null);
    try {
      const res = (await api.interviewReport({
        dafSummary: daf,
        transcript,
        language,
      })) as { report: InterviewReport };
      setReport(res.report);
      setSessionActive(false);
      onSessionCompleted();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not evaluate interview session.');
    } finally {
      setLoadingTurn(false);
    }
  };

  // FINAL 275-MARK INTERVIEW REPORT
  if (report) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t(language, 'interviewDisclaimer')}
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Personality Test Practice Report
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Practice Assessment</div>
            <div className="font-mono text-3xl font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
              {report.practiceScoreOutOf275} / 275
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {report.overallSummary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.dimensions.map((dim) => (
            <div
              key={dim.name}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{dim.name}</span>
                <span className="font-mono text-sm font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                  {dim.score} / {dim.max}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {dim.feedback}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setReport(null);
            setTranscript([]);
          }}
          className="px-5 py-2.5 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm"
        >
          Start New Interview Session
        </button>
      </div>
    );
  }

  // VOICE & TEXT BOARDROOM
  if (sessionActive) {
    const latestBoardTurn = [...transcript].reverse().find((m) => m.role === 'board');

    return (
      <div className="space-y-6">
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="h-44 relative">
            <img
              src="/src/assets/images/interview_board_room_1795376372937.jpg"
              alt="UPSC Personality Test Boardroom"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent p-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-amber-300 font-medium">
                  UPSC Personality Test Simulator · {daf.optionalSubject} · {daf.homeState}
                </p>
                <h1 className="font-display text-xl font-bold text-white mt-0.5">
                  Dholpur House Mock Interview Board
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {latestBoardTurn && (
                  <button
                    type="button"
                    disabled={playingAudio}
                    onClick={() => playBoardVoice(latestBoardTurn.text)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{playingAudio ? 'Speaking...' : 'Listen Board'}</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={loadingTurn || transcript.length < 2}
                  onClick={finishAndEvaluate}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold disabled:opacity-50"
                >
                  End & Evaluate (/275)
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto">
            {transcript.map((turn, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  turn.role === 'board'
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 mr-8'
                    : 'bg-[#0B1E3D]/5 dark:bg-amber-500/10 border-[#0B1E3D]/20 dark:border-amber-500/30 ml-8'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {turn.role === 'board' ? `Board Chairperson${turn.category ? ` · ${turn.category}` : ''}` : 'Candidate Response'}
                </div>
                <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">{turn.text}</p>
              </div>
            ))}
            {loadingTurn && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Board is formulating next question...</p>
            )}
          </div>

          {errorMsg && (
            <div className="mx-6 mb-4 p-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleRecording}
              aria-label={recording ? 'Stop voice recording' : 'Record voice response'}
              className={`p-3 rounded-xl border transition-colors shrink-0 ${
                recording
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void sendCandidateResponse();
              }}
              placeholder={recording ? 'Listening... click mic to transcribe' : 'Type or speak your response to the Board...'}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
            <button
              type="button"
              disabled={loadingTurn || !candidateInput.trim()}
              onClick={() => sendCandidateResponse()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B1E3D] dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-semibold disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Respond</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INTERVIEW DASHBOARD & DAF SETUP
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Stage 3 · Detailed Application Form (DAF) & Board Simulator
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {t(language, 'aiInterview')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t(language, 'interviewDisclaimer')}
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="daf-state" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Home State
              </label>
              <input
                id="daf-state"
                type="text"
                value={daf.homeState}
                onChange={(e) => setDaf({ ...daf, homeState: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label htmlFor="daf-grad" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Graduation Background
              </label>
              <input
                id="daf-grad"
                type="text"
                value={daf.graduationStream}
                onChange={(e) => setDaf({ ...daf, graduationStream: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="daf-hobbies" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              DAF Hobbies & Extra-Curricular Interests
            </label>
            <input
              id="daf-hobbies"
              type="text"
              value={daf.hobbies}
              onChange={(e) => setDaf({ ...daf, hobbies: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label htmlFor="daf-service" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Service Preference Order
            </label>
            <input
              id="daf-service"
              type="text"
              value={daf.servicePreference}
              onChange={(e) => setDaf({ ...daf, servicePreference: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={loadingTurn}
            onClick={startSession}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0B1E3D] hover:bg-[#132C56] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors"
          >
            {loadingTurn ? 'Convening Interview Board...' : 'Enter Personality Test Room'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <img
            src="/src/assets/images/interview_board_room_1795376372937.jpg"
            alt="UPSC Interview Boardroom"
            referrerPolicy="no-referrer"
            className="h-52 w-full object-cover"
          />
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1E3D] dark:text-amber-400">
              <Award className="w-4 h-4" />
              <span>7-Dimension Evaluation Framework (/275 Marks)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Assesses Clarity, Communication, Logical Reasoning, Balanced Judgement, Relevance, Confidence Indicators, and Quality of Responses across voice and text turns.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Past AI Interview Board Sessions
            </h2>
            <div className="space-y-2.5">
              {history.slice(0, 4).map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">
                      {new Date(sess.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <span className="font-mono font-bold text-[#0B1E3D] dark:text-amber-400 tabular-nums">
                      {sess.practiceScore} / {sess.maxScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">
                    {sess.evaluationReport.overallSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
