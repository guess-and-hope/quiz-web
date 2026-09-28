import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { CategoryColor, Question, Quiz } from '../models';
import { SupabaseService } from './supabase.service';
import { PlayerIdentityService } from './player-identity.service';

export interface QuizDraft {
  title: string;
  description?: string;
  category?: string;
  categoryColor?: CategoryColor;
  questions: Question[];
}

interface UserQuizRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  category_color: string | null;
  device_id: string;
  created_at: string;
  updated_at: string;
  questions: Quiz['questions'];
}

@Injectable({ providedIn: 'root' })
export class UserQuizService {
  private readonly supabase = inject(SupabaseService);
  private readonly playerIdentity = inject(PlayerIdentityService);

  private readonly quizzesSignal = signal<Quiz[]>([]);
  private readonly ownerByQuizId = signal<Record<string, string>>({});
  private readonly loadingSignal = signal(true);
  private readonly errorSignal = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  getAll(): Signal<Quiz[]> {
    return this.quizzesSignal.asReadonly();
  }

  getById(id: string): Signal<Quiz | undefined> {
    return computed(() => this.quizzesSignal().find((quiz) => quiz.id === id));
  }

  isLoading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  getError(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  /** UI-only ownership hint ("this is your quiz") — not enforced by RLS. */
  isMine(quizId: string): boolean {
    return this.ownerByQuizId()[quizId] === this.playerIdentity.getDeviceId();
  }

  async create(draft: QuizDraft): Promise<{ error: string | null }> {
    const now = new Date().toISOString();
    const { error } = await this.supabase.client.from('user_quizzes').insert({
      id: crypto.randomUUID(),
      title: draft.title,
      description: draft.description ?? null,
      category: draft.category ?? null,
      category_color: draft.categoryColor ?? null,
      device_id: this.playerIdentity.getDeviceId(),
      created_at: now,
      updated_at: now,
      questions: draft.questions,
    });

    if (error) {
      return { error: error.message };
    }
    await this.load();
    return { error: null };
  }

  async update(id: string, draft: QuizDraft): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('user_quizzes')
      .update({
        title: draft.title,
        description: draft.description ?? null,
        category: draft.category ?? null,
        category_color: draft.categoryColor ?? null,
        questions: draft.questions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }
    await this.load();
    return { error: null };
  }

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.from('user_quizzes').delete().eq('id', id);

    if (error) {
      return { error: error.message };
    }
    await this.load();
    return { error: null };
  }

  private async load(): Promise<void> {
    this.loadingSignal.set(true);

    const { data, error } = await this.supabase.client
      .from('user_quizzes')
      .select(
        'id, title, description, category, category_color, device_id, created_at, updated_at, questions',
      )
      .order('created_at', { ascending: false });

    if (error) {
      this.errorSignal.set('Nie udało się wczytać quizów użytkowników.');
      this.loadingSignal.set(false);
      return;
    }

    const rows = (data ?? []) as UserQuizRow[];
    this.quizzesSignal.set(rows.map((row) => this.toQuiz(row)));
    this.ownerByQuizId.set(Object.fromEntries(rows.map((row) => [row.id, row.device_id])));
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
  }

  private toQuiz(row: UserQuizRow): Quiz {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      categoryColor: (row.category_color as CategoryColor | null) ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      questions: row.questions,
    };
  }
}
