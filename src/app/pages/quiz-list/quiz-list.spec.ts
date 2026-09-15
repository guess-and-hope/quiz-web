import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuizList } from './quiz-list';

describe('QuizList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    TestBed.inject(HttpTestingController).match(() => true);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuizList);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
