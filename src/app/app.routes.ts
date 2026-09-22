import { Routes } from '@angular/router';
import { QuizList } from './pages/quiz-list/quiz-list';
import { QuizPlay } from './pages/quiz-play/quiz-play';
import { QuizResult } from './pages/quiz-result/quiz-result';
import { MyQuizzes } from './pages/my-quizzes/my-quizzes';
import { QuizEditor } from './pages/quiz-editor/quiz-editor';

export const routes: Routes = [
  { path: '', redirectTo: 'quizzes', pathMatch: 'full' },
  { path: 'quizzes', component: QuizList },
  { path: 'moje-quizy', component: MyQuizzes },
  { path: 'moje-quizy/nowy', component: QuizEditor },
  { path: 'moje-quizy/:id/edytuj', component: QuizEditor },
  { path: 'quiz/:id', component: QuizPlay },
  { path: 'quiz/:id/result', component: QuizResult },
  { path: '**', redirectTo: 'quizzes' },
];
