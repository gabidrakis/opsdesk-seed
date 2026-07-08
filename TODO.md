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
- [x] **Checkpoint Gabi (manuel, Claude Code)** : 3 outils MCP exercés en session · écriture réelle vérifiée hors-MCP puis restaurée · base intacte (9 open). Reste : approuver 1× en CLI (`claude mcp list` affiche `⏸ Pending approval`).

## Lab 3 — spécifier planner / builder / reviewer (branche `j4-orchestration`)
- [x] `.claude/agents/{planner,builder,reviewer}.md` — frontmatter name/description/tools + prompt de rôle + critère de sortie
- [x] `.pi/agents/{planner,builder,reviewer}.md` — frontmatter minimal (name/description) + prompt de rôle (pour Lab 5 pi.dev)
- [x] Périmètres non chevauchants **garantis par les outils** (planner lecture seule · builder seul Write/Edit · reviewer pas de Write/Edit)
- [x] Goulot humain validé : 2 gates (accepter le plan · accepter le verdict) ; builder→reviewer = gate auto I3
- [ ] Versionner les 6 définitions (commit) — en attente feu vert Gabi

## Lab 4 — pipeline planner→builder→reviewer sur une feature réelle (branche `j4-orchestration`)

**Feature : exposer `GET /tickets/stats` qui renvoie `{ open, in_progress, closed }`. Critère : test Vitest passant + route répond 200.**

Contrainte de conception (énoncé) : `stats` se calcule en **réutilisant `listTickets()`** (`src/tickets.ts`, déjà paramétré), **sans nouveau SQL**. Route ajoutée dans `src/server.ts` à côté des routes existantes.

- [x] PLANNER → `plans/stats.plan.md` (plan numéroté ; agent read-only `Plan` + rôle planner injecté)
- [x] **Checkpoint humain n°1** : plan ACCEPTÉ, décisions A (fonction dédiée) + B (réponse stricte) tracées dans `plans/stats.plan.md`
- [x] BUILDER → `computeTicketStats` (`src/tickets.ts`) + route (`src/server.ts`) + `test/stats-endpoint.test.ts` (7 cas)
- [x] **Checkpoint humain n°2** : `npx vitest run` **33/33** (relance perso) + `tsc` exit 0 + live `curl.exe /tickets/stats` = `{open:9,in_progress:2,closed:1}` cohérent SQLite (serveur zombie d'hier tué au passage)
- [x] REVIEWER → `reviews/stats.review.md` (verdict **ACCEPTER**, gate I3 reproduite ; agent read-only `Explore` + rôle reviewer injecté)
- [x] **Checkpoint humain n°3** : merge accepté → commit dédié `535cd01`
- [x] Capitaliser : `plans/stats.plan.md` + `reviews/stats.review.md` versionnés (commit feature), workflow + route `/tickets/stats` ajoutés à `CLAUDE.md`

## À venir (labs suivants)
- [ ] Note d'arbitrage (Pièce 5)
