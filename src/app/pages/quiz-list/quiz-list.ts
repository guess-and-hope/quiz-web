import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { UserQuizService } from '../../services/user-quiz.service';
import { QuizSearchService } from '../../services/quiz-search.service';
import { FeedbackService } from '../../services/feedback.service';
import { ResultsService } from '../../services/results.service';
import { CategoryIcon } from '../../shared/category-icon/category-icon';
import { AppSelect, SelectOption } from '../../components/app-select/app-select';
import { questionsLabel } from '../../shared/pluralize-pl';
import { Quiz, categoryColor } from '../../models';

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'likes-desc' | 'solves-desc';

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Od najnowszych' },
  { value: 'oldest', label: 'Od najstarszych' },
  { value: 'title-asc', label: 'Nazwa: A-Z' },
  { value: 'title-desc', label: 'Nazwa: Z-A' },
  { value: 'likes-desc', label: 'Najwięcej polubień' },
  { value: 'solves-desc', label: 'Najwięcej rozwiązań' },
];

@Component({
  selector: 'app-quiz-list',
  imports: [RouterLink, CategoryIcon, AppSelect],
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

  protected readonly quizzes = computed(() => this.sort(this.filter(this.allQuizzes())));
  protected readonly loading = this.quizService.isLoading();
  protected readonly error = this.quizService.getError();

  protected readonly userQuizzes = computed(() => this.sort(this.filter(this.allUserQuizzes())));
  protected readonly userQuizzesLoading = this.userQuizService.isLoading();
  protected readonly userQuizzesError = this.userQuizService.getError();

  protected readonly hasActiveFilters = this.quizSearch.hasActiveFilters;

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sortBy = signal<SortOption>('newest');

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

  protected setSortBy(value: string): void {
    this.sortBy.set(value as SortOption);
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

  private sort(quizzes: Quiz[]): Quiz[] {
    const sorted = [...quizzes];

    switch (this.sortBy()) {
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title, 'pl'));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title, 'pl'));
      case 'likes-desc':
        return sorted.sort((a, b) => this.likesFor(b.id) - this.likesFor(a.id));
      case 'solves-desc':
        return sorted.sort((a, b) => this.solvesFor(b.id) - this.solvesFor(a.id));
      case 'oldest':
        return sorted.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case 'newest':
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }
}
