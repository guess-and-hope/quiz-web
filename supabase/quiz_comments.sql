-- Komentarze do quizów — tabela `quiz_comments`
-- Run in Supabase Studio -> SQL Editor. The script is idempotent (safe to
-- run multiple times).
--
-- "Honor mode", same as `results.sql`: a comment requires a nickname (the
-- same `player_name` concept used when saving a score), but no login.
-- Entries are an append-only log, like `results` — no UPDATE/DELETE from
-- the frontend.

create table if not exists public.quiz_comments (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     text not null,
  device_id   text,
  player_name text not null,
  comment     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists quiz_comments_quiz_idx on public.quiz_comments (quiz_id, created_at desc);

alter table public.quiz_comments enable row level security;

drop policy if exists "Public read quiz comments" on public.quiz_comments;
create policy "Public read quiz comments"
  on public.quiz_comments
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert quiz comments" on public.quiz_comments;
create policy "Public insert quiz comments"
  on public.quiz_comments
  for insert
  to anon, authenticated
  with check (true);
