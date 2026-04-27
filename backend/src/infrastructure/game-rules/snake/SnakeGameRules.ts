import { Injectable } from '@nestjs/common';
import { IGameRules } from '../../../domain/ports/IGameRules';

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

export type SnakeMove = { direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' };

const COLS = 20;
const ROWS = 20;

const DIR_VECTORS: Record<SnakeMove['direction'], SnakePoint> = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1  },
  LEFT:  { x: -1, y: 0  },
  RIGHT: { x: 1,  y: 0  },
};

function isOpposite(a: SnakePoint, b: SnakePoint): boolean {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function randomCell(exclude: SnakePoint[]): SnakePoint {
  const occupied = new Set(exclude.map((p) => `${p.x},${p.y}`));
  let cell: SnakePoint;
  do {
    cell = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (occupied.has(`${cell.x},${cell.y}`));
  return cell;
}

function makeSnake(startX: number, startY: number, length: number): SnakePoint[] {
  return Array.from({ length }, (_, i) => ({ x: startX - i, y: startY }));
}

const PLAYER_STARTS: Array<{ x: number; y: number }> = [
  { x: 13, y: 10 },
  { x: 6,  y: 10 },
  { x: 10, y: 4  },
  { x: 10, y: 16 },
];

@Injectable()
export class SnakeGameRules implements IGameRules<SnakeState, SnakeMove> {
  getInitialState(playerIds: string[]): SnakeState {
    const players: SnakePlayer[] = playerIds.map((id, i) => {
      const start = PLAYER_STARTS[i] ?? { x: 10, y: 10 };
      return {
        playerId: id,
        snake: makeSnake(start.x, start.y, 3),
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        alive: true,
        score: 0,
      };
    });

    const allSegments = players.flatMap((p) => p.snake);
    return { players, apple: randomCell(allSegments), tick: 0, running: true };
  }

  applyMove(state: SnakeState, move: SnakeMove, playerId: string): SnakeState {
    const cloned = this.cloneState(state);
    const player = cloned.players.find((p) => p.playerId === playerId);
    if (!player || !player.alive) return cloned;

    const vec = DIR_VECTORS[move.direction];
    if (!isOpposite(player.direction, vec)) {
      player.nextDirection = vec;
    }
    return cloned;
  }

  tick(state: SnakeState): SnakeState {
    if (!state.running) return state;

    const next = this.cloneState(state);
    next.tick++;

    // Commit queued directions
    for (const p of next.players) {
      if (p.alive) p.direction = { ...p.nextDirection };
    }

    // Compute new heads
    const newHeads = next.players.map((p) =>
      p.alive
        ? { x: p.snake[0].x + p.direction.x, y: p.snake[0].y + p.direction.y }
        : null,
    );

    // Wall collisions
    for (let i = 0; i < next.players.length; i++) {
      const head = newHeads[i];
      if (!head) continue;
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        next.players[i].alive = false;
      }
    }

    // Build occupied cells (bodies before move, excluding tails that will move)
    const occupied = new Set<string>();
    for (const p of next.players) {
      if (!p.alive) continue;
      // Exclude tail (last segment) unless snake grows this tick
      for (let i = 0; i < p.snake.length - 1; i++) {
        occupied.add(`${p.snake[i].x},${p.snake[i].y}`);
      }
    }

    // Body/head collisions for alive players
    for (let i = 0; i < next.players.length; i++) {
      const head = newHeads[i];
      if (!head || !next.players[i].alive) continue;
      if (occupied.has(`${head.x},${head.y}`)) {
        next.players[i].alive = false;
      }
    }

    // Head-to-head collisions
    const aliveHeads = newHeads.map((h, i) =>
      next.players[i].alive ? h : null,
    );
    for (let i = 0; i < aliveHeads.length; i++) {
      for (let j = i + 1; j < aliveHeads.length; j++) {
        const a = aliveHeads[i];
        const b = aliveHeads[j];
        if (a && b && a.x === b.x && a.y === b.y) {
          next.players[i].alive = false;
          next.players[j].alive = false;
        }
      }
    }

    // Move snakes
    let appleEaten = false;
    for (let i = 0; i < next.players.length; i++) {
      const p = next.players[i];
      const head = newHeads[i];
      if (!p.alive || !head) continue;

      const ate = head.x === next.apple.x && head.y === next.apple.y;
      p.snake.unshift(head);
      if (!ate) {
        p.snake.pop();
      } else {
        p.score++;
        appleEaten = true;
      }
    }

    if (appleEaten) {
      const allSegments = next.players.flatMap((p) => p.snake);
      next.apple = randomCell(allSegments);
    }

    const alivePlayers = next.players.filter((p) => p.alive);
    if (alivePlayers.length <= (next.players.length > 1 ? 1 : 0)) {
      next.running = false;
    }

    return next;
  }

  isGameOver(state: SnakeState): boolean {
    return !state.running;
  }

  getValidMoves(_state: SnakeState, _playerId: string): SnakeMove[] {
    return [
      { direction: 'UP' },
      { direction: 'DOWN' },
      { direction: 'LEFT' },
      { direction: 'RIGHT' },
    ];
  }

  getWinner(state: SnakeState): string | null {
    if (state.running) return null;
    const alive = state.players.filter((p) => p.alive);
    if (alive.length === 1) return alive[0].playerId;
    // Tie or last player standing by score
    const top = state.players.reduce((a, b) => (b.score > a.score ? b : a));
    return top.playerId;
  }

  private cloneState(state: SnakeState): SnakeState {
    return {
      tick: state.tick,
      running: state.running,
      apple: { ...state.apple },
      players: state.players.map((p) => ({
        playerId: p.playerId,
        snake: p.snake.map((s) => ({ ...s })),
        direction: { ...p.direction },
        nextDirection: { ...p.nextDirection },
        alive: p.alive,
        score: p.score,
      })),
    };
  }
}
