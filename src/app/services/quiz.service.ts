import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Quiz } from '../models';

const QUIZ_FILES = ['geografia', 'historia', 'matematyka', 'ciekawostki'];

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);

  private readonly quizzes = signal<Quiz[]>([]);
  private readonly loading = signal(true);
  private readonly error = signal<string | null>(null);

  constructor() {
    forkJoin(
      QUIZ_FILES.map((file) => this.http.get<Quiz>(`assets/quizzes/${file}.json`)),
    ).subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się wczytać quizów.');
        this.loading.set(false);
      },
    });
  }

  getAll(): Signal<Quiz[]> {
    return this.quizzes.asReadonly();
  }

  getById(id: string): Signal<Quiz | undefined> {
    return computed(() => this.quizzes().find((quiz) => quiz.id === id));
  }

  isLoading(): Signal<boolean> {
    return this.loading.asReadonly();
  }

  getError(): Signal<string | null> {
    return this.error.asReadonly();
  }
}
