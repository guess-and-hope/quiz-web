import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionImage } from '../../models';
import { ImageSearchResult, ImageSearchService } from '../../services/image-search.service';

@Component({
  selector: 'app-image-picker',
  imports: [FormsModule],
  templateUrl: './image-picker.html',
  styleUrl: './image-picker.scss',
})
export class ImagePicker {
  readonly image = input<QuestionImage | null>(null);
  readonly imageChange = output<QuestionImage | null>();

  private readonly imageSearchService = inject(ImageSearchService);

  protected readonly panelOpen = signal(false);
  protected readonly query = signal('');
  protected readonly results = signal<ImageSearchResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly searched = signal(false);
  protected readonly error = signal<string | null>(null);

  // Tracks the url of an attached image that failed to load (e.g. an expired
  // Pixabay link) so the preview can be hidden instead of showing a broken-image icon.
  private readonly failedImageUrl = signal<string | null>(null);

  protected imageFailed(url: string): boolean {
    return this.failedImageUrl() === url;
  }

  protected onImageError(url: string): void {
    this.failedImageUrl.set(url);
  }

  protected openPanel(): void {
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
  }

  protected async search(): Promise<void> {
    const query = this.query().trim();
    if (!query || this.searching()) {
      return;
    }

    this.searching.set(true);
    this.error.set(null);
    try {
      this.results.set(await this.imageSearchService.search(query));
      this.searched.set(true);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Nie udało się wyszukać zdjęć.');
    } finally {
      this.searching.set(false);
    }
  }

  protected pick(result: ImageSearchResult): void {
    this.imageChange.emit({
      url: result.url,
      photographer: result.photographer,
      photographerUrl: result.photographerUrl,
      sourceUrl: result.sourceUrl,
    });
    this.results.set([]);
    this.query.set('');
    this.searched.set(false);
    this.panelOpen.set(false);
  }

  protected remove(): void {
    this.imageChange.emit(null);
  }
}
