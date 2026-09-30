// Supabase Edge Function: search-images
//
// Proxies photo search to the Pixabay API so the API key stays on the server
// (same pattern as generate-quiz / Gemini). Returns a small, normalized shape
// with just what the editor needs to show a picker and credit the photographer.
//
// Setup (one-off):
//   npx supabase secrets set PIXABAY_API_KEY=<your-key-from-pixabay.com/api/docs>
//
// Deploy (app has no login, so the endpoint skips JWT verification):
//   npx supabase functions deploy search-images --no-verify-jwt

import { searchPixabay } from '../_shared/pixabay.ts';

// Small result grid is enough for picking one photo per question.
const RESULTS_PER_PAGE = 12;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SearchRequest {
  query?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Metoda nieobsługiwana.' }, 405);
  }

  const apiKey = Deno.env.get('PIXABAY_API_KEY');
  if (!apiKey) {
    return json({ error: 'Brak konfiguracji PIXABAY_API_KEY po stronie serwera.' }, 500);
  }

  let payload: SearchRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Nieprawidłowe body zapytania.' }, 400);
  }

  const query = (payload.query ?? '').trim();
  if (!query) {
    return json({ error: 'Podaj czego szukać.' }, 400);
  }

  try {
    const results = await searchPixabay(apiKey, query, RESULTS_PER_PAGE);
    return json({ results });
  } catch (err) {
    console.error('search-images: Pixabay zwróciło błąd', err);
    return json({ error: 'Usługa zdjęć zwróciła błąd. Spróbuj ponownie za chwilę.' }, 502);
  }
});
