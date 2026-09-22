import { Injectable, Signal, signal } from '@angular/core';

const PLAYER_NAME_KEY = 'quiz.playerName';
const DEVICE_ID_KEY = 'quiz.deviceId';

@Injectable({ providedIn: 'root' })
export class PlayerIdentityService {
  private readonly playerNameSignal = signal(localStorage.getItem(PLAYER_NAME_KEY) ?? '');

  constructor() {
    this.ensureDeviceId();
  }

  get playerName(): Signal<string> {
    return this.playerNameSignal.asReadonly();
  }

  setPlayerName(name: string): void {
    const trimmed = name.trim();
    localStorage.setItem(PLAYER_NAME_KEY, trimmed);
    this.playerNameSignal.set(trimmed);
  }

  getDeviceId(): string {
    return this.ensureDeviceId();
  }

  private ensureDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }
}
