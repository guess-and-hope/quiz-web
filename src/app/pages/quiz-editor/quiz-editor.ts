import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { QuizDraft, UserQuizService } from '../../services/user-quiz.service';
import { CATEGORY_COLORS, CategoryColor, Question, QuestionType } from '../../models';

interface QuestionDraft {
  id: string;
  type: QuestionType;
  text: string;
  explanation: string;
  options: string[];
  correctSingle: number | null;
  correctMulti: boolean[];
  correctBoolean: boolean;
}

function blankQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    type: 'single',
    text: '',
    explanation: '',
    options: ['', ''],
    correctSingle: null,
    correctMulti: [false, false],
    correctBoolean: true,
  };
}

function toDraft(question: Question): QuestionDraft {
  const base = { id: question.id, text: question.text, explanation: question.explanation ?? '' };

  if (question.type === 'boolean') {
    return {
      ...base,
      type: 'boolean',
      options: [],
      correctSingle: null,
      correctMulti: [],
      correctBoolean: question.correct,
    };
  }

  if (question.type === 'single') {
    return {
      ...base,
      type: 'single',
      options: [...question.options],
      correctSingle: question.correct,
      correctMulti: question.options.map(() => false),
      correctBoolean: true,
    };
  }

  return {
    ...base,
    type: 'multi',
    options: [...question.options],
    correctSingle: null,
    correctMulti: question.options.map((_, index) => question.correct.includes(index)),
    correctBoolean: true,
  };
}

function toQuestion(draft: QuestionDraft): Question {
  const base = {
    id: draft.id,
    text: draft.text.trim(),
    explanation: draft.explanation.trim() || undefined,
  };

  if (draft.type === 'boolean') {
    return { ...base, type: 'boolean', correct: draft.correctBoolean };
  }

  const options = draft.options.map((option) => option.trim());

  if (draft.type === 'single') {
    return { ...base, type: 'single', options, correct: draft.correctSingle! };
  }

  const correct = draft.correctMulti.reduce<number[]>(
    (indices, checked, index) => (checked ? [...indices, index] : indices),
    [],
  );
  return { ...base, type: 'multi', options, correct };
}

@Component({
  selector: 'app-quiz-editor',
  imports: [FormsModule, RouterLink],
  templateUrl: './quiz-editor.html',
  styleUrl: './quiz-editor.scss',
})
export class QuizEditor {
  readonly id = input<string>();

  private readonly userQuizService = inject(UserQuizService);
  private readonly router = inject(Router);

  protected readonly quizLoading = this.userQuizService.isLoading();
  protected readonly categoryColors = CATEGORY_COLORS;

  protected editingId: string | null = null;
  protected notFound = false;
  protected title = '';
  protected category = '';
  protected categoryColor: CategoryColor | null = null;
  protected description = '';
  protected questions: QuestionDraft[] = [blankQuestion()];

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly colorPickerOpen = signal(false);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id || this.editingId) {
        return;
      }
      const quiz = this.userQuizService.getById(id)();
      if (quiz) {
        this.editingId = id;
        this.title = quiz.title;
        this.category = quiz.category ?? '';
        this.categoryColor = quiz.categoryColor ?? null;
        this.description = quiz.description ?? '';
        this.questions = quiz.questions.map(toDraft);
      } else if (!this.userQuizService.isLoading()()) {
        this.notFound = true;
      }
    });
  }

  private static readonly COLOR_LABELS: Record<CategoryColor, string> = {
    teal: 'Turkusowy',
    pink: 'Różowy',
    green: 'Zielony',
    red: 'Czerwony',
    yellow: 'Żółty',
  };

  protected colorLabel(color: CategoryColor): string {
    return QuizEditor.COLOR_LABELS[color];
  }

  protected pickColor(color: CategoryColor | null): void {
    this.categoryColor = color;
    this.colorPickerOpen.set(false);
  }

  protected addQuestion(): void {
    this.questions = [...this.questions, blankQuestion()];
  }

  protected removeQuestion(index: number): void {
    this.questions = this.questions.filter((_, i) => i !== index);
  }

  protected onTypeChange(question: QuestionDraft): void {
    if (question.type !== 'boolean' && question.options.length < 2) {
      question.options = ['', ''];
    }
    if (question.type === 'multi' && question.correctMulti.length !== question.options.length) {
      question.correctMulti = question.options.map(() => false);
    }
  }

  protected addOption(question: QuestionDraft): void {
    question.options = [...question.options, ''];
    question.correctMulti = [...question.correctMulti, false];
  }

  protected removeOption(question: QuestionDraft, index: number): void {
    question.options = question.options.filter((_, i) => i !== index);
    question.correctMulti = question.correctMulti.filter((_, i) => i !== index);
    if (question.correctSingle === index) {
      question.correctSingle = null;
    } else if (question.correctSingle !== null && question.correctSingle > index) {
      question.correctSingle -= 1;
    }
  }

  protected get canSave(): boolean {
    return this.validationMessage === null;
  }

  protected get validationMessage(): string | null {
    if (!this.title.trim()) {
      return 'Podaj tytuł quizu.';
    }
    if (this.questions.length === 0) {
      return 'Dodaj przynajmniej jedno pytanie.';
    }
    for (let i = 0; i < this.questions.length; i++) {
      const message = this.questionValidationMessage(this.questions[i]);
      if (message) {
        return `Pytanie ${i + 1}: ${message}`;
      }
    }
    return null;
  }

  private questionValidationMessage(question: QuestionDraft): string | null {
    if (!question.text.trim()) {
      return 'uzupełnij treść pytania.';
    }
    if (question.type === 'boolean') {
      return null;
    }
    if (question.options.length < 2) {
      return 'dodaj przynajmniej 2 odpowiedzi.';
    }
    if (question.options.some((option) => !option.trim())) {
      return 'uzupełnij wszystkie pola odpowiedzi (albo usuń puste).';
    }
    if (question.type === 'single' && question.correctSingle === null) {
      return 'zaznacz, która odpowiedź jest poprawna.';
    }
    if (question.type === 'multi' && !question.correctMulti.some(Boolean)) {
      return 'zaznacz przynajmniej jedną poprawną odpowiedź.';
    }
    return null;
  }

  protected async save(): Promise<void> {
    if (!this.canSave || this.saving()) {
      return;
    }

    const draft: QuizDraft = {
      title: this.title.trim(),
      category: this.category.trim() || undefined,
      categoryColor: this.categoryColor ?? undefined,
      description: this.description.trim() || undefined,
      questions: this.questions.map(toQuestion),
    };

    this.saving.set(true);
    this.saveError.set(null);

    const { error } = this.editingId
      ? await this.userQuizService.update(this.editingId, draft)
      : await this.userQuizService.create(draft);

    this.saving.set(false);

    if (error) {
      this.saveError.set(error);
      return;
    }

    this.router.navigate(['/moje-quizy']);
  }
}
