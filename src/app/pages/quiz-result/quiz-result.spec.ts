import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizResult } from './quiz-result';
import { AttemptService } from '../../services/attempt.service';
import { FeedbackService } from '../../services/feedback.service';
import { Quiz } from '../../models';
import { provideQuizServiceStub } from '../../testing/quiz-service.stub';
import { provideUserQuizServiceStub } from '../../testing/user-quiz-service.stub';

const feedbackServiceStub = {
  getRatingSummary: async () => ({ summary: { up: 0, down: 0, myRating: null }, error: null }),
  getComments: async () => ({ comments: [], error: null }),
  setRating: async () => ({ error: null }),
  addComment: async () => ({ error: null }),
};

const quiz: Quiz = {
  id: 'geografia',
  title: 'Geografia świata',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [
    {
      id: 'q1',
      type: 'single',
      text: 'Pytanie 1?',
      options: ['A', 'B'],
      correct: 0,
      explanation: 'Bo tak.',
    },
    { id: 'q2', type: 'boolean', text: 'Pytanie 2?', correct: true },
  ],
};

function createFixture() {
  const fixture = TestBed.createComponent(QuizResult);
  fixture.componentRef.setInput('id', 'geografia');
  return fixture;
}

describe('QuizResult', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [QuizResult],
      providers: [
        provideRouter([]),
        provideQuizServiceStub([quiz]),
        provideUserQuizServiceStub(),
        { provide: FeedbackService, useValue: feedbackServiceStub },
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('prompts to solve the quiz when there is no attempt yet', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nie masz jeszcze wyniku');
  });

  it('shows the score and marks correct/wrong answers once an attempt was submitted', () => {
    TestBed.inject(AttemptService).submit('geografia', { q1: 0, q2: false });

    const fixture = createFixture();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('1 / 2 — 50%');
    expect(text).toContain('Bo tak.');
    expect(text).toContain('Poprawna odpowiedź: Prawda');
  });

  it('lets the player rate the quiz with a thumbs up and highlights the choice', async () => {
    TestBed.inject(AttemptService).submit('geografia', { q1: 0, q2: false });

    const fixture = createFixture();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const upBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.quiz-result__rating-btn',
    );
    upBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(upBtn.classList).toContain('quiz-result__rating-btn--active');
    expect(upBtn.querySelector('span:not(.material-symbols-outlined)')?.textContent).toBe('1');
  });

  it('requires a name before a comment can be submitted, and lists it once sent', async () => {
    TestBed.inject(AttemptService).submit('geografia', { q1: 0, q2: false });

    const fixture = createFixture();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const submitBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Dodaj komentarz',
    ) as HTMLButtonElement;
    const commentInput = el.querySelector('.quiz-result__comment-input') as HTMLTextAreaElement;
    const nameInputs = el.querySelectorAll(
      '.quiz-result__name-input',
    ) as NodeListOf<HTMLInputElement>;
    const nameInput = nameInputs[nameInputs.length - 1];

    commentInput.value = 'Super quiz!';
    commentInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(true);

    nameInput.value = 'Kasia';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(false);

    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.textContent).toContain('Kasia');
    expect(el.textContent).toContain('Super quiz!');
  });
});
