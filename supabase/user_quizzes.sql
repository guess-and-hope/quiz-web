-- User-created quizzes — `user_quizzes` table
-- Run in Supabase Studio -> SQL Editor. The script is idempotent (safe to
-- run multiple times): it creates the table and enables RLS with public
-- access policies.
--
-- "Honor mode" (an entertainment site, no login), same as `results.sql`,
-- BUT unlike `results` (where writes are an append-only log of scores),
-- this table is meant to be editable by quiz owners — the "Moje quizy"
-- feature (add/edit/delete) requires it. That's why, unlike results.sql,
-- we also allow UPDATE and DELETE from the frontend here.
-- `device_id` (an anonymous browser identifier from localStorage) is only
-- used to show "this is your quiz" in the UI (Edit/Delete buttons) — RLS
-- does NOT verify it, so this isn't real enforcement, just a social
-- contract, consistent with the rest of the app.

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
