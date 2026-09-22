import { computed, signal } from '@angular/core';
import { QuizService } from '../services/quiz.service';
import { Quiz } from '../models';

/**
 * Lekki stub QuizService dla testów komponentów — pomija warstwę Supabase
 * i od razu udostępnia przekazane quizy przez to samo sygnałowe API.
 */
export function provideQuizServiceStub(quizzes: Quiz[] = []) {
  const all = signal(quizzes);
  const stub: Pick<QuizService, 'getAll' | 'getById' | 'isLoading' | 'getError'> = {
    getAll: () => all.asReadonly(),
    getById: (id: string) => computed(() => all().find((quiz) => quiz.id === id)),
    isLoading: () => signal(false).asReadonly(),
    getError: () => signal<string | null>(null).asReadonly(),
  };
  return { provide: QuizService, useValue: stub };
}
