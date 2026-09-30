import { Injectable, computed, signal } from '@angular/core';

/** Shared quiz search/filter state, so the search bar in the app header can drive the quiz list page. */
@Injectable({ providedIn: 'root' })
export class QuizSearchService {
  readonly searchTerm = signal('');
  readonly selectedCategories = signal<ReadonlySet<string>>(new Set());
  /** When on, the list shows only quizzes owned by this browser. */
  readonly mineOnly = signal(false);

  readonly hasActiveFilters = computed(
    () =>
      this.searchTerm().trim().length > 0 ||
      this.selectedCategories().size > 0 ||
      this.mineOnly(),
  );

  toggleMineOnly(): void {
    this.mineOnly.update((on) => !on);
  }

  toggleCategory(name: string): void {
    const next = new Set(this.selectedCategories());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.selectedCategories.set(next);
  }

  isCategorySelected(name: string): boolean {
    return this.selectedCategories().has(name);
  }

  clear(): void {
    this.searchTerm.set('');
    this.selectedCategories.set(new Set());
    this.mineOnly.set(false);
  }
}
