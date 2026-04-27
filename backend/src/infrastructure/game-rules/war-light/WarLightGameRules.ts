import { Injectable } from '@nestjs/common';
import { IGameRules } from '../../../domain/ports/IGameRules';

// ── Map data (from snake_gamer/games/war-light/game.js) ──────────────────────

export const TERRITORIES = [
  { id: 1,  name: 'Canadá',           region: 'na', xPct: 22.0, yPct: 20.0 },
  { id: 2,  name: 'EUA',              region: 'na', xPct: 22.5, yPct: 33.0 },
  { id: 3,  name: 'México',           region: 'na', xPct: 21.0, yPct: 42.5 },
  { id: 4,  name: 'Brasil',           region: 'sa', xPct: 32.0, yPct: 57.0 },
  { id: 5,  name: 'Argentina',        region: 'sa', xPct: 30.5, yPct: 73.0 },
  { id: 6,  name: 'Europa Oeste',     region: 'eu', xPct: 44.5, yPct: 24.0 },
  { id: 7,  name: 'Europa Central',   region: 'eu', xPct: 51.0, yPct: 22.0 },
  { id: 8,  name: 'Rússia',           region: 'eu', xPct: 58.0, yPct: 16.0 },
  { id: 9,  name: 'Norte África',     region: 'af', xPct: 46.5, yPct: 42.0 },
  { id: 10, name: 'África Sul',       region: 'af', xPct: 49.5, yPct: 65.0 },
  { id: 11, name: 'Oriente Médio',    region: 'as', xPct: 55.5, yPct: 37.0 },
  { id: 12, name: 'Índia',            region: 'as', xPct: 62.0, yPct: 45.0 },
  { id: 13, name: 'China',            region: 'as', xPct: 68.5, yPct: 30.0 },
  { id: 14, name: 'Sudeste Asiático', region: 'as', xPct: 72.0, yPct: 47.0 },
  { id: 15, name: 'Japão',            region: 'as', xPct: 78.5, yPct: 27.0 },
  { id: 16, name: 'Indonésia',        region: 'oc', xPct: 77.0, yPct: 57.0 },
  { id: 17, name: 'Austrália',        region: 'oc', xPct: 82.5, yPct: 68.0 },
  { id: 18, name: 'N. Zelândia',      region: 'oc', xPct: 88.5, yPct: 76.0 },
];

export const ADJACENCIES: [number, number][] = [
  [1, 2], [1, 6],
  [2, 3],
  [3, 4], [3, 9],
  [4, 5], [4, 10],
  [5, 10],
  [6, 7], [6, 9],
  [7, 8], [7, 9], [7, 11],
  [8, 11], [8, 13], [8, 15],
  [9, 10], [9, 11],
  [10, 11],
  [11, 12], [11, 13], [11, 14],
  [12, 13], [12, 14],
  [13, 14], [13, 15], [13, 16],
  [14, 15], [14, 16],
  [16, 17],
  [17, 18],
];

// ── Types ─────────────────────────────────────────────────────────────────────

export type WarPhase = 'distribution' | 'reinforcement' | 'attack' | 'ended';

export interface WarTerritory {
  id: number;
  name: string;
  owner: string | null; // playerId or null (neutral)
  troops: number;
}

export interface WarCombatResult {
  attackDice: number[];
  defenseDice: number[];
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
}

export interface WarState {
  territories: WarTerritory[];
  phase: WarPhase;
  currentPlayerIndex: number;
  playerIds: string[];
  availableReinforcements: number;
  winner: string | null;
  lastCombat: WarCombatResult | null;
}

export type WarMoveType = 'DISTRIBUTE' | 'REINFORCE' | 'ATTACK' | 'END_TURN';

export interface WarMove {
  type: WarMoveType;
  territoryId?: number;   // DISTRIBUTE, REINFORCE, ATTACK source
  targetId?: number;      // ATTACK target
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAdjacent(a: number, b: number): boolean {
  return ADJACENCIES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
    .sort((a, b) => b - a);
}

function calculateReinforcements(state: WarState, playerId: string): number {
  const owned = state.territories.filter((t) => t.owner === playerId).length;
  return Math.max(3, Math.floor(owned / 3));
}

function activePlayers(state: WarState): string[] {
  return state.playerIds.filter(
    (id) => state.territories.some((t) => t.owner === id),
  );
}

function nextPlayerIndex(state: WarState): number {
  const total = state.playerIds.length;

  // During distribution no player has territories yet — just round-robin
  if (state.phase === 'distribution') {
    return (state.currentPlayerIndex + 1) % total;
  }

  const active = activePlayers(state);
  for (let i = 1; i <= total; i++) {
    const idx = (state.currentPlayerIndex + i) % total;
    if (active.includes(state.playerIds[idx])) return idx;
  }
  return state.currentPlayerIndex;
}

// ── WarLightGameRules ─────────────────────────────────────────────────────────

@Injectable()
export class WarLightGameRules implements IGameRules<WarState, WarMove> {
  getInitialState(playerIds: string[]): WarState {
    const territories: WarTerritory[] = TERRITORIES.map((t) => ({
      id: t.id,
      name: t.name,
      owner: null,
      troops: 0,
    }));

    return {
      territories,
      phase: 'distribution',
      currentPlayerIndex: 0,
      playerIds,
      availableReinforcements: 0,
      winner: null,
      lastCombat: null,
    };
  }

