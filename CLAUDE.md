# OpsDesk

Mini back-office de gestion de tickets de support : API HTTP (Fastify) sur une base
SQLite locale, plus un jeu de données d'exemple (`npm run seed`).
(`package.json` → "mini back-office de gestion de tickets de support")

## Stack
- TypeScript 5.5 en ESM (`"type": "module"`) — cible ES2022, `moduleResolution: "Bundler"`
  (`tsconfig.json`). Conséquence : les imports internes portent l'extension `.js`
  même en `.ts` (ex. `import { PORT } from "./config.js"`, `src/server.ts:2`).
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

## Conventions (déduites du code)
- Imports ESM avec extension `.js` (voir Stack).
- Routes Fastify typées par génériques : `app.get<{ Params: { id: string } }>(...)`
  (`src/server.ts:18,28`).
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

## À savoir (non déductible du code seul)
- **Windows** : interroger l'API en `127.0.0.1`, pas `localhost` — `localhost` résout en
  IPv6 (`::1`) alors que Fastify écoute en IPv4 (`0.0.0.0`), d'où un refus de connexion.
- `OPSDESK_API_KEY` est **codée en dur** dans `src/config.ts:3` (`opsdesk_live_…`, commentée
  « à des fins de démonstration »). Cela contredit le critère « aucun secret en clair » ci-dessus :
  documenté ici, statut à confirmer — non modifié.
- Aucun `.eslintrc`/`.prettierrc`/`.editorconfig` : les conventions ci-dessus sont *de facto*
  (déduites du code), rien ne les vérifie automatiquement.
