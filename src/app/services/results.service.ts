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

export interface RankingEntry {
  playerName: string;
  deviceId: string | null;
  correct: number;
  total: number;
  percentage: number;
  createdAt: string;
}

interface ResultsRow {
  player_name: string;
  device_id: string | null;
  correct: number;
  total: number;
  percentage: number;
  created_at: string;
}

// Ile wierszy pobieramy przed deduplikacją — z zapasem, bo jeden gracz może mieć
// wiele podejść, a chcemy dostać `limit` różnych osób.
const RANKING_FETCH_LIMIT = 200;

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

  /**
   * Ranking najlepszych wyników dla danego quizu: najlepszy wynik na osobę,
   * malejąco (procent → trafienia → najwcześniejszy czas). Deduplikacja po
   * `device_id`, a przy jego braku po nicku. Zwraca do `limit` pozycji.
   */
  async topForQuiz(
    quizId: string,
    limit = 10,
  ): Promise<{ entries: RankingEntry[]; error: string | null }> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select('player_name, device_id, correct, total, percentage, created_at')
      .eq('quiz_id', quizId)
      .order('percentage', { ascending: false })
      .order('correct', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(RANKING_FETCH_LIMIT);

    if (error) {
      return { entries: [], error: error.message };
    }

    const seen = new Set<string>();
    const entries: RankingEntry[] = [];
    for (const row of (data ?? []) as ResultsRow[]) {
      const identity = row.device_id ?? `name:${row.player_name}`;
      if (seen.has(identity)) {
        continue;
      }
      seen.add(identity);
      entries.push({
        playerName: row.player_name,
        deviceId: row.device_id,
        correct: row.correct,
        total: row.total,
        percentage: row.percentage,
        createdAt: row.created_at,
      });
      if (entries.length >= limit) {
        break;
      }
    }

    return { entries, error: null };
  }
}
