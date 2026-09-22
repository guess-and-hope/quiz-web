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
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    playerName: 'Asia',
    deviceId: 'd2',
    correct: 8,
    total: 10,
    percentage: 80,
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
});
