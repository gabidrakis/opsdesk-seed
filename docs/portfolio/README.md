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
Une note /5 par critère. ⚠️ **Les chiffres sont à poser par Gabi** (auto-évaluation honnête, avant le
verdict plateforme). Le factuel, les preuves et la limite sont pré-remplis ; chaque note se lit
« ce que j'ai fait → preuve vérifiable → limite honnête qui m'empêche de mettre plus ».

| Critère | Note /5 |
|---|:---:|
| Autonomie | `3 / 5` |
| Observabilité | `4 / 5` |
| Fiabilité | `5 / 5` |
| Gouvernance | `5 / 5` |
| Enseigner à ses agents | `4 / 5` |

### Autonomie — `3 / 5`
La revue de PR se déclenche **seule** sur `pull_request` et rend un verdict sans intervention
(prouvé sur la PR de démo : job vert, `request_changes` détecté sur la route non testée). Le pipeline
`planner→builder→reviewer` (J4) enchaîne conception → code → jugement.
_Preuve :_ `.github/workflows/revue-agentique.yml`, PR de démo, `.claude/agents/`.
_Limite :_ autonomie **bornée par choix** — re-run manuel, aucun auto-merge, gates humains ; c'est de
l'autonomie encadrée, pas totale.

### Observabilité — `4 / 5`
Chaque exécution produit un **Job Summary** (PR, commit, verdict, nb findings, durée, horodatage UTC)
et **un** commentaire de PR ; l'état de chantier vit sur disque (`plans/*.md`, `TODO.md`, `journal/`) ;
mesure avant/après tracée en J3.
_Preuve :_ step *Job Summary* de `.github/workflows/revue-agentique.yml`, commentaire de la PR de démo,
`mesure/avant-apres.md`.
_Limite :_ observabilité **par run** — pas de métriques agrégées ni de tableau de tendance dans le temps.

### Fiabilité — `5 / 5`
L'idempotence et la reprise après crash ne sont pas affirmées mais **prouvées par test** :
`test/classify-idempotent.test.ts` rejoue le batch (2ᵉ passage = 0 reclassé) et simule un crash via
`OPSDESK_FAIL_AT` puis vérifie que la reprise ne refait que le reste. Suite complète **46/46 verte** ;
verdict de revue validé par schéma (invalide → `exit 1`, rien publié).
_Preuve :_ `test/classify-idempotent.test.ts`, `npx vitest run`, `scripts/publier-verdict.mjs`
(`validerVerdict`).
_Limite :_ tout est vérifié en base `:memory:` — pas de test de charge ni de reprise sur la base réelle.

### Gouvernance — `5 / 5`
Les gates irréversibles restent **humains** : branch protection `main` (1 approbation, agent ne merge
jamais). Secret hors du code (Actions secret + hook `guard-commit.sh`). Sorties structurées **validées**
(schéma Zod J2/J4, verdict JSON J5 ; non conforme → échec). Décision d'archi **tracée** (ADR-001).
_Preuve :_ protection posée (`gh api …/branches/main/protection`), `scripts/guard-commit.sh`,
`scripts/publier-verdict.mjs`, `docs/decisions/adr-001-mise-en-prod.md`.
_Limite :_ angle mort connu et documenté — `OPSDESK_API_KEY` reste codée en dur dans `src/config.ts`
(signalé dans `CLAUDE.md`, non corrigé).

### Enseigner à ses agents — `4 / 5`
Des règles réutilisables sont transmises aux agents : `CLAUDE.md` riche + mémoires `.claude/memory/*.md`,
bibliothèque de prompts figés en slash-commands (`.claude/commands/`), gabarits réutilisables (workflow
de revue, ADR, pipeline planner/builder/reviewer).
_Preuve :_ `CLAUDE.md`, `.claude/commands/`, `.claude/agents/`, `.claude/memory/`.
_Limite :_ aucune vérification automatique que les agents **respectent** effectivement ces règles — la
conformité repose sur la relecture humaine.

## Question rituelle (J5)
>  Qu'ai-je délégué / enseigné à mes agents aujourd'hui, et comment l'ai-je vérifié ? 

J'ai délégué à mon agent la vérification de mon travail + la mécanique CI/portfolio, tout en lui enseignant que je garde les gates irréversibles et le jugement personnel. Je l'ai vérifié par la branch protection posée de ma main, le  secret confirmé, et la PR de démo verte où l'agent a détecté seul la route non testée.
