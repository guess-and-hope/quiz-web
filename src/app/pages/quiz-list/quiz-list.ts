import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';

@Component({
  selector: 'app-quiz-list',
  imports: [],
  templateUrl: './quiz-list.html',
  styleUrl: './quiz-list.scss',
})
export class QuizList {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  protected readonly quizzes = this.quizService.getAll();
  protected readonly loading = this.quizService.isLoading();
  protected readonly error = this.quizService.getError();

  protected solve(quizId: string): void {
    this.router.navigate(['/quiz', quizId]);
  }
}
