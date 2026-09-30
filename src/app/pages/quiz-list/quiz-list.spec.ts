import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizList } from './quiz-list';
import { FeedbackService } from '../../services/feedback.service';
import { ResultsService } from '../../services/results.service';
import { QuizSearchService } from '../../services/quiz-search.service';
import { Quiz } from '../../models';
import { provideQuizServiceStub } from '../../testing/quiz-service.stub';
import { provideUserQuizServiceStub } from '../../testing/user-quiz-service.stub';

const noStats = {
  feedback: { provide: FeedbackService, useValue: { getLikeCounts: async () => ({}) } },
  results: { provide: ResultsService, useValue: { getSolveCounts: async () => ({}) } },
};

const quiz: Quiz = {
  id: 'geografia',
  title: 'Geografia świata',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [],
};

describe('QuizList', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [
        provideRouter([]),
        provideQuizServiceStub(),
        provideUserQuizServiceStub(),
        noStats.feedback,
        noStats.results,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizList);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows curated and user-submitted quizzes together in a single list', async () => {
    const curated: Quiz = {
      id: 'curated',
      title: 'Quiz sprawdzony',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      questions: [],
    };
    const userSubmitted: Quiz = {
      id: 'user-submitted',
      title: 'Quiz użytkownika',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      questions: [],
    };

    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [
        provideRouter([]),
        provideQuizServiceStub([curated]),
        provideUserQuizServiceStub([userSubmitted]),
        noStats.feedback,
        noStats.results,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizList);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Quiz sprawdzony');
    expect(text).toContain('Quiz użytkownika');
  });

  it('shows the like and solve counts for each quiz', async () => {
    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [
        provideRouter([]),
        provideQuizServiceStub([quiz]),
        provideUserQuizServiceStub(),
        {
          provide: FeedbackService,
          useValue: { getLikeCounts: async () => ({ geografia: 7 }) },
        },
        {
          provide: ResultsService,
          useValue: { getSolveCounts: async () => ({ geografia: 3 }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizList);
    fixture.detectChanges();
    await fixture.whenStable();
    // Flush the promise chain the effect kicked off (whenStable doesn't
    // track it, since it isn't registered as an Angular pending task).
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('7');
    expect(text).toContain('3');
  });

  it('shows only the browser\'s own quizzes when the "mine only" filter is on', async () => {
    const mine: Quiz = {
      id: 'mine',
      title: 'Mój quiz',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
      questions: [],
    };
    const theirs: Quiz = {
      id: 'theirs',
      title: 'Cudzy quiz',
      createdAt: '2026-01-04T00:00:00.000Z',
      updatedAt: '2026-01-04T00:00:00.000Z',
      questions: [],
    };

    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [
        provideRouter([]),
        provideQuizServiceStub(),
        provideUserQuizServiceStub([mine, theirs], ['mine']),
        noStats.feedback,
        noStats.results,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizList);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mój quiz');
    expect(fixture.nativeElement.textContent).toContain('Cudzy quiz');

    TestBed.inject(QuizSearchService).mineOnly.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mój quiz');
    expect(fixture.nativeElement.textContent).not.toContain('Cudzy quiz');
  });

  it('lets an owner delete their own quiz from the list', async () => {
    const mine: Quiz = {
      id: 'mine',
      title: 'Mój quiz',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
      questions: [],
    };

    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [
        provideRouter([]),
        provideQuizServiceStub(),
        provideUserQuizServiceStub([mine], ['mine']),
        noStats.feedback,
        noStats.results,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizList);
    fixture.detectChanges();

    // Owner-only actions are visible for a quiz this browser owns.
    expect(fixture.nativeElement.textContent).toContain('Edytuj');

    fixture.componentInstance['confirmDelete'](mine);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Na pewno chcesz usunąć');

    await fixture.componentInstance['deleteConfirmed']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Mój quiz');
  });
});
