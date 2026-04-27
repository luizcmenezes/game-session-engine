const TERRITORIES = [
  { id: 1,  name: "Canadá",           region: "na", xPct: 22.0, yPct: 20.0 },
  { id: 2,  name: "EUA",              region: "na", xPct: 22.5, yPct: 33.0 },
  { id: 3,  name: "México",           region: "na", xPct: 21.0, yPct: 42.5 },
  { id: 4,  name: "Brasil",           region: "sa", xPct: 32.0, yPct: 57.0 },
  { id: 5,  name: "Argentina",        region: "sa", xPct: 30.5, yPct: 73.0 },
  { id: 6,  name: "Europa Oeste",     region: "eu", xPct: 44.5, yPct: 24.0 },
  { id: 7,  name: "Europa Central",   region: "eu", xPct: 51.0, yPct: 22.0 },
  { id: 8,  name: "Rússia",           region: "eu", xPct: 58.0, yPct: 16.0 },
  { id: 9,  name: "Norte África",     region: "af", xPct: 46.5, yPct: 42.0 },
  { id: 10, name: "África Sul",       region: "af", xPct: 49.5, yPct: 65.0 },
  { id: 11, name: "Oriente Médio",    region: "as", xPct: 55.5, yPct: 37.0 },
  { id: 12, name: "Índia",            region: "as", xPct: 62.0, yPct: 45.0 },
  { id: 13, name: "China",            region: "as", xPct: 68.5, yPct: 30.0 },
  { id: 14, name: "Sudeste Asiático", region: "as", xPct: 72.0, yPct: 47.0 },
  { id: 15, name: "Japão",            region: "as", xPct: 78.5, yPct: 27.0 },
  { id: 16, name: "Indonésia",        region: "oc", xPct: 77.0, yPct: 57.0 },
  { id: 17, name: "Austrália",        region: "oc", xPct: 82.5, yPct: 68.0 },
  { id: 18, name: "N. Zelândia",      region: "oc", xPct: 88.5, yPct: 76.0 }
];

const ADJACENCIES = [
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
  [17, 18]
];

const PLAYER_COLORS = [
  { css: "player1", dot: "rgba(134,239,172,1), rgba(22,101,52,0.96)",  line: "rgba(134,239,172,0.55)", badge: "#16a34a" },
  { css: "player2", dot: "rgba(252,165,165,1), rgba(127,29,29,0.96)",  line: "rgba(252,165,165,0.55)", badge: "#dc2626" },
  { css: "player3", dot: "rgba(253,224,71,1),  rgba(133,77,14,0.96)",  line: "rgba(253,224,71,0.55)",  badge: "#ca8a04" },
  { css: "player4", dot: "rgba(196,181,253,1), rgba(76,29,149,0.96)",  line: "rgba(196,181,253,0.55)", badge: "#7c3aed" }
];

const GAME_MODES = {
  "pvp2":  { label: "2 Jogadores",       humans: 2, cpus: 0 },
  "pvp3":  { label: "3 Jogadores",       humans: 3, cpus: 0 },
  "pvp4":  { label: "4 Jogadores",       humans: 4, cpus: 0 },
  "pvc1":  { label: "1 Jogador vs 1 PC", humans: 1, cpus: 1 },
  "pvc2":  { label: "1 Jogador vs 2 PCs",humans: 1, cpus: 2 },
  "pvc3":  { label: "1 Jogador vs 3 PCs",humans: 1, cpus: 3 }
};

const CPU_PROFILES = {
  easy: {
    label: "Fácil",
    delayMs: 950,
    maxAttacks: 1,
    keepAttackingScore: 1,
    randomAttackChance: 0.55,
    reinforceSmartness: 0.35
  },
  normal: {
    label: "Normal",
    delayMs: 700,
    maxAttacks: 2,
    keepAttackingScore: 0,
    randomAttackChance: 0.3,
    reinforceSmartness: 0.65
  },
  hard: {
    label: "Difícil",
    delayMs: 520,
    maxAttacks: 3,
    keepAttackingScore: -1,
    randomAttackChance: 0.12,
    reinforceSmartness: 0.9
  }
};

// gameState.players: array of { index (1-based), label, isCpu }
// gameState.currentPlayerIndex: 0-based index into players array
const gameState = {
  mode: "pvc1",
  cpuLevel: "normal",
  players: [],
  currentPlayerIndex: 0,
  phase: "distribution",
  territories: [],
  selectedTerritory: null,
  attackFrom: null,
  attackTarget: null,
  availableReinforcements: 3,
  gameStarted: false,
  cpuThinking: false
};

