import { TestBed } from '@angular/core/testing';
import { UserQuizService, QuizDraft } from './user-quiz.service';

const draft: QuizDraft = {
  title: 'Mój quiz',
  category: 'Test',
  questions: [{ id: 'q1', type: 'boolean', text: 'Czy to działa?', correct: true }],
};

describe('UserQuizService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts empty when localStorage has no user quizzes', () => {
    const service = TestBed.inject(UserQuizService);
    expect(service.getAll()()).toEqual([]);
  });

  it('creates a quiz, persists it and exposes it via getAll/getById', () => {
    const service = TestBed.inject(UserQuizService);

    const created = service.create(draft);

    expect(service.getAll()()).toEqual([created]);
    expect(service.getById(created.id)()).toEqual(created);

    const stored = JSON.parse(localStorage.getItem('quiz.userQuizzes')!);
    expect(stored).toEqual([created]);
  });

  it('updates an existing quiz in place', () => {
    const service = TestBed.inject(UserQuizService);
    const created = service.create(draft);

    service.update(created.id, { ...draft, title: 'Zmieniony tytuł' });

    const updated = service.getById(created.id)();
    expect(updated?.title).toBe('Zmieniony tytuł');
    expect(updated?.createdAt).toBe(created.createdAt);
  });

  it('deletes a quiz', () => {
    const service = TestBed.inject(UserQuizService);
    const created = service.create(draft);

    service.delete(created.id);

    expect(service.getAll()()).toEqual([]);
  });

  it('rehydrates quizzes from localStorage on a later inject', () => {
    const first = TestBed.inject(UserQuizService);
    first.create(draft);

    TestBed.resetTestingModule();
    const second = TestBed.inject(UserQuizService);

    expect(second.getAll()().length).toBe(1);
    expect(second.getAll()()[0].title).toBe('Mój quiz');
  });
});
