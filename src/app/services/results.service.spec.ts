import { TestBed } from '@angular/core/testing';
import { ResultsService } from './results.service';
import { SupabaseService } from './supabase.service';

interface Recorder {
  inserts: Record<string, unknown>[];
  eqCalls: [string, unknown][];
}

/**
 * Chainable stand-in for the Supabase query builder. `rows` is what a SELECT
 * chain resolves to; `rec` captures INSERT payloads and `.eq(...)` filters so
 * tests can assert on them.
 */
function provideSupabaseStub(rows: Record<string, unknown>[] = [], rec?: Recorder) {
  const builder: any = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      rec?.eqCalls.push([column, value]);
      return builder;
    },
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    then: (resolve: (v: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve),
  };

  return {
    provide: SupabaseService,
    useValue: {
      client: {
        from: () => ({
          select: () => builder,
          insert: (payload: Record<string, unknown>) => {
            rec?.inserts.push(payload);
            return Promise.resolve({ error: null });
          },
        }),
      },
    },
  };
}

const baseInput = {
  quizId: 'geografia',
  quizTitle: 'Geografia',
  playerName: 'Kuba',
  deviceId: 'd1',
  correct: 5,
  total: 5,
  percentage: 100,
  durationSeconds: 30,
};

describe('ResultsService', () => {
  it('flags a named save as a high-score (leaderboard) entry', async () => {
    const rec: Recorder = { inserts: [], eqCalls: [] };
    TestBed.configureTestingModule({ providers: [provideSupabaseStub([], rec)] });
    const service = TestBed.inject(ResultsService);

    await service.save({ ...baseInput, onLeaderboard: true });

    expect(rec.inserts[0]['on_leaderboard']).toBe(true);
    expect(rec.inserts[0]['player_name']).toBe('Kuba');
  });

  it('records an anonymous completion off the leaderboard', async () => {
    const rec: Recorder = { inserts: [], eqCalls: [] };
    TestBed.configureTestingModule({ providers: [provideSupabaseStub([], rec)] });
    const service = TestBed.inject(ResultsService);

    await service.save({ ...baseInput, playerName: '', onLeaderboard: false });

    expect(rec.inserts[0]['on_leaderboard']).toBe(false);
    expect(rec.inserts[0]['player_name']).toBe('');
  });

  it('restricts the ranking to leaderboard entries only', async () => {
    const rec: Recorder = { inserts: [], eqCalls: [] };
    TestBed.configureTestingModule({ providers: [provideSupabaseStub([], rec)] });
    const service = TestBed.inject(ResultsService);

    await service.topForQuiz('geografia', 10);

    expect(rec.eqCalls).toContainEqual(['on_leaderboard', true]);
  });

  it('counts solve events (one per completion), without deduplicating by device', async () => {
    // Rows as the DB returns them for the on_leaderboard = false filter — one
    // per completion. The same person solving three times counts as three.
    const rec: Recorder = { inserts: [], eqCalls: [] };
    const rows = [
      { quiz_id: 'geografia' },
      { quiz_id: 'geografia' },
      { quiz_id: 'geografia' },
      { quiz_id: 'historia' },
    ];
    TestBed.configureTestingModule({ providers: [provideSupabaseStub(rows, rec)] });
    const service = TestBed.inject(ResultsService);

    const counts = await service.getSolveCounts(['geografia', 'historia']);

    expect(counts['geografia']).toBe(3);
    expect(counts['historia']).toBe(1);
    // Only completion rows are counted, so ranking saves aren't double counted.
    expect(rec.eqCalls).toContainEqual(['on_leaderboard', false]);
  });
});
