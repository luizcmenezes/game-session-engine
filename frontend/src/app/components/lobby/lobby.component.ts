import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../services/web-socket.service';
import { SessionService } from '../../services/session.service';
import { GameStateService, AppState } from '../../services/game-state.service';
import { Observable } from 'rxjs';

interface Game {
  id: string;
  title: string;
  description: string;
  path: string;
  status: 'available' | 'coming-soon';
  tags: string[];
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <main class="container">
      <header class="hero">
        <h1>Game Hub</h1>
        <p>Menu central para acessar todos os jogos do projeto.</p>
      </header>

      @let state = (state$ | async);
      @if (state === AppState.LOBBY) {
        <div class="session-form card">
          <h3>Configuração de Sessão</h3>
          <div class="form-group">
            <label for="playerName">Seu Nome:</label>
            <input type="text" id="playerName" [(ngModel)]="playerName" placeholder="Digite seu nome">
          </div>
          <div class="form-group">
            <label for="sessionId">ID da Sessão (opcional):</label>
            <input type="text" id="sessionId" [(ngModel)]="sessionId" placeholder="ID para entrar em sala existente">
          </div>
        </div>

        <section class="grid" aria-label="Lista de jogos">
          @for (game of games; track game.id) {
            <article class="game-card">
              <span class="badge" [ngClass]="game.status === 'available' ? 'live' : 'soon'">
                {{ game.status === 'available' ? 'Disponivel' : 'Em breve' }}
              </span>
              <h2>{{ game.title }}</h2>
              <p>{{ game.description }}</p>
              <div class="tags">
                @for (tag of game.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
              
              @switch (game.status) {
                @case ('available') {
                  <button class="action play" (click)="joinGame(game.id)">
                    Jogar
                  </button>
                }
                @default {
                  <button class="action disabled">
                    Aguardando
                  </button>
                }
              }
            </article>
          }
        </section>
      } @else if (state === AppState.WAITING) {
        <div class="waiting-screen card">
          <h2>Aguardando outros jogadores...</h2>
          <p>Sessão ID: <code>{{ currentSessionId }}</code></p>
          <div class="loader"></div>
          <button class="action disabled" (click)="cancel()">Cancelar</button>
        </div>
      } @else if (state === AppState.RECONNECTING) {
        <div class="waiting-screen card">
          <h2>Reconectando...</h2>
          <p>Tentando retomar sua sessão anterior.</p>
          <div class="loader"></div>
          <button class="action disabled" (click)="cancelReconnect()">Cancelar</button>
        </div>
      }

      <footer class="footer">
        Desenvolvido com Angular 18+ em modo estrito.
      </footer>
    </main>
  `,
  styles: [`
    .session-form, .waiting-screen {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      backdrop-filter: blur(4px);
      text-align: center;
    }
    .form-group {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      text-align: left;
    }
    input {
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: rgba(0,0,0,0.3);
      color: var(--txt);
      font-size: 1rem;
    }
    .action {
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
    }
    .loader {
      border: 4px solid rgba(255,255,255,0.1);
      border-left-color: var(--accent);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LobbyComponent implements OnInit {
  private webSocketService = inject(WebSocketService);
  private sessionService = inject(SessionService);
  private gameStateService = inject(GameStateService);

  playerName = '';
  sessionId = '';
  state$: Observable<AppState> = this.gameStateService.getState();
  AppState = AppState;

  games: Game[] = [
    {
      id: 'snake',
      title: 'Snake',
      description: 'Clássico da cobrinha com modos 1 e 2 jogadores, suporte mobile e recorde local.',
      path: '/games/snake',
      status: 'available',
      tags: ['Arcade', '1-2 jogadores', 'Mobile']
    },
    {
      id: 'war-light',
      title: 'War Light',
      description: 'Jogo estratégico por turnos inspirado em War: distribua territórios, reforce e ataque.',
      path: '/games/war-light',
      status: 'available',
      tags: ['Estratégia', 'Turnos', '2 jogadores']
    }
  ];

  ngOnInit(): void {
    const savedName = localStorage.getItem('gs_player_name');
    if (savedName) this.playerName = savedName;

    // Escutar por início do jogo
    this.webSocketService.getGameStarted().subscribe(() => {
      this.gameStateService.setPlaying();
    });
  }

  get currentSessionId(): string {
    return this.sessionService.getSessionId() || '';
  }

  get availableCount(): number {
    return this.games.filter(g => g.status === 'available').length;
  }

  joinGame(gameType: string): void {
    if (!this.playerName) {
      alert('Por favor, insira seu nome.');
      return;
    }
    localStorage.setItem('gs_player_name', this.playerName);

    const sId = this.sessionId || (
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
          )
    );
    this.sessionService.setSessionId(sId);
    
    this.webSocketService.connect();
    this.webSocketService.joinGame(sId, this.playerName);
    
    this.gameStateService.setWaiting(gameType);
  }

  cancel(): void {
    this.gameStateService.setLobby();
    this.webSocketService.disconnect();
  }

  cancelReconnect(): void {
    this.gameStateService.setLobby();
    this.webSocketService.disconnect();
  }
}
