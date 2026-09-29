import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { CATEGORIES } from './models';
import { QuizSearchService } from './services/quiz-search.service';
import { CategoryIcon } from './shared/category-icon/category-icon';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, CategoryIcon],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  protected readonly title = signal('Guess and Hope');
  protected readonly categories = CATEGORIES;
  protected readonly quizSearch = inject(QuizSearchService);

  protected readonly searchOpen = signal(false);
  private closeSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  /** The category badges only appear once the mobile search field has been tapped. */
  protected readonly mobileSearchEngaged = signal(false);

  /** The quiz search bar only makes sense on the quiz list (home) page. */
  protected readonly isQuizzesPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.isQuizzesUrl(event.urlAfterRedirects)),
    ),
    { initialValue: this.isQuizzesUrl(this.router.url) },
  );

  /** Opens the search panel immediately and cancels any pending close. */
  protected openSearch(): void {
    if (this.closeSearchTimeout) {
      clearTimeout(this.closeSearchTimeout);
      this.closeSearchTimeout = null;
    }
    this.searchOpen.set(true);
  }

  /** Keeps the panel open for a bit after the cursor leaves, so it doesn't vanish on a small overshoot. */
  protected scheduleCloseSearch(): void {
    this.closeSearchTimeout = setTimeout(() => {
      this.searchOpen.set(false);
      this.closeSearchTimeout = null;
    }, 600);
  }

  protected engageMobileSearch(): void {
    this.mobileSearchEngaged.set(true);
  }

  private isQuizzesUrl(url: string): boolean {
    return url === '/' || url.startsWith('/quizzes');
  }
}
