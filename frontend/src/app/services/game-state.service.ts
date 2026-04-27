import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export enum AppState {
  LOBBY = 'LOBBY',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  RECONNECTING = 'RECONNECTING'
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private router = inject(Router);
  private stateSubject = new BehaviorSubject<AppState>(AppState.LOBBY);
  private currentGameType: string | null = null;

  getState(): Observable<AppState> {
    return this.stateSubject.asObservable();
  }

  getCurrentState(): AppState {
    return this.stateSubject.value;
  }

  setWaiting(gameType: string): void {
    this.currentGameType = gameType;
    this.stateSubject.next(AppState.WAITING);
  }

  setPlaying(): void {
    this.stateSubject.next(AppState.PLAYING);
    if (this.currentGameType) {
      this.router.navigate([`/games/${this.currentGameType}`]);
    }
  }

  setLobby(): void {
    this.currentGameType = null;
    this.stateSubject.next(AppState.LOBBY);
    this.router.navigate(['/']);
  }

  setReconnecting(): void {
    this.stateSubject.next(AppState.RECONNECTING);
  }
}
