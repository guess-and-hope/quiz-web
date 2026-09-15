import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuizService } from './quiz.service';
import { Quiz } from '../models';

const makeQuiz = (id: string): Quiz => ({
  id,
  title: id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [],
});

describe('QuizService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads all starter quizzes and exposes them as a signal', () => {
    const service = TestBed.inject(QuizService);

    const requests = httpMock.match(() => true);
    expect(requests.length).toBe(3);
    requests.forEach((req) => req.flush(makeQuiz(req.request.url)));

    expect(service.getAll()().length).toBe(3);
    expect(service.isLoading()()).toBe(false);
  });

  it('getById returns the matching quiz once loaded', () => {
    const service = TestBed.inject(QuizService);

    httpMock.match(() => true).forEach((req) => {
      const id = req.request.url.split('/').pop()!.replace('.json', '');
      req.flush(makeQuiz(id));
    });

    expect(service.getById('geografia')()?.id).toBe('geografia');
    expect(service.getById('brak')()).toBeUndefined();
  });
});
