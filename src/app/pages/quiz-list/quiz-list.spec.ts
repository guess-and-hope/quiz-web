import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizList } from './quiz-list';
import { FeedbackService } from '../../services/feedback.service';
import { ResultsService } from '../../services/results.service';
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

  it('shows both the curated and the user-submitted quiz sections', async () => {
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
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sprawdzone quizy');
    expect(text).toContain('Quizy użytkowników');
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
});