let mapEl = null;
let overlayLinesEl = null;
let connectionLinesEl = null;
let addTroopBtn = null;
let attackBtn = null;
let endTurnBtn = null;
let gameModeSelect = null;
let cpuLevelSelect = null;
let newGameBtn = null;
let actionDescriptionEl = null;
let reinforceSection = null;
let attackSection = null;
let diceResultEl = null;
let statusBarEl = null;
let phaseIndicatorEl = null;

function currentPlayer() {
  return gameState.players[gameState.currentPlayerIndex];
}

function playerLabel(p) {
  return p.isCpu ? `PC ${p.index}` : `Jogador ${p.index}`;
}

function getTerritory(id) {
  return gameState.territories.find((t) => t.id === id);
}

function getTerritoryConfig(id) {
  return TERRITORIES.find((t) => t.id === id);
}

function getTerritoryCenter(id) {
  const config = getTerritoryConfig(id);
  if (!config || !mapEl) return null;
  return {
    x: mapEl.clientWidth * (config.xPct / 100),
    y: mapEl.clientHeight * (config.yPct / 100) + 8
  };
}

function randomItem(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function isAdjacent(id1, id2) {
  return ADJACENCIES.some((pair) => (pair[0] === id1 && pair[1] === id2) || (pair[0] === id2 && pair[1] === id1));
}

function isCpuTurn() {
  return currentPlayer().isCpu && gameState.phase !== "ended";
}

function getCpuProfile() {
  return CPU_PROFILES[gameState.cpuLevel] || CPU_PROFILES.normal;
}

function getEnemyAdjacentTargets(fromId) {
  const cp = currentPlayer().index;
  return gameState.territories
    .filter((t) => t.player !== 0 && t.player !== cp && isAdjacent(fromId, t.id))
    .map((t) => t.id);
}

// ── Overlay / SVG ─────────────────────────────────────────────────────────────

function createAttackOverlay(map) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("id", "attackOverlay");
  svg.setAttribute("viewBox", `0 0 ${map.clientWidth} ${map.clientHeight}`);
  svg.setAttribute("preserveAspectRatio", "none");

  const defs = document.createElementNS(ns, "defs");

  const mkCandidate = document.createElementNS(ns, "marker");
  mkCandidate.setAttribute("id", "arrowCandidate");
  mkCandidate.setAttribute("markerWidth", "10");
  mkCandidate.setAttribute("markerHeight", "10");
  mkCandidate.setAttribute("refX", "9");
  mkCandidate.setAttribute("refY", "3");
  mkCandidate.setAttribute("orient", "auto");
  mkCandidate.setAttribute("markerUnits", "strokeWidth");
  mkCandidate.innerHTML = "<path d='M0,0 L10,3 L0,6 z' fill='rgba(147,197,253,0.95)'></path>";

  const mkSelected = document.createElementNS(ns, "marker");
  mkSelected.setAttribute("id", "arrowSelected");
  mkSelected.setAttribute("markerWidth", "10");
  mkSelected.setAttribute("markerHeight", "10");
  mkSelected.setAttribute("refX", "9");
  mkSelected.setAttribute("refY", "3");
  mkSelected.setAttribute("orient", "auto");
  mkSelected.setAttribute("markerUnits", "strokeWidth");
  mkSelected.innerHTML = "<path d='M0,0 L10,3 L0,6 z' fill='rgba(248,113,113,0.98)'></path>";

  defs.appendChild(mkCandidate);
  defs.appendChild(mkSelected);
  svg.appendChild(defs);

  connectionLinesEl = document.createElementNS(ns, "g");
  connectionLinesEl.setAttribute("id", "connectionLines");
  svg.appendChild(connectionLinesEl);

  overlayLinesEl = document.createElementNS(ns, "g");
  overlayLinesEl.setAttribute("id", "attackOverlayLines");
  svg.appendChild(overlayLinesEl);

  map.appendChild(svg);
}

function syncAttackOverlaySize() {
  const overlayEl = document.getElementById("attackOverlay");
  if (!overlayEl || !mapEl) return;
  overlayEl.setAttribute("viewBox", `0 0 ${mapEl.clientWidth} ${mapEl.clientHeight}`);
}

