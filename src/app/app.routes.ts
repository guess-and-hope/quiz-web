import { Routes } from '@angular/router';
import { QuizList } from './pages/quiz-list/quiz-list';
import { QuizPlay } from './pages/quiz-play/quiz-play';

export const routes: Routes = [
  { path: '', redirectTo: 'quizzes', pathMatch: 'full' },
  { path: 'quizzes', component: QuizList },
  { path: 'quiz/:id', component: QuizPlay },
];
