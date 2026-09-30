import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ImageSearchResult {
  id: number;
  thumbnailUrl: string;
  url: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ImageSearchService {
  private readonly supabase = inject(SupabaseService);

  async search(query: string): Promise<ImageSearchResult[]> {
    const { data, error } = await this.supabase.client.functions.invoke<{
      results: ImageSearchResult[];
    }>('search-images', { body: { query } });

    if (error) {
      throw new Error(await this.extractError(error));
    }
    return data?.results ?? [];
  }

  // Edge Function zwraca komunikat błędu w polu `error` (po polsku) — wyciągamy go
  // z odpowiedzi HTTP, żeby pokazać użytkownikowi konkretną przyczynę.
  private async extractError(error: unknown): Promise<string> {
    const fallback = 'Nie udało się wyszukać zdjęć. Spróbuj ponownie.';
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json();
        if (body?.error) {
          return body.error as string;
        }
      } catch {
        // ignorujemy — użyjemy komunikatu domyślnego
      }
    }
    return fallback;
  }
}
