import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizQuestion } from '../../components/quiz-question/quiz-question';
import { AnswerValue } from '../../models';

@Component({
  selector: 'app-quiz-play',
  imports: [RouterLink, QuizQuestion],
  templateUrl: './quiz-play.html',
  styleUrl: './quiz-play.scss',
})
export class QuizPlay {
  readonly id = input.required<string>();

  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  private readonly quizzes = this.quizService.getAll();
  protected readonly loading = this.quizService.isLoading();
  protected readonly error = this.quizService.getError();

  protected readonly quiz = computed(() => this.quizzes().find((quiz) => quiz.id === this.id()));
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
    this.router.navigate(['/quiz', this.id(), 'result']);
  }
}
