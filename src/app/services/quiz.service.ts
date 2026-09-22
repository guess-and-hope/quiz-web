import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Quiz } from '../models';
import { SupabaseService } from './supabase.service';

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  questions: Quiz['questions'];
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly supabase = inject(SupabaseService);

  private readonly quizzes = signal<Quiz[]>([]);
  private readonly loading = signal(true);
  private readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('quizzes')
      .select('id, title, description, category, created_at, updated_at, questions')
      .order('created_at', { ascending: true });

    if (error) {
      this.error.set('Nie udało się wczytać quizów.');
      this.loading.set(false);
      return;
    }

    this.quizzes.set((data ?? []).map((row) => this.toQuiz(row as QuizRow)));
    this.loading.set(false);
  }

  private toQuiz(row: QuizRow): Quiz {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      questions: row.questions,
    };
  }

  getAll(): Signal<Quiz[]> {
    return this.quizzes.asReadonly();
  }

  getById(id: string): Signal<Quiz | undefined> {
    return computed(() => this.quizzes().find((quiz) => quiz.id === id));
  }

  isLoading(): Signal<boolean> {
    return this.loading.asReadonly();
  }

  getError(): Signal<string | null> {
    return this.error.asReadonly();
  }
}
