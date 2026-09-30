// Shared Pixabay search helper, used by both `search-images` (manual picker in
// the editor) and `generate-quiz` (auto-suggested photos for AI-generated questions).

const PIXABAY_SEARCH_URL = 'https://pixabay.com/api/';

interface PixabayHit {
  id: number;
  pageURL: string;
  previewURL: string;
  webformatURL: string;
  user: string;
  user_id: number;
}

export interface PixabayImageResult {
  id: number;
  thumbnailUrl: string;
  url: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
}

function toResult(hit: PixabayHit): PixabayImageResult {
  return {
    id: hit.id,
    thumbnailUrl: hit.previewURL,
    url: hit.webformatURL,
    photographer: hit.user,
    photographerUrl: `https://pixabay.com/users/${encodeURIComponent(hit.user)}-${hit.user_id}/`,
    sourceUrl: hit.pageURL,
  };
}

// Pixabay requires per_page to be between 3 and 200.
export async function searchPixabay(
  apiKey: string,
  query: string,
  perPage: number,
): Promise<PixabayImageResult[]> {
  const url =
    `${PIXABAY_SEARCH_URL}?key=${apiKey}&q=${encodeURIComponent(query)}` +
    `&image_type=photo&orientation=horizontal&safesearch=true&per_page=${Math.max(3, perPage)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Pixabay ${res.status}: ${detail.slice(0, 500)}`);
  }

  const data = await res.json();
  const hits: PixabayHit[] = Array.isArray(data?.hits) ? data.hits : [];
  return hits.map(toResult);
}
