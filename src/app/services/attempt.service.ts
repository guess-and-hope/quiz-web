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

  submit(quizId: string, answers: Record<string, AnswerValue>, durationSeconds = 0): void {
    this.attempt.set({ quizId, answers, durationSeconds });
  }

  getAttempt(): Signal<QuizAttempt | undefined> {
    return this.attempt.asReadonly();
  }
}
