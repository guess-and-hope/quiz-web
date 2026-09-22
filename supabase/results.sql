-- Etap 2: wyniki graczy (Supabase) — tabela `results`
-- Uruchom w Supabase Studio -> SQL Editor. Skrypt jest idempotentny (mozna
-- uruchamiac wielokrotnie): tworzy tabele, wlacza RLS oraz polityki dostepu
-- i dodaje indeks pod zapytanie rankingu.
--
-- Uwaga: to odtworzenie istniejacej tabeli (dokumentacja + reprodukowalnosc).
-- Model "honorowy" (strona rozrywkowa): kazdy moze dopisac swoj wynik i czytac
-- ranking; nie ma logowania. Ochrone daje RLS, nie tajnosc klucza publishable.

create table if not exists public.results (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  quiz_id          text not null,
  quiz_title       text not null,
  player_name      text not null,
  correct          integer not null,
  total            integer not null,
  percentage       integer not null,
  device_id        uuid,             -- anonimowy identyfikator urzadzenia; NULL dla starszych wpisow
  duration_seconds integer           -- czas rozwiazywania; obecnie nieuzywany przez aplikacje
);

-- Indeks pod zapytanie rankingu (filtr po quizie + sortowanie malejaco).
create index if not exists results_quiz_ranking_idx
  on public.results (quiz_id, percentage desc, correct desc, created_at);

-- Row Level Security: publiczny ODCZYT i ZAPIS (dopisywanie wynikow z frontendu).
-- Brak polityk UPDATE/DELETE => modyfikacja/usuwanie tylko z poziomu Supabase.
alter table public.results enable row level security;

drop policy if exists "Public read results" on public.results;
create policy "Public read results"
  on public.results
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert results" on public.results;
create policy "Public insert results"
  on public.results
  for insert
  to anon, authenticated
  with check (true);
