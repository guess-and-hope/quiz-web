-- Migracja: scalenie `user_quizzes` do `quizzes` (dla ISTNIEJĄCEJ bazy).
--
-- Uruchom w Supabase Studio -> SQL Editor. Plik jest samowystarczalny i
-- idempotentny — można go odpalić raz na bazie, która ma już tabele `quizzes`
-- oraz `user_quizzes`. Robi wszystko naraz:
--   1. dokłada do `quizzes` kolumny category_color / device_id / is_user_quiz,
--   2. ustawia RLS (publiczny odczyt + zapis tylko dla quizów użytkowników),
--   3. przenosi wiersze z `user_quizzes` do `quizzes` (is_user_quiz = true),
--   4. usuwa starą tabelę `user_quizzes`.
--
-- Uwaga: przy świeżej instalacji (pusta baza) NIE uruchamiaj tego pliku — użyj
-- `supabase/quizzes.sql`, który tworzy scaloną tabelę i wgrywa quizy wbudowane.

-- 1) Nowe kolumny na scalonej tabeli `quizzes`
--    (istniejące wiersze wbudowane dostaną is_user_quiz = false z domyślnej wartości).
alter table public.quizzes add column if not exists category_color text;
alter table public.quizzes add column if not exists device_id text;
alter table public.quizzes add column if not exists is_user_quiz boolean not null default false;

-- 2) RLS: odczyt publiczny + zapis TYLKO dla quizów użytkowników (is_user_quiz = true).
--    Quizów wbudowanych (is_user_quiz = false) nie da się zmienić z frontendu.
alter table public.quizzes enable row level security;

drop policy if exists "Public read quizzes" on public.quizzes;
create policy "Public read quizzes"
  on public.quizzes
  for select
  to anon, authenticated
  using (true);

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

-- 3) Przeniesienie quizów użytkowników do `quizzes` (is_user_quiz = true)
--    i usunięcie starej tabeli. `on conflict do nothing` chroni przed
--    nadpisaniem, gdyby migrację uruchomiono dwa razy przed dropem.
do $$
begin
  if to_regclass('public.user_quizzes') is not null then
    insert into public.quizzes
      (id, title, description, category, category_color, device_id,
       is_user_quiz, created_at, updated_at, questions)
    select
      id, title, description, category, category_color, device_id,
      true, created_at, updated_at, questions
    from public.user_quizzes
    on conflict (id) do nothing;

    drop table public.user_quizzes;
  end if;
end $$;

-- 4) Weryfikacja (opcjonalnie — odpal osobno po migracji):
-- select is_user_quiz, count(*) from public.quizzes group by is_user_quiz;
-- select to_regclass('public.user_quizzes');  -- powinno zwrócić NULL
