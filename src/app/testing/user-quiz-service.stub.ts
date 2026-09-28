import { computed, signal } from '@angular/core';
import { QuizDraft, UserQuizService } from '../services/user-quiz.service';
import { Quiz } from '../models';

/**
 * Lightweight UserQuizService stub for component tests — skips Supabase and
 * keeps quizzes in an in-memory signal instead, through the same API.
 */
export function provideUserQuizServiceStub(initial: Quiz[] = [], mineIds: string[] = []) {
  const all = signal(initial);
  const mine = new Set(mineIds);

  const stub: Pick<
    UserQuizService,
    'getAll' | 'getById' | 'isLoading' | 'getError' | 'isMine' | 'create' | 'update' | 'delete'
  > = {
    getAll: () => all.asReadonly(),
    getById: (id: string) => computed(() => all().find((quiz) => quiz.id === id)),
    isLoading: () => signal(false).asReadonly(),
    getError: () => signal<string | null>(null).asReadonly(),
    isMine: (id: string) => mine.has(id),
    create: async (draft: QuizDraft) => {
      const now = new Date().toISOString();
      const quiz: Quiz = {
        id: crypto.randomUUID(),
        title: draft.title,
        description: draft.description,
        category: draft.category,
        categoryColor: draft.categoryColor,
        createdAt: now,
        updatedAt: now,
        questions: draft.questions,
      };
      all.set([quiz, ...all()]);
      mine.add(quiz.id);
      return { error: null };
    },
    update: async (id: string, draft: QuizDraft) => {
      all.set(
        all().map((quiz) =>
          quiz.id === id
            ? {
                ...quiz,
                title: draft.title,
                description: draft.description,
                category: draft.category,
                categoryColor: draft.categoryColor,
                questions: draft.questions,
                updatedAt: new Date().toISOString(),
              }
            : quiz,
        ),
      );
      return { error: null };
    },
    delete: async (id: string) => {
      all.set(all().filter((quiz) => quiz.id !== id));
      return { error: null };
    },
  };

  return { provide: UserQuizService, useValue: stub };
}
