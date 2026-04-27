export interface SnakePoint {
  x: number;
  y: number;
}

export interface SnakePlayer {
  playerId: string;
  snake: SnakePoint[];
  direction: SnakePoint;
  nextDirection: SnakePoint;
  alive: boolean;
  score: number;
}

export interface SnakeState {
  players: SnakePlayer[];
  apple: SnakePoint;
  tick: number;
  running: boolean;
}

export interface SnakeMove { direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' }
