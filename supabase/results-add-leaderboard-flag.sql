-- Migracja: flaga `on_leaderboard` na tabeli `results` (dla ISTNIEJĄCEJ bazy).
--
-- Uruchom w Supabase Studio -> SQL Editor. Od teraz każde ukończenie quizu
-- zapisuje wiersz (mamy device_id, więc nawet bez nicku), a `on_leaderboard`
-- mówi, czy wynik trafia na listę high score (ranking).
--
-- Dotychczasowe wpisy pochodziły wyłącznie z zapisu z nickiem — czyli były to
-- wpisy rankingowe — więc backfillujemy je na TRUE. Robimy to, dodając kolumnę
-- z domyślną wartością true (co ustawia istniejące wiersze), a następnie zmieniamy
-- domyślną na false dla nowych, anonimowych ukończeń.
--
-- Idempotentne: przy ponownym uruchomieniu `add column if not exists` jest no-op
-- i NIE nadpisuje istniejących wartości flagi.

alter table public.results add column if not exists on_leaderboard boolean not null default true;
alter table public.results alter column on_leaderboard set default false;

-- Weryfikacja (opcjonalnie — odpal osobno po migracji):
-- select on_leaderboard, count(*) from public.results group by on_leaderboard;
