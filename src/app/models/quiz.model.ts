import { Question } from './question.model';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}
