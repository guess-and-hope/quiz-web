-- Oceny quizów (kciuk w górę / w dół) — tabela `quiz_ratings`
-- Run in Supabase Studio -> SQL Editor. The script is idempotent (safe to
-- run multiple times).
--
-- "Honor mode", same as the rest of the database: anyone can rate a quiz
-- with a thumbs up/down, no login required. One rating per device per quiz
-- (unique `quiz_id` + `device_id`) — a later rating from the same device
-- OVERWRITES the previous one (upsert), so a player can change their mind.

create table if not exists public.quiz_ratings (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    text not null,
  device_id  text not null,
  rating     smallint not null check (rating in (-1, 1)), -- 1 = thumbs up, -1 = thumbs down
  created_at timestamptz not null default now(),
  unique (quiz_id, device_id)
);

create index if not exists quiz_ratings_quiz_idx on public.quiz_ratings (quiz_id);

alter table public.quiz_ratings enable row level security;

drop policy if exists "Public read quiz ratings" on public.quiz_ratings;
create policy "Public read quiz ratings"
  on public.quiz_ratings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert quiz ratings" on public.quiz_ratings;
create policy "Public insert quiz ratings"
  on public.quiz_ratings
  for insert
  to anon, authenticated
  with check (true);

-- UPDATE is needed for the upsert (changing your mind about a rating).
drop policy if exists "Public update quiz ratings" on public.quiz_ratings;
create policy "Public update quiz ratings"
  on public.quiz_ratings
  for update
  to anon, authenticated
  using (true);
