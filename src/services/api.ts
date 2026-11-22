import { auth } from '../lib/firebase.ts';

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch {
      // Ignore if token refresh fails
    }
  }
  return headers;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getCatalog: () => requestJson('/api/catalog'),
  getRecords: () => requestJson('/api/records'),
  refreshCurrentAffairs: (language: string) =>
    requestJson('/api/current-affairs/refresh', {
      method: 'POST',
      body: JSON.stringify({ language }),
    }),
  getMe: () => requestJson('/api/auth/me'),
  updateProfile: (payload: Record<string, unknown>) =>
    requestJson('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  submitPrelims: (payload: Record<string, unknown>) =>
    requestJson('/api/exams/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getLeaderboard: (examId?: string, state?: string) => {
    const qs = new URLSearchParams();
    if (examId) qs.set('examId', examId);
    if (state) qs.set('state', state);
    return requestJson(`/api/leaderboard?${qs.toString()}`);
  },
  generateQuestion: (payload: Record<string, unknown>) =>
    requestJson('/api/ai/generate-question', { method: 'POST', body: JSON.stringify(payload) }),
  evaluateMains: (payload: Record<string, unknown>) =>
    requestJson('/api/mains/evaluate', { method: 'POST', body: JSON.stringify(payload) }),
  interviewTurn: (payload: Record<string, unknown>) =>
    requestJson('/api/interview/turn', { method: 'POST', body: JSON.stringify(payload) }),
  interviewReport: (payload: Record<string, unknown>) =>
    requestJson('/api/interview/report', { method: 'POST', body: JSON.stringify(payload) }),
  synthesizeTts: (text: string) =>
    requestJson<{ audioBase64: string; mimeType: string }>('/api/ai/tts', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  transcribeAudio: (audioBase64: string, mimeType: string) =>
    requestJson<{ transcript: string }>('/api/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, mimeType }),
    }),
  toggleBookmark: (payload: Record<string, unknown>) =>
    requestJson('/api/bookmarks/toggle', { method: 'POST', body: JSON.stringify(payload) }),
  saveStudyTask: (payload: Record<string, unknown>) =>
    requestJson('/api/study-plans', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminOverview: () => requestJson('/api/admin/overview'),
  reviewQuestion: (id: string, decision: 'approved' | 'rejected', notes?: string) =>
    requestJson(`/api/admin/questions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),
  publishRuleVersion: (payload: Record<string, unknown>) =>
    requestJson('/api/admin/rules', { method: 'POST', body: JSON.stringify(payload) }),
};
