// Supabase Edge Function: generate-quiz
//
// Generuje pytania quizowe przez Google Gemini (darmowy tier) i zwraca je
// w formacie zgodnym z modelem `Question` aplikacji. Klucz API pozostaje po
// stronie serwera (sekret) — nigdy nie trafia do przeglądarki.
//
// Konfiguracja (jednorazowo):
//   npx supabase secrets set GEMINI_API_KEY=<twój-klucz-z-aistudio.google.com>
//
// Wdrożenie (aplikacja nie ma logowania, więc endpoint bez weryfikacji JWT):
//   npx supabase functions deploy generate-quiz --no-verify-jwt

// Model można nadpisać sekretem bez zmiany kodu:
//   npx supabase secrets set GEMINI_MODEL=<inny-model>
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Górny limit pytań na jedno wywołanie — chroni darmowy limit Gemini.
const MAX_QUESTIONS = 20;

// Ponawianie przy chwilowym przeciążeniu modelu ("high demand") i błędach 5xx / 429.
const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Difficulty = 'easy' | 'medium' | 'hard';

interface GenerateRequest {
  topic?: string;
  count?: number;
  difficulty?: Difficulty;
  // Teksty istniejących pytań, których model NIE ma powtarzać ani parafrazować.
  // Używane przy regeneracji pojedynczego pytania (re-roll), by nie zwrócić duplikatu.
  avoid?: string[];
}

// Górny limit i przycięcie listy `avoid` — chronią rozmiar promptu przed rozdęciem.
const MAX_AVOID = 30;
const MAX_AVOID_LENGTH = 300;

// Znormalizowany kształt, o który prosimy model — bez unii typów, dzięki czemu
// schemat Gemini jest prosty, a całość walidujemy po stronie serwera.
interface RawQuestion {
  type: 'single' | 'multi' | 'boolean';
  text: string;
  explanation?: string;
  options: string[];
  correctIndexes: number[];
  correctBoolean: boolean;
}

type Question =
  | { id: string; type: 'single'; text: string; explanation?: string; options: string[]; correct: number }
  | { id: string; type: 'multi'; text: string; explanation?: string; options: string[]; correct: number[] }
  | { id: string; type: 'boolean'; text: string; explanation?: string; correct: boolean };

// Musi odpowiadać liście kategorii w aplikacji (src/app/models/quiz.model.ts).
// Model wybiera jedną z nich, a aplikacja auto-zaznacza pasującą plakietkę.
const CATEGORY_NAMES = [
  'Geografia',
  'Historia',
  'Nauka',
  'Ogólna wiedza',
  'Sport',
  'Filmy i seriale',
  'Muzyka',
  'Literatura',
  'Gry',
  'Sztuka i kultura',
  'Zwierzęta',
  'Lifestyle',
  'Technologia',
  'Przyroda',
  'Języki',
  'Inne',
];

const responseSchema = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING', enum: CATEGORY_NAMES },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ['single', 'multi', 'boolean'] },
          text: { type: 'STRING' },
          explanation: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correctIndexes: { type: 'ARRAY', items: { type: 'INTEGER' } },
          correctBoolean: { type: 'BOOLEAN' },
        },
        required: ['type', 'text', 'options', 'correctIndexes', 'correctBoolean'],
      },
    },
  },
  required: ['category', 'questions'],
};

const DIFFICULTY_PL: Record<Difficulty, string> = {
  easy: 'łatwy',
  medium: 'średni',
  hard: 'trudny',
};

function buildPrompt(topic: string, count: number, difficulty: Difficulty, avoid: string[] = []): string {
  const lines = [
    `Wygeneruj ${count} pytań quizowych po polsku na temat: "${topic}".`,
    `Poziom trudności: ${DIFFICULTY_PL[difficulty]}.`,
    'Użyj różnych typów pytań: single (jednokrotny wybór), multi (wielokrotny wybór), boolean (prawda/fałsz).',
    'Zasady dla każdego pytania:',
    '- single: options ma 3-4 sensowne odpowiedzi, correctIndexes zawiera DOKŁADNIE jeden indeks poprawnej odpowiedzi, correctBoolean = false.',
    '- multi: options ma 3-5 odpowiedzi, correctIndexes zawiera co najmniej jeden (najlepiej kilka) indeksów poprawnych odpowiedzi, correctBoolean = false.',
    '- boolean: options pozostaw puste ([]), correctIndexes pozostaw puste ([]), correctBoolean to poprawna odpowiedź (true = prawda, false = fałsz).',
    'Indeksy w correctIndexes liczone są od 0. Pole explanation to krótkie wyjaśnienie poprawnej odpowiedzi.',
    `Dobierz też jedną kategorię najlepiej pasującą do tematu z tej listy (użyj dokładnie takiej nazwy): ${CATEGORY_NAMES.join(', ')}. Zwróć ją w polu "category".`,
  ];

  // Przy re-rollu przekazujemy istniejące pytania, żeby model nie zwrócił duplikatu.
  if (avoid.length > 0) {
    const list = avoid.map((text) => `"${text}"`).join('; ');
    lines.push(
      `Nie powtarzaj ani nie parafrazuj następujących istniejących pytań: ${list}. Wygeneruj pytanie wyraźnie różne od nich.`,
    );
  }

  lines.push('Nie powtarzaj pytań. Zwróć wyłącznie poprawny JSON zgodny ze schematem.');
  return lines.join('\n');
}

