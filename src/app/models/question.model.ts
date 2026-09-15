export type QuestionType = 'single' | 'multi' | 'boolean';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single';
  options: string[];
  correct: number;
}

export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi';
  options: string[];
  correct: number[];
}

export interface BooleanQuestion extends BaseQuestion {
  type: 'boolean';
  correct: boolean;
}

export type Question = SingleChoiceQuestion | MultiChoiceQuestion | BooleanQuestion;