function clearAttackHints() {
  if (overlayLinesEl) overlayLinesEl.innerHTML = "";
  gameState.territories.forEach((t) => {
    const el = document.getElementById(`territory-${t.id}`);
    if (!el) return;
    el.classList.remove("attack-targetable", "attack-target");
  });
}

function drawAttackArrow(fromId, toId, selected) {
  if (!overlayLinesEl) return;
  const from = getTerritoryCenter(fromId);
  const to = getTerritoryCenter(toId);
  if (!from || !to) return;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;

  const offset = 18;
  const startX = from.x + (dx / length) * offset;
  const startY = from.y + (dy / length) * offset;
  const endX = to.x - (dx / length) * offset;
  const endY = to.y - (dy / length) * offset;

  const ns = "http://www.w3.org/2000/svg";
  const line = document.createElementNS(ns, "line");
  line.setAttribute("x1", String(startX));
  line.setAttribute("y1", String(startY));
  line.setAttribute("x2", String(endX));
  line.setAttribute("y2", String(endY));
  line.setAttribute("class", selected ? "attack-line selected" : "attack-line");
  line.setAttribute("marker-end", selected ? "url(#arrowSelected)" : "url(#arrowCandidate)");
  overlayLinesEl.appendChild(line);
}

function renderAttackHints() {
  clearAttackHints();
  if (gameState.phase !== "attack" || !gameState.attackFrom) return;

  const targets = getEnemyAdjacentTargets(gameState.attackFrom);
  targets.forEach((targetId) => {
    const el = document.getElementById(`territory-${targetId}`);
    if (!el) return;
    el.classList.add("attack-targetable");
    const isSelected = gameState.attackTarget === targetId;
    if (isSelected) el.classList.add("attack-target");
    drawAttackArrow(gameState.attackFrom, targetId, isSelected);
  });
}

function renderConnectionLines() {
  if (!connectionLinesEl) return;
  connectionLinesEl.innerHTML = "";

  ADJACENCIES.forEach(([id1, id2]) => {
    const from = getTerritoryCenter(id1);
    const to = getTerritoryCenter(id2);
    if (!from || !to) return;

    const t1 = getTerritory(id1);
    const t2 = getTerritory(id2);

    let stroke = "rgba(148,163,184,0.22)";
    if (t1 && t2 && t1.player > 0 && t1.player === t2.player) {
      stroke = PLAYER_COLORS[t1.player - 1].line;
    }

    const ns = "http://www.w3.org/2000/svg";
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("class", "connection-line");
    line.setAttribute("stroke", stroke);
    connectionLinesEl.appendChild(line);
  });
}

// ── Territory display ─────────────────────────────────────────────────────────

function clearSelectedTerritoryVisual() {
  if (!gameState.selectedTerritory) return;
  const el = document.getElementById(`territory-${gameState.selectedTerritory}`);
  if (el) el.classList.remove("selected");
}

function clearMapTerritories() {
  if (!mapEl) return;
  mapEl.querySelectorAll(".territory").forEach((el) => el.remove());
  const overlay = document.getElementById("attackOverlay");
  if (overlay) overlay.remove();
  overlayLinesEl = null;
  connectionLinesEl = null;
}

function updateTerritoryDisplay(id) {
  const territory = getTerritory(id);
  const cfg = getTerritoryConfig(id);
  const el = document.getElementById(`territory-${id}`);
  const troopsEl = document.getElementById(`troops-${id}`);
  if (!territory || !el || !troopsEl) return;

  el.className = `territory region-${cfg?.region || "default"}`;
  if (territory.player === 0) {
    el.classList.add("neutral");
  } else {
    el.classList.add(PLAYER_COLORS[territory.player - 1].css);
  }
  troopsEl.textContent = String(territory.troops);
}

function createTerritories() {
  if (!mapEl) return;

  TERRITORIES.forEach((cfg) => {
    const el = document.createElement("div");
    el.className = `territory neutral region-${cfg.region || "default"}`;
    el.id = `territory-${cfg.id}`;
    el.style.left = `${cfg.xPct}%`;
    el.style.top = `${cfg.yPct}%`;
    el.dataset.tooltip = cfg.name;
    el.innerHTML = `
      <div class="troop-count" id="troops-${cfg.id}">0</div>
      <div class="territory-dot"></div>
    `;
    el.addEventListener("click", () => selectTerritory(cfg.id));
    mapEl.appendChild(el);

    gameState.territories.push({ id: cfg.id, name: cfg.name, player: 0, troops: 0 });
  });
}

