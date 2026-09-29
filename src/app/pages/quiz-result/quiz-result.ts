import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { UserQuizService } from '../../services/user-quiz.service';
import { AttemptService } from '../../services/attempt.service';
import { ScoringService } from '../../services/scoring.service';
import { PlayerIdentityService } from '../../services/player-identity.service';
import { ResultsService } from '../../services/results.service';
import { FeedbackService, QuizComment, Rating, RatingSummary } from '../../services/feedback.service';
import { AnswerValue, Question } from '../../models';
import { formatDuration } from '../../shared/format-duration';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

interface QuestionReview {
  question: Question;
  userAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-quiz-result',
  imports: [RouterLink, CategoryIcon],
  templateUrl: './quiz-result.html',
  styleUrl: './quiz-result.scss',
})
export class QuizResult {
  readonly id = input.required<string>();

  private readonly quizService = inject(QuizService);
  private readonly userQuizService = inject(UserQuizService);
  private readonly attemptService = inject(AttemptService);
  private readonly scoringService = inject(ScoringService);
  private readonly playerIdentity = inject(PlayerIdentityService);
  private readonly resultsService = inject(ResultsService);
  private readonly feedbackService = inject(FeedbackService);

  protected readonly loading = computed(
    () => this.quizService.isLoading()() || this.userQuizService.isLoading()(),
  );
  protected readonly error = this.quizService.getError();

  private readonly quizzes = this.quizService.getAll();
  protected readonly quiz = computed(
    () =>
      this.quizzes().find((quiz) => quiz.id === this.id()) ??
      this.userQuizService.getAll()().find((quiz) => quiz.id === this.id()),
  );

  private readonly attempt = this.attemptService.getAttempt();
  protected readonly hasAttempt = computed(() => this.attempt()?.quizId === this.id());

  protected readonly score = computed(() => {
    const quiz = this.quiz();
    const attempt = this.attempt();
    if (!quiz || !attempt || attempt.quizId !== quiz.id) {
      return undefined;
    }
    return this.scoringService.score(quiz, attempt.answers);
  });

  protected readonly durationText = computed(() => {
    const attempt = this.attempt();
    return attempt && attempt.quizId === this.id() ? formatDuration(attempt.durationSeconds) : '';
  });

  protected readonly reviews = computed<QuestionReview[]>(() => {
    const quiz = this.quiz();
    const attempt = this.attempt();
    if (!quiz || !attempt || attempt.quizId !== quiz.id) {
      return [];
    }

    return quiz.questions.map((question) => {
      const answer = attempt.answers[question.id];
      return {
        question,
        userAnswerText: this.formatAnswer(question, answer),
        correctAnswerText: this.formatValue(question, question.correct),
        isCorrect: this.scoringService.isCorrect(question, answer),
      };
    });
  });

  protected readonly playerName = this.playerIdentity.playerName;
  protected readonly nameDraft = signal(this.playerIdentity.playerName());
  protected readonly editingName = signal(!this.playerIdentity.playerName());
  protected readonly saved = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  private readonly deviceId = this.playerIdentity.getDeviceId();

  protected readonly ratingSummary = signal<RatingSummary>({ up: 0, down: 0, myRating: null });
  protected readonly rating = signal(false);
  // Once the player has rated locally, ignore the initial fetch if it resolves late —
  // otherwise a slow initial load can silently overwrite the vote the player just cast.
  private readonly ratedLocally = signal(false);

  protected readonly comments = signal<QuizComment[]>([]);
  protected readonly commentsLoading = signal(true);
  protected readonly commentsLoadError = signal<string | null>(null);
  protected readonly commentNameDraft = signal(this.playerIdentity.playerName());
  protected readonly commentDraft = signal('');
  protected readonly commentSaving = signal(false);
  protected readonly commentError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const quizId = this.id();
      void this.loadFeedback(quizId);
    });
  }

  protected async rate(value: Rating): Promise<void> {
    const quiz = this.quiz();
    if (!quiz || this.rating()) {
      return;
    }

    this.ratedLocally.set(true);
    const previous = this.ratingSummary();
    const next: RatingSummary = { ...previous, myRating: value };
    if (previous.myRating === 1) next.up--;
    if (previous.myRating === -1) next.down--;
    if (value === 1) next.up++;
    if (value === -1) next.down++;
    this.ratingSummary.set(next);

    this.rating.set(true);
    const { error } = await this.feedbackService.setRating(quiz.id, this.deviceId, value);
    this.rating.set(false);

    if (error) {
      this.ratingSummary.set(previous);
    }
  }

  protected onCommentNameInput(event: Event): void {
    this.commentNameDraft.set((event.target as HTMLInputElement).value);
  }

  protected onCommentInput(event: Event): void {
    this.commentDraft.set((event.target as HTMLTextAreaElement).value);
  }

  protected async addComment(): Promise<void> {
    const name = this.commentNameDraft().trim();
    const text = this.commentDraft().trim();
    const quiz = this.quiz();
    if (!name || !text || !quiz || this.commentSaving()) {
      return;
    }

    this.playerIdentity.setPlayerName(name);
    this.commentSaving.set(true);
    this.commentError.set(null);

    const { error } = await this.feedbackService.addComment(quiz.id, this.deviceId, name, text);

    this.commentSaving.set(false);

    if (error) {
      this.commentError.set(error);
      return;
    }

    this.commentDraft.set('');
    this.comments.update((comments) => [{ playerName: name, comment: text, createdAt: new Date().toISOString() }, ...comments]);
  }

  private async loadFeedback(quizId: string): Promise<void> {
    this.commentsLoading.set(true);

    const [{ summary }, { comments, error }] = await Promise.all([
      this.feedbackService.getRatingSummary(quizId, this.deviceId),
      this.feedbackService.getComments(quizId),
    ]);

    if (!this.ratedLocally()) {
      this.ratingSummary.set(summary);
    }
    this.comments.set(comments);
    this.commentsLoadError.set(error);
    this.commentsLoading.set(false);
  }

  protected onNameInput(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  protected startEditingName(): void {
    this.nameDraft.set(this.playerIdentity.playerName());
    this.editingName.set(true);
    this.saved.set(false);
    this.saveError.set(null);
  }

  protected async saveResult(): Promise<void> {
    const name = this.nameDraft().trim();
    const quiz = this.quiz();
    const score = this.score();
    const attempt = this.attempt();
    if (!name || !quiz || !score || !attempt || this.saving()) {
      return;
    }

    this.playerIdentity.setPlayerName(name);
    this.saving.set(true);
    this.saveError.set(null);

    const { error } = await this.resultsService.save({
      quizId: quiz.id,
      quizTitle: quiz.title,
      playerName: name,
      deviceId: this.playerIdentity.getDeviceId(),
      correct: score.correct,
      total: score.total,
      percentage: score.percentage,
      durationSeconds: attempt.durationSeconds,
    });

    this.saving.set(false);

    if (error) {
      this.saveError.set(error);
      return;
    }

    this.editingName.set(false);
    this.saved.set(true);
  }

  private formatAnswer(question: Question, answer: AnswerValue | undefined): string {
    return answer === undefined ? 'Brak odpowiedzi' : this.formatValue(question, answer);
  }

  private formatValue(question: Question, value: AnswerValue): string {
    if (question.type === 'boolean') {
      return value ? 'Prawda' : 'Fałsz';
    }
    if (question.type === 'single') {
      return question.options[value as number] ?? 'Brak odpowiedzi';
    }
    const indices = value as number[];
    return indices.length ? indices.map((index) => question.options[index]).join(', ') : 'Brak odpowiedzi';
  }
}
