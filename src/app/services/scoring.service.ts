import { Injectable } from '@angular/core';
import { AnswerValue, Question, Quiz } from '../models';

export interface QuizScore {
  correct: number;
  total: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class ScoringService {
  isCorrect(question: Question, answer: AnswerValue | undefined): boolean {
    if (answer === undefined) {
      return false;
    }

    switch (question.type) {
      case 'single':
        return answer === question.correct;
      case 'boolean':
        return answer === question.correct;
      case 'multi': {
        if (!Array.isArray(answer)) {
          return false;
        }
        const given = new Set(answer);
        const correct = new Set(question.correct);
        return given.size === correct.size && [...correct].every((index) => given.has(index));
      }
    }
  }

  score(quiz: Quiz, answers: Record<string, AnswerValue>): QuizScore {
    const total = quiz.questions.length;
    const correct = quiz.questions.filter((question) =>
      this.isCorrect(question, answers[question.id]),
    ).length;
    const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);

    return { correct, total, percentage };
  }
}