// ── Status bar ────────────────────────────────────────────────────────────────

function renderStatusBar() {
  if (!statusBarEl) return;
  statusBarEl.innerHTML = "";

  gameState.players.forEach((p) => {
    const count = gameState.territories.filter((t) => t.player === p.index).length;
    const color = PLAYER_COLORS[p.index - 1];
    const badge = document.createElement("div");
    badge.className = "player-badge";
    badge.id = `badge-player${p.index}`;
    badge.innerHTML = `
      <div class="player-color" style="background:radial-gradient(circle at 30% 20%, ${color.dot}); box-shadow:0 0 10px ${color.badge}88;"></div>
      <span>${playerLabel(p)} — <span id="p${p.index}Territories">${count}</span> terr.</span>
    `;
    statusBarEl.appendChild(badge);
  });

  const phase = document.createElement("div");
  phase.className = "phase-indicator";
  phase.id = "phaseIndicator";
  phase.textContent = "DISTRIBUIÇÃO INICIAL";
  statusBarEl.appendChild(phase);
  phaseIndicatorEl = phase;
}

// ── Log ───────────────────────────────────────────────────────────────────────

function addLog(sender, message) {
  const log = document.getElementById("gameLog");
  if (!log) return;

  const entry = document.createElement("div");
  const lower = sender.toLowerCase();

  let cls = "system";
  gameState.players.forEach((p) => {
    if (lower.includes(playerLabel(p).toLowerCase())) cls = `player${p.index}`;
  });

  entry.className = `log-entry ${cls}`;
  entry.innerHTML = `<strong>${sender}:</strong> ${message}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function resetLog() {
  const log = document.getElementById("gameLog");
  if (!log) return;
  log.innerHTML = "";
  addLog("Sistema", `Bem-vindo ao WAR Light! ${playerLabel(gameState.players[0])} inicia a distribuição.`);
}

// ── Game logic ────────────────────────────────────────────────────────────────

function calculateReinforcements(playerIndex) {
  const owned = gameState.territories.filter((t) => t.player === playerIndex).length;
  return Math.max(3, Math.floor(owned / 3));
}

function rollDice(times) {
  const values = [];
  for (let i = 0; i < times; i++) values.push(Math.floor(Math.random() * 6) + 1);
  return values.sort((a, b) => b - a);
}

function showDice(attackDice, defenseDice) {
  if (!diceResultEl) return;
  diceResultEl.innerHTML = "";

  attackDice.forEach((v) => {
    const die = document.createElement("div");
    die.className = "die attacker";
    die.textContent = String(v);
    diceResultEl.appendChild(die);
  });

  const vs = document.createElement("div");
  vs.style.cssText = "align-self:center;font-size:0.85rem;font-weight:600;";
  vs.textContent = "VS";
  diceResultEl.appendChild(vs);

  defenseDice.forEach((v) => {
    const die = document.createElement("div");
    die.className = "die defender";
    die.textContent = String(v);
    diceResultEl.appendChild(die);
  });

  diceResultEl.style.display = "flex";
}

function checkVictory() {
  const total = TERRITORIES.length;
  for (const p of gameState.players) {
    const owned = gameState.territories.filter((t) => t.player === p.index).length;
    if (owned === total) {
      gameState.phase = "ended";
      gameState.cpuThinking = false;
      const label = playerLabel(p).toUpperCase();
      addLog("Sistema", `🏆 ${label} CONQUISTOU TODO O MAPA!`);
      if (phaseIndicatorEl) phaseIndicatorEl.textContent = `VITÓRIA: ${label}`;
      if (endTurnBtn) endTurnBtn.disabled = true;
      if (attackBtn) attackBtn.disabled = true;
      if (addTroopBtn) addTroopBtn.disabled = true;
      setTimeout(() => alert(`${playerLabel(p)} venceu! Clique em Novo Jogo para jogar novamente.`), 350);
      return true;
    }
  }
  return false;
}

function eliminatePlayerIfNeeded(playerIndex) {
  const owned = gameState.territories.filter((t) => t.player === playerIndex).length;
  if (owned === 0) {
    addLog("Sistema", `${playerLabel(gameState.players[playerIndex - 1])} foi eliminado!`);
  }
}

function getPossibleAttacks(playerIndex) {
  const possible = [];
  const attackers = gameState.territories.filter((t) => t.player === playerIndex && t.troops > 1);
  attackers.forEach((from) => {
    const targets = gameState.territories.filter(
      (t) => t.player !== playerIndex && t.player !== 0 && isAdjacent(from.id, t.id)
    );
    targets.forEach((target) => {
      possible.push({ fromId: from.id, toId: target.id, score: from.troops - target.troops });
    });
  });
  possible.sort((a, b) => b.score - a.score);
  return possible;
}

function performAttack(fromId, toId) {
  const from = getTerritory(fromId);
  const to = getTerritory(toId);
  if (!from || !to) return false;

  const cp = currentPlayer().index;
  if (from.player !== cp || to.player === cp || to.player === 0 || !isAdjacent(from.id, to.id)) {
    addLog("Sistema", "Ataque inválido.");
    return false;
  }

  if (from.troops < 2) {
    addLog("Sistema", "Você precisa de pelo menos 2 tropas para atacar.");
    return false;
  }

  const attackDiceCount = Math.min(3, from.troops - 1);
  const defenseDiceCount = Math.min(2, to.troops);
  const attackDice = rollDice(attackDiceCount);
  const defenseDice = rollDice(defenseDiceCount);
  showDice(attackDice, defenseDice);

  const comparisons = Math.min(attackDice.length, defenseDice.length);
  for (let i = 0; i < comparisons; i++) {
    if (attackDice[i] > defenseDice[i]) to.troops -= 1;
    else from.troops -= 1;
  }

  addLog(playerLabel(currentPlayer()), `Atacou ${to.name} (${attackDice.join(",")} × ${defenseDice.join(",")}).`);

  if (to.troops <= 0) {
    const movedTroops = Math.min(attackDiceCount, Math.max(1, from.troops - 1));
    const previousOwner = to.player;
    to.player = cp;
    to.troops = movedTroops;
    from.troops -= movedTroops;
    addLog(playerLabel(currentPlayer()), `CONQUISTOU ${to.name}! Moveu ${movedTroops} tropas.`);
    eliminatePlayerIfNeeded(previousOwner);
    if (checkVictory()) return true;
  }

  updateTerritoryDisplay(from.id);
  updateTerritoryDisplay(to.id);
  return true;
}

// ── Turn management ───────────────────────────────────────────────────────────

function nextPlayerIndex() {
  const total = gameState.players.length;
  let next = (gameState.currentPlayerIndex + 1) % total;
  // skip eliminated players
  for (let i = 0; i < total; i++) {
    const p = gameState.players[next];
    const owned = gameState.territories.filter((t) => t.player === p.index).length;
    if (owned > 0 || !gameState.gameStarted) return next;
    next = (next + 1) % total;
  }
  return next;
}

function endTurn() {
  if (gameState.phase === "ended") return;

  clearSelectedTerritoryVisual();
  gameState.selectedTerritory = null;
  gameState.attackFrom = null;
  gameState.attackTarget = null;
  clearAttackHints();
  if (diceResultEl) diceResultEl.style.display = "none";

  gameState.currentPlayerIndex = nextPlayerIndex();
  gameState.phase = "reinforcement";
  gameState.availableReinforcements = calculateReinforcements(currentPlayer().index);

  addLog("Sistema", `Início do turno de ${playerLabel(currentPlayer())}. Reforços: ${gameState.availableReinforcements}.`);
  updateDisplay();
  maybeTriggerCpuTurn();
}

// ── CPU AI ────────────────────────────────────────────────────────────────────

function runCpuTurn() {
  if (!isCpuTurn() || gameState.cpuThinking) return;
  const profile = getCpuProfile();
  const cp = currentPlayer();

  gameState.cpuThinking = true;
  if (actionDescriptionEl) actionDescriptionEl.textContent = `${playerLabel(cp)} está pensando...`;
  updateDisplay();

  setTimeout(() => {
    if (!isCpuTurn()) { gameState.cpuThinking = false; return; }

    if (gameState.phase === "distribution") {
      const neutral = gameState.territories.filter((t) => t.player === 0);
      let pick = randomItem(neutral);
      if (neutral.length && Math.random() < profile.reinforceSmartness) {
        pick = [...neutral].sort((a, b) => {
          const aAdj = gameState.territories.filter((own) => own.player === cp.index && isAdjacent(a.id, own.id)).length;
          const bAdj = gameState.territories.filter((own) => own.player === cp.index && isAdjacent(b.id, own.id)).length;
          return bAdj - aAdj;
        })[0];
      }
      if (pick) {
        pick.player = cp.index;
        pick.troops = 1;
        updateTerritoryDisplay(pick.id);
        addLog(playerLabel(cp), `Reivindicou ${pick.name}.`);
      }

      const distributed = gameState.territories.filter((t) => t.player !== 0).length;
      if (distributed === TERRITORIES.length) {
        gameState.phase = "reinforcement";
        gameState.currentPlayerIndex = 0;
        gameState.availableReinforcements = calculateReinforcements(gameState.players[0].index);
        gameState.gameStarted = true;
        addLog("Sistema", `Distribuição concluída. Começam os reforços de ${playerLabel(gameState.players[0])}.`);
      } else {
        gameState.currentPlayerIndex = nextPlayerIndex();
        addLog("Sistema", `Vez de ${playerLabel(currentPlayer())} escolher um território.`);
      }

      gameState.cpuThinking = false;
      updateDisplay();
      maybeTriggerCpuTurn();
      return;
    }

    if (gameState.phase === "reinforcement") {
      while (gameState.availableReinforcements > 0) {
        const own = gameState.territories.filter((t) => t.player === cp.index);
        if (!own.length) break;

        const scored = own
          .map((t) => ({
            territory: t,
            score:
              gameState.territories.filter((e) => e.player !== cp.index && e.player !== 0 && isAdjacent(t.id, e.id)).length * 3 +
              t.troops
          }))
          .sort((a, b) => b.score - a.score);

        let selected = scored[0].territory;
        if (Math.random() > profile.reinforceSmartness) selected = randomItem(own) || selected;
        selected.troops += 1;
        gameState.availableReinforcements -= 1;
        updateTerritoryDisplay(selected.id);
      }

      addLog(playerLabel(cp), "Distribuiu seus reforços.");
      gameState.phase = "attack";
      updateDisplay();
    }

    if (gameState.phase === "attack" && gameState.phase !== "ended") {
      let attacks = 0;
      while (attacks < profile.maxAttacks && gameState.phase !== "ended") {
        const options = getPossibleAttacks(cp.index);
        if (!options.length) break;

        let best = options[0];
        if (Math.random() < profile.randomAttackChance) {
          best = randomItem(options.slice(0, Math.min(3, options.length))) || best;
        }
        if (best.score < profile.keepAttackingScore && attacks > 0) break;

        gameState.attackFrom = best.fromId;
        gameState.attackTarget = best.toId;
        renderAttackHints();

        const executed = performAttack(best.fromId, best.toId);
        if (!executed) break;
        attacks += 1;
      }

      gameState.attackFrom = null;
      gameState.attackTarget = null;
      clearAttackHints();
      if (attackBtn) attackBtn.disabled = true;
    }

    gameState.cpuThinking = false;
    if (gameState.phase !== "ended") endTurn();
  }, profile.delayMs);
}

function maybeTriggerCpuTurn() {
  if (isCpuTurn()) runCpuTurn();
}

// ── Player interaction ────────────────────────────────────────────────────────

function handleDistributionClick(territory) {
  if (territory.player !== 0 || gameState.phase !== "distribution") return;

  const cp = currentPlayer();
  territory.player = cp.index;
  territory.troops = 1;
  updateTerritoryDisplay(territory.id);
  addLog(playerLabel(cp), `Reivindicou ${territory.name}.`);

  const distributed = gameState.territories.filter((t) => t.player !== 0).length;
  if (distributed === TERRITORIES.length) {
    gameState.phase = "reinforcement";
    gameState.currentPlayerIndex = 0;
    gameState.availableReinforcements = calculateReinforcements(gameState.players[0].index);
    gameState.gameStarted = true;
    addLog("Sistema", `Distribuição concluída. Começam os reforços de ${playerLabel(gameState.players[0])}.`);
  } else {
    gameState.currentPlayerIndex = nextPlayerIndex();
    addLog("Sistema", `Vez de ${playerLabel(currentPlayer())} escolher um território.`);
  }
}

function handleAttackSelection(territory) {
  if (!actionDescriptionEl || !attackBtn) return;
  const cp = currentPlayer();

  if (territory.player === cp.index && territory.troops > 1) {
    gameState.attackFrom = territory.id;
    gameState.attackTarget = null;
    actionDescriptionEl.textContent = `Atacando a partir de: ${territory.name}. Selecione um território inimigo adjacente.`;
    attackBtn.disabled = true;
    renderAttackHints();
    return;
  }

  if (
    gameState.attackFrom &&
    territory.player !== cp.index &&
    territory.player !== 0 &&
    isAdjacent(gameState.attackFrom, territory.id)
  ) {
    gameState.attackTarget = territory.id;
    actionDescriptionEl.textContent = `Alvo: ${territory.name}. Clique em "Atacar" para rolar os dados.`;
    attackBtn.disabled = false;
    renderAttackHints();
    return;
  }

  actionDescriptionEl.textContent = "Selecione um de seus territórios com mais de 1 tropa para iniciar um ataque.";
  renderAttackHints();
}

function selectTerritory(id) {
  if (isCpuTurn() || gameState.cpuThinking) return;

  const territory = getTerritory(id);
  const el = document.getElementById(`territory-${id}`);
  if (!territory || !el) return;

  clearSelectedTerritoryVisual();
  el.classList.add("selected");
  gameState.selectedTerritory = id;

  switch (gameState.phase) {
    case "distribution":
      handleDistributionClick(territory);
      break;
    case "reinforcement":
      if (territory.player === currentPlayer().index) {
        if (actionDescriptionEl)
          actionDescriptionEl.textContent = `Selecionado: ${territory.name} (${territory.troops} tropas). Clique em "+ Adicionar Tropa".`;
      } else {
        if (actionDescriptionEl) actionDescriptionEl.textContent = "Escolha um território SEU para reforçar.";
      }
      break;
    case "attack":
      handleAttackSelection(territory);
      break;
    default:
      break;
  }

  updateDisplay();
  maybeTriggerCpuTurn();
}

function addTroop() {
  if (isCpuTurn() || gameState.cpuThinking) return;
  if (!gameState.selectedTerritory || gameState.availableReinforcements <= 0) return;

  const territory = getTerritory(gameState.selectedTerritory);
  if (!territory || territory.player !== currentPlayer().index) return;

  territory.troops += 1;
  gameState.availableReinforcements -= 1;
  updateTerritoryDisplay(territory.id);
  addLog(playerLabel(currentPlayer()), `Reforçou ${territory.name} (agora com ${territory.troops} tropas).`);

  if (gameState.availableReinforcements === 0) {
    gameState.phase = "attack";
    if (reinforceSection) reinforceSection.style.display = "none";
    if (attackSection) attackSection.style.display = "block";
    if (actionDescriptionEl)
      actionDescriptionEl.textContent = "Fase de ataque: escolha território atacante (seu, com >1 tropa) e um inimigo adjacente.";
    renderAttackHints();
  }

  updateDisplay();
  maybeTriggerCpuTurn();
}

function executeAttack() {
  if (isCpuTurn() || gameState.cpuThinking) return;
  if (!gameState.attackFrom || !gameState.attackTarget) return;

  const ok = performAttack(gameState.attackFrom, gameState.attackTarget);
  if (!ok) return;

  gameState.attackFrom = null;
  gameState.attackTarget = null;
  if (attackBtn) attackBtn.disabled = true;
  clearAttackHints();
  updateDisplay();
}

// ── Display ───────────────────────────────────────────────────────────────────

function updateDisplay() {
  gameState.players.forEach((p) => {
    const count = gameState.territories.filter((t) => t.player === p.index).length;
    const el = document.getElementById(`p${p.index}Territories`);
    if (el) el.textContent = String(count);
  });

  const phaseLabel = {
    distribution: "DISTRIBUIÇÃO INICIAL",
    reinforcement: "REFORÇOS",
    attack: "ATAQUE",
    ended: "FIM DE JOGO"
  }[gameState.phase] || "";

  const cp = currentPlayer();
  if (phaseIndicatorEl) phaseIndicatorEl.textContent = `${playerLabel(cp).toUpperCase()} · ${phaseLabel}`;
  if (document.getElementById("availableReinforcements"))
    document.getElementById("availableReinforcements").textContent = String(gameState.availableReinforcements);

  const locked = isCpuTurn() || gameState.cpuThinking;

  if (endTurnBtn) endTurnBtn.disabled = !gameState.gameStarted || gameState.phase === "distribution" || locked;
  if (addTroopBtn) addTroopBtn.disabled = locked || gameState.phase !== "reinforcement";
  if (gameModeSelect) gameModeSelect.disabled = gameState.gameStarted && gameState.phase !== "ended";
  if (cpuLevelSelect) {
    const modeHasCpu = GAME_MODES[gameState.mode]?.cpus > 0;
    cpuLevelSelect.disabled = !modeHasCpu || (gameState.gameStarted && gameState.phase !== "ended") || locked;
  }

  if (gameState.phase === "reinforcement") {
    if (reinforceSection) reinforceSection.style.display = "block";
    if (attackSection) attackSection.style.display = "none";
    if (actionDescriptionEl && !locked)
      actionDescriptionEl.textContent = `${playerLabel(cp)}: distribua seus ${gameState.availableReinforcements} reforços.`;
    clearAttackHints();
  } else if (gameState.phase === "attack") {
    if (reinforceSection) reinforceSection.style.display = "none";
    if (attackSection) attackSection.style.display = "block";
    if (!locked) renderAttackHints();
  } else {
    if (reinforceSection) reinforceSection.style.display = "none";
    if (attackSection) attackSection.style.display = "none";
    clearAttackHints();
  }

  if (locked && actionDescriptionEl)
    actionDescriptionEl.textContent = `${playerLabel(cp)} está jogando este turno...`;

  renderConnectionLines();
}

// ── Game init ─────────────────────────────────────────────────────────────────

function buildPlayers(mode) {
  const cfg = GAME_MODES[mode] || GAME_MODES["pvc1"];
  const players = [];
  for (let i = 0; i < cfg.humans; i++) players.push({ index: players.length + 1, isCpu: false });
  for (let i = 0; i < cfg.cpus; i++) players.push({ index: players.length + 1, isCpu: true });
  return players;
}

function startNewGame() {
  gameState.mode = gameModeSelect ? gameModeSelect.value : "pvc1";
  gameState.cpuLevel = cpuLevelSelect ? cpuLevelSelect.value : "normal";
  gameState.players = buildPlayers(gameState.mode);
  gameState.currentPlayerIndex = 0;
  gameState.phase = "distribution";
  gameState.territories = [];
  gameState.selectedTerritory = null;
  gameState.attackFrom = null;
  gameState.attackTarget = null;
  gameState.availableReinforcements = 3;
  gameState.gameStarted = false;
  gameState.cpuThinking = false;

  renderStatusBar();
  clearMapTerritories();
  createAttackOverlay(mapEl);
  syncAttackOverlaySize();
  createTerritories();
  resetLog();

  if (diceResultEl) diceResultEl.style.display = "none";
  if (addTroopBtn) addTroopBtn.disabled = false;
  if (attackBtn) attackBtn.disabled = true;
  if (actionDescriptionEl)
    actionDescriptionEl.textContent = "Clique em um território neutro para distribuí-lo (distribuição alternada).";

  const modeCfg = GAME_MODES[gameState.mode];
  addLog("Sistema", `Modo: ${modeCfg.label}.`);
  updateDisplay();
}

function initGame() {
  mapEl = document.getElementById("gameMap");
  addTroopBtn = document.getElementById("addTroopBtn");
  attackBtn = document.getElementById("attackBtn");
  endTurnBtn = document.getElementById("endTurnBtn");
  gameModeSelect = document.getElementById("gameModeSelect");
  cpuLevelSelect = document.getElementById("cpuLevelSelect");
  newGameBtn = document.getElementById("newGameBtn");
  actionDescriptionEl = document.getElementById("actionDescription");
  reinforceSection = document.getElementById("reinforceSection");
  attackSection = document.getElementById("attackSection");
  diceResultEl = document.getElementById("diceResult");
  statusBarEl = document.getElementById("statusBar");

  if (!mapEl || !addTroopBtn || !attackBtn || !endTurnBtn || !gameModeSelect || !cpuLevelSelect || !newGameBtn) return;

  addTroopBtn.addEventListener("click", addTroop);
  attackBtn.addEventListener("click", executeAttack);
  endTurnBtn.addEventListener("click", endTurn);
  newGameBtn.addEventListener("click", startNewGame);

  window.addEventListener("resize", () => {
    syncAttackOverlaySize();
    renderAttackHints();
    renderConnectionLines();
  });

  gameModeSelect.addEventListener("change", () => {
    const modeHasCpu = GAME_MODES[gameModeSelect.value]?.cpus > 0;
    if (cpuLevelSelect) cpuLevelSelect.disabled = !modeHasCpu;
  });

  startNewGame();
}

window.addEventListener("load", initGame);
