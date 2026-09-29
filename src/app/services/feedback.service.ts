import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type Rating = 1 | -1;

export interface RatingSummary {
  up: number;
  down: number;
  myRating: Rating | null;
}

export interface QuizComment {
  playerName: string;
  comment: string;
  createdAt: string;
}

interface RatingRow {
  device_id: string;
  rating: Rating;
}

interface CommentRow {
  player_name: string;
  comment: string;
  created_at: string;
}

const COMMENTS_FETCH_LIMIT = 50;

/** Quiz feedback: thumbs up/down ratings and named comments (see `quiz_ratings.sql` / `quiz_comments.sql`). */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly supabase = inject(SupabaseService);

  async getRatingSummary(
    quizId: string,
    deviceId: string,
  ): Promise<{ summary: RatingSummary; error: string | null }> {
    const { data, error } = await this.supabase.client
      .from('quiz_ratings')
      .select('device_id, rating')
      .eq('quiz_id', quizId);

    if (error) {
      return { summary: { up: 0, down: 0, myRating: null }, error: error.message };
    }

    const summary: RatingSummary = { up: 0, down: 0, myRating: null };
    for (const row of (data ?? []) as RatingRow[]) {
      if (row.rating === 1) {
        summary.up++;
      } else {
        summary.down++;
      }
      if (row.device_id === deviceId) {
        summary.myRating = row.rating;
      }
    }

    return { summary, error: null };
  }

  /** Sets (or changes) the caller's rating for a quiz — one rating per device, upserted. */
  async setRating(quizId: string, deviceId: string, rating: Rating): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client
      .from('quiz_ratings')
      .upsert({ quiz_id: quizId, device_id: deviceId, rating }, { onConflict: 'quiz_id,device_id' });

    return { error: error ? error.message : null };
  }

  async getComments(quizId: string): Promise<{ comments: QuizComment[]; error: string | null }> {
    const { data, error } = await this.supabase.client
      .from('quiz_comments')
      .select('player_name, comment, created_at')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false })
      .limit(COMMENTS_FETCH_LIMIT);

    if (error) {
      return { comments: [], error: error.message };
    }

    const comments = ((data ?? []) as CommentRow[]).map((row) => ({
      playerName: row.player_name,
      comment: row.comment,
      createdAt: row.created_at,
    }));

    return { comments, error: null };
  }

  async addComment(
    quizId: string,
    deviceId: string,
    playerName: string,
    comment: string,
  ): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.from('quiz_comments').insert({
      quiz_id: quizId,
      device_id: deviceId,
      player_name: playerName,
      comment,
    });

    return { error: error ? error.message : null };
  }
}
