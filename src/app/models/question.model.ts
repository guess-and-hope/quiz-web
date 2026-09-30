export type QuestionType = 'single' | 'multi' | 'boolean';

/**
 * A photo attached to a question, picked from Pixabay. We only ever store the
 * hotlinked Pixabay URL (never re-host the file) and the attribution fields
 * required by the Pixabay API terms.
 */
export interface QuestionImage {
  url: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  image?: QuestionImage;
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
