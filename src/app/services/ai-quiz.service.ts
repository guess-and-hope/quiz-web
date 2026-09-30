import { Injectable, inject } from '@angular/core';
import { Question } from '../models';
import { SupabaseService } from './supabase.service';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface GenerateQuizParams {
  topic: string;
  count: number;
  difficulty: QuizDifficulty;
  /** Teksty istniejących pytań, których model ma nie powtarzać (dedup przy re-rollu). */
  avoid?: string[];
}

export interface GenerateQuizResult {
  questions: Question[];
  /** Best-matching category name chosen by the AI, if it returned one. */
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class AiQuizService {
  private readonly supabase = inject(SupabaseService);

  async generate(params: GenerateQuizParams): Promise<GenerateQuizResult> {
    const { data, error } = await this.supabase.client.functions.invoke<GenerateQuizResult>(
      'generate-quiz',
      { body: params },
    );

    if (error) {
      throw new Error(await this.extractError(error));
    }
    return { questions: data?.questions ?? [], category: data?.category };
  }

  /**
   * Regeneruje pojedyncze pytanie (re-roll): woła tę samą funkcję z `count: 1`
   * i zwraca pierwsze pytanie albo `null`, gdy AI nic sensownego nie zwróciło.
   */
  async regenerateQuestion(params: {
    topic: string;
    difficulty: QuizDifficulty;
    avoid?: string[];
  }): Promise<Question | null> {
    const { questions } = await this.generate({ ...params, count: 1 });
    return questions[0] ?? null;
  }

  // Edge Function zwraca komunikat błędu w polu `error` (po polsku) — wyciągamy go
  // z odpowiedzi HTTP, żeby pokazać użytkownikowi konkretną przyczynę.
  private async extractError(error: unknown): Promise<string> {
    const fallback = 'Nie udało się wygenerować pytań. Spróbuj ponownie.';
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json();
        if (body?.error) {
          return body.error as string;
        }
      } catch {
        // ignorujemy — użyjemy komunikatu domyślnego
      }
    }
    return fallback;
  }
}