// Czyści listę `avoid` z payloadu: odrzuca nie-stringi/puste, spłaszcza białe znaki,
// przycina liczbę i długość elementów (ochrona rozmiaru promptu).
function sanitizeAvoid(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((text) => (typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : ''))
    .filter((text) => text.length > 0)
    .slice(0, MAX_AVOID)
    .map((text) => text.slice(0, MAX_AVOID_LENGTH));
}

// Mapuje znormalizowane pytanie z modelu na ścisły typ `Question`.
// Zwraca null, gdy pytanie jest niepoprawne (odrzucamy je zamiast wpuszczać śmieci).
function toQuestion(raw: RawQuestion): Question | null {
  const text = (raw?.text ?? '').trim();
  if (!text) return null;

  const explanation = (raw.explanation ?? '').trim() || undefined;
  const base = { id: crypto.randomUUID(), text, explanation };

  if (raw.type === 'boolean') {
    if (typeof raw.correctBoolean !== 'boolean') return null;
    return { ...base, type: 'boolean', correct: raw.correctBoolean };
  }

  // Przycinamy, ale nie usuwamy pustych opcji — usunięcie przesunęłoby indeksy
  // poprawnych odpowiedzi. Pytanie z pustą opcją odrzucamy w całości.
  const options = (raw.options ?? []).map((option) => (option ?? '').trim());
  if (options.length < 2 || options.some((option) => option.length === 0)) return null;

  const indexes = Array.from(
    new Set((raw.correctIndexes ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < options.length)),
  );
  if (indexes.length === 0) return null;

  if (raw.type === 'single') {
    return { ...base, type: 'single', options, correct: indexes[0] };
  }
  return { ...base, type: 'multi', options, correct: indexes };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Woła Gemini z ponawianiem: chwilowe przeciążenie modelu (503 "high demand")
// oraz błędy 5xx/429 są przejściowe, więc próbujemy ponownie z rosnącym odstępem.
async function callGemini(apiKey: string, requestBody: string): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    // Sukces, błąd nie do ponowienia albo ostatnia próba → zwracamy odpowiedź.
    if (res.ok || !RETRYABLE_STATUSES.has(res.status) || attempt === MAX_RETRIES) {
      return res;
    }

    // Przejściowy błąd — odrzucamy odpowiedź i ponawiamy po krótkiej przerwie.
    await res.body?.cancel().catch(() => {});
    console.warn(`generate-quiz: Gemini ${res.status}, ponawiam (próba ${attempt}/${MAX_RETRIES})`);
    await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
  }
  // Nieosiągalne — pętla zawsze zwraca w ostatniej próbie.
  throw new Error('generate-quiz: wyczerpano próby wywołania Gemini');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Metoda nieobsługiwana.' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json({ error: 'Brak konfiguracji GEMINI_API_KEY po stronie serwera.' }, 500);
  }

  let payload: GenerateRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Nieprawidłowe body zapytania.' }, 400);
  }

  const topic = (payload.topic ?? '').trim();
  if (!topic) {
    return json({ error: 'Podaj temat quizu.' }, 400);
  }

  const difficulty: Difficulty =
    payload.difficulty === 'easy' || payload.difficulty === 'hard' ? payload.difficulty : 'medium';
  const count = Math.min(Math.max(Math.floor(payload.count ?? 5) || 5, 1), MAX_QUESTIONS);
  const avoid = sanitizeAvoid(payload.avoid);

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(topic, count, difficulty, avoid) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.8,
    },
  });

  let geminiRes: Response;
  try {
    geminiRes = await callGemini(apiKey, requestBody);
  } catch (fetchError) {
    console.error('generate-quiz: połączenie z Gemini nieudane', fetchError);
    return json({ error: 'Nie udało się połączyć z usługą AI.' }, 502);
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => '');
    console.error('generate-quiz: Gemini zwróciło błąd', geminiRes.status, detail);
    const overloaded = geminiRes.status === 503 || geminiRes.status === 429;
    return json(
      {
        error: overloaded
          ? 'Model AI jest chwilowo przeciążony. Odczekaj chwilę i spróbuj ponownie.'
          : 'Usługa AI zwróciła błąd. Spróbuj ponownie za chwilę.',
        detail: `${geminiRes.status}: ${detail.slice(0, 500)}`,
      },
      overloaded ? 503 : 502,
    );
  }

  const data = await geminiRes.json();
  const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('generate-quiz: brak treści w odpowiedzi Gemini', JSON.stringify(data).slice(0, 800));
    const detail =
      data?.promptFeedback?.blockReason ?? data?.candidates?.[0]?.finishReason ?? 'brak treści w odpowiedzi';
    return json({ error: 'AI nie zwróciło żadnych pytań.', detail: String(detail) }, 502);
  }

  let parsed: { questions?: RawQuestion[]; category?: string };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return json({ error: 'AI zwróciło odpowiedź w nieprawidłowym formacie.' }, 502);
  }

  const questions = (parsed.questions ?? [])
    .map(toQuestion)
    .filter((question): question is Question => question !== null);

  if (questions.length === 0) {
    return json({ error: 'Nie udało się wygenerować poprawnych pytań. Spróbuj ponownie.' }, 422);
  }

  // Zwracamy kategorię tylko, gdy jest jedną ze znanych — inaczej pomijamy (aplikacja jej nie zaznaczy).
  const category =
    typeof parsed.category === 'string' && CATEGORY_NAMES.includes(parsed.category)
      ? parsed.category
      : undefined;

  return json({ questions, category }, 200);
});
