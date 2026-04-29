import { Injectable, OnDestroy, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private sessionService = inject(SessionService);
  private socket: Socket;
  private readonly url = `http://${window.location.hostname}:3000/game`;

  private stateSyncSubject = new Subject<unknown>();
  private moveAppliedSubject = new Subject<unknown>();
  private errorSubject = new Subject<unknown>();
  private gameStartedSubject = new Subject<unknown>();
  private playerJoinedSubject = new Subject<unknown>();
  private connectErrorSubject = new Subject<unknown>();

  constructor() {
    this.socket = io(this.url, {
      autoConnect: false,
      transports: ['websocket'],
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on('STATE_SYNC', (data: unknown) => this.stateSyncSubject.next(data));
    this.socket.on('MOVE_APPLIED', (data: unknown) => this.moveAppliedSubject.next(data));
    this.socket.on('EVENT_ERROR', (data: unknown) => this.errorSubject.next(data));
    this.socket.on('GAME_STARTED', (data: unknown) => this.gameStartedSubject.next(data));
    this.socket.on('PLAYER_JOINED', (data: unknown) => this.playerJoinedSubject.next(data));

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (err: unknown) => this.connectErrorSubject.next(err));
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  joinGame(sessionId: string, playerName: string): void {
    const playerId = this.sessionService.getPlayerId();
    this.socket.emit('JOIN_GAME', { sessionId, playerId, playerName });
  }

  startGame(sessionId: string): void {
    this.socket.emit('START_GAME', { sessionId });
  }

  makeMove(sessionId: string, move: unknown): void {
    const playerId = this.sessionService.getPlayerId();
    this.socket.emit('MAKE_MOVE', { sessionId, playerId, move });
  }

  reconnect(sessionId: string): void {
    const playerId = this.sessionService.getPlayerId();
    this.socket.emit('RECONNECT', { sessionId, playerId });
  }

  // Observables
  getStateSync(): Observable<unknown> { return this.stateSyncSubject.asObservable(); }
  getMoveApplied(): Observable<unknown> { return this.moveAppliedSubject.asObservable(); }
  getErrors(): Observable<unknown> { return this.errorSubject.asObservable(); }
  getGameStarted(): Observable<unknown> { return this.gameStartedSubject.asObservable(); }
  getPlayerJoined(): Observable<unknown> { return this.playerJoinedSubject.asObservable(); }
  getConnectError(): Observable<unknown> { return this.connectErrorSubject.asObservable(); }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
