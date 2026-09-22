import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizResult } from './quiz-result';
import { AttemptService } from '../../services/attempt.service';
import { Quiz } from '../../models';
import { provideQuizServiceStub } from '../../testing/quiz-service.stub';

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
    await TestBed.configureTestingModule({
      imports: [QuizResult],
      providers: [provideRouter([]), provideQuizServiceStub([quiz])],
    }).compileComponents();
  });

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
});
