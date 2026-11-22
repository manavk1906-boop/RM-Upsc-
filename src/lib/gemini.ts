import { GoogleGenAI, Type } from '@google/genai';
import type { SupportedLanguage } from '../i18n/translations.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const LANGUAGE_NAME: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script, standard UPSC academic Hindi)',
  gu: 'Gujarati (Gujarati script, accurate administrative/academic Gujarati)',
};

export async function generateUpscQuestion(params: {
  subject: string;
  topic: string;
  difficulty: number;
  questionType: string;
  language: SupportedLanguage;
}) {
  const ai = getAiClient();
  const prompt = `Create one authentic UPSC Civil Services Prelims MCQ in ${LANGUAGE_NAME[params.language]}.
Subject: ${params.subject}
Topic: ${params.topic || 'Core UPSC Syllabus'}
Difficulty Level: ${params.difficulty}/5 (1=Foundation, 5=Expert Challenge)
Question Type: ${params.questionType}

Requirements:
- Follow UPSC CSE analytical standards (eliminate trivial facts; test conceptual clarity, constitutional provisions, or multi-statement reasoning).
- Do not fabricate fake statutes or court cases. Cite only verifiable standard references (Constitution Articles, NCERTs, Economic Survey, PIB, standard commissions).
- Provide 4 distinct options (A, B, C, D) and a rigorous explanation.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a senior UPSC CSE paper setter and subject matter expert. Ensure factual precision and faithful technical terminology in the requested language.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['key', 'text'],
            },
          },
          correctOption: { type: Type.STRING },
          explanation: { type: Type.STRING },
          topicName: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          citationText: { type: Type.STRING },
        },
        required: [
          'questionText',
          'options',
          'correctOption',
          'explanation',
          'topicName',
          'sourceTitle',
          'citationText',
        ],
      },
    },
  });

  const raw = (response.text || '').trim();
  if (!raw) throw new Error('Empty response from AI question generator.');
  return JSON.parse(raw);
}

export async function evaluateMainsAnswer(params: {
  paperCode: string;
  promptText: string;
  answerText: string;
  wordLimit: number;
  maxMarks: number;
  language: SupportedLanguage;
  attachmentBase64?: string;
  attachmentMime?: string;
}) {
  const ai = getAiClient();

  const textInstruction = `Evaluate this UPSC Civil Services Mains practice answer as an experienced UPSC mentor.
Paper: ${params.paperCode}
Max Marks for Question: ${params.maxMarks}
Target Word Limit: ${params.wordLimit} words
Language: ${LANGUAGE_NAME[params.language]}

Question:
${params.promptText}

Candidate Text Answer:
${params.answerText || '(See attached handwritten answer sheet / PDF document)'}

Evaluate strictly on these 6 rubric dimensions (each out of 10):
1. relevance (Relevance to directive & demand)
2. accuracy (Conceptual & constitutional/factual accuracy)
3. structure (Introduction, structured body, balanced conclusion)
4. examples (Relevant examples, data, committees, constitutional articles, or case studies)
5. balance (Balanced multi-dimensional arguments & way forward)
6. clarity (Clarity of expression and adherence to word limit)

Also provide:
- strengths: 3 concrete bullet points
- improvements: 3 actionable improvement points
- modelAnswer: a crisp high-scoring model answer outline in ${LANGUAGE_NAME[params.language]}
Clearly remember these marks are practice estimates only.`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (params.attachmentBase64 && params.attachmentMime) {
    parts.push({
      inlineData: {
        mimeType: params.attachmentMime,
        data: params.attachmentBase64,
      },
    });
  }
  parts.push({ text: textInstruction });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: { parts },
    config: {
      systemInstruction:
        'You are a senior UPSC Mains evaluator. Give constructive, balanced, strictly rubric-aligned feedback without inflating scores.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rubric: {
            type: Type.OBJECT,
            properties: {
              relevance: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, max: { type: Type.NUMBER }, note: { type: Type.STRING } },
                required: ['score', 'max', 'note'],
              },
              accuracy: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, max: { type: Type.NUMBER }, note: { type: Type.STRING } },
                required: ['score', 'max', 'note'],
              },
              structure: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, max: { type: Type.NUMBER }, note: { type: Type.STRING } },
                required: ['score', 'max', 'note'],
              },
              examples: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, max: { type: Type.NUMBER }, note: { type: Type.STRING } },
                required: ['score', 'max', 'note'],
              },
              balance: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, max: { type: Type.NUMBER }, note: { type: Type.STRING } },
                required: ['score', 'max', 'note'],
              },
              clarity: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, max: { type: Type.NUMBER }, note: { type: Type.STRING } },
                required: ['score', 'max', 'note'],
              },
            },
            required: ['relevance', 'accuracy', 'structure', 'examples', 'balance', 'clarity'],
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          modelAnswer: { type: Type.STRING },
        },
        required: ['rubric', 'strengths', 'improvements', 'modelAnswer'],
      },
    },
  });

  const raw = (response.text || '').trim();
  if (!raw) throw new Error('Empty evaluation returned by AI evaluator.');
  return JSON.parse(raw);
}

export async function generateInterviewTurn(params: {
  dafSummary: Record<string, string>;
  transcript: Array<{ role: 'board' | 'candidate'; text: string }>;
  language: SupportedLanguage;
}) {
  const ai = getAiClient();
  const historyText = params.transcript
    .map((m) => `${m.role === 'board' ? 'Board Member' : 'Candidate'}: ${m.text}`)
    .join('\n');

  const prompt = `Candidate DAF Summary:
- Home State: ${params.dafSummary.homeState || 'Not specified'}
- Optional Subject: ${params.dafSummary.optionalSubject || 'PSIR'}
- Graduation: ${params.dafSummary.graduationStream || 'Humanities / Engineering'}
- Hobbies / Interests: ${params.dafSummary.hobbies || 'Reading constitutional history'}
- Service Preference: ${params.dafSummary.servicePreference || 'IAS / IFS'}

Conversation so far:
${historyText || '(Start of interview — greet the candidate formally and ask the first DAF-linked opening question.)'}

Respond in ${LANGUAGE_NAME[params.language]}. Ask ONE concise, probing UPSC Personality Test board question (either DAF-based, current affairs, situational administrative dilemma, ethics-based, or a crisp follow-up to the candidate's last answer).`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are the Chairperson of a UPSC Civil Services Personality Test Board. Maintain calm dignity, neutrality, intellectual rigor, and courteous administrative tone.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          boardQuestion: { type: Type.STRING },
          category: { type: Type.STRING },
          briefObservation: { type: Type.STRING },
        },
        required: ['boardQuestion', 'category', 'briefObservation'],
      },
    },
  });

  const raw = (response.text || '').trim();
  if (!raw) throw new Error('Empty interview turn response.');
  return JSON.parse(raw);
}

