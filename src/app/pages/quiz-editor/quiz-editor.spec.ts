import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuizEditor } from './quiz-editor';
import { UserQuizService } from '../../services/user-quiz.service';
import { provideUserQuizServiceStub } from '../../testing/user-quiz-service.stub';
import { provideAiQuizServiceStub } from '../../testing/ai-quiz-service.stub';
import { Quiz } from '../../models';

/** Stand-in for the quiz list the editor navigates back to after save/cancel. */
@Component({ selector: 'app-quizzes-stub', template: '' })
class QuizzesStub {}

describe('QuizEditor', () => {
  it('disables saving until the quiz has a title and a valid question', async () => {
    await TestBed.configureTestingModule({
      imports: [QuizEditor],
      providers: [
        provideRouter([{ path: 'quizzes', component: QuizzesStub }]),
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
        provideRouter([{ path: 'quizzes', component: QuizzesStub }]),
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
        provideRouter([{ path: 'quizzes', component: QuizzesStub }]),
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

  describe('regeneracja pojedynczego pytania', () => {
    async function createEditor() {
      const ai = provideAiQuizServiceStub();
      await TestBed.configureTestingModule({
        imports: [QuizEditor],
        providers: [
          provideRouter([{ path: 'quizzes', component: QuizzesStub }]),
          provideUserQuizServiceStub(),
          ai.provider,
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(QuizEditor);
      fixture.detectChanges();
      return { fixture, component: fixture.componentInstance, control: ai.control };
    }

    it('podmienia tylko wskazane pytanie, resztę zostawia nietkniętą', async () => {
      const { component, control } = await createEditor();
      component['title'] = 'Historia Polski';
      component['addQuestion']();
      const firstId = component['questions'][0].id;
      const secondId = component['questions'][1].id;
      component['questions'][0].text = 'Pierwsze pytanie?';
      component['questions'][1].text = 'Drugie pytanie?';
      control.nextQuestion = { id: 'srv-new', type: 'single', text: 'Świeże pytanie?', options: ['A', 'B'], correct: 0 };

      await component['regenerateQuestion'](component['questions'][0]);

      expect(control.regenerateCalls).toBe(1);
      expect(component['questions'][0].text).toBe('Świeże pytanie?');
      expect(component['questions'][0].id).toBe(firstId); // id slotu zachowany
      expect(component['questions'][1].text).toBe('Drugie pytanie?');
      expect(component['questions'][1].id).toBe(secondId);
    });

    it('gdy pole wskazówki jest puste, tematem jest tytuł quizu', async () => {
      const { component, control } = await createEditor();
      component['title'] = 'Historia Polski';
      component['questions'][0].aiHint = '';

      await component['regenerateQuestion'](component['questions'][0]);

      expect(control.lastRegenerateArgs?.topic).toBe('Historia Polski');
    });

    it('gdy wskazówka jest wpisana, staje się tematem pytania', async () => {
      const { component, control } = await createEditor();
      component['title'] = 'Historia Polski';
      component['questions'][0].aiHint = 'Bitwa pod Grunwaldem';

      await component['regenerateQuestion'](component['questions'][0]);

      expect(control.lastRegenerateArgs?.topic).toBe('Bitwa pod Grunwaldem');
    });

    it('nie woła AI, gdy brak tytułu i wskazówki, i ustawia błąd przy pytaniu', async () => {
      const { component, control } = await createEditor();
      component['title'] = '';
      component['questions'][0].aiHint = '';

      await component['regenerateQuestion'](component['questions'][0]);

      expect(control.regenerateCalls).toBe(0);
      expect(component['regenError']()?.id).toBe(component['questions'][0].id);
    });

    it('przekazuje teksty wszystkich pytań jako `avoid` (w tym bieżące, by nie wrócił duplikat)', async () => {
      const { component, control } = await createEditor();
      component['title'] = 'Quiz';
      component['addQuestion']();
      component['questions'][0].text = 'Pierwsze?';
      component['questions'][1].text = 'Drugie?';

      await component['regenerateQuestion'](component['questions'][0]);

      expect(control.lastRegenerateArgs?.avoid).toEqual(['Pierwsze?', 'Drugie?']);
    });
  });
});
