import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizList } from './quiz-list';
import { provideQuizServiceStub } from '../../testing/quiz-service.stub';

describe('QuizList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [provideRouter([]), provideQuizServiceStub()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuizList);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
