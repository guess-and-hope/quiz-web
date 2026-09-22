// Generuje supabase/quizzes.sql na podstawie plików src/assets/quizzes/*.json.
// Uruchom z katalogu głównego repo:  node supabase/gen-quizzes-sql.mjs
//
// Skrypt osadza quizy w dollar-quoted stringu ($seed$…$seed$), dzięki czemu
// polskie znaki, apostrofy i cudzysłowy nie wymagają ręcznego escapowania.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = 'src/assets/quizzes';
// Dopisz tu nazwę nowego pliku quizu (bez rozszerzenia .json).
const files = ['geografia', 'historia', 'matematyka', 'ciekawostki'];

const quizzes = files.map((f) => JSON.parse(readFileSync(`${dir}/${f}.json`, 'utf8')));
const seed = JSON.stringify(quizzes, null, 2);

const sql = `-- Etap 3: quizy w backendzie (Supabase)
-- Uruchom w Supabase Studio -> SQL Editor. Skrypt jest idempotentny (mozna
-- uruchamiac wielokrotnie): tworzy tabele, wlacza RLS z publicznym odczytem
-- i wgrywa/aktualizuje quizy (upsert po kolumnie id).
--
-- UWAGA: to plik generowany. Zrodlo danych: src/assets/quizzes/*.json.
-- Regeneracja:  node supabase/gen-quizzes-sql.mjs

create table if not exists public.quizzes (
  id          text primary key,
  title       text not null,
  description text,
  category    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  questions   jsonb not null default '[]'::jsonb
);

-- Row Level Security: tylko publiczny ODCZYT (zapis niedozwolony z frontendu).
alter table public.quizzes enable row level security;

drop policy if exists "Public read quizzes" on public.quizzes;
create policy "Public read quizzes"
  on public.quizzes
  for select
  to anon, authenticated
  using (true);

-- Seed / upsert z assets/quizzes/*.json
insert into public.quizzes (id, title, description, category, created_at, updated_at, questions)
select
  q->>'id',
  q->>'title',
  q->>'description',
  q->>'category',
  coalesce((q->>'createdAt')::timestamptz, now()),
  coalesce((q->>'updatedAt')::timestamptz, now()),
  coalesce(q->'questions', '[]'::jsonb)
from jsonb_array_elements($seed$
${seed}
$seed$::jsonb) as q
on conflict (id) do update set
  title       = excluded.title,
  description = excluded.description,
  category    = excluded.category,
  created_at  = excluded.created_at,
  updated_at  = excluded.updated_at,
  questions   = excluded.questions;
`;

writeFileSync('supabase/quizzes.sql', sql, 'utf8');
console.log(`Wrote supabase/quizzes.sql (${quizzes.length} quizzes)`);
