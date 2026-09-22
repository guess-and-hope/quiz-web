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

Skrypt jest **idempotentny** — tworzy tabelę `quizzes`, włącza Row Level Security
z polityką **publicznego odczytu**, a następnie wgrywa/aktualizuje quizy (upsert po `id`).
Można go uruchamiać wielokrotnie bez skutków ubocznych.

Po uruchomieniu odśwież aplikację — quizy wczytają się z bazy.

---

## 3. Schemat tabeli

| Kolumna       | Typ           | Uwagi                                            |
| ------------- | ------------- | ------------------------------------------------ |
| `id`          | `text` (PK)   | np. `geografia` (to samo co dawniej w JSON)      |
| `title`       | `text`        | tytuł quizu                                       |
| `description` | `text`        | opcjonalny                                        |
| `category`    | `text`        | opcjonalny                                        |
| `created_at`  | `timestamptz` | domyślnie `now()`                                |
| `updated_at`  | `timestamptz` | domyślnie `now()`                                |
| `questions`   | `jsonb`       | pełna lista pytań (struktura 1:1 z modelem `Quiz`) |

Pytania trzymamy jako **JSONB** (jeden dokument = jeden quiz), bo aplikacja i tak
czyta cały quiz naraz. Nie rozbijamy pytań/odpowiedzi na osobne tabele — dla tej
aplikacji byłby to przerost formy.

### RLS

Tabela ma włączone Row Level Security z jedną polityką: **SELECT dla `anon`/`authenticated`**.
Zapis z frontendu jest zablokowany (brak polityki INSERT/UPDATE/DELETE) — quizy
modyfikuje się z poziomu Supabase Studio lub kluczem serwisowym.

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
