import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyQuizzes } from './my-quizzes';
import { UserQuizService } from '../../services/user-quiz.service';

describe('MyQuizzes', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MyQuizzes],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('shows the empty state when there are no user quizzes', () => {
    const fixture = TestBed.createComponent(MyQuizzes);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nie masz jeszcze żadnych własnych quizów');
  });

  it('lists user quizzes and removes one on delete', () => {
    const service = TestBed.inject(UserQuizService);
    const quiz = service.create({
      title: 'Mój quiz',
      questions: [{ id: 'q1', type: 'boolean', text: 'Pytanie?', correct: true }],
    });

    const fixture = TestBed.createComponent(MyQuizzes);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mój quiz');

    fixture.componentInstance['confirmDelete'](quiz);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Na pewno chcesz usunąć');

    fixture.componentInstance['deleteConfirmed']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Mój quiz');
  });

  it('keeps the quiz when the deletion is cancelled', () => {
    const service = TestBed.inject(UserQuizService);
    const quiz = service.create({
      title: 'Zachowany quiz',
      questions: [{ id: 'q1', type: 'boolean', text: 'Pytanie?', correct: true }],
    });

    const fixture = TestBed.createComponent(MyQuizzes);
    fixture.detectChanges();

    fixture.componentInstance['confirmDelete'](quiz);
    fixture.componentInstance['cancelDelete']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Zachowany quiz');
    expect(fixture.nativeElement.textContent).not.toContain('Na pewno chcesz usunąć');
  });
});
