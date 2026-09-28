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
  durationSeconds: number;
}

export interface RankingEntry {
  playerName: string;
  deviceId: string | null;
  correct: number;
  total: number;
  percentage: number;
  durationSeconds: number | null;
  createdAt: string;
}

interface ResultsRow {
  player_name: string;
  device_id: string | null;
  correct: number;
  total: number;
  percentage: number;
  duration_seconds: number | null;
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
      duration_seconds: result.durationSeconds,
    });

    return { error: error ? error.message : null };
  }

  /**
   * Top results for a given quiz: the best score per player, sorted
   * descending (percentage → correct answers → completion time, faster
   * ranks higher → earliest submission as the final tiebreaker).
   * Deduplicated by `device_id`, falling back to nickname when it's
   * missing. Returns up to `limit` entries.
   */
  async topForQuiz(
    quizId: string,
    limit = 10,
  ): Promise<{ entries: RankingEntry[]; error: string | null }> {
    const { data, error } = await this.supabase.client
      .from('results')
      .select('player_name, device_id, correct, total, percentage, duration_seconds, created_at')
      .eq('quiz_id', quizId)
      .order('percentage', { ascending: false })
      .order('correct', { ascending: false })
      .order('duration_seconds', { ascending: true, nullsFirst: false })
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
        durationSeconds: row.duration_seconds,
        createdAt: row.created_at,
      });
      if (entries.length >= limit) {
        break;
      }
    }

    return { entries, error: null };
  }
}
