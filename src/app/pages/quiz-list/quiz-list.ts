import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { UserQuizService } from '../../services/user-quiz.service';
import { QuizSearchService } from '../../services/quiz-search.service';
import { FeedbackService } from '../../services/feedback.service';
import { ResultsService } from '../../services/results.service';
import { CategoryIcon } from '../../shared/category-icon/category-icon';
import { questionsLabel } from '../../shared/pluralize-pl';
import { Quiz, categoryColor } from '../../models';

@Component({
  selector: 'app-quiz-list',
  imports: [RouterLink, CategoryIcon],
  templateUrl: './quiz-list.html',
  styleUrl: './quiz-list.scss',
})
export class QuizList {
  private readonly quizService = inject(QuizService);
  private readonly userQuizService = inject(UserQuizService);
  private readonly quizSearch = inject(QuizSearchService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly resultsService = inject(ResultsService);
  private readonly router = inject(Router);

  private readonly allQuizzes = this.quizService.getAll();
  private readonly allUserQuizzes = this.userQuizService.getAll();

  protected readonly quizzes = computed(() => this.filter(this.allQuizzes()));
  protected readonly loading = this.quizService.isLoading();
  protected readonly error = this.quizService.getError();

  protected readonly userQuizzes = computed(() => this.filter(this.allUserQuizzes()));
  protected readonly userQuizzesLoading = this.userQuizService.isLoading();
  protected readonly userQuizzesError = this.userQuizService.getError();

  protected readonly hasActiveFilters = this.quizSearch.hasActiveFilters;

  private readonly likeCounts = signal<Record<string, number>>({});
  private readonly solveCounts = signal<Record<string, number>>({});

  constructor() {
    effect(() => {
      const ids = [...this.allQuizzes(), ...this.allUserQuizzes()].map((quiz) => quiz.id);
      if (ids.length === 0) {
        return;
      }
      void this.loadStats(ids);
    });
  }

  protected solve(quizId: string): void {
    this.router.navigate(['/quiz', quizId]);
  }

  protected likesFor(quizId: string): number {
    return this.likeCounts()[quizId] ?? 0;
  }

  protected solvesFor(quizId: string): number {
    return this.solveCounts()[quizId] ?? 0;
  }

  private async loadStats(quizIds: string[]): Promise<void> {
    const [likes, solves] = await Promise.all([
      this.feedbackService.getLikeCounts(quizIds),
      this.resultsService.getSolveCounts(quizIds),
    ]);
    this.likeCounts.set(likes);
    this.solveCounts.set(solves);
  }

  protected categoryClass(quiz: Quiz): string {
    return `quiz-card__category quiz-card__category--${categoryColor(quiz.category) ?? 'auto'}`;
  }

  protected questionCountLabel(count: number): string {
    return questionsLabel(count);
  }

  private filter(quizzes: Quiz[]): Quiz[] {
    const term = this.quizSearch.searchTerm().trim().toLowerCase();
    const categories = this.quizSearch.selectedCategories();

    return quizzes.filter((quiz) => {
      const matchesTerm = !term || quiz.title.toLowerCase().includes(term);
      const matchesCategory = categories.size === 0 || (!!quiz.category && categories.has(quiz.category));
      return matchesTerm && matchesCategory;
    });
  }
}
