# OpsDesk

Mini back-office de gestion de tickets de support : API HTTP (Fastify) sur une base
SQLite locale, plus un jeu de données d'exemple (`npm run seed`).
(`package.json` → "mini back-office de gestion de tickets de support")

## Stack
- TypeScript 5.5 en ESM (`"type": "module"`) — cible ES2022, `moduleResolution: "Bundler"`
  (`tsconfig.json`). Conséquence : les imports internes portent l'extension `.js`
  même en `.ts` (ex. `import { PORT } from "./config.js"`, `src/server.ts:4`).
- Node **>=20 <24** (`package.json` → `engines`). La borne haute n'est pas cosmétique :
  le driver natif `better-sqlite3` n'a pas de binaire précompilé pour Node 24 → rester en 20–23.
- Fastify 4 (API HTTP) · better-sqlite3 11 (SQLite, driver natif).
- tsx (exécution TS en dev/seed) · Vitest 2 (tests).

## Commandes
- `npm ci` — installation. **Pas `npm install`** (bug npm des deps optionnelles rollup-win32
  si un `node_modules` résiduel traîne). Ne pas supprimer `package-lock.json`.
- `npm run dev` — serveur (`tsx src/server.ts`), écoute `0.0.0.0:3000` (env `PORT`).
- `npm run seed` — **vide puis réinsère** 12 tickets d'exemple à id fixes `1001`–`1012`
  (`DELETE FROM tickets` en tête, `src/seed.ts:110`). Destructif ; id stables pour rendre
  les labs rejouables.
- `npm run build` — compile (`tsc` → `dist/`).
- `npm test` — Vitest (`vitest run`).

## Configuration (src/config.ts)
- `PORT` — port HTTP, défaut `3000` (env `PORT`).
- `DB_PATH` — fichier SQLite, défaut `data/opsdesk.db` (env **`OPSDESK_DB`**).

## Modèle de données (src/db.ts)
- Table `tickets(id, subject, body, category, priority, status, created_at)`, SQLite en
  `journal_mode = WAL`. Colonnes en anglais, snake_case.
- Valeurs métier réelles (relevées dans `src/seed.ts`, non contraintes par le schéma) :
  - `status` : `open` · `in_progress` · `closed`
  - `category` : `acces` · `facturation` · `bug` · `demande` · `autre` (en français)
  - `priority` : entier `1`–`3`

## Routes (src/server.ts)
- `GET /health` → `{ "status": "ok" }`.
- `GET /tickets` — liste (triée `created_at DESC`).
- `GET /tickets/:id` — un ticket ; **404** `{ error: "ticket not found" }` si absent.
- `POST /tickets/:id/status` — corps `{ "status": "..." }` ; **400** si `status` manquant,
  **404** si ticket absent.
- `GET /tickets/stats` → `{ open, in_progress, closed }` — compteurs par statut, calculés
  **en mémoire** en réutilisant `listTickets()` (aucun SQL nouveau ; `computeTicketStats`,
  `src/tickets.ts`). Statuts hors des 3 attendus ignorés. Toujours **200**.

## Conventions (déduites du code)
- Imports ESM avec extension `.js` (voir Stack).
- Routes Fastify typées par génériques : `app.get<{ Params: { id: string } }>(...)`
  (`src/server.ts:27,55` ; `POST` en `src/server.ts:37`).
- Erreurs HTTP : `reply.code(4xx).send({ error: "..." })`.
- Fichiers `src/` : un mot, minuscule (`config.ts`, `db.ts`, `server.ts`, `tickets.ts`, `seed.ts`).
- Fonctions : camelCase à préfixe verbal (`listTickets`, `getTicket`, `updateTicketStatus`,
  `src/tickets.ts`). Types : PascalCase (`Ticket`, `DB`). Env : UPPER_SNAKE_CASE.
- Commentaires de code en français.
- Fonctions de données injectables : `database: DB = defaultDb` (testables en base mémoire,
  `src/tickets.ts:7`).

## Vérifier qu'une modif est correcte
1. `npm run build` → exit 0 (aucune erreur `tsc`).
2. `npm test` → Vitest vert.
3. Runtime : `npm run dev` puis `GET /health` → `{"status":"ok"}`.

⚠️ La CI (`.github/workflows/ci.yml`) ne lance que `npm ci` + `npm test` sous Node 20 —
**pas `npm run build`**. Le type-check n'est donc garanti que si tu lances `tsc` à la main.

## Critères de réussite
- `npm run build` réussit sans erreur (`tsc`).
- `npm test` (Vitest) est vert.
- `GET /health` répond `{"status":"ok"}`.
- La CI (`.github/workflows/ci.yml`) est verte (`npm ci` + `npm test`).
- Aucun secret en clair commité.

## Bibliothèque de prompts (`.claude/commands/`)

Prompts figés en **slash-commands de projet** (versionnées, disponibles au clone).
Voir `prompts/README.md` pour la convention de nommage et la règle de relecture.

