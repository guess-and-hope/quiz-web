import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { AttemptService } from '../../services/attempt.service';
import { ScoringService } from '../../services/scoring.service';
import { PlayerIdentityService } from '../../services/player-identity.service';
import { AnswerValue, Question } from '../../models';

interface QuestionReview {
  question: Question;
  userAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-quiz-result',
  imports: [RouterLink],
  templateUrl: './quiz-result.html',
  styleUrl: './quiz-result.scss',
})
export class QuizResult {
  readonly id = input.required<string>();

  private readonly quizService = inject(QuizService);
  private readonly attemptService = inject(AttemptService);
  private readonly scoringService = inject(ScoringService);
  private readonly playerIdentity = inject(PlayerIdentityService);

  protected readonly loading = this.quizService.isLoading();
  protected readonly error = this.quizService.getError();

  private readonly quizzes = this.quizService.getAll();
  protected readonly quiz = computed(() => this.quizzes().find((quiz) => quiz.id === this.id()));

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

  protected onNameInput(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  protected startEditingName(): void {
    this.nameDraft.set(this.playerIdentity.playerName());
    this.editingName.set(true);
    this.saved.set(false);
  }

  protected saveResult(): void {
    const name = this.nameDraft().trim();
    if (!name) {
      return;
    }
    this.playerIdentity.setPlayerName(name);
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
