import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { UserQuizService } from '../../services/user-quiz.service';
import { AttemptService } from '../../services/attempt.service';
import { QuizQuestion } from '../../components/quiz-question/quiz-question';
import { AnswerValue } from '../../models';
import { formatDuration } from '../../shared/format-duration';

@Component({
  selector: 'app-quiz-play',
  imports: [RouterLink, QuizQuestion],
  templateUrl: './quiz-play.html',
  styleUrl: './quiz-play.scss',
})
export class QuizPlay implements OnDestroy {
  readonly id = input.required<string>();

  private readonly quizService = inject(QuizService);
  private readonly userQuizService = inject(UserQuizService);
  private readonly attemptService = inject(AttemptService);
  private readonly router = inject(Router);

  private readonly startedAt = Date.now();
  private readonly timerHandle = setInterval(() => {
    this.elapsedSeconds.set(Math.floor((Date.now() - this.startedAt) / 1000));
  }, 1000);

  protected readonly elapsedSeconds = signal(0);
  protected readonly elapsedText = computed(() => formatDuration(this.elapsedSeconds()));

  ngOnDestroy(): void {
    clearInterval(this.timerHandle);
  }

  private readonly quizzes = this.quizService.getAll();
  protected readonly loading = computed(
    () => this.quizService.isLoading()() || this.userQuizService.isLoading()(),
  );
  protected readonly error = this.quizService.getError();

  protected readonly quiz = computed(
    () =>
      this.quizzes().find((quiz) => quiz.id === this.id()) ??
      this.userQuizService.getAll()().find((quiz) => quiz.id === this.id()),
  );
  protected readonly questions = computed(() => this.quiz()?.questions ?? []);

  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<Record<string, AnswerValue>>({});

  protected readonly currentQuestion = computed(() => this.questions()[this.currentIndex()]);
  protected readonly currentAnswer = computed(() => {
    const question = this.currentQuestion();
    return question ? this.answers()[question.id] : undefined;
  });

  protected readonly progressText = computed(() =>
    this.questions().length ? `${this.currentIndex() + 1} / ${this.questions().length}` : '',
  );
  protected readonly progressSegments = computed(() =>
    Array.from({ length: this.questions().length }, (_, index) => index <= this.currentIndex()),
  );
  protected readonly isFirst = computed(() => this.currentIndex() === 0);
  protected readonly isLast = computed(() => this.currentIndex() === this.questions().length - 1);

  protected onAnswerChange(value: AnswerValue): void {
    const question = this.currentQuestion();
    if (!question) {
      return;
    }
    this.answers.update((answers) => ({ ...answers, [question.id]: value }));
  }

  protected next(): void {
    if (!this.isLast()) {
      this.currentIndex.update((index) => index + 1);
    }
  }

  protected previous(): void {
    if (!this.isFirst()) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  protected finish(): void {
    const durationSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    clearInterval(this.timerHandle);
    this.attemptService.submit(this.id(), this.answers(), durationSeconds);
    this.router.navigate(['/quiz', this.id(), 'result']);
  }
}
