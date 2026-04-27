# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Session Engine é um hub centralizado para acessar múltiplos jogos web. A arquitetura é simples e escalável: cada jogo vive em sua própria pasta dentro de `/games`, e um catálogo central em `scripts/game-catalog.js` gerencia a descoberta e exibição de todos os jogos.

## Architecture

**Entry Point:** `index.html` — hub central com grid responsivo de jogos. Carrega `scripts/game-catalog.js` dinamicamente para renderizar cards de cada jogo.

**Game Catalog System:** `scripts/game-catalog.js` define um array global `window.GAME_CATALOG` com objetos contendo:
- `id` — identificador único do jogo
- `title` — nome exibido
- `description` — descrição breve
- `path` — caminho relativo para `games/nome/index.html`
- `status` — "available" ou "coming-soon" (controla se o botão está ativo)
- `tags` — array de strings para categorização

**Game Structure:** Cada jogo é uma pasta independente em `/games/nome-do-jogo/` com:
- `index.html` — página do jogo com link de volta `../../index.html`
- Estilos e scripts específicos do jogo (podem estar inline ou em arquivos separados)

**Existing Games:**
- `games/snake/` — jogo Snake clássico com modos 1-2 jogadores, canvas-based, suporte mobile e localStorage para recorde
- `games/war-light/` — jogo estratégico por turnos inspirado em War, com 18 territórios, sistema de turnos, tropas, reforços e dados de combate

## Development Workflow

### Adding a New Game

1. Crie a pasta `games/nome-do-jogo/`
2. Crie `games/nome-do-jogo/index.html` com:
   - Link de volta ao menu: `<a href="../../index.html">Voltar ao Menu</a>`
   - Seu HTML, CSS e JS
3. Registre em `scripts/game-catalog.js` adicionando um objeto ao array com os campos obrigatórios
4. Set `status: 'available'` para o jogo aparecer ativo no hub

### Testing Locally

Abra `index.html` em um navegador moderno (Chrome, Firefox, Edge). Não requer build ou servidor — é vanilla HTML/CSS/JS.

## Key Implementation Notes

**Responsive Design:** O hub usa CSS Grid com `minmax(250px, 1fr)` para adaptar-se a qualquer tamanho de tela. Temas de cores usam CSS variables (--bg-1, --accent, etc.) para consistência.

**Game Styling:** Cada jogo pode ter seu próprio design. O Snake usa canvas com contexto 2D; War Light usa SVG/divs para territórios. Mantenha estilos scoped ao jogo quando possível.

**State Management:** Jogos podem usar localStorage (como Snake com recorde) ou state local em variáveis. Não há dependências externas — tudo é vanilla JS.

**Accessibility:** Hub inclui `aria-label` em seções e estrutura HTML semântica. Considere labels e navegação por teclado ao adicionar novos jogos.

## Code Style

- Variáveis e funções em camelCase
- Constantes em UPPER_SNAKE_CASE
- Comentários apenas quando o WHY não é óbvio
- Prefira nomes descritivos: `calculateReinforcements()` em vez de `calc()`

## Common Commands

- **View:** Abra `index.html` em qualquer navegador
- **Add Game:** Crie pasta em `/games`, registro em `game-catalog.js`, teste a renderização no hub
- **Debug:** Use DevTools (F12) — não há build step, JS é executado direto

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
