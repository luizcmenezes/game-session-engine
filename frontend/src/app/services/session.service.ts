import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private platformId = inject(PLATFORM_ID);
  private readonly PLAYER_ID_KEY = 'gs_player_id';
  private readonly SESSION_ID_KEY = 'gs_session_id';

  private playerId: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.init();
    }
  }

  private init(): void {
    this.playerId = localStorage.getItem(this.PLAYER_ID_KEY);
    if (!this.playerId) {
      this.playerId = crypto.randomUUID();
      localStorage.setItem(this.PLAYER_ID_KEY, this.playerId);
    }

    this.sessionId = localStorage.getItem(this.SESSION_ID_KEY);
  }

  getPlayerId(): string {
    if (!this.playerId) {
      this.playerId = crypto.randomUUID();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.PLAYER_ID_KEY, this.playerId);
      }
    }
    return this.playerId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(id: string): void {
    this.sessionId = id;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.SESSION_ID_KEY, id);
    }
  }

  clearSession(): void {
    this.sessionId = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.SESSION_ID_KEY);
    }
  }
}
