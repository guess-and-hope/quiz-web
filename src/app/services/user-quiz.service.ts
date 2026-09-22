import { Injectable, Signal, computed, signal } from '@angular/core';
import { Question, Quiz } from '../models';

const STORAGE_KEY = 'quiz.userQuizzes';

export interface QuizDraft {
  title: string;
  description?: string;
  category?: string;
  questions: Question[];
}

@Injectable({ providedIn: 'root' })
export class UserQuizService {
  private readonly quizzesSignal = signal<Quiz[]>(this.readFromStorage());

  getAll(): Signal<Quiz[]> {
    return this.quizzesSignal.asReadonly();
  }

  getById(id: string): Signal<Quiz | undefined> {
    return computed(() => this.quizzesSignal().find((quiz) => quiz.id === id));
  }

  create(draft: QuizDraft): Quiz {
    const now = new Date().toISOString();
    const quiz: Quiz = {
      id: crypto.randomUUID(),
      title: draft.title,
      description: draft.description,
      category: draft.category,
      createdAt: now,
      updatedAt: now,
      questions: draft.questions,
    };
    this.persist([...this.quizzesSignal(), quiz]);
    return quiz;
  }

  update(id: string, draft: QuizDraft): void {
    const now = new Date().toISOString();
    this.persist(
      this.quizzesSignal().map((quiz) =>
        quiz.id === id
          ? {
              ...quiz,
              title: draft.title,
              description: draft.description,
              category: draft.category,
              questions: draft.questions,
              updatedAt: now,
            }
          : quiz,
      ),
    );
  }

  delete(id: string): void {
    this.persist(this.quizzesSignal().filter((quiz) => quiz.id !== id));
  }

  private persist(quizzes: Quiz[]): void {
    this.quizzesSignal.set(quizzes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  }

  private readFromStorage(): Quiz[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Quiz[]) : [];
    } catch {
      return [];
    }
  }
}
