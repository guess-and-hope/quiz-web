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

  it('reorders entries by time when the "Wg czasu" toggle is clicked', async () => {
    await TestBed.configureTestingModule({
      imports: [Ranking],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ResultsService,
          useValue: { topForQuiz: async () => ({ entries, error: null }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Ranking);
    fixture.componentRef.setInput('id', 'geografia');
    flushQuizzes();

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const namesInOrder = () =>
      Array.from(el.querySelectorAll('.ranking__name')).map((n) => n.textContent?.trim().split('\n')[0]);

    // Domyślnie (wg wyniku) Kuba (90%) jest pierwszy.
    expect(namesInOrder()[0]).toContain('Kuba');

    const timeButton = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Wg czasu',
    )!;
    timeButton.click();
    fixture.detectChanges();

    // Po przełączeniu na czas Asia (45s) wyprzedza Kubę (120s).
    expect(namesInOrder()[0]).toContain('Asia');
  });
});
