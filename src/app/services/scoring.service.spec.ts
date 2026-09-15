import { TestBed } from '@angular/core/testing';
import { ScoringService } from './scoring.service';
import {
  BooleanQuestion,
  MultiChoiceQuestion,
  Quiz,
  SingleChoiceQuestion,
} from '../models';

const single: SingleChoiceQuestion = {
  id: 'single',
  type: 'single',
  text: '?',
  options: ['a', 'b', 'c'],
  correct: 1,
};

const multi: MultiChoiceQuestion = {
  id: 'multi',
  type: 'multi',
  text: '?',
  options: ['a', 'b', 'c', 'd'],
  correct: [0, 2],
};

const boolean: BooleanQuestion = {
  id: 'boolean',
  type: 'boolean',
  text: '?',
  correct: true,
};

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = TestBed.inject(ScoringService);
  });

  it('marks single-choice answers correct only for the exact index', () => {
    expect(service.isCorrect(single, 1)).toBe(true);
    expect(service.isCorrect(single, 0)).toBe(false);
    expect(service.isCorrect(single, undefined)).toBe(false);
  });

  it('marks boolean answers correct only for the exact value', () => {
    expect(service.isCorrect(boolean, true)).toBe(true);
    expect(service.isCorrect(boolean, false)).toBe(false);
  });

  it('requires an exact set match for multi-choice answers', () => {
    expect(service.isCorrect(multi, [0, 2])).toBe(true);
    expect(service.isCorrect(multi, [2, 0])).toBe(true);
    expect(service.isCorrect(multi, [0])).toBe(false);
    expect(service.isCorrect(multi, [0, 1, 2])).toBe(false);
    expect(service.isCorrect(multi, [])).toBe(false);
  });

  it('scores a full quiz as points and percentage', () => {
    const quiz: Quiz = {
      id: 'q',
      title: 't',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      questions: [single, multi, boolean],
    };

    const result = service.score(quiz, {
      single: 1,
      multi: [0, 2],
      boolean: false,
    });

    expect(result).toEqual({ correct: 2, total: 3, percentage: 67 });
  });

  it('treats an empty quiz as a 0% score without dividing by zero', () => {
    const quiz: Quiz = {
      id: 'empty',
      title: 't',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      questions: [],
    };

    expect(service.score(quiz, {})).toEqual({ correct: 0, total: 0, percentage: 0 });
  });
});
