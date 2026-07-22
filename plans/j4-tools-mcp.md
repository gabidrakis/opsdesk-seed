# Plan · J4 — Outils, MCP & orchestration
Daté : 2026-07-08 · Branche : `j4-tools` (depuis `etat/j3-fin`)

## Objectif
Livrer les 5 pièces du jalon J4 — un **outil** propre, un **serveur MCP** seul point d'accès
à la base tickets, un **pipeline planner→builder→reviewer** à checkpoints humains tracés, une
**feature** (recherche/filtrage de tickets) livrée *par* ce pipeline, et une **note d'arbitrage** —
sans casser les invariants du module.

## Invariants (à ne pas casser — rappel énoncé)
- **I1** — Tout accès à la base tickets par l'agent passe par le serveur MCP. Aucun SQL libre
  exécuté par l'agent. (Ma vérification manuelle en lecture seule `sqlite3` reste permise.)
- **I2** — Chaque jonction entre agents franchit un **point de contrôle humain tracé**
  (une ligne de décision datée suffit).
- **I3** — `npx vitest run` **vert** avant de passer au reviewer. Le verdict d'un agent ne
  remplace jamais les tests.

## Ajustements au fil des labs (mis à jour à réception de chaque lab)
- **Lab 1 (reçu 2026-07-08) — « Concevoir l'outil `classifier_ticket` »** → réoriente la Pièce 2 :
  l'**outil propre** de J4 n'est PAS `search_tickets` mais **`classifier_ticket`** (classification,
  réutilise `ClassificationSchema` du module 2). **FAIT** (voir « Pièce 1 — Lab 1 »). Le Lab 2
  fera de ce même contrat un **vrai outil MCP** que l'agent choisit d'appeler → confirme la Pièce 1
  (serveur MCP) comme prochaine brique. La feature « recherche » (Pièces 3/4) reste **provisoire** :
  les labs suivants définiront probablement la vraie feature livrée par le pipeline — à réajuster ici.
