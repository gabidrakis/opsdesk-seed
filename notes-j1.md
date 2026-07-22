# Notes J1 — Fondations (fil rouge OpsDesk)

> Journal d'observations du Jour 1. Chaque lab y consigne ses sorties (preuves de
> commandes). Sert d'appui au diagnostic `AGENTIC-READINESS.md` et au jalon J1.
>
> Auteur : Gabi (gabidrakis) · Dépôt : fork `gabidrakis/opsdesk-seed` (clone local `opsdesk/`)

---

## Lab 1 — Préparer le poste et récupérer OpsDesk (2026-07-02)

**Objectif** : un environnement qui compile et tourne, prêt pour l'agentique.
**Réussi** : ✅ `npm run build` OK · `/health` → `{"status":"ok"}` · `npm test` s'exécute.

### Outils
| Outil | Version | Attendu |
|-------|---------|---------|
| node  | v20.20.2 | LTS 20–22 (pas 24) ✅ |
| npm   | 10.8.2   | — |
| git   | 2.53.0.windows.1 | — |

### Installation & build
- `npm ci` → 137 paquets installés, `better-sqlite3` (natif) compilé sans erreur.
  Aucune erreur `@rollup/rollup-win32-x64-msvc` → procédure de secours non nécessaire.
- `npm run build` (`tsc`) → **exit 0**, compile sans erreur.

### Référence des tests (point de comparaison pour la suite)
```
npm test → Vitest · test/tickets.test.ts
=> 4 passent / 0 échouent
```
Couverture **partielle** : seule la logique tickets est testée, pas les routes HTTP.
C'est la référence de départ ; tout changement de ce chiffre devra être expliqué.

### Vérification runtime
- Serveur démarré (`node dist/server.js`) → écoute sur `http://0.0.0.0:3000`.
- `GET /health` → `{"status":"ok"}` (HTTP 200).
- `GET /tickets` → `[]` (0 ticket : base non seedée — normal ; seed réservé aux labs J3/J4).
  - ⚠️ Sous Windows, interroger en `127.0.0.1` (pas `localhost` → résout en IPv6 `::1`,
    alors que Fastify écoute en IPv4 `0.0.0.0`).

