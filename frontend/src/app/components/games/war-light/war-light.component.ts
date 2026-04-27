import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../services/web-socket.service';
import { SessionService } from '../../../services/session.service';
import { 
  WarState, 
  TERRITORY_METADATA, 
  ADJACENCIES, 
  WarTerritory, 
  WarMove
} from '../../../models/war-light.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-war-light',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      @if (gameState) {
        <div class="status-bar">
          <div class="phase-info">Fase: <span>{{ gameState.phase | uppercase }}</span></div>
          <div class="player-info" [ngClass]="getOwnerClass(currentPlayerId)">
            Vez de: <span>{{ currentPlayerId === myId ? 'VOCÊ' : 'OPONENTE' }}</span>
          </div>
          @if (gameState.phase === 'reinforcement' && isMyTurn) {
            <div class="reinforcements">
              Tropas disponíveis: <span>{{ gameState.availableReinforcements }}</span>
            </div>
          }
          @if (gameState.phase === 'attack' && isMyTurn) {
            <button class="end-turn-btn" (click)="endTurn()">Finalizar Turno</button>
          }
        </div>
      }

      <div class="map-wrapper">
        <svg class="adjacencies-layer">
          @for (adj of adjacencies; track adj.x1 + '-' + adj.y1 + '-' + adj.x2 + '-' + adj.y2) {
            <line [attr.x1]="adj.x1 + '%'" [attr.y1]="adj.y1 + '%'" 
                  [attr.x2]="adj.x2 + '%'" [attr.y2]="adj.y2 + '%'" 
                  class="adj-line" />
          }
        </svg>

        @for (t of territories; track t.id) {
          <div class="territory" 
               [style.left]="t.meta.xPct + '%'" 
               [style.top]="t.meta.yPct + '%'"
               [ngClass]="[getOwnerClass(t.state?.owner), selectedId === t.id ? 'selected' : '', targetId === t.id ? 'target' : '']"
               (click)="onTerritoryClick(t.id)"
               tabindex="0"
               (keyup.enter)="onTerritoryClick(t.id)">
            <div class="troop-count">{{ t.state?.troops || 0 }}</div>
            <div class="territory-name">{{ t.meta.name }}</div>
          </div>
        }
      </div>
      
      @if (gameState?.lastCombat) {
        <div class="combat-log">
          Último Combate: 
          Attacker -{{ gameState!.lastCombat!.attackerLosses }}, 
          Defender -{{ gameState!.lastCombat!.defenderLosses }}
          {{ gameState!.lastCombat!.conquered ? 'CONQUISTADO!' : '' }}
        </div>
      }
    </div>
  `,
  styles: [`
    .game-container {
      width: 100%;
      height: 100vh;
      background: #0b131e;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .status-bar {
      height: 60px;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 30px;
      z-index: 10;
      border-bottom: 1px solid var(--card-border);
    }
    .status-bar span { font-weight: bold; color: var(--accent); }
    .end-turn-btn {
      margin-left: auto;
      background: var(--accent-2);
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-weight: bold;
    }
    .map-wrapper {
      flex: 1;
      position: relative;
      width: 90vw;
      height: 70vh;
      max-width: 1200px;
      margin: auto;
    }
    .adjacencies-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .adj-line {
      stroke: rgba(255, 255, 255, 0.15);
      stroke-width: 2;
      stroke-dasharray: 5;
    }
    .territory {
      position: absolute;
      width: 60px;
      height: 60px;
      margin-left: -30px;
      margin-top: -30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 2;
    }
    .territory:hover { transform: scale(1.1); border-color: var(--accent); }
    .territory.selected { border-color: white; box-shadow: 0 0 15px white; transform: scale(1.15); z-index: 3; }
    .territory.target { border-color: #f44336; box-shadow: 0 0 15px #f44336; }
    .troop-count { font-weight: bold; font-size: 1.2rem; color: white; }
    .territory-name { font-size: 0.65rem; color: #aaa; text-transform: uppercase; white-space: nowrap; }
    .player-0 { background: rgba(36, 227, 159, 0.4); border-color: #24e39f; }
    .player-1 { background: rgba(233, 30, 99, 0.4); border-color: #e91e63; }
    .neutral { background: rgba(135, 146, 172, 0.2); border-color: #8792ac; }
    .combat-log {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #ddd;
    }
  `]
})
export class WarLightComponent implements OnInit, OnDestroy {
  private webSocketService = inject(WebSocketService);
  private sessionService = inject(SessionService);

  territories = TERRITORY_METADATA.map(meta => ({
    id: meta.id,
    meta,
    state: null as WarTerritory | null
  }));

  adjacencies = ADJACENCIES.map(([id1, id2]) => {
    const t1 = TERRITORY_METADATA.find(m => m.id === id1)!;
    const t2 = TERRITORY_METADATA.find(m => m.id === id2)!;
    return { x1: t1.xPct, y1: t1.yPct, x2: t2.xPct, y2: t2.yPct };
  });

  private subs = new Subscription();
  gameState: WarState | null = null;
  myId = '';
  selectedId: number | null = null;
  targetId: number | null = null;

  ngOnInit(): void {
    this.myId = this.sessionService.getPlayerId();
    this.subs.add(this.webSocketService.getStateSync().subscribe(state => {
      this.gameState = state as WarState;
      this.updateTerritoryStates(this.gameState);
      this.clearSelection();
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get currentPlayerId(): string {
    return this.gameState?.playerIds[this.gameState.currentPlayerIndex] || '';
  }

  get isMyTurn(): boolean {
    return this.currentPlayerId === this.myId;
  }

  updateTerritoryStates(state: WarState): void {
    this.territories.forEach(t => {
      t.state = state.territories.find(ts => ts.id === t.id) || null;
    });
  }

  getOwnerClass(ownerId: string | null | undefined): string {
    if (!ownerId || !this.gameState) return 'neutral';
    const index = this.gameState.playerIds.indexOf(ownerId);
    return `player-${index}`;
  }

  onTerritoryClick(id: number): void {
    if (!this.gameState || !this.isMyTurn) return;

    const tState = this.gameState.territories.find(t => t.id === id);
    if (!tState) return;

    switch (this.gameState.phase) {
      case 'distribution':
        if (!tState.owner) {
          this.sendMove({ type: 'DISTRIBUTE', territoryId: id });
        }
        break;

      case 'reinforcement':
        if (tState.owner === this.myId) {
          this.sendMove({ type: 'REINFORCE', territoryId: id });
        }
        break;

      case 'attack':
        if (tState.owner === this.myId) {
          this.selectedId = id;
          this.targetId = null;
        } else if (this.selectedId && this.isAdjacent(this.selectedId, id)) {
          this.targetId = id;
          this.sendMove({ type: 'ATTACK', territoryId: this.selectedId, targetId: id });
        }
        break;
    }
  }

  private isAdjacent(id1: number, id2: number): boolean {
    return ADJACENCIES.some(([a, b]) => (a === id1 && b === id2) || (a === id2 && b === id1));
  }

  private sendMove(move: WarMove): void {
    const sId = this.sessionService.getSessionId();
    if (sId) {
      this.webSocketService.makeMove(sId, move);
    }
  }

  endTurn(): void {
    this.sendMove({ type: 'END_TURN' });
  }

  private clearSelection(): void {
    this.selectedId = null;
    this.targetId = null;
  }
}
