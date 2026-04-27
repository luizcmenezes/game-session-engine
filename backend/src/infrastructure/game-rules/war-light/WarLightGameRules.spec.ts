import { WarLightGameRules, WarState } from './WarLightGameRules';

const p1 = 'player-1';
const p2 = 'player-2';
const TOTAL_TERRITORIES = 18;

describe('WarLightGameRules', () => {
  let rules: WarLightGameRules;

  beforeEach(() => {
    rules = new WarLightGameRules();
  });

  // ── getInitialState ──────────────────────────────────────────────────────────

  describe('getInitialState', () => {
    it('cria 18 territórios neutros', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(state.territories).toHaveLength(TOTAL_TERRITORIES);
      expect(state.territories.every((t) => t.owner === null)).toBe(true);
      expect(state.territories.every((t) => t.troops === 0)).toBe(true);
    });

    it('fase inicial é distribution', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(state.phase).toBe('distribution');
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('nenhum vencedor no início', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(state.winner).toBeNull();
      expect(rules.isGameOver(state)).toBe(false);
    });
  });

  // ── DISTRIBUTE ───────────────────────────────────────────────────────────────

  describe('DISTRIBUTE', () => {
    it('jogador reivindica território neutro', () => {
      const state = rules.getInitialState([p1, p2]);
      const next = rules.applyMove(state, { type: 'DISTRIBUTE', territoryId: 1 }, p1);
      const t = next.territories.find((t) => t.id === 1)!;
      expect(t.owner).toBe(p1);
      expect(t.troops).toBe(1);
    });

    it('turno passa para próximo jogador após distribuição', () => {
      const state = rules.getInitialState([p1, p2]);
      const next = rules.applyMove(state, { type: 'DISTRIBUTE', territoryId: 1 }, p1);
      expect(next.playerIds[next.currentPlayerIndex]).toBe(p2);
    });

    it('não pode reivindicar território já ocupado', () => {
      let state = rules.getInitialState([p1, p2]);
      state = rules.applyMove(state, { type: 'DISTRIBUTE', territoryId: 1 }, p1);
      const next = rules.applyMove(state, { type: 'DISTRIBUTE', territoryId: 1 }, p2);
      expect(next.territories.find((t) => t.id === 1)!.owner).toBe(p1);
    });

    it('transita para reinforcement quando todos os territórios distribuídos', () => {
      let state = rules.getInitialState([p1, p2]);
      // Distribui todos os 18 territórios alternando entre p1 e p2
      const ids = Array.from({ length: TOTAL_TERRITORIES }, (_, i) => i + 1);
      for (let i = 0; i < ids.length; i++) {
        const who = state.playerIds[state.currentPlayerIndex];
        state = rules.applyMove(state, { type: 'DISTRIBUTE', territoryId: ids[i] }, who);
      }
      expect(state.phase).toBe('reinforcement');
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.availableReinforcements).toBeGreaterThanOrEqual(3);
    });
  });

  // ── REINFORCE ────────────────────────────────────────────────────────────────

  describe('REINFORCE', () => {
    function stateAfterDistribution(): WarState {
      let state = rules.getInitialState([p1, p2]);
      const ids = Array.from({ length: TOTAL_TERRITORIES }, (_, i) => i + 1);
      for (const id of ids) {
        const who = state.playerIds[state.currentPlayerIndex];
        state = rules.applyMove(state, { type: 'DISTRIBUTE', territoryId: id }, who);
      }
      return state;
    }

    it('adiciona tropa ao território próprio', () => {
      let state = stateAfterDistribution();
      const ownedByP1 = state.territories.find((t) => t.owner === p1)!;
      const reinforcesBefore = state.availableReinforcements;
      state = rules.applyMove(state, { type: 'REINFORCE', territoryId: ownedByP1.id }, p1);
      expect(state.territories.find((t) => t.id === ownedByP1.id)!.troops).toBe(2);
      expect(state.availableReinforcements).toBe(reinforcesBefore - 1);
    });

    it('não pode reforçar território inimigo', () => {
      let state = stateAfterDistribution();
      const ownedByP2 = state.territories.find((t) => t.owner === p2)!;
      const troopsBefore = ownedByP2.troops;
      state = rules.applyMove(state, { type: 'REINFORCE', territoryId: ownedByP2.id }, p1);
      expect(state.territories.find((t) => t.id === ownedByP2.id)!.troops).toBe(troopsBefore);
    });

    it('transita para attack quando reforços esgotam', () => {
      let state = stateAfterDistribution();
      const reinforces = state.availableReinforcements;
      const ownedByP1 = state.territories.find((t) => t.owner === p1)!;
      for (let i = 0; i < reinforces; i++) {
        state = rules.applyMove(state, { type: 'REINFORCE', territoryId: ownedByP1.id }, p1);
      }
      expect(state.phase).toBe('attack');
    });
  });

  // ── ATTACK ───────────────────────────────────────────────────────────────────

  describe('ATTACK', () => {
    function buildAttackState(): WarState {
      // Estado manual: p1 tem território 1 com 5 tropas; p2 tem território 2 com 1 tropa (adjacentes)
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'attack';
      state.territories.find((t) => t.id === 1)!.owner = p1;
      state.territories.find((t) => t.id === 1)!.troops = 5;
      state.territories.find((t) => t.id === 2)!.owner = p2;
      state.territories.find((t) => t.id === 2)!.troops = 1;
      return state;
    }

    it('resulta em combate com dados', () => {
      const state = buildAttackState();
      const next = rules.applyMove(state, { type: 'ATTACK', territoryId: 1, targetId: 2 }, p1);
      expect(next.lastCombat).not.toBeNull();
      expect(next.lastCombat!.attackDice.length).toBeGreaterThan(0);
      expect(next.lastCombat!.defenseDice.length).toBeGreaterThan(0);
    });

    it('não pode atacar território neutro', () => {
      const state = buildAttackState();
      state.territories.find((t) => t.id === 2)!.owner = null;
      const next = rules.applyMove(state, { type: 'ATTACK', territoryId: 1, targetId: 2 }, p1);
      expect(next.lastCombat).toBeNull();
    });

    it('não pode atacar território próprio', () => {
      const state = buildAttackState();
      state.territories.find((t) => t.id === 2)!.owner = p1;
      const next = rules.applyMove(state, { type: 'ATTACK', territoryId: 1, targetId: 2 }, p1);
      expect(next.lastCombat).toBeNull();
    });

    it('não pode atacar sem ao menos 2 tropas', () => {
      const state = buildAttackState();
      state.territories.find((t) => t.id === 1)!.troops = 1;
      const next = rules.applyMove(state, { type: 'ATTACK', territoryId: 1, targetId: 2 }, p1);
      expect(next.lastCombat).toBeNull();
    });

    it('conquista território ao eliminar todas as tropas defensoras', () => {
      // Atacante com 10 tropas, defensor com 1 — conquista quase garantida em múltiplos ticks
      // Forçamos o resultado manipulando diretamente para testar a lógica
      const state = buildAttackState();
      // Com 5 atacantes vs 1 defensor, há alta chance de conquistar. Testamos que o campo conquered é setado.
      let conquered = false;
      for (let i = 0; i < 20; i++) {
        const fresh = buildAttackState();
        const next = rules.applyMove(fresh, { type: 'ATTACK', territoryId: 1, targetId: 2 }, p1);
        if (next.lastCombat?.conquered) { conquered = true; break; }
      }
      expect(conquered).toBe(true);
    });

    it('vencedor declarado ao conquistar todos os territórios', () => {
      // p1 tem 17 territórios, p2 tem apenas território 2 com 1 tropa
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'attack';
      for (const t of state.territories) {
        t.owner = p1;
        t.troops = 5;
      }
      state.territories.find((t) => t.id === 2)!.owner = p2;
      state.territories.find((t) => t.id === 2)!.troops = 1;

      let won = false;
      for (let i = 0; i < 30; i++) {
        const fresh = JSON.parse(JSON.stringify(state)) as WarState;
        const next = rules.applyMove(fresh, { type: 'ATTACK', territoryId: 1, targetId: 2 }, p1);
        if (next.winner === p1) { won = true; break; }
      }
      expect(won).toBe(true);
    });
  });

  // ── END_TURN ─────────────────────────────────────────────────────────────────

  describe('END_TURN', () => {
    it('passa para próximo jogador na fase reinforcement', () => {
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'attack';
      state.territories.find((t) => t.id === 1)!.owner = p1;
      state.territories.find((t) => t.id === 2)!.owner = p2;

      const next = rules.applyMove(state, { type: 'END_TURN' }, p1);
      expect(next.playerIds[next.currentPlayerIndex]).toBe(p2);
      expect(next.phase).toBe('reinforcement');
    });

    it('calcula reforços do próximo jogador', () => {
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'attack';
      // p2 tem 9 territórios → reforços = max(3, floor(9/3)) = 3
      for (let i = 0; i < 9; i++) {
        state.territories[i].owner = p2;
        state.territories[i].troops = 1;
      }
      state.territories[9].owner = p1;
      state.territories[9].troops = 1;

      const next = rules.applyMove(state, { type: 'END_TURN' }, p1);
      expect(next.availableReinforcements).toBe(3);
    });

    it('não pode finalizar turno em fase distribution', () => {
      const state = rules.getInitialState([p1, p2]);
      const next = rules.applyMove(state, { type: 'END_TURN' }, p1);
      expect(next.phase).toBe('distribution');
    });
  });

  // ── getValidMoves ────────────────────────────────────────────────────────────

  describe('getValidMoves', () => {
    it('retorna territórios neutros na fase distribution', () => {
      const state = rules.getInitialState([p1, p2]);
      const moves = rules.getValidMoves(state, p1);
      expect(moves.every((m) => m.type === 'DISTRIBUTE')).toBe(true);
      expect(moves).toHaveLength(TOTAL_TERRITORIES);
    });

    it('retorna END_TURN e ataques válidos na fase attack', () => {
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'attack';
      state.territories.find((t) => t.id === 1)!.owner = p1;
      state.territories.find((t) => t.id === 1)!.troops = 3;
      state.territories.find((t) => t.id === 2)!.owner = p2;
      state.territories.find((t) => t.id === 2)!.troops = 1;

      const moves = rules.getValidMoves(state, p1);
      expect(moves.some((m) => m.type === 'END_TURN')).toBe(true);
      expect(moves.some((m) => m.type === 'ATTACK')).toBe(true);
    });

    it('retorna [] para jogador fora do turno', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(rules.getValidMoves(state, p2)).toHaveLength(0);
    });

    it('retorna [] quando jogo encerrado', () => {
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'ended';
      expect(rules.getValidMoves(state, p1)).toHaveLength(0);
    });
  });

  // ── isGameOver / getWinner ───────────────────────────────────────────────────

  describe('isGameOver / getWinner', () => {
    it('não está encerrado no início', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(rules.isGameOver(state)).toBe(false);
      expect(rules.getWinner(state)).toBeNull();
    });

    it('retorna vencedor quando fase ended e winner setado', () => {
      const state = rules.getInitialState([p1, p2]);
      state.phase = 'ended';
      state.winner = p1;
      expect(rules.isGameOver(state)).toBe(true);
      expect(rules.getWinner(state)).toBe(p1);
    });
  });
});
