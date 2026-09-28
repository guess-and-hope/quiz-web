import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizList } from './quiz-list';
import { provideQuizServiceStub } from '../../testing/quiz-service.stub';
import { provideUserQuizServiceStub } from '../../testing/user-quiz-service.stub';

describe('QuizList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizList],
      providers: [provideRouter([]), provideQuizServiceStub(), provideUserQuizServiceStub()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuizList);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows both the curated and the user-submitted quiz sections', () => {
    const fixture = TestBed.createComponent(QuizList);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sprawdzone quizy');
    expect(text).toContain('Quizy użytkowników');
  });
});
