import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  ElementRef, 
  HostListener,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../services/web-socket.service';
import { SessionService } from '../../../services/session.service';
import { SnakeState } from '../../../models/snake.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <div class="sidebar">
        <div class="scoreboard card">
          <h3>Placar</h3>
          @for (p of gameState?.players; track p.playerId; let i = $index) {
            <div class="score-item" [ngClass]="'player-' + i">
              <span class="player-name">{{ p.playerId === myId ? 'VOCÊ' : 'P' + (i+1) }}</span>
              <span class="player-score">{{ p.score }}</span>
              @if (!p.alive) {
                <span class="dead-tag">ELIMINADO</span>
              }
            </div>
          }
        </div>

        <div class="controls-hint card">
          <p>Use <b>Setas</b> ou <b>WASD</b></p>
        </div>
      </div>

      <div class="canvas-wrapper">
        <canvas #gameCanvas width="600" height="600"></canvas>
        
        @if (gameState && !gameState.running) {
          <div class="overlay">
            <h2>FIM DE JOGO</h2>
            @if (winnerId) {
              <p>Vencedor: {{ winnerId === myId ? 'VOCÊ!' : 'OPONENTE' }}</p>
            }
            <button class="action play" (click)="backToLobby()">Voltar ao Lobby</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      gap: 20px;
      padding: 20px;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      background: #0d1b2a;
    }
    .sidebar {
      width: 250px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(4px);
    }
    .score-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding: 8px;
      border-radius: 8px;
    }
    .player-0 { border-left: 4px solid #24e39f; background: rgba(36, 227, 159, 0.1); }
    .player-1 { border-left: 4px solid #e91e63; background: rgba(233, 30, 99, 0.1); }
    .dead-tag { font-size: 0.6rem; color: #ff5252; font-weight: bold; }
    
    .canvas-wrapper {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid var(--card-border);
      border-radius: 8px;
      line-height: 0;
    }
    canvas {
      image-rendering: pixelated;
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      border-radius: 6px;
      z-index: 10;
    }
    .action {
      margin-top: 20px;
      cursor: pointer;
    }
  `]
})
export class SnakeComponent implements OnInit, OnDestroy {
  private webSocketService = inject(WebSocketService);
  private sessionService = inject(SessionService);

  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private subs = new Subscription();

  gameState: SnakeState | null = null;
  myId = '';
  winnerId: string | null = null;

  private readonly CELL_SIZE = 30; // 600 / 20

  ngOnInit(): void {
    this.myId = this.sessionService.getPlayerId();
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    
    this.subs.add(this.webSocketService.getStateSync().subscribe(state => {
      this.gameState = state as SnakeState;
      this.draw();
      if (this.gameState && !this.gameState.running) {
        this.winnerId = this.calculateWinner(this.gameState);
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
    
    switch (event.key) {
      case 'ArrowUp': case 'w': case 'W': direction = 'UP'; break;
      case 'ArrowDown': case 's': case 'S': direction = 'DOWN'; break;
      case 'ArrowLeft': case 'a': case 'A': direction = 'LEFT'; break;
      case 'ArrowRight': case 'd': case 'D': direction = 'RIGHT'; break;
    }

    if (direction) {
      const sId = this.sessionService.getSessionId();
      if (sId) {
        this.webSocketService.makeMove(sId, { direction });
      }
    }
  }

  private draw(): void {
    if (!this.gameState) return;

    // Clear
    this.ctx.fillStyle = '#0d1b2a';
    this.ctx.fillRect(0, 0, 600, 600);

    // Grid (optional, for visual)
    this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for(let i=0; i<600; i+=this.CELL_SIZE) {
      this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, 600); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(600, i); this.ctx.stroke();
    }

    // Apple
    this.ctx.fillStyle = '#ff5252';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#ff5252';
    this.ctx.fillRect(
      this.gameState.apple.x * this.CELL_SIZE + 2,
      this.gameState.apple.y * this.CELL_SIZE + 2,
      this.CELL_SIZE - 4,
      this.CELL_SIZE - 4
    );
    this.ctx.shadowBlur = 0;

    // Snakes
    this.gameState.players.forEach((player, index) => {
      if (!player.alive && player.snake.length === 0) return;

      this.ctx.fillStyle = index === 0 ? '#24e39f' : '#e91e63';
      if (!player.alive) this.ctx.globalAlpha = 0.3;

      player.snake.forEach((segment, segmentIndex) => {
        const isHead = segmentIndex === 0;
        const size = isHead ? this.CELL_SIZE : this.CELL_SIZE - 2;
        const offset = isHead ? 0 : 1;

        this.ctx.fillRect(
          segment.x * this.CELL_SIZE + offset,
          segment.y * this.CELL_SIZE + offset,
          size - (offset * 2),
          size - (offset * 2)
        );
      });
      this.ctx.globalAlpha = 1.0;
    });
  }

  private calculateWinner(state: SnakeState): string | null {
    const alive = state.players.filter(p => p.alive);
    if (alive.length === 1) return alive[0].playerId;
    const top = state.players.reduce((a, b) => (b.score > a.score ? b : a));
    return top.playerId;
  }

  backToLobby(): void {
    window.location.href = '/'; 
  }
}
