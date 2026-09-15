import { TestBed } from '@angular/core/testing';
import { AttemptService } from './attempt.service';

describe('AttemptService', () => {
  it('has no attempt before anything is submitted', () => {
    const service = TestBed.inject(AttemptService);
    expect(service.getAttempt()()).toBeUndefined();
  });

  it('exposes the most recently submitted attempt', () => {
    const service = TestBed.inject(AttemptService);

    service.submit('geografia', { 'geo-1': 1 });
    expect(service.getAttempt()()).toEqual({ quizId: 'geografia', answers: { 'geo-1': 1 } });

    service.submit('historia', { 'hist-1': true });
    expect(service.getAttempt()()).toEqual({ quizId: 'historia', answers: { 'hist-1': true } });
  });
});
