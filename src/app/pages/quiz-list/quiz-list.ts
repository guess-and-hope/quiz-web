import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { UserQuizService } from '../../services/user-quiz.service';
import { QuizSearchService } from '../../services/quiz-search.service';
import { Quiz, categoryColor } from '../../models';

@Component({
  selector: 'app-quiz-list',
  imports: [RouterLink],
  templateUrl: './quiz-list.html',
  styleUrl: './quiz-list.scss',
})
export class QuizList {
  private readonly quizService = inject(QuizService);
  private readonly userQuizService = inject(UserQuizService);
  private readonly quizSearch = inject(QuizSearchService);
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

  protected solve(quizId: string): void {
    this.router.navigate(['/quiz', quizId]);
  }

  protected categoryClass(quiz: Quiz): string {
    return `quiz-card__category quiz-card__category--${categoryColor(quiz.category) ?? 'auto'}`;
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
