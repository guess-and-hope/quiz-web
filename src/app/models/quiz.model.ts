import { Question } from './question.model';

/** Curated set of category-badge colors, matching the app's brand tokens. */
export const CATEGORY_COLORS = ['teal', 'pink', 'green', 'red', 'yellow'] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/** Fixed list of quiz categories, each with a preassigned badge color and a Material Symbols icon name. */
export const CATEGORIES: readonly { name: string; color: CategoryColor; icon: string }[] = [
  { name: 'Geografia', color: 'teal', icon: 'public' },
  { name: 'Historia', color: 'red', icon: 'account_balance' },
  { name: 'Nauka', color: 'green', icon: 'science' },
  { name: 'Ogólna wiedza', color: 'pink', icon: 'help' },
  { name: 'Sport', color: 'yellow', icon: 'emoji_events' },
  { name: 'Filmy i seriale', color: 'teal', icon: 'movie' },
  { name: 'Muzyka', color: 'pink', icon: 'music_note' },
  { name: 'Literatura', color: 'green', icon: 'menu_book' },
  { name: 'Gry', color: 'red', icon: 'sports_esports' },
  { name: 'Sztuka i kultura', color: 'yellow', icon: 'palette' },
  { name: 'Zwierzęta', color: 'teal', icon: 'pets' },
  { name: 'Lifestyle', color: 'pink', icon: 'favorite' },
  { name: 'Technologia', color: 'green', icon: 'memory' },
  { name: 'Przyroda', color: 'red', icon: 'eco' },
  { name: 'Języki', color: 'yellow', icon: 'translate' },
  { name: 'Inne', color: 'teal', icon: 'more_horiz' },
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
