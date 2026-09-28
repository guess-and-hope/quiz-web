import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizEditor } from './quiz-editor';
import { MyQuizzes } from '../my-quizzes/my-quizzes';
import { UserQuizService } from '../../services/user-quiz.service';
import { provideUserQuizServiceStub } from '../../testing/user-quiz-service.stub';
import { Quiz } from '../../models';

describe('QuizEditor', () => {
  it('disables saving until the quiz has a title and a valid question', async () => {
    await TestBed.configureTestingModule({
      imports: [QuizEditor],
      providers: [
        provideRouter([{ path: 'moje-quizy', component: MyQuizzes }]),
        provideUserQuizServiceStub(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizEditor);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['canSave']).toBe(false);

    component['title'] = 'Nowy quiz';
    component['questions'][0].text = 'Pytanie testowe?';
    component['questions'][0].options = ['A', 'B'];
    component['questions'][0].correctSingle = 0;

    expect(component['canSave']).toBe(true);
  });

  it('creates a new user quiz on save', async () => {
    await TestBed.configureTestingModule({
      imports: [QuizEditor],
      providers: [
        provideRouter([{ path: 'moje-quizy', component: MyQuizzes }]),
        provideUserQuizServiceStub(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizEditor);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['title'] = 'Stolice';
    component['questions'][0].text = 'Stolica Polski?';
    component['questions'][0].options = ['Warszawa', 'Kraków'];
    component['questions'][0].correctSingle = 0;

    await component['save']();

    const service = TestBed.inject(UserQuizService);
    const quizzes = service.getAll()();
    expect(quizzes.length).toBe(1);
    expect(quizzes[0].title).toBe('Stolice');
    expect(quizzes[0].questions[0]).toEqual(
      expect.objectContaining({ type: 'single', text: 'Stolica Polski?', correct: 0 }),
    );
  });

  it('prefills the form and updates the existing quiz when editing', async () => {
    const quiz: Quiz = {
      id: 'do-edycji',
      title: 'Do edycji',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      questions: [{ id: 'q1', type: 'boolean', text: 'Prawda?', correct: true }],
    };

    await TestBed.configureTestingModule({
      imports: [QuizEditor],
      providers: [
        provideRouter([{ path: 'moje-quizy', component: MyQuizzes }]),
        provideUserQuizServiceStub([quiz], [quiz.id]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuizEditor);
    fixture.componentRef.setInput('id', quiz.id);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component['title']).toBe('Do edycji');

    component['title'] = 'Po edycji';
    await component['save']();

    const service = TestBed.inject(UserQuizService);
    expect(service.getAll()().length).toBe(1);
    expect(service.getById(quiz.id)()?.title).toBe('Po edycji');
  });
});
