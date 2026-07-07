# Plan · Endpoint GET /tickets/:id/reply-suggestion
Daté : 2026-07-07

> ✅ **Statut : VALIDÉ le 2026-07-07.** Exécution en cours (voir `TODO.md` + `journal/2026-07-07.md`).

## Objectif
Exposer `GET /tickets/:id/reply-suggestion` qui, pour un ticket existant, renvoie une
**proposition** de réponse client en français (ton OpsDesk), sans jamais l'envoyer.

## Décisions (arrêtées)
- **Route** : `GET /tickets/:id/reply-suggestion` (lecture seule, idempotente, pas d'effet de bord).
  Réponse `200 { id, suggestion }` ; **404** `{ error: "ticket not found" }` si le ticket est absent.
  → GET plutôt que POST : on *suggère*, on n'écrit rien ; pas d'écriture de `replies/<id>.md` côté serveur.
- **Génération** : templating **déterministe** depuis `subject`, `body`, `category`, `priority`
  — pas d'appel LLM (reproductible + testable, cf. principe de fiabilité du CLAUDE.md global).
- **Ton** : suit `.claude/memory/reponses-tickets.md` (vouvoiement, accusé de réception →
  réponse → prochaine étape → clôture, pas de délai chiffré, avertissement de relecture en fin).

## Étapes
1. [ ] Créer `src/reply.ts` : fonction pure `buildReplySuggestion(ticket: Ticket): string`
       (injectable, sans I/O, testable en isolation). Fichiers touchés : `src/reply.ts`.
2. [ ] Ajouter la route `GET /tickets/:id/reply-suggestion` typée
       `app.get<{ Params: { id: string } }>(...)`, qui réutilise `getTicket` et renvoie **404**
       `{ error: "ticket not found" }` si absent, sinon `{ id, suggestion }`.
       Fichiers touchés : `src/server.ts` (importe `src/tickets.ts` et `src/reply.ts`).
3. [ ] Tests à écrire (`test/reply-endpoint.test.ts`, base `:memory:` injectée via `app.inject`) :
       - ticket existant → `200`, `suggestion` non vide, contient le sujet + la formule de clôture ;
       - `suggestion` se termine toujours par l'avertissement « Relecture humaine » ;
       - déterminisme : deux appels → `suggestion` identique ;
       - id inconnu → `404` `{ error: "ticket not found" }`.
4. [ ] Vérif : `npm run build` (exit 0) + `npm test` (vert) + fumée `GET /tickets/1001/reply-suggestion`
       en `127.0.0.1` (Windows).

## Fichiers touchés
- `src/reply.ts` (nouveau) · `src/server.ts` (une route) · `test/reply-endpoint.test.ts` (nouveau).
- **Aucune** modif de schéma DB, `config.ts`, `seed.ts`, ni des routes existantes.

## Tests à écrire
Voir étape 3 : 4 assertions (200 + contenu, avertissement, déterminisme, 404).

## Risques identifiés
- **Qualité non vérifiable objectivement** : le texte rédigé ne se teste pas au mot près
  → garde-fou = avertissement de relecture humaine + tests sur invariants structurels seulement.
- **Dérive vs pattern** : le template de `src/reply.ts` peut diverger de
  `.claude/memory/reponses-tickets.md` → référencer le pattern en commentaire, garder alignés.
- **Injection Fastify** : tester via `app.inject` (pas de port réseau) pour rester déterministe et rapide.
- **CI ne lance pas `tsc`** : type-check à faire à la main (`npm run build`).
- **Import ESM** : extension `.js` sur les imports internes (`./reply.js`, `./tickets.js`).

## Relecture / validation
- **Relu et validé le 2026-07-07 par l'humain (gd), aucune correction nécessaire** car les
  4 points soumis à sa relecture ont été approuvés tels quels : (1) verbe **GET** sans
  persistance serveur — on suggère, on n'écrit rien ; (2) **templating déterministe** plutôt
  que LLM, pour la testabilité ; (3) format de réponse `{ id, suggestion }` suffisant ;
  (4) les 4 assertions de test couvrent 200+contenu, avertissement, déterminisme, 404.
  Périmètre lecture seule, sans effet de bord et vérifiable → accord justifié.
- Réserve d'implémentation notée à l'exécution : rendre l'app testable impose d'exporter une
  fabrique `buildApp(database)` et de conditionner `listen()` au point d'entrée. Les routes
  existantes conservent leur comportement (aucune régression) ; à couvrir par `npm test`.
- [x] Plan validé → exécution autorisée.
