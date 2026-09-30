# Quiz Web — Etap 4: generowanie pytań przez AI (Gemini)

W tym etapie dodajemy **generowanie pytań przez AI**. Użytkownik w edytorze quizu
podaje temat, a model **Google Gemini** (darmowy tier) przygotowuje wstępne pytania,
które można poprawić i zapisać jak każdy inny quiz użytkownika.

Rozwiązanie jest **w pełni serverless** — nie dochodzi żaden serwer do utrzymania.

---

## 1. Architektura

```
Przeglądarka (Angular)                     Supabase (serverless)            Google
┌───────────────────────────┐   invoke     ┌────────────────────────┐  fetch  ┌──────────┐
│ quiz-editor               │ ───────────▶ │ Edge Function          │ ──────▶ │ Gemini   │
│   → AiQuizService         │ {temat,      │  generate-quiz         │         │ API      │
│   ← Question[] (szkic)    │  liczba,     │  • klucz = SEKRET       │ ◀────── │          │
│   → UserQuizService       │  poziom}     │  • walidacja Question[] │  JSON   └──────────┘
│     (localStorage)        │ ◀─────────── │                        │
└───────────────────────────┘  Question[]  └────────────────────────┘
```

- **Klucz API Gemini nigdy nie trafia do przeglądarki** — trzymany jest jako sekret
  po stronie Edge Function. To dlatego wywołanie idzie przez funkcję, a nie wprost z Angulara.
- **Człowiek w pętli**: AI tworzy tylko szkic, użytkownik zatwierdza/poprawia w edytorze,
  więc słabe pytania nie wejdą do quizu automatycznie.

---

## 2. Co doszło w kodzie

- `supabase/functions/generate-quiz/index.ts` — Edge Function (Deno). Buduje prompt,
  wywołuje Gemini z **wymuszonym JSON-em** (`responseSchema`), waliduje wynik i mapuje
  na ścisły model `Question[]` (te same reguły co edytor: min. 2 opcje, wskazana poprawna itd.).
- `src/app/services/ai-quiz.service.ts` — `AiQuizService`: metoda `generate(...)` wołająca
  funkcję przez `supabase.client.functions.invoke('generate-quiz', …)`.
- `src/app/pages/quiz-editor/*` — panel „Generuj z AI" (temat, liczba, poziom, przycisk).
  Wygenerowane pytania trafiają do istniejącego formularza edytora; zapis bez zmian
  przez `UserQuizService` (localStorage).

Publiczne API pozostałych serwisów (`QuizService`, `UserQuizService`) **się nie zmieniło**.

---

## 3. Jak uruchomić (jednorazowo)

1. **Klucz Gemini** — wejdź na [aistudio.google.com](https://aistudio.google.com/) →
   „Get API key". Konto Google wystarczy, karta kredytowa nie jest wymagana.

2. **Ustaw sekret** w Supabase (klucz nie ląduje w repo):

   ```bash
   npx supabase secrets set GEMINI_API_KEY=<twój-klucz>
   ```

3. **Wdróż funkcję.** Aplikacja nie ma logowania użytkowników, więc endpoint wdrażamy
   bez weryfikacji JWT:

   ```bash
   npx supabase functions deploy generate-quiz --no-verify-jwt
   ```

Po wdrożeniu odśwież aplikację — w edytorze quizu pojawi się panel „Generuj z AI".

---

## 4. Model danych (Gemini → aplikacja)

Model prosimy o **znormalizowany** kształt (bez unii typów), a Edge Function mapuje go
na `Question` z aplikacji:

| Pole modelu       | single            | multi                   | boolean         |
| ----------------- | ----------------- | ----------------------- | --------------- |
| `options`         | 3–4 odpowiedzi    | 3–5 odpowiedzi          | `[]`            |
| `correctIndexes`  | jeden indeks      | ≥1 indeks               | `[]`            |
| `correctBoolean`  | `false`           | `false`                 | poprawna wartość |

Pytania, które nie przejdą walidacji (brak treści, za mało opcji, brak poprawnej
odpowiedzi), są odrzucane po stronie serwera.

---

## 5. Ograniczenia i uwagi

- **Darmowy limit Gemini** — kilkanaście–kilkadziesiąt zapytań na minutę. Wystarcza do
  projektu, ale nie do dużego ruchu. Górny limit pytań na wywołanie (`MAX_QUESTIONS = 15`)
  chroni limit przed przypadkowym wyczerpaniem.
- **Endpoint jest publiczny** (bez logowania). Klucz Gemini jest bezpieczny (po stronie
  serwera), ale sam endpoint może być wołany bez konta. Naturalny następny krok:
  **rate limiting** w Edge Function (np. limit generowań na IP zapisywany w tabeli Supabase).
- **Jakość po polsku bywa nierówna** — dlatego zostaje człowiek w pętli (przegląd przed zapisem).

---

## 6. Regeneracja pojedynczego pytania (re-roll)

Generowanie wsadowe zastępuje **całą** listę pytań. Żeby poprawić jedno słabe pytanie bez
utraty reszty, przy każdym pytaniu w edytorze jest przycisk **„Wygeneruj na nowo"**:

- **Temat**: opcjonalne pole „o czym ma być to pytanie" przy danym pytaniu. Puste → temat =
  **tytuł quizu**. Dzięki temu re-roll działa też przy edycji zapisanego quizu (panel AI pusty).
- **Typ pytania dobiera AI** (single / multi / boolean) — tak jak przy generowaniu wsadowym.
- **Bez duplikatów**: teksty pozostałych pytań lecą do funkcji w polu `avoid`, więc model nie
  zwróci powtórki. Kategoria quizu **nie** jest przy re-rollu nadpisywana.
- **Jedno na raz** (single-flight): w trakcie regeneracji przyciski są zablokowane — chroni to
  darmowy limit Gemini.

Technicznie re-roll woła **tę samą** Edge Function `generate-quiz` z `count: 1` i bierze pierwsze
pytanie (`AiQuizService.regenerateQuestion(...)`) — brak nowego endpointu, jedno źródło walidacji.

> **Uwaga o wdrożeniu:** pole `avoid` obsługuje zaktualizowana funkcja — po zmianie wykonaj
> ponowny deploy: `npx supabase functions deploy generate-quiz --no-verify-jwt`. Do czasu
> redeployu re-roll działa, ale bez deduplikacji (stara funkcja ignoruje nieznane pole).
