import { Component, inject, signal } from '@angular/core';
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

  protected readonly quizzes = this.userQuizService.getAll();
  protected readonly pendingDelete = signal<Quiz | null>(null);

  protected solve(id: string): void {
    this.router.navigate(['/quiz', id]);
  }

  protected confirmDelete(quiz: Quiz): void {
    this.pendingDelete.set(quiz);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const quiz = this.pendingDelete();
    if (!quiz) {
      return;
    }
    this.userQuizService.delete(quiz.id);
    this.pendingDelete.set(null);
  }
}