export async function evaluateInterviewSession(params: {
  dafSummary: Record<string, string>;
  transcript: Array<{ role: 'board' | 'candidate'; text: string }>;
  language: SupportedLanguage;
}) {
  const ai = getAiClient();
  const historyText = params.transcript
    .map((m) => `${m.role === 'board' ? 'Board' : 'Candidate'}: ${m.text}`)
    .join('\n');

  const prompt = `Evaluate this UPSC Personality Test practice transcript.
Language: ${LANGUAGE_NAME[params.language]}
DAF: ${JSON.stringify(params.dafSummary)}
Transcript:
${historyText}

Score each of the 7 dimensions out of 40 (except Quality of Responses out of 35, so total max = 275):
1. Clarity (max 40)
2. Communication (max 40)
3. Logical Reasoning (max 40)
4. Balanced Judgement (max 40)
5. Relevance (max 40)
6. Confidence Indicators (max 40)
7. Quality of Responses (max 35)

Provide practiceScoreOutOf275 (sum of dimensions), detailed feedback per dimension, and an overallSummary. Note explicitly that this is a practice assessment and does not predict official UPSC marks.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction: 'You are a UPSC Personality Test mentor providing structured practice feedback.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          practiceScoreOutOf275: { type: Type.NUMBER },
          dimensions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
                feedback: { type: Type.STRING },
              },
              required: ['name', 'score', 'max', 'feedback'],
            },
          },
          overallSummary: { type: Type.STRING },
        },
        required: ['practiceScoreOutOf275', 'dimensions', 'overallSummary'],
      },
    },
  });

  const raw = (response.text || '').trim();
  if (!raw) throw new Error('Empty interview evaluation response.');
  return JSON.parse(raw);
}

export async function synthesizeSpeechWav(text: string): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style: 'Calm, dignified, authoritative senior UPSC interview board chairperson',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Speech synthesis did not return audio data.');
  }
  return base64Audio;
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        {
          text: 'Transcribe this civil services interview candidate response accurately.',
        },
      ],
    },
  });
  return (response.text || '').trim();
}

export interface LiveCurrentAffairInput {
  slug: string;
  publishedDate: string;
  subjectSlug: string;
  gsPaper: string;
  titleEn: string;
  titleHi: string;
  titleGu: string;
  summaryEn: string;
  summaryHi: string;
  summaryGu: string;
  sourceCitation: string;
}

function sanitizeHttpUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.hostname.replace(/^www\./, '');
    }
  } catch {
    // ignore malformed URLs
  }
  return null;
}

export async function fetchLiveCurrentAffairs(
  focusLanguage: SupportedLanguage = 'en'
): Promise<LiveCurrentAffairInput[]> {
  const ai = getAiClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const prompt = `Search for the latest real-world Indian and global developments relevant to UPSC Civil Services Examination (Prelims & Mains GS I/II/III) around ${todayIso}.
Select 3 distinct, high-yield current affairs topics across Indian Polity/Governance, Economy/RBI/Budget, Environment/Science, or International Relations.
Requested primary language context: ${LANGUAGE_NAME[focusLanguage]}.

Return ONLY a valid JSON array (no markdown fences, no commentary) of 3 objects with these exact string properties:
- subjectSlug: one of "polity", "economy", "environment", "science_tech", "ir", "geography", "history"
- gsPaper: one of "GS Paper II", "GS Paper III", "GS Paper I", "Prelims & GS II", "Prelims & GS III"
- titleEn: crisp UPSC-style English headline (max 110 chars)
- titleHi: faithful Hindi translation of the headline in Devanagari
- titleGu: faithful Gujarati translation of the headline in Gujarati script
- summaryEn: 2-3 factual UPSC analytical sentences (prelims + mains relevance) in English
- summaryHi: 2-3 factual sentences in Hindi
- summaryGu: 2-3 factual sentences in Gujarati
- sourceCitation: authoritative Indian/global source name (e.g., "PIB / The Hindu / RBI Press Release")`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a UPSC Current Affairs Research Desk analyst. Provide strictly factual, verifiable current affairs summaries grounded in live web search results. Output only a valid JSON array.',
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = (response.text || '').trim();
  if (!rawText) {
    throw new Error('Live current affairs search returned an empty response.');
  }

  // Strip optional markdown code fences if returned alongside search grounding
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const jsonStart = cleaned.indexOf('[');
  const jsonEnd = cleaned.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Unable to parse structured current affairs items from live search.');
  }

  const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as Array<Record<string, unknown>>;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Live current affairs search did not produce any news briefs.');
  }

  const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as Array<{
    web?: { uri?: string; title?: string };
  }>;
  const groundedDomains = Array.from(
    new Set(
      groundingChunks
        .map((c) => sanitizeHttpUrl(c.web?.uri))
        .filter((d): d is string => Boolean(d))
    )
  ).slice(0, 3);

  const allowedSubjects = new Set([
    'polity',
    'economy',
    'environment',
    'science_tech',
    'ir',
    'geography',
    'history',
  ]);

  return parsed.slice(0, 4).map((item, idx) => {
    const titleEn = String(item.titleEn || `UPSC Live Brief ${idx + 1}`).slice(0, 140);
    const slugBase = titleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const subjRaw = String(item.subjectSlug || 'polity').toLowerCase();
    const subjectSlug = allowedSubjects.has(subjRaw) ? subjRaw : 'polity';
    const baseCitation = String(item.sourceCitation || 'PIB / Official Release');
    const groundedNote = groundedDomains.length > 0 ? ` · Grounded: ${groundedDomains.join(', ')}` : '';

    return {
      slug: `live-${todayIso}-${slugBase || idx}-${Date.now().toString().slice(-4)}`,
      publishedDate: todayIso,
      subjectSlug,
      gsPaper: String(item.gsPaper || 'GS Paper II'),
      titleEn,
      titleHi: String(item.titleHi || titleEn),
      titleGu: String(item.titleGu || titleEn),
      summaryEn: String(item.summaryEn || ''),
      summaryHi: String(item.summaryHi || item.summaryEn || ''),
      summaryGu: String(item.summaryGu || item.summaryEn || ''),
      sourceCitation: `${baseCitation}${groundedNote}`,
    };
  });
}

