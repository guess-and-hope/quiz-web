import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Ranking } from './ranking';
import { RankingEntry, ResultsService } from '../../services/results.service';
import { Quiz } from '../../models';
import { provideQuizServiceStub } from '../../testing/quiz-service.stub';

const quiz: Quiz = {
  id: 'geografia',
  title: 'Geografia świata',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [],
};

const entries: RankingEntry[] = [
  {
    playerName: 'Kuba',
    deviceId: 'd1',
    correct: 9,
    total: 10,
    percentage: 90,
    durationSeconds: 120,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    playerName: 'Asia',
    deviceId: 'd2',
    correct: 8,
    total: 10,
    percentage: 80,
    durationSeconds: 45,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('Ranking', () => {
  it('renders the top results fetched for the quiz', async () => {
    await TestBed.configureTestingModule({
      imports: [Ranking],
      providers: [
        provideRouter([]),
        provideQuizServiceStub([quiz]),
        {
          provide: ResultsService,
          useValue: { topForQuiz: async () => ({ entries, error: null }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Ranking);
    fixture.componentRef.setInput('id', 'geografia');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Geografia świata — ranking');
    expect(text).toContain('Kuba');
    expect(text).toContain('90%');
    expect(text).toContain('Asia');
  });

  it('shows an empty-state message when there are no results yet', async () => {
    await TestBed.configureTestingModule({
      imports: [Ranking],
      providers: [
        provideRouter([]),
        provideQuizServiceStub([quiz]),
        {
          provide: ResultsService,
          useValue: { topForQuiz: async () => ({ entries: [], error: null }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Ranking);
    fixture.componentRef.setInput('id', 'geografia');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nikt jeszcze nie zapisał wyniku');
  });

  it('renders entries in the order returned by the service and shows the time', async () => {
    await TestBed.configureTestingModule({
      imports: [Ranking],
      providers: [
        provideRouter([]),
        provideQuizServiceStub([quiz]),
        {
          provide: ResultsService,
          useValue: { topForQuiz: async () => ({ entries, error: null }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Ranking);
    fixture.componentRef.setInput('id', 'geografia');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const namesInOrder = Array.from(el.querySelectorAll('.ranking__name')).map(
      (n) => n.textContent?.trim().split('\n')[0],
    );

    // Kolejność (wynik, potem czas) jest już ustalona po stronie zapytania.
    expect(namesInOrder[0]).toContain('Kuba');
    expect(namesInOrder[1]).toContain('Asia');
    expect(el.textContent).toContain('2:00');
    expect(el.textContent).toContain('0:45');
  });
});
