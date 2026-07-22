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

## Checklist garde-fous de production (M5)
Cochée = vérifiée dans le dépôt. La preuve est le fichier/mécanisme cité.

- [x] **L'agent ne merge jamais** — branch protection `main` (*Require a PR* + *Require approvals 1*) ;
  le job n'a que `permissions: contents: read` (+ `pull-requests: write` pour le seul commentaire).
  Preuve : `.github/workflows/revue-agentique.yml:10-12`.
- [x] **Secret hors du code** — `ANTHROPIC_API_KEY` en *Actions secret*, jamais dans le YAML ;
  hook `guard-commit.sh` actif ; `.env` gitignoré. Preuve : `.github/workflows/revue-agentique.yml:58`.
- [x] **Sortie structurée validée** — `validerVerdict()` (whitelist + types) ; JSON non conforme → `exit 1`,
  rien publié. Preuve : `scripts/publier-verdict.mjs:17-29` + `test/publier-verdict.test.mjs`.
- [x] **Idempotence** — marqueur `<!-- opsdesk-revue-agent -->` + upsert (`--paginate --slurp` → find →
  PATCH/POST). Preuve : `scripts/publier-verdict.mjs:51-74`.
- [x] **Boucle bornée** — `timeout-minutes: 10`, re-run **manuel** uniquement (jamais de boucle auto),
  aucun spawn massif de sous-agents. Preuve : `.github/workflows/revue-agentique.yml:17`.
- [x] **Coût borné** — l'agent ne juge que le **diff** (pas le dépôt) ; court-circuit si diff tout-`.md`.
  Preuve : `.github/workflows/revue-agentique.yml:38-47`.
- [x] **Observabilité** — Job Summary (PR, commit, verdict, nb findings, durée, horodatage UTC).
  Preuve : `.github/workflows/revue-agentique.yml:68-91`.
- [x] **Données sensibles non exfiltrées** — seul le diff est transmis à l'agent, jamais le dépôt entier.
  Preuve : `scripts/revue-agent.mjs:33-39` (diff sur stdin).

## Grille d'auto-évaluation P3 (à froid)
Une note /5 par critère, **justifiée par une preuve**. ⚠️ Les notes sont à renseigner par Gabi
(auto-évaluation honnête, avant le verdict plateforme) ; la colonne preuve est pré-remplie.

| Critère | Note /5 | Preuve (à l'appui de la note) |
|---|:---:|---|
| **Autonomie** | _(à remplir)_ | Pipeline planner→builder→reviewer (J4) · revue agentique en CI qui tourne seule sur `pull_request` (J5). |
| **Observabilité** | _(à remplir)_ | Job Summary + commentaire idempotent (J5) · `plans/`, `TODO.md`, `journal/` (état sur disque). |
| **Fiabilité** | _(à remplir)_ | Idempotence + reprise après crash prouvées par test (J3) · 46/46 tests verts · upsert (J5). |
| **Gouvernance** | _(à remplir)_ | Branch protection + agent ne merge jamais · secret hors code + hook · sortie validée (J5) · ADR-001. |
| **Enseigner à ses agents** | _(à remplir)_ | `CLAUDE.md` + `.claude/memory/*` · bibliothèque de prompts (J2) · gabarits réutilisables (workflow, ADR). |

## Question rituelle (J5)
> _(Intitulé de la question rituelle du jalon J5 — à recopier depuis le tableau de bord.)_

_(Réponse à rédiger par Gabi — section personnelle, non déléguée à l'agent.)_
