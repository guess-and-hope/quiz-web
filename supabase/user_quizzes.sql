-- Quizy tworzone przez użytkowników — tabela `user_quizzes`
-- Uruchom w Supabase Studio -> SQL Editor. Skrypt jest idempotentny (mozna
-- uruchamiac wielokrotnie): tworzy tabele i wlacza RLS z publicznymi
-- politykami dostepu.
--
-- Model "honorowy" (strona rozrywkowa, bez logowania), jak w `results.sql`,
-- ALE w odroznieniu od `results` (gdzie zapis to append-only log wynikow)
-- ta tabela jest z zalozenia edytowalna przez wlascicieli quizow — funkcja
-- "Moje quizy" (dodawanie/edycja/usuwanie) tego wymaga. Dlatego, inaczej niz
-- w results.sql, dopuszczamy tu rowniez UPDATE i DELETE z frontendu.
-- `device_id` (anonimowy identyfikator przegladarki z localStorage) sluzy
-- tylko do pokazania w UI "to Twoj quiz" (przyciski Edytuj/Usun) — RLS go
-- NIE weryfikuje, wiec to nie jest twarde zabezpieczenie, tylko umowa
-- spoleczna, zgodna z reszta aplikacji.

create table if not exists public.user_quizzes (
  id          text primary key,
  title       text not null,
  description text,
  category    text,
  device_id   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  questions   jsonb not null default '[]'::jsonb
);

alter table public.user_quizzes enable row level security;

drop policy if exists "Public read user quizzes" on public.user_quizzes;
create policy "Public read user quizzes"
  on public.user_quizzes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert user quizzes" on public.user_quizzes;
create policy "Public insert user quizzes"
  on public.user_quizzes
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public update user quizzes" on public.user_quizzes;
create policy "Public update user quizzes"
  on public.user_quizzes
  for update
  to anon, authenticated
  using (true);

drop policy if exists "Public delete user quizzes" on public.user_quizzes;
create policy "Public delete user quizzes"
  on public.user_quizzes
  for delete
  to anon, authenticated
  using (true);