  applyMove(state: WarState, move: WarMove, playerId: string): WarState {
    if (state.phase === 'ended') return state;
    if (state.playerIds[state.currentPlayerIndex] !== playerId) return state;

    const s = this.cloneState(state);
    s.lastCombat = null;

    switch (move.type) {
      case 'DISTRIBUTE': return this.applyDistribute(s, playerId, move.territoryId!);
      case 'REINFORCE':  return this.applyReinforce(s, playerId, move.territoryId!);
      case 'ATTACK':     return this.applyAttack(s, playerId, move.territoryId!, move.targetId!);
      case 'END_TURN':   return this.applyEndTurn(s, playerId);
      default:           return s;
    }
  }

  isGameOver(state: WarState): boolean {
    return state.phase === 'ended';
  }

  getValidMoves(state: WarState, playerId: string): WarMove[] {
    if (state.phase === 'ended') return [];
    if (state.playerIds[state.currentPlayerIndex] !== playerId) return [];

    if (state.phase === 'distribution') {
      return state.territories
        .filter((t) => t.owner === null)
        .map((t) => ({ type: 'DISTRIBUTE', territoryId: t.id }));
    }

    if (state.phase === 'reinforcement') {
      return state.territories
        .filter((t) => t.owner === playerId)
        .map((t) => ({ type: 'REINFORCE', territoryId: t.id }));
    }

    if (state.phase === 'attack') {
      const moves: WarMove[] = [{ type: 'END_TURN' }];
      for (const from of state.territories.filter((t) => t.owner === playerId && t.troops > 1)) {
        for (const to of state.territories.filter(
          (t) => t.owner !== playerId && t.owner !== null && isAdjacent(from.id, t.id),
        )) {
          moves.push({ type: 'ATTACK', territoryId: from.id, targetId: to.id });
        }
      }
      return moves;
    }

    return [];
  }

  getWinner(state: WarState): string | null {
    return state.winner;
  }

  // ── Private move handlers ──────────────────────────────────────────────────

  private applyDistribute(s: WarState, playerId: string, territoryId: number): WarState {
    const territory = s.territories.find((t) => t.id === territoryId);
    if (!territory || territory.owner !== null) return s;

    territory.owner = playerId;
    territory.troops = 1;

    const allDistributed = s.territories.every((t) => t.owner !== null);
    if (allDistributed) {
      s.currentPlayerIndex = 0;
      s.phase = 'reinforcement';
      s.availableReinforcements = calculateReinforcements(s, s.playerIds[0]);
    } else {
      s.currentPlayerIndex = nextPlayerIndex(s);
    }

    return s;
  }

  private applyReinforce(s: WarState, playerId: string, territoryId: number): WarState {
    if (s.availableReinforcements <= 0) return s;
    const territory = s.territories.find((t) => t.id === territoryId);
    if (!territory || territory.owner !== playerId) return s;

    territory.troops++;
    s.availableReinforcements--;

    if (s.availableReinforcements === 0) {
      s.phase = 'attack';
    }

    return s;
  }

  private applyAttack(s: WarState, playerId: string, fromId: number, toId: number): WarState {
    const from = s.territories.find((t) => t.id === fromId);
    const to = s.territories.find((t) => t.id === toId);

    if (!from || !to) return s;
    if (from.owner !== playerId) return s;
    if (to.owner === playerId || to.owner === null) return s;
    if (!isAdjacent(fromId, toId)) return s;
    if (from.troops < 2) return s;

    const attackDiceCount = Math.min(3, from.troops - 1);
    const defenseDiceCount = Math.min(2, to.troops);
    const attackDice = rollDice(attackDiceCount);
    const defenseDice = rollDice(defenseDiceCount);

    let attackerLosses = 0;
    let defenderLosses = 0;
    const comparisons = Math.min(attackDice.length, defenseDice.length);
    for (let i = 0; i < comparisons; i++) {
      if (attackDice[i] > defenseDice[i]) {
        to.troops--;
        defenderLosses++;
      } else {
        from.troops--;
        attackerLosses++;
      }
    }

    let conquered = false;
    if (to.troops <= 0) {
      const movedTroops = Math.min(attackDiceCount, Math.max(1, from.troops - 1));
      to.owner = playerId;
      to.troops = movedTroops;
      from.troops -= movedTroops;
      conquered = true;

      // Check victory
      const totalTerritories = s.territories.length;
      const ownedByPlayer = s.territories.filter((t) => t.owner === playerId).length;
      if (ownedByPlayer === totalTerritories) {
        s.phase = 'ended';
        s.winner = playerId;
      }
    }

    s.lastCombat = { attackDice, defenseDice, attackerLosses, defenderLosses, conquered };
    return s;
  }

  private applyEndTurn(s: WarState, playerId: string): WarState {
    if (s.phase !== 'attack') return s;
    if (s.playerIds[s.currentPlayerIndex] !== playerId) return s;

    s.currentPlayerIndex = nextPlayerIndex(s);
    s.phase = 'reinforcement';
    s.availableReinforcements = calculateReinforcements(s, s.playerIds[s.currentPlayerIndex]);

    // Check if only one player remains
    const alive = activePlayers(s);
    if (alive.length === 1) {
      s.phase = 'ended';
      s.winner = alive[0];
    }

    return s;
  }

  private cloneState(state: WarState): WarState {
    return {
      territories: state.territories.map((t) => ({ ...t })),
      phase: state.phase,
      currentPlayerIndex: state.currentPlayerIndex,
      playerIds: [...state.playerIds],
      availableReinforcements: state.availableReinforcements,
      winner: state.winner,
      lastCombat: state.lastCombat ? { ...state.lastCombat } : null,
    };
  }
}
