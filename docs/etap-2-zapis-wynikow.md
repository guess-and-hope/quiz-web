# Quiz Web — Etap 2: flow zapisu wyniku i identyfikacja gracza

Dokument decyzyjny: **jak ma wyglądać przepływ (flow)** zapisania wyniku i „kim jest
gracz" na wspólnej stronie najlepszych wyników.

Założenia:

- Strona **rozrywkowa** — priorytetem jest **minimalny kłopot dla gracza**, a nie twarde
  zabezpieczenia. Świadomie działamy w „trybie honorowym" (można podać dowolny nick,
  wynik liczy przeglądarka).
- **Gdzie** zapisujemy jest już rozstrzygnięte: **Supabase** (integracja w toku).
  Ten dokument dotyczy wyłącznie **UX/flow i tożsamości** — patrz też sekcja „Co
  przechowujemy" i skrócone porównanie backendów w dodatku.

---

## 1. Kluczowe decyzje do podjęcia

1. **Logowanie czy nick?** → **Nick, bez logowania.** Dla strony rozrywkowej konto
   (e-mail/hasło/OAuth) to za duża bariera; odstrasza i wymaga obsługi resetu hasła,
   RODO itd. Nick w zupełności wystarcza do rankingu.
2. **Kiedy pytać o nick?** → **Leniwie** — granie nie wymaga niczego; o nick prosimy
   dopiero, gdy gracz chce **zapisać** wynik / trafić na ranking.
3. **Jak zapamiętać nick między sesjami?** → **`localStorage`** — raz podany nick
   podpowiadamy przy kolejnych zapisach (bez ponownego wpisywania).
4. **Jak rozpoznać „to Ty" bez logowania?** → **anonimowy identyfikator urządzenia
   (losowy UUID w `localStorage`)** — pozwala wyróżnić własne wpisy na rankingu i
   ewentualnie edytować/usunąć swój wynik, mimo braku konta.
