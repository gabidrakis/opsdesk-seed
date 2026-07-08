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

## Lab 2 — serveur MCP tickets (seul accès base, invariant I1)
- [x] `mcp/tickets-server.mjs` — 3 outils gouvernés, requêtes paramétrées, aucun SQL générique
- [x] `.mcp.json` versionné (rebranchement au clone) + doc `claude mcp add` dans CLAUDE.md
- [x] `test/mcp-tickets.test.mjs` — Client MCP in-memory (3 outils, id=999 géré, écriture réelle, injection rejetée)
- [x] Boot sous `node` vérifié (initialize + tools/list) ; suite **26/26 vert**
- [ ] **Checkpoint Gabi (manuel, Claude Code)** : `claude mcp list` connected · 3 prompts · `sqlite3` id=1001

## À venir (en attente des labs suivants)
- [ ] Pipeline planner→builder→reviewer (checkpoints humains tracés, I2 ; vitest vert avant reviewer, I3)
- [ ] Feature livrée par le pipeline
- [ ] Note d'arbitrage
