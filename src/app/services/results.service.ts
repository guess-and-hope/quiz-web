import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface QuizResultInput {
  quizId: string;
  quizTitle: string;
  playerName: string;
  deviceId: string;
  correct: number;
  total: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  private readonly supabase = inject(SupabaseService);

  /** Zapisuje wynik gracza w tabeli `results`. Zwraca komunikat błędu albo null. */
  async save(result: QuizResultInput): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.from('results').insert({
      quiz_id: result.quizId,
      quiz_title: result.quizTitle,
      player_name: result.playerName,
      device_id: result.deviceId,
      correct: result.correct,
      total: result.total,
      percentage: result.percentage,
    });

    return { error: error ? error.message : null };
  }
}
