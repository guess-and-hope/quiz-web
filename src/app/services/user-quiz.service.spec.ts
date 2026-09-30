import { TestBed } from '@angular/core/testing';
import { UserQuizService, QuizDraft } from './user-quiz.service';
import { SupabaseService } from './supabase.service';

const draft: QuizDraft = {
  title: 'Mój quiz',
  category: 'Test',
  questions: [{ id: 'q1', type: 'boolean', text: 'Czy to działa?', correct: true }],
};

/**
 * In-memory stand-in for the merged `quizzes` table, chainable like the real
 * client. Pass `captured` to inspect the rows sent to `insert`.
 */
function provideSupabaseStub(captured?: { inserts: Record<string, unknown>[] }) {
  let rows: Record<string, unknown>[] = [];

  return {
    provide: SupabaseService,
    useValue: {
      client: {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [...rows].sort((a, b) =>
                    String(b['created_at']).localeCompare(String(a['created_at'])),
                  ),
                  error: null,
                }),
            }),
          }),
          insert: (row: Record<string, unknown>) => {
            rows.push(row);
            captured?.inserts.push(row);
            return Promise.resolve({ error: null });
          },
          update: (patch: Record<string, unknown>) => ({
            eq: (_column: string, id: string) => {
              rows = rows.map((row) => (row['id'] === id ? { ...row, ...patch } : row));
              return Promise.resolve({ error: null });
            },
          }),
          delete: () => ({
            eq: (_column: string, id: string) => {
              rows = rows.filter((row) => row['id'] !== id);
              return Promise.resolve({ error: null });
            },
          }),
        }),
      },
    },
  };
}

describe('UserQuizService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts empty and loads created quizzes', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabaseStub()] });
    const service = TestBed.inject(UserQuizService);
    expect(service.getAll()()).toEqual([]);

    const { error } = await service.create(draft);

    expect(error).toBeNull();
    expect(service.getAll()().length).toBe(1);
    expect(service.getAll()()[0].title).toBe('Mój quiz');
  });

  it('flags a created quiz as a user quiz (is_user_quiz = true)', async () => {
    const captured = { inserts: [] as Record<string, unknown>[] };
    TestBed.configureTestingModule({ providers: [provideSupabaseStub(captured)] });
    const service = TestBed.inject(UserQuizService);

    await service.create(draft);

    expect(captured.inserts.length).toBe(1);
    expect(captured.inserts[0]['is_user_quiz']).toBe(true);
  });

  it('marks a freshly created quiz as mine', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabaseStub()] });
    const service = TestBed.inject(UserQuizService);

    await service.create(draft);
    const created = service.getAll()()[0];

    expect(service.isMine(created.id)).toBe(true);
    expect(service.isMine('inny-quiz')).toBe(false);
  });

  it('updates an existing quiz in place', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabaseStub()] });
    const service = TestBed.inject(UserQuizService);
    await service.create(draft);
    const created = service.getAll()()[0];

    await service.update(created.id, { ...draft, title: 'Zmieniony tytuł' });

    const updated = service.getById(created.id)();
    expect(updated?.title).toBe('Zmieniony tytuł');
  });

  it('deletes a quiz', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabaseStub()] });
    const service = TestBed.inject(UserQuizService);
    await service.create(draft);
    const created = service.getAll()()[0];

    await service.delete(created.id);

    expect(service.getAll()()).toEqual([]);
  });
});
