import { TestBed } from '@angular/core/testing';
import { ImagePicker } from './image-picker';
import { ImageSearchResult, ImageSearchService } from '../../services/image-search.service';

const fakeResult: ImageSearchResult = {
  id: 1,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  url: 'https://example.com/large.jpg',
  photographer: 'Jan Testowy',
  photographerUrl: 'https://pixabay.com/users/jan-1/',
  sourceUrl: 'https://pixabay.com/photos/1/',
};

describe('ImagePicker', () => {
  it('emits the picked image and shows a preview', async () => {
    const searchService = { search: async () => [fakeResult] };
    await TestBed.configureTestingModule({
      imports: [ImagePicker],
      providers: [{ provide: ImageSearchService, useValue: searchService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ImagePicker);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    let emitted: unknown;
    component.imageChange.subscribe((value) => (emitted = value));

    component['query'].set('góry');
    await component['search']();
    component['pick'](fakeResult);

    expect(emitted).toEqual({
      url: fakeResult.url,
      photographer: fakeResult.photographer,
      photographerUrl: fakeResult.photographerUrl,
      sourceUrl: fakeResult.sourceUrl,
    });
  });

  it('emits null when the image is removed', async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePicker],
      providers: [{ provide: ImageSearchService, useValue: { search: async () => [] } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ImagePicker);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    let emitted: unknown = 'unset';
    component.imageChange.subscribe((value) => (emitted = value));

    component['remove']();

    expect(emitted).toBeNull();
  });
});
