import { Routes } from '@angular/router';
import { QuizList } from './pages/quiz-list/quiz-list';

export const routes: Routes = [
  { path: '', redirectTo: 'quizzes', pathMatch: 'full' },
  { path: 'quizzes', component: QuizList },
];
