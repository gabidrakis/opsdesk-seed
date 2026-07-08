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

## À venir (labs suivants)
- [ ] Exécuter le pipeline planner→builder→reviewer pour livrer la feature recherche (`GET /tickets/search` + cœur `searchTickets`), checkpoints humains tracés (I2), vitest vert avant reviewer (I3)
- [ ] Note d'arbitrage (Pièce 5)
