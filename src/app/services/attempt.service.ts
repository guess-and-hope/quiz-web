import { Injectable, Signal, signal } from '@angular/core';
import { AnswerValue } from '../models';

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, AnswerValue>;
  durationSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class AttemptService {
  private readonly attempt = signal<QuizAttempt | undefined>(undefined);

  /**
   * Whether the current attempt's completion has already been written to
   * `results`. Prevents a duplicate row when the player re-opens the result
   * page for the same attempt (e.g. via the back button). Reset on each
   * `submit()`, so a fresh play is recorded again.
   */
  private recorded = false;

  submit(quizId: string, answers: Record<string, AnswerValue>, durationSeconds = 0): void {
    this.attempt.set({ quizId, answers, durationSeconds });
    this.recorded = false;
  }

  getAttempt(): Signal<QuizAttempt | undefined> {
    return this.attempt.asReadonly();
  }

  isRecorded(): boolean {
    return this.recorded;
  }

  markRecorded(): void {
    this.recorded = true;
  }
}
