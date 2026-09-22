import { Component, computed, input, output } from '@angular/core';
import { AnswerValue, Question } from '../../models';

@Component({
  selector: 'app-quiz-question',
  imports: [],
  templateUrl: './quiz-question.html',
  styleUrl: './quiz-question.scss',
})
export class QuizQuestion {
  readonly question = input.required<Question>();
  readonly answer = input<AnswerValue | undefined>(undefined);
  readonly answerChange = output<AnswerValue>();

  protected readonly options = computed(() => {
    const question = this.question();
    return question.type === 'single' || question.type === 'multi' ? question.options : [];
  });

  protected readonly choiceHint = computed(() =>
    this.question().type === 'multi' ? 'Wielokrotny wybór' : 'Jednokrotny wybór',
  );

  protected isSingleSelected(index: number): boolean {
    return this.answer() === index;
  }

  protected isMultiSelected(index: number): boolean {
    const value = this.answer();
    return Array.isArray(value) && value.includes(index);
  }

  protected isBooleanSelected(value: boolean): boolean {
    return this.answer() === value;
  }

  protected selectSingle(index: number): void {
    this.answerChange.emit(index);
  }

  protected toggleMulti(index: number): void {
    const current = this.answer();
    const selected = Array.isArray(current) ? [...current] : [];
    const position = selected.indexOf(index);

    if (position === -1) {
      selected.push(index);
    } else {
      selected.splice(position, 1);
    }

    this.answerChange.emit(selected.sort((a, b) => a - b));
  }

  protected selectBoolean(value: boolean): void {
    this.answerChange.emit(value);
  }
}
