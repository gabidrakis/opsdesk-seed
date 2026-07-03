# OpsDesk

Mini back-office de gestion de tickets de support : API HTTP + base SQLite locale.
Back-end seul, pas d'UI. (`package.json` → "mini back-office de gestion de tickets de support")

## Stack
- TypeScript 5.5 en ESM (`"type": "module"`) — cible ES2022, `moduleResolution: "Bundler"`
  (`tsconfig.json`). Conséquence : les imports internes portent l'extension `.js`
  même en `.ts` (ex. `import { PORT } from "./config.js"`, `src/server.ts:2`).
- Node **>=20 <24** (`package.json` → `engines`).
- Fastify 4 (API HTTP) · better-sqlite3 11 (SQLite, driver natif).
- tsx (exécution TS en dev/seed) · Vitest 2 (tests).

## Commandes
- `npm ci` — installation. **Pas `npm install`** (bug npm des deps optionnelles rollup-win32
  si un `node_modules` résiduel traîne). Ne pas supprimer `package-lock.json`.
- `npm run dev` — serveur (`tsx src/server.ts`), écoute `0.0.0.0:3000` (env `PORT`).
- `npm run seed` — remplit la base (`tsx src/seed.ts`).
- `npm run build` — compile (`tsc` → `dist/`).
- `npm test` — Vitest (`vitest run`).

## Configuration (src/config.ts)
- `PORT` — port HTTP, défaut `3000` (env `PORT`).
- `DB_PATH` — fichier SQLite, défaut `data/opsdesk.db` (env **`OPSDESK_DB`**).

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
- SQL : colonnes en anglais, snake_case (`created_at`) ; commentaire « schéma canonique
  (anglais) », `src/db.ts:14`. Commentaires de code en français.
- Fonctions de données injectables : `database: DB = defaultDb` (testables en base mémoire,
  `src/tickets.ts:7`).

## Vérifier qu'une modif est correcte
1. `npm run build` → exit 0 (aucune erreur `tsc`).
2. `npm test` → Vitest vert.
3. Runtime : `npm run dev` puis `GET /health` → `{"status":"ok"}`.

⚠️ La CI (`.github/workflows/ci.yml`) ne lance que `npm ci` + `npm test` sous Node 20 —
**pas `npm run build`**. Le type-check n'est donc garanti que si tu lances `tsc` à la main.

## À vérifier (non tranché par le code seul)
- `OPSDESK_API_KEY` est codée en dur dans `src/config.ts:3` (`opsdesk_live_…`, commentée
  « à des fins de démonstration »). Statut voulu ? — non modifié ici.
- Pas de `.eslintrc`/`.prettierrc`/`.editorconfig` : les conventions ci-dessus sont *de facto*,
  rien ne les vérifie automatiquement.
