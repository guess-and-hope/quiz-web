import { TestBed } from '@angular/core/testing';
import { QuizService } from './quiz.service';
import { SupabaseService } from './supabase.service';

const rows = [
  {
    id: 'geografia',
    title: 'Geografia świata',
    description: null,
    category: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    questions: [],
  },
  {
    id: 'historia',
    title: 'Historia',
    description: 'Opis',
    category: 'Historia',
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    questions: [],
  },
];

function provideSupabaseStub(data: unknown, error: unknown = null) {
  return {
    provide: SupabaseService,
    useValue: {
      client: {
        from: () => ({
          select: () => ({
            order: () => Promise.resolve({ data, error }),
          }),
        }),
      },
    },
  };
}

// QuizService ładuje quizy asynchronicznie w konstruktorze — pozwól mikro/makro-taskom się rozliczyć.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('QuizService', () => {
  it('loads quizzes from Supabase and exposes them as a signal', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabaseStub(rows)] });
    const service = TestBed.inject(QuizService);

    await flush();

    expect(service.getAll()().length).toBe(2);
    expect(service.isLoading()()).toBe(false);
    expect(service.getError()()).toBeNull();

    // mapowanie snake_case -> camelCase oraz null -> undefined
    const geografia = service.getById('geografia')();
    expect(geografia?.description).toBeUndefined();
    expect(geografia?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(service.getById('brak')()).toBeUndefined();
  });

  it('exposes an error message when the query fails', async () => {
    TestBed.configureTestingModule({
      providers: [provideSupabaseStub(null, { message: 'boom' })],
    });
    const service = TestBed.inject(QuizService);

    await flush();

    expect(service.getError()()).toBe('Nie udało się wczytać quizów.');
    expect(service.isLoading()()).toBe(false);
    expect(service.getAll()().length).toBe(0);
  });
});
