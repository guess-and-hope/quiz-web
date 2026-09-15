import { Routes } from '@angular/router';
import { QuizList } from './pages/quiz-list/quiz-list';
import { QuizPlay } from './pages/quiz-play/quiz-play';
import { QuizResult } from './pages/quiz-result/quiz-result';

export const routes: Routes = [
  { path: '', redirectTo: 'quizzes', pathMatch: 'full' },
  { path: 'quizzes', component: QuizList },
  { path: 'quiz/:id', component: QuizPlay },
  { path: 'quiz/:id/result', component: QuizResult },
  { path: '**', redirectTo: 'quizzes' },
];
