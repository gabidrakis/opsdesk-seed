# Plan · GET /tickets/stats (compteurs par statut)
Daté : 2026-07-08 · Branche : `j4-orchestration` · Produit par : sous-agent **planner**

## Objectif
Exposer `GET /tickets/stats` qui renvoie `{ open, in_progress, closed }` (nombre de tickets par statut), calculé en réutilisant `listTickets()` sans nouveau SQL, réponse 200.

## Contexte vérifié (fichier:ligne)
- `src/tickets.ts:7-11` — `listTickets(database: DB = defaultDb): Ticket[]` : point d'accès réutilisé (requête paramétrée existante, invariant I1 respecté car aucun SQL libre ajouté).
- `src/db.ts` — type `Ticket` ; `status: string` (colonne `TEXT` libre, aucune contrainte d'enum en base — voir Risques).
- `src/server.ts:13-68` — `buildApp(database: DB = defaultDb, logger = true)` ; routes déclarées à la suite, `database` injecté à chaque appel de couche d'accès. Import de `tickets.js` déjà présent ligne 7.
- `test/reply-endpoint.test.ts:7-33` — patron `makeDb()` (`:memory:`, `CREATE TABLE`, `INSERT` paramétré) + `buildApp(makeDb(), false)` + `app.inject`.

## Étapes
1. [ ] **Fonction de calcul dédiée et testable** — `src/tickets.ts`.
   Fonction pure prenant la liste et retournant les compteurs, pour ne PAS mettre de logique dans la route et pouvoir la tester sans HTTP.
   ```ts
   export type TicketStats = { open: number; in_progress: number; closed: number };
   export function computeTicketStats(tickets: Ticket[]): TicketStats
   ```
   Implémentation : initialiser `{ open: 0, in_progress: 0, closed: 0 }`, itérer sur `tickets`, incrémenter la clé correspondant à `t.status` uniquement si elle fait partie des 3 clés attendues (cf. Décision B). Commentaire FR. Aucun accès base → réutilisable et déterministe.

2. [ ] **Déclaration de la route** — `src/server.ts`, après le bloc `/tickets/:id/reply-suggestion`, avant `return app;`.
   - Étendre l'import ligne 7 : ajouter `computeTicketStats` (+ type si besoin) depuis `./tickets.js`.
   - Ordre Fastify : `/tickets/stats` (segment statique) l'emporte normalement sur `/tickets/:id` (paramétré). À **verrouiller par un test** ; si collision, déplacer la déclaration avant la route `:id`.
   - Handler :
     ```ts
     // Compteurs de tickets par statut (open / in_progress / closed).
     app.get("/tickets/stats", async () => {
       return computeTicketStats(listTickets(database));
     });
     ```
   - Réponse (200) : `{ open: number, in_progress: number, closed: number }`, sans autre clé (cf. Décision B).

3. [ ] **Tests à écrire** — nouveau fichier `test/stats-endpoint.test.ts` (patron de `reply-endpoint.test.ts`).
   - `makeDb()` local insérant un jeu déterministe couvrant les 3 statuts (ex. 2 `open`, 1 `in_progress`, 3 `closed`, ids/created_at fixes).
   - Cas 1 : `GET /tickets/stats` → `statusCode === 200`.
   - Cas 2 : corps `=== { open: 2, in_progress: 1, closed: 3 }`.
   - Cas 3 : base vide → `{ open: 0, in_progress: 0, closed: 0 }`.
   - Cas 4 (selon Décision B) : ticket au statut hors des 3 (ex. `"archived"`) → comportement retenu (ignoré / clé sup.).
   - Cas 5 (unitaire, sans HTTP) : `computeTicketStats([...])` en dur → compteurs attendus (déterminisme + isolation).

## Décisions à trancher par l'humain
- **Décision A — Où calculer ?**
  *Recommandé* : fonction dédiée `computeTicketStats` dans `src/tickets.ts` (testable unitairement, route mince). *Alternative* : calcul inline dans le handler (moins de surface, mais logique non testable hors HTTP).
- **Décision B — Contenu exact de la réponse.**
  *Recommandé* : STRICTEMENT `{ open, in_progress, closed }`, statuts hors liste ignorés. *Alternatives* : (b1) ajouter `total = tickets.length` ; (b2) exposer aussi les statuts inconnus. Impact : contrat JSON + assertions des tests.

## Risques identifiés
- **Statuts hors des 3 attendus** : `status` est un `TEXT` libre, `updateTicketStatus` n'impose aucune valeur → des statuts imprévus (`archived`, casse différente, `null`) peuvent exister et seraient silencieusement hors compteurs. Comportement à figer par le test (Cas 4). Sensibilité à la casse : `"Open"` ≠ `"open"`, pas de normalisation prévue sauf décision contraire.
- **Réutilisation vs duplication (I1)** : on réutilise `listTickets()` sans SQL nouveau → invariant respecté. Ne PAS introduire de `SELECT ... GROUP BY status` (SQL libre). Contrepartie : comptage en mémoire (coût acceptable au volume du lab).
- **Déterminisme** : comptage indépendant de l'ordre `created_at DESC` → déterministe (testé au Cas 5).
- **Ordre des routes Fastify** : collision possible `/tickets/stats` vs `/tickets/:id` → verrouillée par un test (une requête `/tickets/stats` ne doit pas renvoyer 404 « ticket not found »).
- **Absence de contrat de schéma** : pas de validation Fastify de la réponse ; forme garantie uniquement par les tests.

## Relecture
- **2026-07-08 · Checkpoint humain n°1 — Gabi : plan ACCEPTÉ.** Décision A = fonction dédiée `computeTicketStats` dans `src/tickets.ts` (testable unitairement). Décision B = réponse STRICTE `{ open, in_progress, closed }`, statuts hors liste ignorés. Le builder implémente selon ces choix, sans replanifier.
