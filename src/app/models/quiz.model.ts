import { Question } from './question.model';

/** Curated set of category-badge colors, matching the app's brand tokens. */
export const CATEGORY_COLORS = ['teal', 'pink', 'green', 'red', 'yellow'] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category?: string;
  categoryColor?: CategoryColor;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}
