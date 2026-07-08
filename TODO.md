# TODO · J4 — Outils, MCP & orchestration

Source : `plans/j4-tools-mcp.md` (validé le 2026-07-08, ajusté au fil des labs).

## Setup
- [x] Branche `j4-tools` depuis `etat/j3-fin` ; `@modelcontextprotocol/sdk` installé ; baseline vitest verte.

## Lab 1 — outil `classifier_ticket`
- [x] `tools/classifier-ticket.mjs` (contrat : corps vide → `{erreur}`, sinon sortie validée par schéma)
- [x] `tools/run-classifier.mjs` (wrapper CLI, via `npx tsx`)
- [x] `.claude/commands/classer-ticket.md` (délègue à l'outil, description quand/quand-pas)
- [x] `tools/classifier-ticket.test.mjs` (3 cas) — `vitest` vert (20/20 suite complète)
- [x] Note « contrat d'un outil » dans `CLAUDE.md`

## À venir (en attente des labs suivants)
- [ ] Lab 2 : `classifier_ticket` devient un vrai outil MCP appelé par l'agent
- [ ] Serveur MCP = seul accès à la base tickets (invariant I1)
- [ ] Pipeline planner→builder→reviewer (checkpoints humains tracés, I2 ; vitest vert avant reviewer, I3)
- [ ] Feature livrée par le pipeline
- [ ] Note d'arbitrage
