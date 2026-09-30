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

const sql = `-- Etap 3: quizy w backendzie (Supabase) — scalona tabela \`quizzes\`
-- Uruchom w Supabase Studio -> SQL Editor. Skrypt jest idempotentny (mozna
-- uruchamiac wielokrotnie): tworzy/uzupelnia tabele, wlacza RLS i wgrywa
-- (upsert po kolumnie id) quizy wbudowane.
--
-- Tabela \`quizzes\` trzyma ZAROWNO quizy wbudowane (is_user_quiz = false),
-- jak i quizy uzytkownikow (is_user_quiz = true) — dawna tabela \`user_quizzes\`
-- zostala z nia scalona. Migracja danych: supabase/merge-user-quizzes.sql.
--
-- UWAGA: to plik generowany. Zrodlo danych: src/assets/quizzes/*.json.
-- Regeneracja:  node supabase/gen-quizzes-sql.mjs

create table if not exists public.quizzes (
  id             text primary key,
  title          text not null,
  description    text,
  category       text,
  category_color text,
  device_id      text,
  is_user_quiz   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  questions      jsonb not null default '[]'::jsonb
);

-- Kolumny dodane przy scaleniu z \`user_quizzes\` — bezpieczne do wielokrotnego
-- uruchomienia (no-op, gdy juz istnieja). Dla istniejacych wierszy wbudowanych
-- is_user_quiz przyjmie domyslne false.
alter table public.quizzes add column if not exists category_color text;
alter table public.quizzes add column if not exists device_id text;
alter table public.quizzes add column if not exists is_user_quiz boolean not null default false;

alter table public.quizzes enable row level security;

-- Odczyt: publiczny dla wszystkich (quizy wbudowane i uzytkownikow).
drop policy if exists "Public read quizzes" on public.quizzes;
create policy "Public read quizzes"
  on public.quizzes
  for select
  to anon, authenticated
  using (true);

-- Zapis z frontendu: TYLKO quizy uzytkownikow (is_user_quiz = true).
-- Quizow wbudowanych (is_user_quiz = false) nie mozna wstawic/zmienic/usunac
-- z frontendu — modyfikuje sie je przez seed powyzej lub Supabase Studio.
drop policy if exists "Public insert user quizzes" on public.quizzes;
create policy "Public insert user quizzes"
  on public.quizzes
  for insert
  to anon, authenticated
  with check (is_user_quiz);

drop policy if exists "Public update user quizzes" on public.quizzes;
create policy "Public update user quizzes"
  on public.quizzes
  for update
  to anon, authenticated
  using (is_user_quiz)
  with check (is_user_quiz);

drop policy if exists "Public delete user quizzes" on public.quizzes;
create policy "Public delete user quizzes"
  on public.quizzes
  for delete
  to anon, authenticated
  using (is_user_quiz);

-- Seed / upsert quizow wbudowanych (is_user_quiz = false) z assets/quizzes/*.json
insert into public.quizzes (id, title, description, category, is_user_quiz, created_at, updated_at, questions)
select
  q->>'id',
  q->>'title',
  q->>'description',
  q->>'category',
  false,
  coalesce((q->>'createdAt')::timestamptz, now()),
  coalesce((q->>'updatedAt')::timestamptz, now()),
  coalesce(q->'questions', '[]'::jsonb)
from jsonb_array_elements($seed$
${seed}
$seed$::jsonb) as q
on conflict (id) do update set
  title        = excluded.title,
  description  = excluded.description,
  category     = excluded.category,
  is_user_quiz = excluded.is_user_quiz,
  created_at   = excluded.created_at,
  updated_at   = excluded.updated_at,
  questions    = excluded.questions;
`;

writeFileSync('supabase/quizzes.sql', sql, 'utf8');
console.log(`Wrote supabase/quizzes.sql (${quizzes.length} quizzes)`);