### Reproductibilité (règles du module respectées)
- Installer avec `npm ci` (jamais `npm install`).
- Ne pas supprimer `package-lock.json` (fige les binaires natifs par OS).
- Rester sur Node 20–22 (le driver SQLite du seed n'a pas de binaire prêt pour Node 24).

### État git
```
On branch main · up to date with origin/main
  modified:  AGENTIC-READINESS.md   (diagnostic J1.3)
  Untracked: CLAUDE.md              (mémoire projet J1.5)
```
Reste gitignoré (non pollué) : `node_modules/`, `dist/`, `data/`, `*.db`.

---

## Conventions implicites

Documenté explicitement dans `CLAUDE.md` :
- Imports ESM avec extension `.js` même pour des sources `.ts` (ex. `./config.js`).
- Routes Fastify typées via génériques (`app.get<{ Params: {...} }>`).
- Erreurs : `reply.code(404|400).send({ error: "..." })`.
- Config centralisée dans `src/config.ts`.

Observé dans le code (`src/`), cohérent mais non écrit noir sur blanc :
- Fichiers : minuscules, un seul mot (`config.ts`, `db.ts`, `server.ts`, `tickets.ts`, `seed.ts`).
- Fonctions : camelCase à préfixe verbal (`listTickets`, `getTicket`, `updateTicketStatus` — `src/tickets.ts`).
- Types : PascalCase (`Ticket`, `DB`).
- Constantes / env : UPPER_SNAKE_CASE (`PORT`, `DB_PATH`, `OPSDESK_API_KEY` — `src/config.ts`).
- Schéma/colonnes SQL : anglais, snake_case (`created_at`, `status`) — un commentaire de `src/db.ts` confirme « schéma canonique … (anglais) ».
- Commentaires : rédigés en français.

## Angles morts

_Recoupé par lecture directe du dépôt (pas seulement déduit) — références fichier:ligne._

- **Secret en clair** : `src/config.ts:3` contient `OPSDESK_API_KEY = "opsdesk_live_DEMOkeyNOTREAL0000"` en dur (motif `opsdesk_live_…`), ce qui contredit le critère « Aucun secret en clair commité » du `CLAUDE.md`. Un commentaire (`src/config.ts:2`) le qualifie de « à des fins de démonstration ». **Documenté ici, NON corrigé — invariant du module J1** ; à signaler si non voulu.
- **Tests partiels — couche données seulement** : `test/tickets.test.ts` = 4 tests, tous sur `src/tickets.ts` via une base en mémoire (`makeDb()`, injection `database`). Les 4 routes de `src/server.ts` (`/health`, `GET /tickets`, `GET /tickets/:id`, `POST /tickets/:id/status`) n'ont **aucun test**. « `npm test` vert » ne prouve donc pas que le contrat HTTP (404 ticket absent, 400 `status` manquant) tient.
- **Branches non testées** (même dans les fonctions couvertes) : la branche « absent » de `getTicket` (retour `undefined`, `src/tickets.ts:14`) n'est jamais exercée — seul le cas trouvé l'est ; idem `listTickets` sur base vide. Seul `updateTicketStatus` teste ses deux issues (`true`/`false`).
- **La CI ne type-check pas** : `.github/workflows/ci.yml` ne lance que `npm ci` + `npm test` (Node 20), **jamais `npm run build`**. Vitest transpile via esbuild sans vérifier les types → une erreur de typage dans `src/` peut passer la CI au vert. Le critère « build sans erreur » n'est gardé que si `tsc` est lancé **à la main**.
- **Le build ignore `test/`** : `tsconfig.json:15` a `"exclude": [..., "test"]` (et `"include": ["src"]`) → `npm run build` ne type-checke pas les tests ; une erreur de type dans `test/` n'apparaît qu'au runtime Vitest.
- **Nommage non écrit** : aucun `.eslintrc`/`.prettierrc`/`.editorconfig` dans le dépôt. Les conventions de la section « Conventions implicites » (fichiers un-mot minuscule, fonctions camelCase à préfixe verbal, types PascalCase, env UPPER_SNAKE_CASE) sont de facto, déduites de 5 fichiers `src/` — rien ne les vérifie, elles peuvent diverger sans détection.
- **Pas de commande de vérif unique** : valider une modif = `npm ci` (si besoin) → `npm run build` (`tsc`, exit 0) → `npm test` (`vitest run`, vert), + `GET /health` → `{"status":"ok"}` pour le runtime. La CI ne rejoue qu'une partie de cette chaîne.

## Note pi.dev

Contraste de **sobriété** Pi (pi.dev) vs Claude Code, sur le même prompt (« commande de
vérif + conventions de nommage »). Chiffres, pas impressions :

1. **Outils exposés : 4** — `Read` / `Write` / `Edit` / `Bash` (cœur minimal + boucle).
   Claude Code en expose plusieurs dizaines (Read, Write, Edit, Glob, Grep, Bash, WebFetch,
   WebSearch, Task/Agent, NotebookEdit…) + skills. Rapport ≈ 4 vs ~20+.
2. **Mémoire projet au démarrage : NON auto-chargée.** Pi ne lit pas `CLAUDE.md` au boot ;
   s'il le cite, c'est via un `Read` explicite pendant la tâche. Claude Code, lui, injecte
   `CLAUDE.md` (+ `MEMORY.md`) dans le contexte système **au démarrage** (vérifiable : le
   contenu de `opsdesk/CLAUDE.md` arrive sans lecture demandée).
3. **Trace courte, 0 sous-agent.** Le collage ne montre que la **réponse finale** de Pi
   (≈ 30 lignes) ; répondre n'a demandé qu'une lecture directe de `CLAUDE.md` (~1–2 appels
   `Read`, base 4 outils). **Aucun sous-agent** : le cœur 4-outils n'a pas de primitive de
   délégation (pas de `Task`/`Agent`), là où Claude Code peut faire du fan-out.

> Non vérifiable depuis le collage : le nombre exact d'appels d'outils de Pi (seule la
> réponse finale est fournie, pas la trace outillée). Les points 1 et 3 (absence de
> sous-agent) sont des faits de structure du cœur pi.dev ; le point 2 est vérifiable ici.

**Débat « anti-framework » (position, pas fait de repo) :** faut-il un agent = **cœur
minimal** (peu d'outils + boucle) au-dessus duquel on compose l'orchestration au besoin
(thèse pi.dev), ou un **framework** qui intègre d'emblée sous-agents / mémoire auto-chargée
/ skills (Claude Code) ? L'enjeu = *où placer la complexité* : dans l'outil, ou à la main
du dev. Reformulation retenue : **cœur minimal = principe** (primitive stable, universelle) ;
**l'orchestration est une couche au-dessus** — optionnelle, composée, pas une primitive.
Débat non tranché ici — consigné comme position, pas comme fait vérifiable du dépôt.

## Non-délégation

**Situations propres à l'apprenant** (dictées par Gabi, transcrites telles quelles —
corrections de forme seulement, aucune invention). Décision refusée à un agent seul + pourquoi :

- **Commit / push automatique.** Je refuse que l'IA commite ou pousse ce que je fais sans
  que je le lui demande — sinon elle peut pousser des erreurs fatales et casser tout le projet.
  *(irréversible)*
- **Réorganisation des fichiers.** Je refuse que l'IA réorganise tous mes fichiers sans mon
  autorisation et ma supervision — ça peut désordonner toute mon organisation d'origine.
  *(difficilement réversible)*
- **Données confidentielles / secrets.** Je refuse que l'IA lise, manipule ou mémorise des
  données très confidentielles (des secrets) que je ne lui ai pas autorisé à sauvegarder —
  une fois dans la session, ça reste et ça ne m'appartient plus. *(secrets)*

## Question rituelle

> « Qu'ai-je délégué / enseigné à mes agents aujourd'hui, et comment l'ai-je vérifié ? »

j'ai fais rédiger un brouillon CLAUDE.md par l'agent, puis je l'ai corrigé. 
Et je l'ai fais re test le A/B du prompt du lab 2 et le score agent-ready.



## Lab 6 — Re-test de la mémoire projet (A/B) (2026-07-03)

**But** : prouver que corriger `CLAUDE.md` rend la réponse de l'agent *mesurablement* plus juste.

**Protocole** — même prompt du Lab 2, mot pour mot :
> « En te basant uniquement sur ce dépôt : quelle commande dois-je lancer pour vérifier
> qu'une modification est correcte ? Et quelles conventions de nommage ce projet suit-il ?
> Si tu n'es pas sûr, dis-le explicitement. »

- **Avant** = réponse de référence captée au Lab 2 (ancien `CLAUDE.md`, sans section nommage).
- **Après** = agent **frais** relancé (sous-agent, sans le contexte de la session), répondant
  sur le dépôt qui contient désormais le `CLAUDE.md` corrigé (commits `etat/j1-fin`).

### Devinettes / erreurs disparues (le décompte = la preuve)

| # | Aspect | Avant | Après |
|---|--------|-------|-------|
| 1 | Conventions de nommage | **Esquive** : « le `CLAUDE.md` ne documente pas explicitement de conventions de nommage … je ne veux pas inventer », puis propose d'inspecter `src/`. | **Répond directement** : fichiers un-mot minuscule · fonctions camelCase à préfixe verbal · types PascalCase · env UPPER_SNAKE_CASE · SQL snake_case anglais — le tout **sourcé** (`CLAUDE.md`). |
| 2 | Variable d'env de la base | Inexact : « config via env `PORT`, `DB_PATH` » (donne `DB_PATH` comme variable d'env). | Corrigé : la variable d'env est **`OPSDESK_DB`** (`DB_PATH` n'est que le nom de la constante). |
| 3 | Statut de la CI | La CI (`npm ci` + `npm test`) présentée comme « le critère de réussite officiel », sans réserve. | **Signale l'angle mort** : la CI **ne lance pas `npm run build`** → CI verte ≠ types vérifiés ; lancer `tsc` à la main. |

**Décompte : 3 items corrigés** — 1 esquive (« je ne suis pas sûr ») levée en réponse sourcée
+ 2 inexactitudes redressées. Les trois sont **attribuables au travail mémoire du Lab 6** :
la section nommage, la correction `OPSDESK_DB` et l'avertissement CI-sans-build ont été
*ajoutés* à `CLAUDE.md` (absents de la version d'avant).

**Honnêteté du test** : l'« après » est produit par un sous-agent isolé (non biaisé par la
conversation), qui lit `CLAUDE.md` depuis le dépôt comme n'importe quel fichier — un
sous-agent n'auto-charge pas la mémoire projet, ce qui reflète un usage réaliste. L'« avant »
est la réponse de référence, non rejouée (le dépôt d'alors n'existe plus tel quel).

---

## Lab 2 — [à venir]
