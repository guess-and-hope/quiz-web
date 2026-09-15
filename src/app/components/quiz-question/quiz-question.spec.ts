import { TestBed } from '@angular/core/testing';
import { QuizQuestion } from './quiz-question';
import { SingleChoiceQuestion } from '../../models';

const singleQuestion: SingleChoiceQuestion = {
  id: 'q1',
  type: 'single',
  text: 'Pytanie testowe?',
  options: ['A', 'B', 'C'],
  correct: 1,
};

describe('QuizQuestion', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(QuizQuestion);
    fixture.componentRef.setInput('question', singleQuestion);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('emits the selected option index for a single-choice question', () => {
    const fixture = TestBed.createComponent(QuizQuestion);
    fixture.componentRef.setInput('question', singleQuestion);
    fixture.detectChanges();

    let emitted: unknown;
    fixture.componentInstance.answerChange.subscribe((value) => (emitted = value));

    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    radios[2].dispatchEvent(new Event('change'));

    expect(emitted).toBe(2);
  });
});
