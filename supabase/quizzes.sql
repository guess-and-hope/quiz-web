-- Etap 3: quizy w backendzie (Supabase)
-- Uruchom w Supabase Studio -> SQL Editor. Skrypt jest idempotentny (mozna
-- uruchamiac wielokrotnie): tworzy tabele, wlacza RLS z publicznym odczytem
-- i wgrywa/aktualizuje quizy (upsert po kolumnie id).
--
-- UWAGA: to plik generowany. Zrodlo danych: src/assets/quizzes/*.json.
-- Regeneracja:  node supabase/gen-quizzes-sql.mjs

create table if not exists public.quizzes (
  id          text primary key,
  title       text not null,
  description text,
  category    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  questions   jsonb not null default '[]'::jsonb
);

-- Row Level Security: tylko publiczny ODCZYT (zapis niedozwolony z frontendu).
alter table public.quizzes enable row level security;

drop policy if exists "Public read quizzes" on public.quizzes;
create policy "Public read quizzes"
  on public.quizzes
  for select
  to anon, authenticated
  using (true);

-- Seed / upsert z assets/quizzes/*.json
insert into public.quizzes (id, title, description, category, created_at, updated_at, questions)
select
  q->>'id',
  q->>'title',
  q->>'description',
  q->>'category',
  coalesce((q->>'createdAt')::timestamptz, now()),
  coalesce((q->>'updatedAt')::timestamptz, now()),
  coalesce(q->'questions', '[]'::jsonb)
from jsonb_array_elements($seed$
[
  {
    "id": "geografia",
    "title": "Geografia świata",
    "description": "Sprawdź swoją wiedzę o kontynentach, stolicach, górach i rzekach.",
    "category": "Geografia",
    "createdAt": "2026-09-15T00:00:00.000Z",
    "updatedAt": "2026-09-15T00:00:00.000Z",
    "questions": [
      {
        "id": "geo-1",
        "type": "single",
        "text": "Jaka jest stolica Australii?",
        "options": [
          "Sydney",
          "Canberra",
          "Melbourne",
          "Perth"
        ],
        "correct": 1,
        "explanation": "Canberra została zaprojektowana jako stolica jako kompromis między Sydney a Melbourne."
      },
      {
        "id": "geo-2",
        "type": "single",
        "text": "Która rzeka jest najdłuższa na świecie?",
        "options": [
          "Amazonka",
          "Nil",
          "Jangcy",
          "Mississippi"
        ],
        "correct": 1,
        "explanation": "Nil ma długość ok. 6650 km, choć niektóre pomiary wskazują Amazonkę jako dłuższą."
      },
      {
        "id": "geo-3",
        "type": "boolean",
        "text": "Kazachstan jest największym na świecie krajem bez dostępu do oceanu.",
        "correct": true,
        "explanation": "Kazachstan zajmuje powierzchnię ok. 2,7 mln km² i nie ma dostępu do żadnego oceanu ani otwartego morza."
      },
      {
        "id": "geo-4",
        "type": "multi",
        "text": "Które z poniższych państw leżą w Ameryce Południowej?",
        "options": [
          "Brazylia",
          "Meksyk",
          "Peru",
          "Kolumbia",
          "Panama"
        ],
        "correct": [
          0,
          2,
          3
        ],
        "explanation": "Meksyk i Panama należą do Ameryki Północnej (Panama do Ameryki Środkowej)."
      },
      {
        "id": "geo-5",
        "type": "single",
        "text": "Jaki jest najwyższy szczyt świata?",
        "options": [
          "K2",
          "Mount Everest",
          "Kanczendzonga",
          "Lhotse"
        ],
        "correct": 1,
        "explanation": "Mount Everest osiąga wysokość 8848,86 m n.p.m."
      },
      {
        "id": "geo-6",
        "type": "boolean",
        "text": "Sahara jest największą pustynią świata.",
        "correct": false,
        "explanation": "Sahara jest największą pustynią gorącą, ale największą pustynią na świecie jest Antarktyda (pustynia lodowa)."
      },
      {
        "id": "geo-7",
        "type": "single",
        "text": "Które państwo ma najdłuższą linię brzegową na świecie?",
        "options": [
          "Rosja",
          "Kanada",
          "Indonezja",
          "Australia"
        ],
        "correct": 1,
        "explanation": "Kanada ma najdłuższą linię brzegową na świecie – ok. 202 tys. km, głównie dzięki licznym wyspom i fiordom."
      },
      {
        "id": "geo-8",
        "type": "multi",
        "text": "Które kraje graniczą z Polską?",
        "options": [
          "Niemcy",
          "Węgry",
          "Czechy",
          "Ukraina",
          "Francja"
        ],
        "correct": [
          0,
          2,
          3
        ],
        "explanation": "Polska graniczy z 7 państwami; Węgry i Francja nie leżą przy jej granicy."
      }
    ]
  },
  {
    "id": "historia",
    "title": "Historia powszechna",
    "description": "Pytania o ważne wydarzenia, postacie i daty z historii świata i Polski.",
    "category": "Historia",
    "createdAt": "2026-09-15T00:00:00.000Z",
    "updatedAt": "2026-09-15T00:00:00.000Z",
    "questions": [
      {
        "id": "hist-1",
        "type": "single",
        "text": "W którym roku wybuchła II wojna światowa?",
        "options": [
          "1937",
          "1939",
          "1941",
          "1945"
        ],
        "correct": 1,
        "explanation": "II wojna światowa rozpoczęła się 1 września 1939 roku napaścią Niemiec na Polskę."
      },
      {
        "id": "hist-2",
        "type": "boolean",
        "text": "Mikołaj Kopernik był autorem dzieła \"O obrotach sfer niebieskich\".",
        "correct": true,
        "explanation": "Dzieło to zostało wydane w 1543 roku i przedstawiało heliocentryczną teorię budowy Układu Słonecznego."
      },
      {
        "id": "hist-3",
        "type": "single",
        "text": "Kto był pierwszym cesarzem Rzymu?",
        "options": [
          "Juliusz Cezar",
          "Oktawian August",
          "Neron",
          "Trajan"
        ],
        "correct": 1,
        "explanation": "Oktawian August został pierwszym cesarzem rzymskim w 27 roku p.n.e."
      },
      {
        "id": "hist-4",
        "type": "multi",
        "text": "Które z poniższych wydarzeń miały miejsce w XX wieku?",
        "options": [
          "Rewolucja francuska",
          "Upadek muru berlińskiego",
          "Odkrycie Ameryki",
          "Pierwsza wojna światowa",
          "Lot na Księżyc"
        ],
        "correct": [
          1,
          3,
          4
        ],
        "explanation": "Rewolucja francuska (1789) i odkrycie Ameryki (1492) miały miejsce przed XX wiekiem."
      },
      {
        "id": "hist-5",
        "type": "single",
        "text": "W którym roku Polska odzyskała niepodległość po zaborach?",
        "options": [
          "1905",
          "1918",
          "1920",
          "1939"
        ],
        "correct": 1,
        "explanation": "Polska odzyskała niepodległość 11 listopada 1918 roku."
      },
      {
        "id": "hist-6",
        "type": "boolean",
        "text": "Mur berliński upadł w 1989 roku.",
        "correct": true,
        "explanation": "Mur berliński upadł 9 listopada 1989 roku, symbolicznie kończąc podział Niemiec."
      },
      {
        "id": "hist-7",
        "type": "single",
        "text": "Kto dowodził wyprawą, która jako pierwsza opłynęła kulę ziemską?",
        "options": [
          "Krzysztof Kolumb",
          "Ferdynand Magellan",
          "Vasco da Gama",
          "James Cook"
        ],
        "correct": 1,
        "explanation": "Wyprawa Magellana rozpoczęła się w 1519 roku; sam odkrywca zginął po drodze, a wyprawę dokończył Juan Sebastián Elcano."
      },
      {
        "id": "hist-8",
        "type": "multi",
        "text": "Które państwa należały do aliantów podczas II wojny światowej?",
        "options": [
          "Wielka Brytania",
          "Włochy",
          "ZSRR",
          "Stany Zjednoczone",
          "Japonia"
        ],
        "correct": [
          0,
          2,
          3
        ],
        "explanation": "Włochy i Japonia należały do państw Osi, przeciwnika aliantów."
      }
    ]
  },
  {
    "id": "matematyka",
    "title": "Matematyka — podstawy",
    "description": "Zadania i pytania sprawdzające podstawową wiedzę matematyczną.",
    "category": "Matematyka",
    "createdAt": "2026-09-15T00:00:00.000Z",
    "updatedAt": "2026-09-15T00:00:00.000Z",
    "questions": [
      {
        "id": "mat-1",
        "type": "single",
        "text": "Ile wynosi 7 × 8?",
        "options": [
          "54",
          "56",
          "58",
          "64"
        ],
        "correct": 1
      },
      {
        "id": "mat-2",
        "type": "boolean",
        "text": "Liczba 17 jest liczbą pierwszą.",
        "correct": true,
        "explanation": "17 dzieli się tylko przez 1 i przez siebie samą, więc jest liczbą pierwszą."
      },
      {
        "id": "mat-3",
        "type": "single",
        "text": "Ile wynosi pierwiastek kwadratowy z 144?",
        "options": [
          "10",
          "11",
          "12",
          "14"
        ],
        "correct": 2
      },
      {
        "id": "mat-4",
        "type": "multi",
        "text": "Które z poniższych liczb są liczbami pierwszymi?",
        "options": [
          "2",
          "9",
          "13",
          "21",
          "29"
        ],
        "correct": [
          0,
          2,
          4
        ],
        "explanation": "9 = 3×3, a 21 = 3×7, więc nie są liczbami pierwszymi."
      },
      {
        "id": "mat-5",
        "type": "single",
        "text": "Ile stopni ma suma kątów w trójkącie?",
        "options": [
          "90°",
          "180°",
          "270°",
          "360°"
        ],
        "correct": 1
      },
      {
        "id": "mat-6",
        "type": "boolean",
        "text": "Zero jest liczbą naturalną parzystą.",
        "correct": true,
        "explanation": "Zero jest podzielne przez 2 bez reszty, więc jest liczbą parzystą."
      },
      {
        "id": "mat-7",
        "type": "single",
        "text": "Ile wynosi wartość wyrażenia 2³?",
        "options": [
          "6",
          "8",
          "9",
          "16"
        ],
        "correct": 1,
        "explanation": "2³ = 2 × 2 × 2 = 8."
      },
      {
        "id": "mat-8",
        "type": "multi",
        "text": "Które z poniższych ułamków są równe 0,5?",
        "options": [
          "1/2",
          "2/4",
          "3/4",
          "5/10",
          "2/3"
        ],
        "correct": [
          0,
          1,
          3
        ],
        "explanation": "1/2, 2/4 i 5/10 to różne zapisy tej samej wartości — połowy."
      }
    ]
  },
  {
    "id": "ciekawostki",
    "title": "Ciekawostki",
    "description": "Zbiór zaskakujących ciekawostek – a przynajmniej tak się wydaje. Uważaj na pułapki: pozornie oczywista odpowiedź często jest błędna.",
    "category": "Ciekawostki",
    "createdAt": "2026-09-19T00:00:00.000Z",
    "updatedAt": "2026-09-19T00:00:00.000Z",
    "questions": [
      {
        "id": "trik-0",
        "type": "single",
        "text": "Ile wnucząt ma babcia Gosia?",
        "options": [
          "3",
          "4",
          "5",
          "6",
          "42"
        ],
        "correct": 2,
        "explanation": "Ania i Michał Kijania spodziewają się dziecka!"
      },
      {
        "id": "trik-1",
        "type": "single",
        "text": "Jaka jest największa pustynia świata?",
        "options": [
          "Sahara",
          "Antarktyda",
          "Pustynia Gobi",
          "Kalahari"
        ],
        "correct": 1,
        "explanation": "Antarktyda to technicznie pustynia (bardzo mało opadów) i jest największa na świecie – Sahara jest największą pustynią gorącą, ale nie największą w ogóle."
      },
      {
        "id": "trik-2",
        "type": "single",
        "text": "Kto był pierwszym koronowanym królem Polski?",
        "options": [
          "Mieszko I",
          "Bolesław I Chrobry",
          "Kazimierz Wielki",
          "Władysław Łokietek"
        ],
        "correct": 1,
        "explanation": "Mieszko I był pierwszym historycznym władcą Polski, ale nigdy nie został koronowany. Pierwszym królem Polski był Bolesław I Chrobry, koronowany w 1025 roku."
      },
      {
        "id": "trik-3",
        "type": "single",
        "text": "Który kraj ma najwięcej stref czasowych?",
        "options": [
          "Rosja",
          "Francja",
          "Stany Zjednoczone",
          "Chiny"
        ],
        "correct": 1,
        "explanation": "To Francja, a nie Rosja, ma najwięcej stref czasowych na świecie – aż 12, dzięki terytoriom zamorskim jak Polinezja Francuska czy Gujana Francuska. Rosja ma ich 11. Ciekawostka: Chiny, mimo ogromnego terytorium rozciągającego się na szerokość geograficzną odpowiadającą aż 5 strefom, oficjalnie używają tylko jednej."
      },
      {
        "id": "trik-4",
        "type": "single",
        "text": "Z którym krajem Polska ma najdłuższą granicę lądową?",
        "options": [
          "Niemcy",
          "Czechy",
          "Ukraina",
          "Białoruś",
          "Słowacja"
        ],
        "correct": 1,
        "explanation": "Granica z Czechami liczy ok. 796 km i jest najdłuższa, mimo że wiele osób wskazuje Niemcy (ok. 467 km)."
      },
      {
        "id": "trik-5",
        "type": "single",
        "text": "Ile miesięcy w roku ma co najmniej 28 dni?",
        "options": [
          "1",
          "6",
          "12",
          "Żaden"
        ],
        "correct": 2,
        "explanation": "Każdy miesiąc ma co najmniej 28 dni – nie tylko luty. To klasyczna pułapka słowna."
      },
      {
        "id": "trik-6",
        "type": "single",
        "text": "Ile lat tak naprawdę trwała wojna stuletnia?",
        "options": [
          "42 lata",
          "100 lat",
          "108 lat",
          "116 lat",
          "150 lat"
        ],
        "correct": 3,
        "explanation": "Wbrew nazwie, wojna stuletnia między Anglią a Francją trwała w rzeczywistości 116 lat (1337–1453), z licznymi przerwami w walkach. \"42 lata\" to tylko żartobliwe nawiązanie do słynnej odpowiedzi na \"Pytanie o Życie, Wszechświat i Całą Resztę\" z \"Autostopem przez Galaktykę\"."
      },
      {
        "id": "trik-7",
        "type": "multi",
        "text": "Które z poniższych zwierząt są ssakami?",
        "options": [
          "Delfin",
          "Rekin",
          "Nietoperz",
          "Krokodyl",
          "Wieloryb"
        ],
        "correct": [
          0,
          2,
          4
        ],
        "explanation": "Rekin to ryba, a krokodyl to gad. Delfin, nietoperz i wieloryb są ssakami, mimo że żyją w wodzie lub latają."
      },
      {
        "id": "trik-8",
        "type": "single",
        "text": "Który kraj ma obecnie największą liczbę ludności na świecie?",
        "options": [
          "Chiny",
          "Indie",
          "Stany Zjednoczone",
          "Indonezja"
        ],
        "correct": 1,
        "explanation": "Od 2023 roku Indie mają więcej mieszkańców niż Chiny, mimo że przez dekady to Chiny kojarzono z najludniejszym krajem świata."
      },
      {
        "id": "trik-9",
        "type": "multi",
        "text": "Które z poniższych roślin są pod względem botanicznym owocami?",
        "options": [
          "Ogórek",
          "Papryka",
          "Bakłażan",
          "Dynia",
          "Groszek zielony"
        ],
        "correct": [
          0,
          1,
          2,
          3,
          4
        ],
        "explanation": "Zaskoczenie – wszystkie z nich to botanicznie owoce! Owoc to część rośliny, która rozwija się z zalążni kwiatu i zawiera nasiona. Ogórek, papryka, bakłażan, dynia i groszek spełniają tę definicję, choć w kuchni traktuje się je jak warzywa."
      },
      {
        "id": "trik-10",
        "type": "single",
        "text": "Która planeta znajduje się najbliżej Ziemi przez większość czasu?",
        "options": [
          "Wenus",
          "Mars",
          "Merkury",
          "Księżyc"
        ],
        "correct": 2,
        "explanation": "Choć to Wenus podchodzi najbliżej Ziemi w swoim minimum, obliczenia uwzględniające całe orbity pokazują, że przeciętnie najbliżej jest Merkury – Wenus i Mars więcej czasu spędzają dalej. Księżyc w ogóle nie może być tu poprawną odpowiedzią – to nie planeta, lecz naturalny satelita Ziemi, mimo że wydaje się najbliższym obiektem w kosmosie."
      },
      {
        "id": "trik-11",
        "type": "single",
        "text": "Który kraj, którego całe terytorium leży w Europie, ma największą powierzchnię?",
        "options": [
          "Francja",
          "Ukraina",
          "Hiszpania",
          "Szwecja",
          "Niemcy"
        ],
        "correct": 1,
        "explanation": "To Ukraina (ok. 604 tys. km²) jest największym krajem leżącym w całości w Europie – większym niż Francja (ok. 552 tys. km²), która bywa błędnie wskazywana, bo to największe państwo Unii Europejskiej. Rosja, choć ma jeszcze większą powierzchnię, tutaj się nie liczy, bo większa jej część leży w Azji."
      },
      {
        "id": "trik-12",
        "type": "multi",
        "text": "Które z poniższych zwierząt mają więcej niż 6 nóg?",
        "options": [
          "Pająk",
          "Mrówka",
          "Stonoga",
          "Pszczoła",
          "Krab"
        ],
        "correct": [
          0,
          2,
          4
        ],
        "explanation": "Mrówka i pszczoła to owady – mają po 6 nóg. Pająk ma 8, stonoga kilkadziesiąt, a krab 10."
      },
      {
        "id": "trik-14",
        "type": "single",
        "text": "Jaki jest największy organ w ciele człowieka?",
        "options": [
          "Wątroba",
          "Płuca",
          "Skóra",
          "Mózg"
        ],
        "correct": 2,
        "explanation": "Skóra jest największym organem człowieka – u dorosłego może ważyć nawet ok. 4 kg i mieć powierzchnię do 2 m²."
      },
      {
        "id": "trik-15",
        "type": "multi",
        "text": "Z których z poniższych przedmiotów Albert Einstein oblewał w szkole?",
        "options": [
          "Matematyka",
          "Fizyka",
          "Biologia",
          "Chemia",
          "Żadna z powyższych"
        ],
        "correct": [
          4
        ],
        "explanation": "To popularny mit – Einstein nigdy nie oblał żadnego z tych przedmiotów. Wręcz przeciwnie, już jako nastolatek radził sobie świetnie z matematyką i fizyką."
      },
      {
        "id": "trik-16",
        "type": "single",
        "text": "Ile razy trzeba złożyć kartkę papieru na pół, żeby jej grubość przekroczyła odległość do Księżyca (ok. 384 400 km)?",
        "options": [
          "42",
          "934",
          "12 012",
          "Nigdy, to fizycznie niemożliwe"
        ],
        "correct": 0,
        "explanation": "Grubość kartki podwaja się z każdym złożeniem (wzrost wykładniczy), więc już ok. 42 złożenia wystarczą, by przekroczyć odległość do Księżyca – choć fizycznie kartki nie da się złożyć więcej niż 7–8 razy."
      }
    ]
  }
]
$seed$::jsonb) as q
on conflict (id) do update set
  title       = excluded.title,
  description = excluded.description,
  category    = excluded.category,
  created_at  = excluded.created_at,
  updated_at  = excluded.updated_at,
  questions   = excluded.questions;
