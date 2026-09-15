# Quiz Web — Etap 1 (MVP)

Dokument zakresu: co ma zostać zaimplementowane w pierwszym etapie.
Bez BaaS, bez kont użytkowników, bez rankingów globalnych i pozostałych przyszłych funkcji.

---

## 1. Cel etapu

Działająca aplikacja quizowa po stronie przeglądarki, w której użytkownik może:
rozwiązać quiz, dostać punkty, zobaczyć które odpowiedzi były poprawne oraz
samodzielnie dodawać, edytować i usuwać quizy. Dane trzymane lokalnie (JSON + `localStorage`).

## 2. Stack technologiczny

- **Angular** (najnowsza stabilna wersja, standalone components, sygnały do stanu)
- **TypeScript** — modele danych jako interfejsy/typy
- **Angular Router** — nawigacja między ekranami
- **Reactive Forms** — formularz dodawania/edycji quizu
- **CSS/SCSS** (lub Angular Material — do decyzji przy implementacji)
- **Brak backendu** — dane: pliki JSON w repo + `localStorage`

## 3. Zakres — w skrócie

**Wchodzi do Etapu 1:**
- Lista quizów z wyszukiwarką/filtrowaniem
- Rozwiązywanie quizu (kilka typów pytań)
- Punktacja i ekran wyniku
- Podgląd poprawnych odpowiedzi + wyjaśnienia
- Dodawanie, edycja i usuwanie quizu (z walidacją)
- Import/eksport quizu jako plik JSON

**NIE wchodzi (patrz sekcja 12):**
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

Ten sam typ opisuje: plik JSON w repo, formularz dodawania oraz logikę punktacji
(jedno źródło prawdy).

## 5. Przechowywanie danych

- **Startowa biblioteka quizów** — pliki JSON w repo, np. `src/assets/quizzes/*.json`
  (wczytywane przy starcie, tylko do odczytu).
- **Quizy użytkownika** — zapisywane w `localStorage` (dodane, zedytowane, usunięte).
- **Wyniki rozwiązania** — liczone w pamięci na czas sesji rozgrywki
  (bez trwałej historii — to Etap 2).
- Warstwa dostępu do danych ukryta za serwisem (np. `QuizService`), aby w przyszłości
  podmienić `localStorage` na API bez zmiany komponentów.

## 6. Funkcjonalności (szczegółowo)

### 6.1 Lista quizów
- Wyświetla wszystkie quizy (z repo + z `localStorage`).
- Dla każdego: tytuł, kategoria, liczba pytań, przyciski „Rozwiąż" / „Edytuj" / „Usuń".
- Pole wyszukiwania po tytule oraz opcjonalny filtr po kategorii.
- Przycisk „Dodaj quiz" oraz „Importuj z pliku".

### 6.2 Rozwiązywanie quizu
- Pytania prezentowane pojedynczo lub jako lista (do decyzji — domyślnie pojedynczo).
- Obsługa typów: jednokrotny wybór, wielokrotny wybór, prawda/fałsz.
- Nawigacja: dalej / wstecz, wskaźnik postępu (np. „3 / 10").
- Opcjonalne mieszanie kolejności pytań i odpowiedzi.
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

### 6.5 Dodawanie quizu
- Formularz (Reactive Forms): tytuł, opis, kategoria.
- Dynamiczne dodawanie/usuwanie pytań.
- Dla każdego pytania: wybór typu, treść, opcje odpowiedzi, wskazanie poprawnej,
  opcjonalne wyjaśnienie.
- Zapis do `localStorage`.

### 6.6 Edycja / usuwanie quizu
- Edycja: ten sam formularz co dodawanie, wypełniony danymi quizu.
- Usuwanie: z potwierdzeniem.
- Uwaga: quizy startowe z repo są tylko do odczytu (edycja tworzy kopię w `localStorage`
  — do decyzji przy implementacji; domyślnie: edytowalne tylko quizy użytkownika).

### 6.7 Import / eksport JSON
- **Eksport**: pobranie wybranego quizu jako plik `.json`.
- **Import**: wczytanie pliku `.json`, walidacja zgodności ze schematem, zapis do `localStorage`.
- To zastępuje „współdzielenie" quizów bez backendu.

## 7. Typy pytań (Etap 1)

| Typ | Opis | Odpowiedź |
|---|---|---|
| `single` | Jednokrotny wybór | jeden indeks |
| `multi` | Wielokrotny wybór | zbiór indeksów |
| `boolean` | Prawda / fałsz | wartość logiczna |

(Pytania otwarte / wpisywane — poza Etapem 1, ewentualnie Etap 2.)

## 8. Ekrany i routing

| Ścieżka | Ekran |
|---|---|
| `/` lub `/quizzes` | Lista quizów |
| `/quiz/:id` | Rozwiązywanie quizu |
| `/quiz/:id/result` | Ekran wyniku |
| `/create` | Dodawanie quizu |
| `/quiz/:id/edit` | Edycja quizu |
| `**` | Strona 404 / przekierowanie na listę |

## 9. Architektura Angular (propozycja)

- **Komponenty**: `QuizListComponent`, `QuizPlayComponent`, `QuizResultComponent`,
  `QuizFormComponent` (współdzielony dla dodawania/edycji), `QuestionComponent`.
- **Serwisy**: `QuizService` (CRUD + wczytywanie JSON), `StorageService`
  (opakowanie `localStorage`), `ScoringService` (logika punktacji).
- **Modele**: interfejsy z sekcji 4 w osobnym pliku `models/`.
- **Stan**: sygnały (signals) w serwisach; komponenty subskrybują.

## 10. Walidacja

**Formularz quizu:**
- Tytuł wymagany (min. długość, np. 3 znaki).
- Min. 1 pytanie w quizie.
- Każde pytanie: niepusta treść.
- `single`/`multi`: min. 2 opcje, brak pustych opcji.
- `single`: dokładnie jedna poprawna; `multi`: min. jedna poprawna; `boolean`: wybrana wartość.

**Import JSON:**
- Sprawdzenie zgodności ze schematem; przy błędzie — czytelny komunikat, brak zapisu.

## 11. Kryteria akceptacji

- [ ] Użytkownik widzi listę quizów i może ją przeszukać.
- [ ] Użytkownik rozwiązuje quiz z pytaniami różnych typów.
- [ ] Po zakończeniu widzi wynik (punkty + procent).
- [ ] Ekran wyniku pokazuje poprawne odpowiedzi i wyjaśnienia.
- [ ] Użytkownik może dodać nowy quiz przez formularz (z walidacją).
- [ ] Użytkownik może edytować i usunąć własny quiz.
- [ ] Quizy przetrwają odświeżenie strony (`localStorage`).
- [ ] Użytkownik może wyeksportować i zaimportować quiz jako JSON.
- [ ] Aplikacja działa jako statyczna strona bez backendu.

## 12. Poza zakresem Etapu 1 (przyszłość)

- Konta użytkowników, logowanie, autoryzacja
- Backend / BaaS (Firebase, Supabase), wspólna baza danych
- Globalny ranking, leaderboard, tryb pojedynku
- Grywalizacja: odznaki, passa (streak), poziomy
- Trwała historia podejść i śledzenie postępów
- Synchronizacja między urządzeniami
- Timer z limitem czasu (opcjonalnie do rozważenia już w E1)
- Pytania otwarte / wpisywane, pytania z obrazkami
- Tryb ciemny, wielojęzyczność, dostępność (a11y) na poziomie zaawansowanym
- Moderacja treści, quizy publiczne/prywatne
