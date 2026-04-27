# Roadmap Fase 2: Escalabilidade e Persistência

Após a entrega do MVP funcional com armazenamento em memória, os seguintes marcos são planejados:

## 1. Persistência e Cache
- [ ] **PostgreSQL:** Persistência de estatísticas de jogadores, histórico de partidas e contas de usuário.
- [ ] **Redis:** Gerenciamento de sessões distribuídas (permite rodar múltiplos nós do backend) e cache de estado de jogo altamente frequente.

## 2. Infraestrutura e Mensageria
- [ ] **Kafka/RabbitMQ:** Integração de eventos de domínio para sistemas externos (analytics, logs, conquistas).
- [ ] **Docker Compose:** Setup simplificado de todo o ecossistema (DB, Cache, Apps).
- [ ] **Kubernetes Ready:** Preparação para scaling horizontal dos gateways.

## 3. Melhorias de Gameplay
- [ ] **Chat Global/Sala:** Comunicação entre jogadores durante a partida.
- [ ] **Matchmaking Automatizado:** Sistema de filas baseado em rank/habilidade.
- [ ] **Anti-Cheat:** Validação rigorosa de timestamps e sequência de pacotes.

## 4. Observabilidade
- [ ] **Prometheus/Grafana:** Métricas de latência, número de sessões ativas e consumo de CPU/RAM.
- [ ] **Sentry:** Monitoramento de erros em produção (Frontend e Backend).