5. **Zapis: przycisk czy automatycznie?** → gdy nick jest **już znany**, wystarczy
   **jedno kliknięcie** („Zapisz jako <nick>") albo auto-zapis; gdy nieznany — pole +
   przycisk (tak jak dziś).

---

## 2. Warianty flow (od najmniejszego do największego frictionu)

| Wariant                        | Na czym polega                                                      | Friction               | Wspólny, imienny ranking | Uwaga                       |
| ------------------------------ | ------------------------------------------------------------------- | ---------------------- | ------------------------ | --------------------------- |
| **A. Całkiem anonimowo**       | brak nicka, etykieta „Anonim"/losowa                                | zerowy                 | ⚠️ bezimienny            | ranking mało atrakcyjny     |
| **B. Nick za każdym razem**    | pole na nick po każdym quizie (**stan obecny**)                     | niski, ale powtarzalny | ✅                       | gracz wpisuje nick w kółko  |
| **C. Nick zapamiętany** ⭐     | pytamy raz, potem podpowiadamy z `localStorage`                     | **najniższy sensowny** | ✅                       | najlepszy kompromis         |
| **D. Nick + ID urządzenia** ⭐ | jak C + losowy UUID = „moje wyniki", edycja/usuwanie własnego wpisu | najniższy              | ✅ + „to Ty"             | trochę więcej pracy         |
| **E. Logowanie (konto/OAuth)** | trwała tożsamość między urządzeniami                                | **wysoki**             | ✅ + między urządzeniami | przerost formy dla rozrywki |

**Rekomendacja: C jako baza, z elementami D** (ID urządzenia). Daje wrażenie „konta"
(pamięta mnie, wyróżnia moje wyniki) **bez żadnego logowania**.

---

## 3. Rekomendowany flow — krok po kroku

### 3.1 Pierwsza wizyta (nie znamy jeszcze gracza)

1. Gracz wchodzi i **od razu gra** — żadnej bramki, żadnego pytania o nick.
2. Przy pierwszym uruchomieniu (w tle) generujemy **`deviceId`** (losowy UUID) i
   zapisujemy w `localStorage`. Gracz tego nie widzi.
3. Po quizie na ekranie wyniku widzi: punkty + procent + pole **„Wpisz nick, żeby
   trafić na ranking"** i przycisk **„Zapisz wynik"**.
4. Po zapisie: nick trafia do `localStorage` (`quiz.playerName`), a wynik do bazy
   (z `deviceId`). Komunikat: „Zapisano jako <nick>".

### 3.2 Kolejne wizyty / kolejne quizy (znamy nick)

1. Gracz gra jak zwykle.
2. Na ekranie wyniku **nie pytamy ponownie** o nick — pokazujemy:
   > Grasz jako **<nick>**. &nbsp; [ Zapisz wynik ] &nbsp; · &nbsp; _to nie Ty? zmień_
3. **Jedno kliknięcie** zapisuje wynik. (Opcjonalnie: auto-zapis od razu po wejściu na
   ekran wyniku — do rozstrzygnięcia, patrz 5.1.)
4. „_to nie Ty? zmień_" → wraca pole na nick (i podmienia zapamiętany nick).

### 3.3 Strona najlepszych wyników (`/ranking`)

1. TOP N (np. 20) posortowane malejąco (procent → liczba trafień → najwcześniejszy czas).
2. Wpisy z **moim `deviceId`** są **wyróżnione** („to Ty") i mogą mieć akcję _usuń mój
   wynik_.
3. Filtr po quizie (opcjonalnie) i/lub sekcja „Twoje najlepsze wyniki".

### 3.4 Szkic ekranu wyniku (stany)

```
NIEZNANY NICK                         ZNANY NICK
┌───────────────────────────┐        ┌───────────────────────────┐
│  Twój wynik: 7/10 (70%)   │        │  Twój wynik: 7/10 (70%)   │
│                           │        │  Grasz jako: KUBA          │
│  [ Twój nick ..........]  │        │  [  Zapisz wynik  ]        │
│  [   Zapisz wynik    ]    │        │  to nie Ty? zmień          │
└───────────────────────────┘        └───────────────────────────┘
        │  po zapisie                          │  po zapisie
        ▼                                       ▼
   „Zapisano jako KUBA ✓  ·  Zobacz ranking →"
```

---

## 4. Co przechowujemy i gdzie

**W przeglądarce gracza (`localStorage`) — tożsamość, wygoda:**

| Klucz             | Wartość      | Po co                                               |
| ----------------- | ------------ | --------------------------------------------------- |
| `quiz.playerName` | nick (tekst) | podpowiadanie nicka, „grasz jako…"                  |
| `quiz.deviceId`   | losowy UUID  | wyróżnienie „to Ty", edycja/usuwanie własnego wpisu |

**W bazie (Supabase, tabela `results`) — dane rankingu:**

- istniejące: `quiz_id`, `quiz_title`, `player_name`, `correct`, `total`,
  `percentage`, `created_at`;
- **do dodania (dla wariantu D):** `device_id` (uuid) — pozwala oznaczyć „moje" wpisy
  i ograniczyć edycję/usuwanie do własnych.

> `deviceId` to losowy identyfikator urządzenia/przeglądarki, **nie dane osobowe** —
> nie łączy się z tożsamością gracza, dopóki sam nie poda nicka.

---

## 5. Decyzje „do domknięcia" (drobne przełączniki)

### 5.1 Auto-zapis czy jedno kliknięcie?

- **Jedno kliknięcie** (rekomendacja): gracz świadomie decyduje, że chce trafić na
  ranking; unika przypadkowych/śmieciowych wpisów.
- **Auto-zapis**: zero klikania, ale zapisuje też słabe/testowe podejścia.

### 5.2 Które wyniki pokazywać na rankingu?

- **Najlepszy wynik na (gracz + quiz)** (rekomendacja): ranking się nie zapycha
  wielokrotnymi podejściami tej samej osoby.
- **Wszystkie podejścia**: prościej w implementacji, ale ranking bywa zaśmiecony.

### 5.3 Duplikaty nicków

- Dopuszczamy (to nie konta). Rozróżnienie „to Ty" i tak opiera się na `deviceId`,
  nie na nicku.

---

## 6. Przypadki brzegowe (i jak je traktujemy)

- **Gracz czyści dane przeglądarki** → znika nick i `deviceId`; przy następnym zapisie
  poda nick ponownie, dostanie nowy `deviceId`. Akceptowalne dla rozrywki.
- **Jedno urządzenie, wiele osób** → dzielą nick/`deviceId`; ratuje to „_to nie Ty?
  zmień_". Akceptowalne.
- **Jedna osoba, wiele urządzeń** → bez logowania to osobne tożsamości; nie połączymy
  ich. Akceptowalne (to koszt braku kont).
- **Pusty nick** → blokujemy zapis (przycisk nieaktywny) — już zaimplementowane.

---

## 7. Prywatność (lekko, ale świadomie)

- Prosimy o **nick/pseudonim**, nie o dane osobowe — krótka notka przy polu
  („nie wpisuj imienia i nazwiska").
- Ranking jest publiczny — to naturalne dla tablicy wyników.
- `deviceId` jest losowy i anonimowy.

---

## 8. Rekomendacja (podsumowanie)

- **Bez logowania.** Nick zamiast konta.
- **Nick zapamiętany w `localStorage`**, pytany raz i podpowiadany dalej (wariant C).
- **Anonimowy `deviceId` (UUID)**, żeby wyróżniać „to Ty" i pozwolić usunąć własny
  wpis bez konta (element wariantu D).
- **Zapis jednym kliknięciem**, gdy nick jest znany; leniwie — dopiero na ekranie wyniku.
- Ranking = **najlepszy wynik na gracza+quiz**, TOP N, z wyróżnieniem moich wpisów.

To daje wrażenie „pamięta mnie" i przyjemny, imienny ranking **przy zerowej barierze
wejścia** — zgodnie z celem strony rozrywkowej.

### Co to zmienia w kodzie (skrót)

- `localStorage`: odczyt/zapis `quiz.playerName` (pre-fill pola nicka) i lazy-init
  `quiz.deviceId`.
- Ekran wyniku: dwa stany (nieznany / znany nick) + „to nie Ty? zmień".
- `results`: dodać kolumnę `device_id`; wysyłać ją przy zapisie.
- Nowa trasa `/ranking` + komponent listy (sortowanie, wyróżnienie moich wpisów).

---

## Dodatek — gdzie zapisujemy (skrót, decyzja już podjęta)

Backend rankingu = **Supabase** (Postgres jako usługa), bo integracja jest już
rozpoczęta i to najmniejszy dodatkowy nakład. Rozważane alternatywy i dlaczego odpadły:

- **Firebase** — dobra alternatywa (ranking na żywo), ale wymaga przepisania gotowej
  integracji Supabase.
- **Google Sheets + Apps Script** — wygodny wgląd w dane w arkuszu, ale to backend
  „domowej roboty" (limity, zimny start).
- **Airtable** — najładniejszy panel, ale token z prawem zapisu to prawdziwy sekret →
  wymaga dodatkowego pośrednika.
- **`localStorage` samodzielnie** — najprostsze, ale wyniki tylko lokalnie → **nie ma
  wspólnego rankingu**. Używamy go tylko do tożsamości (nick + `deviceId`), nie jako
  magazyn rankingu.
