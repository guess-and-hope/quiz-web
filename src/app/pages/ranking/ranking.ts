import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { PlayerIdentityService } from '../../services/player-identity.service';
import { RankingEntry, ResultsService } from '../../services/results.service';

@Component({
  selector: 'app-ranking',
  imports: [RouterLink],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {
  readonly id = input.required<string>();

  private readonly quizService = inject(QuizService);
  private readonly resultsService = inject(ResultsService);
  private readonly playerIdentity = inject(PlayerIdentityService);

  private readonly quizzes = this.quizService.getAll();
  protected readonly quizLoading = this.quizService.isLoading();
  protected readonly quiz = computed(() => this.quizzes().find((quiz) => quiz.id === this.id()));

  protected readonly entries = signal<RankingEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly deviceId = this.playerIdentity.getDeviceId();

  constructor() {
    effect(() => {
      const quizId = this.id();
      void this.load(quizId);
    });
  }

  protected isMe(entry: RankingEntry): boolean {
    return entry.deviceId !== null && entry.deviceId === this.deviceId;
  }

  private async load(quizId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const { entries, error } = await this.resultsService.topForQuiz(quizId, 10);

    if (error) {
      this.error.set(error);
      this.entries.set([]);
    } else {
      this.entries.set(entries);
    }
    this.loading.set(false);
  }
}
