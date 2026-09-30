-- Etap 2: wyniki graczy (Supabase) — tabela `results`
-- Uruchom w Supabase Studio -> SQL Editor. Skrypt jest idempotentny (mozna
-- uruchamiac wielokrotnie): tworzy tabele, wlacza RLS oraz polityki dostepu
-- i dodaje indeks pod zapytanie rankingu.
--
-- Uwaga: to odtworzenie istniejacej tabeli (dokumentacja + reprodukowalnosc).
-- Model "honorowy" (strona rozrywkowa): kazdy moze dopisac swoj wynik i czytac
-- ranking; nie ma logowania. Ochrone daje RLS, nie tajnosc klucza publishable.
--
-- KAZDE ukonczenie quizu zapisuje wiersz (mamy device_id, wiec nawet bez nicku).
-- Kolumna `on_leaderboard` mowi, czy dany wynik trafia na liste high score
-- (ranking): true = zapis z nickiem wybrany przez gracza, false = anonimowe
-- ukonczenie liczone tylko do statystyki "rozwiazan". Ranking filtruje po tej
-- fladze, a licznik rozwiazan liczy WSZYSTKIE wiersze.

create table if not exists public.results (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  quiz_id          text not null,
  quiz_title       text not null,
  player_name      text not null,   -- '' dla anonimowego ukonczenia bez nicku
  correct          integer not null,
  total            integer not null,
  percentage       integer not null,
  device_id        uuid,             -- anonimowy identyfikator urzadzenia; NULL dla starszych wpisow
  duration_seconds integer,          -- czas rozwiazywania; obecnie nieuzywany przez aplikacje
  on_leaderboard   boolean not null default false  -- czy wynik jest na liscie high score
);

-- Kolumna `on_leaderboard` dodana po tym, jak tabela juz istniala. Wszystkie
-- dotychczasowe wpisy pochodzily wylacznie z zapisu z nickiem (czyli byly to
-- wpisy rankingowe), wiec backfillujemy je na TRUE: dodajemy kolumne z domyslnym
-- true (co ustawia istniejace wiersze), a potem zmieniamy domyslna na false dla
-- nowych, anonimowych ukonczen. Idempotentne: przy ponownym uruchomieniu
-- `add column if not exists` jest no-op i nie nadpisuje istniejacych wartosci.
alter table public.results add column if not exists on_leaderboard boolean not null default true;
alter table public.results alter column on_leaderboard set default false;

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