- **Lab 3 (reçu 2026-07-08) — « Spécifier planner / builder / reviewer »** → recadre la Pièce 4 :
  ce lab ne LANCE PAS le pipeline, il **spécifie les 3 agents** (6 définitions versionnées, gabarit
  réutilisable). L'exécution du pipeline + la feature `search` sont repoussées à un lab ultérieur.
  Livrables : `.claude/agents/{planner,builder,reviewer}.md` (frontmatter name/description/**tools**
  + rôle + critère de sortie) et `.pi/agents/{…}.md` (frontmatter minimal, pour le Lab 5 pi.dev).
  **Décision humaine (Gabi, 2026-07-08)** — goulot humain = **2 gates** : accepter le plan (après
  planner), accepter le verdict (après reviewer) ; builder→reviewer reste une gate **auto** (I3,
  vitest vert). Non-chevauchement **garanti par les outils** : planner lecture seule, builder seul
  à porter `Write`/`Edit`, reviewer sans `Write`/`Edit`. **FAIT** (branche `j4-orchestration`).

## Lab 2 — livré (2026-07-08)
- [x] `mcp/tickets-server.mjs` — serveur MCP « tickets », **3 outils gouvernés** (`list_tickets`,
  `get_ticket`, `update_ticket_status`), requêtes **paramétrées**, **aucun** outil SQL générique.
  Logique injectable (`db`) ; démarre sous `node` (boot + `initialize`/`tools/list` vérifiés).
- [x] `.mcp.json` — déclaration versionnée (chemin relatif portable) → rebranchement au clone.
- [x] `test/mcp-tickets.test.mjs` — Client MCP + transport in-memory : 3 outils, id=999 géré,
  écriture réelle en base, entrée hostile (injection) rejetée. `vitest` **26/26 vert**.
- [x] CLAUDE.md — section « Serveur MCP tickets » + rebranchement une ligne (exigence lab).
- Écarts au squelette du lab (assumés, meilleure ingénierie) :
  1. **Emplacement** `mcp/tickets-server.mjs` (lab) et non `src/mcp/server.ts` (plan initial).
  2. **Runtime `node`** → serveur en `.mjs` sans import `.ts`, connexion better-sqlite3 propre.
  3. **`.mcp.json` versionné** préféré au `claude mcp add` à chemin **absolu** (non committable,
     spécifique machine) ; la commande reste documentée dans CLAUDE.md comme voie alternative.
- **Reste à la main de Gabi** (checkpoint humain, non automatisable par l'agent) : approuver le
  serveur au 1er lancement, `claude mcp list` → `connected`, exercer les 3 prompts, `sqlite3` de
  contrôle. Le test vitest en est le miroir reproductible.

## Lab 1 — livré (2026-07-08)
- [x] `tools/classifier-ticket.mjs` — `classifierTicket({subject,body})`, corps vide → `{erreur}`
  (pas d'exception), sinon sortie validée par `ClassificationSchema.safeParse` (schéma réutilisé tel quel).
- [x] `tools/run-classifier.mjs` — wrapper CLI (matérialise slash-command → fonction).
- [x] `.claude/commands/classer-ticket.md` — délègue à l'outil ; **`npx tsx`** (pas `node` nu :
  import `.ts`) ; description **quand / quand-pas** (classer, ne pas modifier).
- [x] `tools/classifier-ticket.test.mjs` — 3 cas (bug évident, ambigu, corps vide). `vitest` vert (3/3).
- [x] Note « contrat d'un outil » ajoutée à `CLAUDE.md`. Suite complète : **20/20 vert**.
- Écart au squelette du lab : commande sous `npx tsx` et non `node` — `node` nu ne transpile pas
  le `.ts` importé (`ERR_UNKNOWN_FILE_EXTENSION`) ; le contournement `dist/` dupliquerait le chemin
  du schéma (interdit par le lab). `tsx` = runtime réel d'OpsDesk, source de vérité unique conservée.

## Décision de cadrage à valider
- **Feature livrée par le pipeline = « recherche/filtrage de tickets »** : filtrer par
  `category`, `status`, `priority` et texte libre `q` (sur `subject`/`body`).
  Rationnel : un seul cœur testable `searchTickets()` réutilisé par (a) le serveur MCP et
  (b) l'endpoint HTTP → démontre l'invariant I1 (les deux surfaces passent par la même
  fonction paramétrée, l'agent ne touche la base que via MCP).
  👉 **Si tu préfères une autre feature** (ex. `GET /tickets/stats` compteurs par catégorie),
  on substitue ici avant que je code — le reste du plan (MCP, pipeline, note) est inchangé.

## Architecture cible (où vit quoi)
```
src/tickets.ts        + searchTickets(criteria, db)   ← cœur unique, SQL paramétré, testable
src/mcp/server.ts     serveur MCP stdio (gateway DB)   ← SEUL accès agent → base (I1)
src/mcp/tools.ts      handlers fins + schémas zod des outils (délèguent à src/tickets.ts)
src/server.ts         + route GET /tickets/search      ← feature HTTP (réutilise searchTickets)
scripts/ticket-search.ts  CLI « outil propre » (optionnel, cf. Étape 3)
.mcp.json             déclaration du serveur MCP (scope projet, dispo au clone)
docs/orchestration-j4.md   rôles planner/builder/reviewer + règle des checkpoints
docs/note-arbitrage-j4.md  note d'arbitrage (livrable 5)
journal/j4-orchestration-<date>.md  lignes de décision datées (I2)
```

## Étapes

### Pièce 1 — Serveur MCP (socle, porte I1)
1. [ ] **Dépendance** : ajouter `@modelcontextprotocol/sdk` (+ transport stdio).
   Fichiers : `package.json`, `package-lock.json`. ⚠️ voir Risque R1 (npm install vs npm ci).
2. [ ] **Cœur de recherche** : `src/tickets.ts` → `searchTickets(criteria, db=defaultDb)`.
   SQL **paramétré** (`WHERE` dynamique, `LIKE ?` pour `q`), champs whitelistés, `LIMIT` plafonné.
   Aucune interpolation de chaîne. (fichier touché : `src/tickets.ts`)
3. [ ] **Serveur MCP** : `src/mcp/server.ts` (transport stdio) + `src/mcp/tools.ts`.
   Outils exposés : `list_tickets`, `get_ticket`, `search_tickets` (lecture) et
   `set_ticket_status` (écriture gardée). Handlers **fins** → délèguent à `src/tickets.ts`.
   Schémas d'entrée **zod** (validation stricte, refus des champs inconnus).
4. [ ] **Câblage** : script npm `"mcp": "tsx src/mcp/server.ts"` + `.mcp.json` (déclare le
   serveur pour Claude Code, scope projet). (fichiers : `package.json`, `.mcp.json`)

### Pièce 2 — L'outil propre (exemplaire)
5. [ ] Traiter `search_tickets` comme **l'outil de référence** : description claire, schéma
   d'entrée validé, sortie structurée déterministe, comportement en cas de doute (critères
   vides → liste bornée, jamais d'erreur silencieuse), zéro SQL libre. C'est la vitrine « outil propre ».
   *(Décision : CLI `scripts/ticket-search.ts` en complément humain — à trancher, non bloquant.)*

### Pièce 3 — Feature livrée PAR le pipeline (Pièce 4)
6. [ ] **Endpoint** : `GET /tickets/search?q=&category=&status=&priority=` dans `src/server.ts`,
   réutilise `searchTickets`. Validation des query params, 200 + tableau, jamais de 500 sur
   critères vides. (fichier : `src/server.ts`)
   → Implémentée **via** le pipeline planner→builder→reviewer, pas à la main.

### Pièce 4 — Pipeline planner → builder → reviewer (I2, I3)
7. [ ] **Cadre** : `docs/orchestration-j4.md` — définit les 3 rôles, leurs entrées/sorties, et
   la règle : *aucune jonction sans checkpoint humain tracé*.
8. [ ] **Exécution tracée** sur la feature de la Pièce 3 :
   - **Planner** (sub-agent) → produit une spec d'implémentation de l'endpoint.
     → **CHECKPOINT HUMAIN** (Gabi valide/corrige) → ligne datée dans `journal/j4-orchestration-<date>.md`.
   - **Builder** (sub-agent) → implémente endpoint + tests d'après la spec validée.
     → **CHECKPOINT HUMAIN** → ligne datée.
   - **Gate I3** : `npx vitest run` **vert** (factuel) AVANT le reviewer.
   - **Reviewer** (sub-agent) → revue de la diff + verdict.
     → **CHECKPOINT HUMAIN** (le verdict ne vaut pas merge) → ligne datée.

### Pièce 5 — Note d'arbitrage
9. [ ] `docs/note-arbitrage-j4.md` : les arbitrages faits pendant le pipeline — où l'humain a
   corrigé/refusé un agent et **pourquoi**, compromis retenus (surface unique vs duplication,
   périmètre de l'écriture MCP, etc.), ce qu'on garderait/changerait.

### Traçabilité (transverse, discipline projet)
10. [ ] `TODO.md` régénéré depuis ce plan (après validation) ; `journal/<date>.md` mis à jour
    après **chaque** étape réellement finie (statut de test factuel).
11. [ ] Mémoire projet : consigner le pattern MCP-gateway dans `.claude/memory/` en fin de jalon.

## Tests à écrire
- `test/tickets-search.test.ts` — `searchTickets` : filtres combinés, `q` insensible à la casse,
  critères vides, **non-injection** (une valeur `q` contenant `%`/`'`/`;` ne casse pas le SQL et
  ne renvoie pas toute la table). Base `:memory:` injectée.
- `test/mcp-tools.test.ts` — handlers d'outils MCP (fonctions exportées de `src/mcp/tools.ts`)
  testés hors transport : validation zod (entrée invalide rejetée), délégation correcte,
  `set_ticket_status` gardé (statut manquant → refus).
- `test/search-endpoint.test.ts` — `GET /tickets/search` via `app.inject` : 200 + tableau,
  filtres appliqués, params invalides gérés, déterminisme.
- Baseline : `npx vitest run` reste vert (aucune régression sur les 3 suites existantes).

## Risques identifiés
- **R1 — Dépendance & npm** : ajouter `@modelcontextprotocol/sdk` impose un `npm install` qui
  met à jour `package-lock.json`, alors que CLAUDE.md prescrit `npm ci` (bug rollup-win32 des
  deps optionnelles). *Mitigation* : install propre, **ne pas** supprimer le lock, revalider
  `npm ci` + `npm test` juste après ; documenter dans le journal.
- **R2 — Type-check hors CI** : la CI ne lance que `npm ci` + `npm test`, pas `npm run build`.
  Le nouveau code MCP n'est type-check que si je lance `tsc` à la main → l'ajouter au rituel de vérif.
- **R3 — I1 (SQL libre)** : risque d'injection dans `searchTickets` (surtout `q`). *Mitigation* :
  requêtes 100 % paramétrées, champs whitelistés, test de non-injection dédié.
- **R4 — Compat ESM/Node** : SDK MCP en ESM + imports internes en `.js` (moduleResolution Bundler),
  Node 20–23. *Mitigation* : `tsc` + smoke run du serveur MCP avant de brancher l'agent.
- **R5 — I2 (checkpoints)** : tentation d'enchaîner les sub-agents sans checkpoint. *Mitigation* :
  le pipeline s'arrête à chaque jonction et attend ta validation explicite (aligné règles de
  non-délégation) ; chaque passage laisse une ligne datée.
- **R6 — Écriture via MCP** : `set_ticket_status` est un effet de bord réversible mais réel.
  *Mitigation* : outil d'écriture minimal, validé, sans suppression ; aucune action destructive exposée.
- **R7 — Windows** : smoke HTTP en `127.0.0.1` (pas `localhost` → IPv6/::1).

## Relecture
- [x] Relu le 2026-07-08 par Gabi — validé (« bon plan »), **sous réserve d'ajustements** au fil
  des labs J4 que Gabi transmettra. Feature « recherche » retenue par défaut.

## Setup réalisé (avant labs, lab-agnostique)
- 2026-07-08 : `@modelcontextprotocol/sdk@^1.29.0` installé (Étape 1). Import ESM/tsx vérifié
  (`McpServer` + `StdioServerTransport` OK). Baseline `npx vitest run` = **17/17 vert** avant et après.
  `npm audit` signale des vulnérabilités transitives → **pas** de `npm audit fix --force` (destructif). 
