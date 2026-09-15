# Quiz Web — Etap 1 (MVP)

Dokument zakresu: co ma zostać zaimplementowane w pierwszym etapie.
Bez BaaS, bez kont użytkowników, bez rankingów globalnych i pozostałych przyszłych funkcji.

---

## 1. Cel etapu

Działająca aplikacja quizowa po stronie przeglądarki, w której użytkownik może:
rozwiązać quiz, dostać punkty oraz zobaczyć, które odpowiedzi były poprawne.
Dane (quizy) trzymane w repozytorium jako pliki JSON — tylko do odczytu.

## 2. Stack technologiczny

- **Angular** (najnowsza stabilna wersja, standalone components, sygnały do stanu)
- **TypeScript** — modele danych jako interfejsy/typy
- **Angular Router** — nawigacja między ekranami
- **CSS/SCSS** (lub Angular Material — do decyzji przy implementacji)
- **Brak backendu** — dane: pliki JSON w repo (tylko do odczytu)

## 3. Zakres — w skrócie

**Wchodzi do Etapu 1:**
- Lista quizów
- Rozwiązywanie quizu (kilka typów pytań)
- Punktacja i ekran wyniku
- Podgląd poprawnych odpowiedzi + wyjaśnienia

**NIE wchodzi (patrz sekcja 12):**
- Dodawanie, edycja i usuwanie quizu (z walidacją)
- Import/eksport quizu jako plik JSON
- Zapis quizów użytkownika w `localStorage`
- Konta użytkowników, logowanie
- Globalny ranking, grywalizacja (odznaki, streak)
- Synchronizacja między urządzeniami, BaaS/backend
- Historia podejść między sesjami

## 4. Model danych

```ts
// Typ pytania
type QuestionType = 'single' | 'multi' | 'boolean';

interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string; // opcjonalne wyjaśnienie pokazywane na ekranie wyniku
}

interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single';
  options: string[];
  correct: number;        // indeks poprawnej odpowiedzi
}

interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi';
  options: string[];
  correct: number[];      // indeksy poprawnych odpowiedzi
}

interface BooleanQuestion extends BaseQuestion {
  type: 'boolean';
  correct: boolean;
}

type Question = SingleChoiceQuestion | MultiChoiceQuestion | BooleanQuestion;

interface Quiz {
  id: string;
  title: string;
  description?: string;
  category?: string;
  createdAt: string;      // ISO date
  updatedAt: string;      // ISO date
  questions: Question[];
}
```

Ten sam typ opisuje plik JSON w repo oraz logikę punktacji (jedno źródło prawdy).

## 5. Przechowywanie danych

- **Biblioteka quizów** — pliki JSON w repo, np. `src/assets/quizzes/*.json`
  (wczytywane przy starcie, tylko do odczytu).
- **Wyniki rozwiązania** — liczone w pamięci na czas sesji rozgrywki
  (bez trwałej historii — to kolejny etap).
- Warstwa dostępu do danych ukryta za serwisem (np. `QuizService`), aby w przyszłości
  podmienić źródło danych (pliki JSON) na `localStorage`/API bez zmiany komponentów.

## 6. Funkcjonalności (szczegółowo)

### 6.1 Lista quizów
- Wyświetla wszystkie quizy wczytane z plików JSON w repo.
- Dla każdego: tytuł, kategoria, liczba pytań, przycisk „Rozwiąż".

