import { Question } from './question.model';

/** Curated set of category-badge colors, matching the app's brand tokens. */
export const CATEGORY_COLORS = ['teal', 'pink', 'green', 'red', 'yellow'] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/** Fixed list of quiz categories, each with a preassigned badge color. */
export const CATEGORIES: readonly { name: string; color: CategoryColor }[] = [
  { name: 'Geografia', color: 'teal' },
  { name: 'Historia', color: 'red' },
  { name: 'Nauka', color: 'green' },
  { name: 'Ogólna wiedza', color: 'pink' },
  { name: 'Sport', color: 'yellow' },
  { name: 'Filmy i seriale', color: 'teal' },
  { name: 'Muzyka', color: 'pink' },
  { name: 'Literatura', color: 'green' },
  { name: 'Gry', color: 'red' },
  { name: 'Sztuka i kultura', color: 'yellow' },
  { name: 'Zwierzęta', color: 'teal' },
  { name: 'Lifestyle', color: 'pink' },
  { name: 'Technologia', color: 'green' },
  { name: 'Przyroda', color: 'red' },
  { name: 'Języki', color: 'yellow' },
  { name: 'Inne', color: 'teal' },
] as const;

/** Badge color for a category name, if it's one of the preset `CATEGORIES`. */
export function categoryColor(category: string | undefined): CategoryColor | undefined {
  return CATEGORIES.find((c) => c.name === category)?.color;
}

export interface Quiz {
  id: string;
  title: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}
