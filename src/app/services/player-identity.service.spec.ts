import { TestBed } from '@angular/core/testing';
import { PlayerIdentityService } from './player-identity.service';

describe('PlayerIdentityService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts with no player name when localStorage is empty', () => {
    const service = TestBed.inject(PlayerIdentityService);
    expect(service.playerName()).toBe('');
  });

  it('persists the player name to localStorage and updates the signal', () => {
    const service = TestBed.inject(PlayerIdentityService);

    service.setPlayerName('  Kuba  ');

    expect(service.playerName()).toBe('Kuba');
    expect(localStorage.getItem('quiz.playerName')).toBe('Kuba');
  });

  it('rehydrates the player name from localStorage on a later inject', () => {
    localStorage.setItem('quiz.playerName', 'Asia');

    const service = TestBed.inject(PlayerIdentityService);

    expect(service.playerName()).toBe('Asia');
  });

  it('lazily creates and then reuses the same deviceId', () => {
    const service = TestBed.inject(PlayerIdentityService);

    const first = service.getDeviceId();
    const second = service.getDeviceId();

    expect(first).toBe(second);
    expect(localStorage.getItem('quiz.deviceId')).toBe(first);
  });
});