### 6.2 Rozwiązywanie quizu
- Pytania prezentowane pojedynczo (jedno pytanie na ekran).
- Obsługa typów: jednokrotny wybór, wielokrotny wybór, prawda/fałsz.
- Nawigacja: dalej / wstecz, wskaźnik postępu (np. „3 / 10").
- Przycisk „Zakończ i sprawdź" na końcu.
- Odpowiedzi użytkownika trzymane w stanie do momentu policzenia wyniku.

### 6.3 Punktacja
- 1 punkt za poprawnie odpowiedziane pytanie (dla `multi` — pełna zgodność zbiorów).
- Wynik prezentowany jako liczba punktów oraz procent (np. „7/10 — 70%").
- Zasada punktacji `multi` jednoznacznie: punkt tylko przy zaznaczeniu **wszystkich**
  poprawnych i **żadnej** błędnej.

### 6.4 Ekran wyniku
- Podsumowanie: punkty, procent, ewentualnie czas rozwiązania.
- Lista wszystkich pytań z oznaczeniem: odpowiedź użytkownika vs poprawna odpowiedź.
- Wyróżnienie kolorem: poprawne / błędne.
- Wyświetlenie wyjaśnienia (`explanation`), jeśli istnieje.
- Akcje: „Rozwiąż ponownie", „Wróć do listy".

## 7. Typy pytań (Etap 1)

| Typ | Opis | Odpowiedź |
|---|---|---|
| `single` | Jednokrotny wybór | jeden indeks |
| `multi` | Wielokrotny wybór | zbiór indeksów |
| `boolean` | Prawda / fałsz | wartość logiczna |

(Pytania otwarte / wpisywane — poza Etapem 1, ewentualnie kolejny etap.)

## 8. Ekrany i routing

| Ścieżka | Ekran |
|---|---|
| `/` lub `/quizzes` | Lista quizów |
| `/quiz/:id` | Rozwiązywanie quizu |
| `/quiz/:id/result` | Ekran wyniku |
| `**` | Strona 404 / przekierowanie na listę |

## 9. Architektura Angular (propozycja)

- **Komponenty**: `QuizListComponent`, `QuizPlayComponent`, `QuizResultComponent`,
  `QuestionComponent`.
- **Serwisy**: `QuizService` (wczytywanie quizów z JSON), `ScoringService`
  (logika punktacji).
- **Modele**: interfejsy z sekcji 4 w osobnym pliku `models/`.
- **Stan**: sygnały (signals) w serwisach; komponenty subskrybują.

## 10. Etapy implementacji

Kolejne, przyrostowe kroki. Po każdym aplikacja powinna się kompilować i uruchamiać.

### Krok 0 — Szkielet projektu
- Konfiguracja routingu (`app.routes.ts`) i struktury folderów: `models/`, `services/`,
  `components/` (lub `features/`).
- Podstawowy layout (nagłówek + `router-outlet`).
- **Ukończone, gdy:** `ng serve` startuje, widoczna pusta strona z routingiem.

### Krok 1 — Modele i dane
- Interfejsy TS z sekcji 4 w `models/`.
- 2–3 przykładowe quizy jako pliki JSON w `src/assets/quizzes/`
  (różne typy pytań, w tym `explanation`).
- `QuizService`: wczytanie quizów z JSON (`HttpClient`/`fetch`), udostępnienie
  jako sygnały; metody `getAll()` i `getById(id)`.
- **Ukończone, gdy:** serwis zwraca listę quizów wczytaną z plików.

### Krok 2 — Lista quizów
- `QuizListComponent` na trasie `/` (`/quizzes`).
- Karta/wiersz na quiz: tytuł, kategoria, liczba pytań, przycisk „Rozwiąż".
- **Ukończone, gdy:** lista renderuje quizy z `QuizService`, „Rozwiąż" nawiguje
  do `/quiz/:id`.

### Krok 3 — Rozwiązywanie quizu
- `QuizPlayComponent` na trasie `/quiz/:id` + `QuestionComponent` na pojedyncze pytanie.
- Obsługa typów `single` / `multi` / `boolean`, nawigacja dalej/wstecz, wskaźnik
  postępu, stan odpowiedzi w sygnałach.
- Przycisk „Zakończ i sprawdź".
- **Ukończone, gdy:** można przejść cały quiz i zebrać odpowiedzi w stanie.

### Krok 4 — Punktacja
- `ScoringService`: 1 pkt za pytanie, dla `multi` pełna zgodność zbiorów; wynik jako
  liczba punktów i procent.
- **Ukończone, gdy:** po „Zakończ i sprawdź" liczony jest poprawny wynik (testy
  jednostkowe reguł punktacji).

### Krok 5 — Ekran wyniku
- `QuizResultComponent` na trasie `/quiz/:id/result`.
- Podsumowanie (punkty, procent), lista pytań z porównaniem odpowiedzi (kolor
  poprawne/błędne), wyjaśnienia; akcje „Rozwiąż ponownie" / „Wróć do listy".
- **Ukończone, gdy:** ekran wyniku pokazuje pełny przegląd rozwiązania.

### Krok 6 — Dopracowanie
- Trasa `**` → 404 / przekierowanie na listę.
- Stany brzegowe (brak quizów, błąd wczytania JSON, nieznane `:id`).
- Style/porządki, podstawowa responsywność.
- **Ukończone, gdy:** spełnione wszystkie kryteria akceptacji (sekcja 11).

## 11. Kryteria akceptacji

- [ ] Użytkownik widzi listę quizów.
- [ ] Użytkownik rozwiązuje quiz z pytaniami różnych typów.
- [ ] Po zakończeniu widzi wynik (punkty + procent).
- [ ] Ekran wyniku pokazuje poprawne odpowiedzi i wyjaśnienia.
- [ ] Aplikacja działa jako statyczna strona bez backendu.

## 12. Poza zakresem Etapu 1 (następne kroki)

**Najbliższe kroki (przeniesione z Etapu 1):**
- Dodawanie, edycja i usuwanie quizu — formularz (Reactive Forms) z walidacją
  (tytuł wymagany, min. 1 pytanie, poprawne opcje i wskazanie poprawnych odpowiedzi).
- Import/eksport quizu jako plik JSON (walidacja zgodności ze schematem przy imporcie).
- Zapis quizów użytkownika w `localStorage` (dodane/zedytowane), przetrwanie odświeżenia.

**Dalsza przyszłość:**
- Konta użytkowników, logowanie, autoryzacja
- Backend / BaaS (Firebase, Supabase), wspólna baza danych
- Globalny ranking, leaderboard, tryb pojedynku
- Grywalizacja: odznaki, passa (streak), poziomy
- Trwała historia podejść i śledzenie postępów
- Synchronizacja między urządzeniami
- Timer z limitem czasu
- Wyszukiwanie i filtrowanie listy quizów (po tytule / kategorii)
- Mieszanie (losowa kolejność) pytań i odpowiedzi
- Pytania otwarte / wpisywane, pytania z obrazkami
- Tryb ciemny, wielojęzyczność, dostępność (a11y) na poziomie zaawansowanym
- Moderacja treści, quizy publiczne/prywatne