| Commande | Usage | Argument |
|---|---|---|
| `/classer-ticket` | Classe un ticket en JSON structuré | texte du ticket |
| `/rediger-reponse` | Rédige une réponse client (ton pro, 4–6 phrases) | id de ticket ou texte |
| `/resumer-tickets` | Résume les tickets ouverts (liste + compteur/catégorie) | filtre catégorie (optionnel) |

- **Règle** : toute classification doit produire un JSON **conforme à
  `src/classification/schema.ts`** et passer `parseClassification` (§ classification).
- `/rediger-reponse` termine toujours par « ⚠️ Relecture humaine avant envoi » — aucune
  réponse client n'est envoyée automatiquement.

## Outils (`tools/`) — contrat d'un outil (J4, Lab 1)
Un **outil** = **nom verbe-objet** + **description quand / quand-pas** + **erreurs en résultat**
(jamais d'exception qui casse le flux). Exemple de référence : `tools/classifier-ticket.mjs`
(`classifierTicket({ subject, body })`) — corps vide → `{ erreur: "…" }` (pas de throw),
sinon sortie **conforme à `src/classification/schema.ts`** (schéma Zod = source de vérité unique,
validée par `safeParse`, jamais recopiée). Wrapper CLI : `tools/run-classifier.mjs`, lancé via
**`npx tsx`** (pas `node` nu : l'outil importe un `.ts`).

## Serveur MCP tickets (`mcp/tickets-server.mjs`) — J4, Lab 2
**Invariant** : tout accès de l'agent à la base tickets passe par ce serveur MCP. **Aucun SQL
libre** exécuté par l'agent, **aucun outil générique** (`run_query`/`execute_sql`). Traiter ce
serveur comme une **dépendance de sécurité**.
- **3 outils gouvernés**, requêtes **paramétrées** (jamais de concaténation) :
  `list_tickets { status? }` (lecture) · `get_ticket { id }` (lecture ; absent → `{ erreur: "ticket <id> introuvable" }`) ·
  `update_ticket_status { id, status }` (**seule écriture** ; aucune suppression).
- Tourne sous **`node`** nu (n'importe aucun `.ts`, ouvre sa propre connexion better-sqlite3 ;
  base via env `OPSDESK_DB`, défaut `data/opsdesk.db`).
- **Rebranchement en une ligne** — deux voies :
  - **Versionné (recommandé)** : `.mcp.json` du projet déclare le serveur (chemin relatif,
    portable) → dispo au clone, approuver au 1er lancement de Claude Code.
  - **CLI équivalente** : `claude mcp add tickets -- node "$(pwd)/mcp/tickets-server.mjs"`
    puis `claude mcp list` → `tickets ✓ connected`. (Ne pas cumuler avec `.mcp.json` : doublon.)
- Test : `test/mcp-tickets.test.mjs` (Client MCP + transport in-memory : 3 outils exposés,
  id introuvable géré, écriture réelle, entrée hostile rejetée).

## Pipeline planner→builder→reviewer (`.claude/agents/`) — J4, Lab 3-4
Trois agents spécialisés à **rôles non chevauchants**, garantis par leurs **outils** :
`planner` (lecture seule — conçoit, ne code pas) · `builder` (seul avec `Write`/`Edit` — code la
spec validée, ne replanifie pas) · `reviewer` (pas de `Write`/`Edit` — juge, ne code pas). Définitions
versionnées : `.claude/agents/{planner,builder,reviewer}.md` (+ miroir minimal `.pi/agents/` pour pi.dev).

**Workflow d'une feature livrée par le pipeline** (goulots humains = 2 gates ; un agent ne merge jamais seul) :

> feature → **planner** → [🧑 valider le plan] → **builder** → [tests verts, gate auto I3] → **reviewer** → [🧑 lire le verdict] → merge

- Trace obligatoire : `plans/<feature>.plan.md` (spec + décision du checkpoint n°1) et
  `reviews/<feature>.review.md` (verdict + gate I3 reproduite). Commit dédié au merge (checkpoint n°3).
- **Garde-fou** : le verdict d'un agent ne remplace jamais `npx vitest run` — merge rouge = échec du
  pipeline. Vérifier aussi le runtime (`npm run dev` + `curl.exe -s 127.0.0.1:3000/...` sous Windows).
- Exemple de référence : `plans/stats.plan.md` + `reviews/stats.review.md` (feature `/tickets/stats`, Lab 4).

## Revue agentique en CI (`.github/workflows/revue-agentique.yml`) — J5, Module 5
Sur `pull_request`, un agent (`claude -p`) lit **le diff** (contenu **non fiable**, fourni sur stdin) +
`CLAUDE.md`, rend un **verdict JSON validé** et le publie en **un seul commentaire de PR idempotent**.
Workflow **séparé** de `ci.yml` (non touchée) ; les deux coexistent sur une PR.

**4 verrous non négociables :**
1. **L'agent ne merge jamais** — verrou réel = **branch protection** `main` (Require approvals 1),
   pas le job. `permissions: contents: read` (+ `pull-requests: write` pour le seul commentaire).
2. **Sortie structurée validée** — `validerVerdict()` (whitelist `verdict`, `findings` tableau,
   `summary` string) ; JSON non conforme → `exit 1`, **rien n'est publié**.
3. **Secret hors du code** — `ANTHROPIC_API_KEY` en **Actions secret**, jamais dans le YAML
   (le hook M2 `guard-commit.sh` reste actif, il ne bloque que le littéral `opsdesk_live_…`).
4. **Idempotence** — marqueur caché `<!-- opsdesk-revue-agent -->` + upsert (`gh api --paginate
   --slurp` → find → PATCH/POST) : **2 pushes → 1 commentaire mis à jour**, jamais de doublon.

- **Doctrine** : *check vert ≠ validation humaine*. Le job informe ; c'est l'humain qui merge.
- **Re-run manuel tracé** (jamais de boucle auto) : GitHub → onglet *Actions* → run → *Re-run jobs*.
- **Conception maison** : scripts = fonctions **pures** exportées (`nettoyerSortie`, `validerVerdict`,
  `rendreMarkdown`) + garde CLI `import.meta.url` (patron `src/server.ts:77`) → testables sans lancer
  l'agent. `claude` / `gh api` = effets de bord externes, couverts par la démo, non unit-testés.
- **Durcissement** : court-circuit si diff tout-`.md` · `timeout-minutes: 10` · Job Summary
  (PR, commit, verdict, nb findings, durée, horodatage UTC). Verdicts `reviews/revue-*.json`
  **gitignorés** (artefacts runtime ; l'observabilité vit dans le Job Summary + le commentaire).
- Livrables : `.github/agent/revue-pr.md` (prompt, grille 6 composants + 1 few-shot) ·
  `scripts/revue-agent.mjs` · `scripts/publier-verdict.mjs` · tests `test/revue-agent.test.mjs`
  + `test/publier-verdict.test.mjs`. Plan : `plans/revue-agentique.md`.

## Tâches récurrentes
- Répondre à un ticket → suivre `.claude/memory/reponses-tickets.md`.
- Traiter des tickets en lot de façon idempotente → suivre `.claude/memory/idempotence.md`.
- Classer un ticket → slash-command `/classer-ticket` (délègue à `tools/run-classifier.mjs`).
- Lire/écrire un ticket → **via le serveur MCP `tickets`** uniquement (jamais de SQL libre).

## Carte du contexte (où vit quoi)
- **Session (volatile)** : la tâche en cours — le fil de discussion, ce qu'on se dit maintenant.
  Perdu à la fermeture ; ne jamais s'y fier pour ce qui doit survivre.
- **Mémoire projet (persistante, versionnée)** : `CLAUDE.md` + `.claude/memory/*.md`.
  Conventions, patterns, garde-fous. Committée → disponible au clone, relue à chaque session.
- **État de tâche (semi-persistant, sur disque)** : `plans/*.md`, `TODO.md`, `journal/`.
  Le « où en est-on » d'un chantier : plan validé, cases cochées, lignes datées d'avancement.

## Planifier avant de coder
Toute tâche multi-étapes suit ce cycle **observable** :
1. **Plan d'abord** : écrire `plans/<feature>.md` (objectif, étapes numérotées, fichiers touchés,
   tests, risques) — gabarit `plans/_template.md`. **Aucun code applicatif avant validation humaine
   explicite** ; tracer la relecture dans le plan (correction ou « relu le AAAA-MM-JJ, aucune correction car… »).
2. **TODO** : générer `TODO.md` depuis les étapes du plan ; cocher `[x]` seulement une étape réellement finie.
3. **Journal** : après chaque étape, une ligne datée dans `journal/<AAAA-MM-JJ>.md` —
   `[HH:MM] Étape N terminée : <résumé>. Test : <vert/rouge>.` (statut de test factuel).
Exemple de référence : `plans/reply-endpoint.md` + `journal/2026-07-07.md` (Lab 2).

## À savoir (non déductible du code seul)
- **Windows** : interroger l'API en `127.0.0.1`, pas `localhost` — `localhost` résout en
  IPv6 (`::1`) alors que Fastify écoute en IPv4 (`0.0.0.0`), d'où un refus de connexion.
- `OPSDESK_API_KEY` est **codée en dur** dans `src/config.ts:3` (`opsdesk_live_…`, commentée
  « à des fins de démonstration »). Cela contredit le critère « aucun secret en clair » ci-dessus :
  documenté ici, statut à confirmer — non modifié.
- Aucun `.eslintrc`/`.prettierrc`/`.editorconfig` : les conventions ci-dessus sont *de facto*
  (déduites du code), rien ne les vérifie automatiquement.
