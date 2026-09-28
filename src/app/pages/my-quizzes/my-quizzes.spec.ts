import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyQuizzes } from './my-quizzes';
import { provideUserQuizServiceStub } from '../../testing/user-quiz-service.stub';
import { Quiz } from '../../models';

const quiz: Quiz = {
  id: 'q1',
  title: 'Mój quiz',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [{ id: 'q1-1', type: 'boolean', text: 'Pytanie?', correct: true }],
};

const otherQuiz: Quiz = {
  ...quiz,
  id: 'q2',
  title: 'Cudzy quiz',
};

describe('MyQuizzes', () => {
  it('shows the empty state when there are no user quizzes', async () => {
    await TestBed.configureTestingModule({
      imports: [MyQuizzes],
      providers: [provideRouter([]), provideUserQuizServiceStub()],
    }).compileComponents();

    const fixture = TestBed.createComponent(MyQuizzes);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nie masz jeszcze żadnych własnych quizów');
  });

  it('only lists quizzes owned by this browser, and removes one on delete', async () => {
    await TestBed.configureTestingModule({
      imports: [MyQuizzes],
      providers: [provideRouter([]), provideUserQuizServiceStub([quiz, otherQuiz], ['q1'])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MyQuizzes);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mój quiz');
    expect(fixture.nativeElement.textContent).not.toContain('Cudzy quiz');

    fixture.componentInstance['confirmDelete'](quiz);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Na pewno chcesz usunąć');

    await fixture.componentInstance['deleteConfirmed']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Mój quiz');
  });

  it('keeps the quiz when the deletion is cancelled', async () => {
    await TestBed.configureTestingModule({
      imports: [MyQuizzes],
      providers: [provideRouter([]), provideUserQuizServiceStub([quiz], ['q1'])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MyQuizzes);
    fixture.detectChanges();

    fixture.componentInstance['confirmDelete'](quiz);
    fixture.componentInstance['cancelDelete']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mój quiz');
    expect(fixture.nativeElement.textContent).not.toContain('Na pewno chcesz usunąć');
  });
});
