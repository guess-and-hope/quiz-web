# Quiz Web — Etap 3: quizy w backendzie (Supabase)

Do tej pory quizy były wczytywane ze **statycznych plików JSON** (`src/assets/quizzes/*.json`)
przez `HttpClient`. Wyniki graczy trafiały już do Supabase (etap 2), ale same quizy nie.

W tym etapie **przenosimy quizy do Supabase** i czytamy je z bazy zamiast z plików.
Zakres: **tylko odczyt** — nie ma panelu do tworzenia quizów w aplikacji (quizy
dodaje się przez SQL / Supabase Studio).

---

## 1. Co się zmieniło w kodzie

- `QuizService` czyta quizy z tabeli `public.quizzes` (Supabase) zamiast z plików JSON.
  Publiczne API serwisu (`getAll`, `getById`, `isLoading`, `getError`) **nie zmieniło się**,
  więc strony (`quiz-list`, `quiz-play`, `quiz-result`, `ranking`) działają bez zmian.
- `HttpClient` nie jest już nigdzie używany — usunięty z `app.config.ts`.
- Testy komponentów używają lekkiego stubu `provideQuizServiceStub()`
  (`src/app/testing/quiz-service.stub.ts`) zamiast mockowania warstwy HTTP.
- Pliki `src/assets/quizzes/*.json` **pozostają** jako źródło danych startowych
  (seed) — na ich podstawie generowany jest skrypt SQL. Nie są już pobierane w runtime.

---

## 2. Jak uruchomić (jednorazowo, po stronie Supabase)

1. Wejdź w **Supabase Studio → SQL Editor**.
2. Wklej i uruchom zawartość pliku [`supabase/quizzes.sql`](../supabase/quizzes.sql).
3. **Tylko przy migracji istniejącej bazy** (gdy była osobna tabela `user_quizzes`):
   uruchom jeszcze [`supabase/merge-user-quizzes.sql`](../supabase/merge-user-quizzes.sql),
   który przeniesie quizy użytkowników do `quizzes` i usunie starą tabelę.

Skrypt jest **idempotentny** — tworzy/uzupełnia tabelę `quizzes`, włącza Row Level
Security (publiczny odczyt + zapis ograniczony do quizów użytkowników), a następnie
wgrywa/aktualizuje quizy wbudowane (upsert po `id`). Można go uruchamiać wielokrotnie
bez skutków ubocznych.

Po uruchomieniu odśwież aplikację — quizy wczytają się z bazy.

---

## 3. Schemat tabeli

Tabela `quizzes` trzyma **zarówno quizy wbudowane, jak i quizy użytkowników** (dawna
osobna tabela `user_quizzes` została z nią scalona). Rozróżnia je flaga `is_user_quiz`.

| Kolumna          | Typ           | Uwagi                                                        |
| ---------------- | ------------- | ----------------------------------------------------------- |
| `id`             | `text` (PK)   | wbudowane: slug (np. `geografia`); użytkownika: UUID          |
| `title`          | `text`        | tytuł quizu                                                   |
| `description`    | `text`        | opcjonalny                                                    |
| `category`       | `text`        | opcjonalny                                                    |
| `category_color` | `text`        | opcjonalny; używane przez quizy użytkowników                  |
| `device_id`      | `text`        | anonimowy identyfikator autora; `null` dla quizów wbudowanych |
| `is_user_quiz`   | `boolean`     | flaga: `false` = wbudowany, `true` = utworzony przez użytkownika |
| `created_at`     | `timestamptz` | domyślnie `now()`                                            |
| `updated_at`     | `timestamptz` | domyślnie `now()`                                            |
| `questions`      | `jsonb`       | pełna lista pytań (struktura 1:1 z modelem `Quiz`)           |

Pytania trzymamy jako **JSONB** (jeden dokument = jeden quiz), bo aplikacja i tak
czyta cały quiz naraz. Nie rozbijamy pytań/odpowiedzi na osobne tabele — dla tej
aplikacji byłby to przerost formy.

`QuizService` czyta quizy wbudowane (`is_user_quiz = false`), a `UserQuizService`
quizy użytkowników (`is_user_quiz = true`) — obie strony tej samej tabeli.

### RLS

- **SELECT** — publiczny dla `anon`/`authenticated` (wszystkie quizy).
- **INSERT/UPDATE/DELETE** — dozwolony z frontendu **tylko dla quizów użytkowników**
  (`is_user_quiz = true`). Quizów wbudowanych nie da się zmienić z frontendu — modyfikuje
  się je przez seed w `quizzes.sql` lub z poziomu Supabase Studio / kluczem serwisowym.

---

## 4. Jak dodać / edytować quiz

Dwie drogi:

- **Ad hoc:** dodaj wiersz w tabeli `quizzes` w Supabase Studio (kolumnę `questions`
  wypełnij tablicą JSON pytań, w formacie jak w plikach `src/assets/quizzes/*.json`).
- **Z repo (seed):** dodaj/zmień plik w `src/assets/quizzes/*.json`, dopisz jego nazwę
  na liście w generatorze i wygeneruj na nowo `supabase/quizzes.sql`, a potem uruchom go
  w SQL Editorze (upsert zaktualizuje istniejące i doda nowe).

---

## 5. Uwagi

- **Kolejność quizów** na liście wynika z `created_at` (rosnąco).
- Jeśli baza jest niedostępna lub zapytanie zawiedzie, `QuizService` ustawia komunikat
  błędu („Nie udało się wczytać quizów."), a strony pokazują stan błędu — tak jak
  wcześniej przy błędzie pobrania plików.
