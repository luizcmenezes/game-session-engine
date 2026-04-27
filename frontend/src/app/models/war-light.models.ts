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

export const TERRITORY_METADATA = [
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
