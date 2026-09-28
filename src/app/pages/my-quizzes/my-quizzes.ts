import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserQuizService } from '../../services/user-quiz.service';
import { Quiz } from '../../models';

@Component({
  selector: 'app-my-quizzes',
  imports: [RouterLink],
  templateUrl: './my-quizzes.html',
  styleUrl: './my-quizzes.scss',
})
export class MyQuizzes {
  private readonly userQuizService = inject(UserQuizService);
  private readonly router = inject(Router);

  protected readonly loading = this.userQuizService.isLoading();
  protected readonly error = this.userQuizService.getError();
  protected readonly quizzes = computed(() =>
    this.userQuizService.getAll()().filter((quiz) => this.userQuizService.isMine(quiz.id)),
  );
  protected readonly pendingDelete = signal<Quiz | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  protected solve(id: string): void {
    this.router.navigate(['/quiz', id]);
  }

  protected confirmDelete(quiz: Quiz): void {
    this.deleteError.set(null);
    this.pendingDelete.set(quiz);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected async deleteConfirmed(): Promise<void> {
    const quiz = this.pendingDelete();
    if (!quiz) {
      return;
    }
    const { error } = await this.userQuizService.delete(quiz.id);
    if (error) {
      this.deleteError.set(error);
      return;
    }
    this.pendingDelete.set(null);
  }

  protected categoryClass(quiz: Quiz): string {
    return `quiz-card__category quiz-card__category--${quiz.categoryColor ?? 'auto'}`;
  }
}
