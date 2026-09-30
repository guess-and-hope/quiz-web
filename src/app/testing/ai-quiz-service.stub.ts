import { AiQuizService, GenerateQuizResult, QuizDifficulty } from '../services/ai-quiz.service';
import { Question } from '../models';

export interface AiRegenerateArgs {
  topic: string;
  difficulty: QuizDifficulty;
  avoid?: string[];
}

/** Sterowanie stubem z poziomu testu (argumenty wywołań, wynik, wymuszony błąd). */
export interface AiQuizServiceStubControl {
  regenerateCalls: number;
  lastRegenerateArgs: AiRegenerateArgs | null;
  /** Pytanie zwracane przez `regenerateQuestion`/`generate`. `null` = brak wyniku. */
  nextQuestion: Question | null;
  /** Gdy ustawione, `regenerateQuestion` rzuca tym błędem. */
  error: Error | null;
}

/**
 * Lekki stub AiQuizService dla testów edytora — nie dotyka Supabase/Gemini,
 * zapisuje argumenty wywołań i zwraca konfigurowalne pytanie.
 */
export function provideAiQuizServiceStub() {
  const control: AiQuizServiceStubControl = {
    regenerateCalls: 0,
    lastRegenerateArgs: null,
    nextQuestion: { id: 'ai-new', type: 'single', text: 'Nowe pytanie AI?', options: ['A', 'B'], correct: 0 },
    error: null,
  };

  const stub: Pick<AiQuizService, 'generate' | 'regenerateQuestion'> = {
    generate: async (): Promise<GenerateQuizResult> => ({
      questions: control.nextQuestion ? [control.nextQuestion] : [],
    }),
    regenerateQuestion: async (params: AiRegenerateArgs): Promise<Question | null> => {
      control.regenerateCalls++;
      control.lastRegenerateArgs = params;
      if (control.error) {
        throw control.error;
      }
      return control.nextQuestion;
    },
  };

  return { provider: { provide: AiQuizService, useValue: stub }, control };
}
