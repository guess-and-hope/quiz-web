# Quiz Web — Etap 5: zdjęcia przy pytaniach (Pixabay)

W tym etapie dodajemy **opcjonalne zdjęcie do każdego pytania**. Zdjęcia pochodzą
z [Pixabay](https://pixabay.com/) (darmowe zdjęcia stockowe) — użytkownik w edytorze
wyszukuje hasło, wybiera jedno ze zdjęć, a aplikacja pokazuje je nad treścią pytania
podczas rozwiązywania quizu.

> Pierwotnie planowany był Pexels, ale w momencie wdrożenia Pexels miał tymczasowo
> wstrzymane wydawanie nowych kluczy API dla nowych kont, więc wybraliśmy Pixabay —
> rejestracja i klucz API działają tam bez ograniczeń. Front-end (`ImageSearchService`,
> `app-image-picker`) nie wie nic o konkretnym dostawcy — cała logika dostawcy jest
> schowana w jednej Edge Function, więc zmiana dostawcy w przyszłości to wyłącznie
> zmiana `supabase/functions/search-images/index.ts`.

---

## 1. Architektura

```
Przeglądarka (Angular)                     Supabase (serverless)            Pixabay
┌───────────────────────────┐   invoke     ┌────────────────────────┐  fetch  ┌──────────┐
│ quiz-editor                │ ───────────▶ │ Edge Function          │ ──────▶ │ Pixabay  │
│   → app-image-picker       │ {query}      │  search-images         │         │ API      │
│     → ImageSearchService   │              │  • klucz = SEKRET       │ ◀────── │          │
│   ← QuestionImage (URL)    │ ◀─────────── │  • zwraca listę zdjęć   │  JSON   └──────────┘
└───────────────────────────┘  wyniki       └────────────────────────┘
```

- **Klucz API Pixabay nigdy nie trafia do przeglądarki** — trzymany jest jako sekret
  po stronie Edge Function, tak samo jak klucz Gemini przy generowaniu AI (etap 4).
- **Zdjęcia nie są kopiowane na nasz serwer** — zapisujemy tylko URL z Pixabay CDN
  (`webformatURL`) razem z danymi do atrybucji. To hotlinkowanie, a nie hostowanie
  własnej kopii.
- **Jeden ustalony wymiar kadrowania**: wszystkie zdjęcia (w edytorze, w wynikach
  wyszukiwania i w widoku rozwiązywania quizu) są pokazywane w tym samym pudełku
  16:9 z `object-fit: cover` — niezależnie od proporcji oryginału, kadr wygląda
  spójnie. Definicja jest w jednym miejscu: `src/app/shared/_question-image.scss`.

---

## 2. Co doszło w kodzie

- `src/app/models/question.model.ts` — nowy typ `QuestionImage` (`url`,
  `photographer`, `photographerUrl`, `sourceUrl`) i opcjonalne pole
  `image?: QuestionImage` na `BaseQuestion`. Pytania bez zdjęcia działają bez zmian
  (pole jest opcjonalne, `questions` w bazie to i tak `jsonb` — **nie trzeba migracji**).
- `supabase/functions/_shared/pixabay.ts` — `searchPixabay(apiKey, query, perPage)`,
  wspólna funkcja wołająca `GET https://pixabay.com/api/` i zwracająca znormalizowaną
  listę `{ id, thumbnailUrl, url, photographer, photographerUrl, sourceUrl }`. Używają
  jej obie Edge Functions poniżej.
- `supabase/functions/search-images/index.ts` — Edge Function (Deno) dla ręcznego
  wyszukiwania w edytorze; woła `searchPixabay` z sekretem `PIXABAY_API_KEY`.
- `supabase/functions/generate-quiz/index.ts` — **AI samo dobiera zdjęcia**: prompt do
  Gemini prosi o dodatkowe pole `imageQuery` (krótkie hasło po angielsku) przy każdym
  pytaniu, a funkcja po stronie serwera woła dla każdego pytania `searchPixabay` i
  dokleja pierwszy wynik jako `image`. Jeśli `PIXABAY_API_KEY` nie jest ustawiony albo
  wyszukiwanie dla któregoś pytania zawiedzie/nie da wyników, to pytanie po prostu
  zostaje bez zdjęcia — nigdy nie przerywa całej generacji.
- `src/app/services/image-search.service.ts` — `ImageSearchService.search(query)`
  wołające funkcję przez `supabase.client.functions.invoke('search-images', …)`.
- `src/app/components/image-picker/*` — `app-image-picker`: reużywalny komponent
  z przyciskiem „Dodaj zdjęcie", panelem wyszukiwania (siatka miniaturek) i podglądem
  wybranego zdjęcia z linkiem do fotografa/Pixabay (wymagana atrybucja).
- `src/app/pages/quiz-editor/*` — każde pytanie w formularzu ma sekcję „Zdjęcie
  (opcjonalnie)" z `app-image-picker`.
- `src/app/components/quiz-question/*` — jeśli pytanie ma `image`, pokazuje je nad
  treścią pytania podczas rozwiązywania quizu.

Publiczne API `QuizService` i `UserQuizService` **się nie zmieniło** — zdjęcie to
zwykłe pole w JSON-ie pytania, zapisywane/wczytywane tak samo jak reszta.

---

## 3. Jak uruchomić (jednorazowo)

1. **Klucz Pixabay** — załóż darmowe konto na [pixabay.com](https://pixabay.com/),
   zaloguj się i wejdź na [pixabay.com/api/docs](https://pixabay.com/api/docs/) —
   klucz API jest widoczny od razu na stronie (nie trzeba nic zatwierdzać).

2. **Ustaw sekret** w Supabase (klucz nie ląduje w repo):

   ```bash
   npx supabase secrets set PIXABAY_API_KEY=<twój-klucz>
   ```

3. **Wdróż obie funkcje** (bez weryfikacji JWT, tak jak `generate-quiz` — aplikacja nie ma logowania).
   `generate-quiz` trzeba wdrożyć ponownie nawet jeśli już istniała (etap 4) — doszło do niej
   automatyczne dobieranie zdjęć:

   ```bash
   npx supabase functions deploy search-images --no-verify-jwt
   npx supabase functions deploy generate-quiz --no-verify-jwt
   ```

Sekret `PIXABAY_API_KEY` jest wspólny dla całego projektu, więc wystarczy ustawić go raz —
korzystają z niego obie funkcje.

Po wdrożeniu odśwież aplikację — w edytorze quizu, przy każdym pytaniu, pojawi się
przycisk „Dodaj zdjęcie z Pixabay", a generowanie przez AI samo dołączy zdjęcia, gdy je znajdzie.

---

## 4. Ograniczenia i uwagi

- **Darmowy limit Pixabay** — 100 zapytań/60 sekund. Wystarcza do projektu; przy
  dużym ruchu warto rozważyć cache wyników po stronie funkcji.
- **Atrybucja** — przy każdym wybranym zdjęciu pokazujemy link „Foto: [autor] /
  Pixabay" prowadzący do profilu autora na Pixabay.
- **Zdjęcia z AI bywają nietrafione** — `imageQuery` to podpowiedź od Gemini, nie
  gwarancja trafności (np. dla pytań bez wyraźnego motywu wizualnego). Zdjęcie zawsze
  można podejrzeć, zmienić albo usunąć w edytorze przed zapisaniem quizu — ten sam
  „człowiek w pętli", co przy samych pytaniach (etap 4).
- **Żadne dwa pytania nie dostają tego samego zdjęcia** — dla każdego pytania pobieramy
  kilku kandydatów (nie tylko jeden najlepszy wynik) i przydzielamy je sekwencyjnie:
  pytanie dostaje pierwszego kandydata, który nie trafił już do wcześniejszego pytania.
  Ma to znaczenie głównie przy podobnych `imageQuery` (np. dwa pytania o ten sam kraj).
  Jeśli wszyscy kandydaci danego pytania są już zajęci, to pytanie zostaje bez zdjęcia
  zamiast dublować cudze.
- **Generowanie z AI trwa trochę dłużej** — dochodzi do 20 dodatkowych, równoległych
  zapytań do Pixabay (po jednym na pytanie), więc odpowiedź `generate-quiz` może zająć
  1-2 sekundy więcej niż przed tym etapem.
