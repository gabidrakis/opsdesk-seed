# Portfolio P3 · OpsDesk — index des 5 livrables

Fil rouge « Architecte agentique » sur OpsDesk (back-office de tickets, Fastify + SQLite +
TypeScript). Un livrable par module ; la progression se mesure aussi par la grille
[AGENTIC-READINESS.md](../../AGENTIC-READINESS.md). Démo rejouable : [demo.md](demo.md).

Critères d'évaluation : **Autonomie · Observabilité · Fiabilité · Gouvernance · Enseigner à ses agents**.
Les « critères dominants » ci-dessous sont proposés — à confirmer par Gabi.

| # | Module | Livrable(s) principaux | Critères dominants |
|---|--------|------------------------|--------------------|
| J1 | **Fondations : agentic-ready** | [CLAUDE.md](../../CLAUDE.md) · [AGENTIC-READINESS.md](../../AGENTIC-READINESS.md) · [notes-j1.md](../../notes-j1.md) | Enseigner · Observabilité |
| J2 | **Prompts & sorties structurées** | [.claude/commands/](../../.claude/commands) · [schema.ts](../../src/classification/schema.ts) · [guard-commit.sh](../../scripts/guard-commit.sh) · [preuve hook](../../docs/preuves/j2-hook-blocage.txt) | Gouvernance · Fiabilité |
| J3 | **Contexte, mémoire & fiabilité** | [classify-batch.ts](../../scripts/classify-batch.ts) · [test idempotent](../../test/classify-idempotent.test.ts) · [mémoire idempotence](../../.claude/memory/idempotence.md) · [mesure avant/après](../../mesure/avant-apres.md) | Fiabilité · Enseigner |
| J4 | **Outils, MCP & orchestration** | [classifier-ticket.mjs](../../tools/classifier-ticket.mjs) · [serveur MCP](../../mcp/tickets-server.mjs) · [agents](../../.claude/agents) · [plan](../../plans/stats.plan.md)+[review stats](../../reviews/stats.review.md) · [arbitrage](../../portfolio/J4-arbitrage-orchestration.md) | Autonomie · Gouvernance |
| J5 | **Mise en production : revue agentique CI** | [prompt de revue](../../.github/agent/revue-pr.md) · [revue-agent.mjs](../../scripts/revue-agent.mjs) · [publier-verdict.mjs](../../scripts/publier-verdict.mjs) · [workflow](../../.github/workflows/revue-agentique.yml) · [ADR](../decisions/adr-001-mise-en-prod.md) | Gouvernance · Observabilité · Fiabilité |

## Fils conducteurs (ce que le portfolio démontre)
- **État en fichiers, pas en contexte volatil** : `plans/*.md`, `TODO.md`, `journal/`, mémoire projet
  versionnée — reproductible, observable, reprenable.
- **L'humain garde les gates irréversibles** : valider un plan, lire un verdict, merger. Aucun agent
  ne merge seul (branch protection).
- **Sorties structurées validées** : classification (schéma Zod) en J2/J4, verdict JSON en J5 —
  invalide → on échoue, on ne publie pas.
- **Capitalisation** : bibliothèque de prompts (J2), outils/MCP gouvernés (J4), pipeline de revue (J5).

## Garde-fous de production (rappel M5)
Agent ne merge jamais (branch protection + approbation) · secrets hors du code (Actions secret + hook
actif) · sortie structurée validée · idempotence (upsert) · boucle bornée (timeout, pas de re-run auto,
pas de spawn massif) · coût borné (diff seul, court-circuit trivial) · observabilité (Job Summary) ·
données sensibles non exfiltrées.
