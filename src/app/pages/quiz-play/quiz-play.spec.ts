import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuizPlay } from './quiz-play';
import { Quiz } from '../../models';

const quiz: Quiz = {
  id: 'geografia',
  title: 'Geografia świata',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [
    { id: 'q1', type: 'single', text: 'Pytanie 1?', options: ['A', 'B'], correct: 0 },
    { id: 'q2', type: 'boolean', text: 'Pytanie 2?', correct: true },
  ],
};

describe('QuizPlay', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizPlay],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the first question with progress, then advances after answering', () => {
    const fixture = TestBed.createComponent(QuizPlay);
    fixture.componentRef.setInput('id', 'geografia');

    TestBed.inject(HttpTestingController)
      .match(() => true)
      .forEach((req, i) => req.flush(i === 0 ? quiz : { ...quiz, id: `other-${i}` }));

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('1 / 2');
    expect(el.textContent).toContain('Pytanie 1?');

    const firstOption = el.querySelector('input[type="radio"]') as HTMLInputElement;
    firstOption.click();
    fixture.detectChanges();

    const nextButton = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Dalej',
    )!;
    nextButton.click();
    fixture.detectChanges();

    expect(el.textContent).toContain('2 / 2');
    expect(el.textContent).toContain('Pytanie 2?');
    expect(el.textContent).toContain('Zakończ i sprawdź');
  });
});
