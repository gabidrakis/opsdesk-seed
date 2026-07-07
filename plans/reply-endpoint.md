# Plan · Endpoint de réponse à un ticket (reply-endpoint)
Daté : 2026-07-07

> ⏳ **Statut : EN ATTENTE DE VALIDATION.** Aucun code applicatif ne sera écrit avant ton accord.

## Objectif
Exposer une route HTTP qui, pour un ticket donné, renvoie une proposition de réponse
client standard en français (ton OpsDesk), sans jamais l'envoyer automatiquement.

## Hypothèses à valider (feature sous-spécifiée)
- **Route** : `GET /tickets/:id/reply` → `{ id, reply }` ; **404** `{ error: "ticket not found" }` si absent.
  (Alternative possible : `POST /tickets/:id/reply` qui écrit aussi `replies/<id>.md`. À trancher.)
- **Génération** : templating **déterministe** à partir des champs du ticket
  (`subject`, `body`, `category`, `priority`) — pas d'appel LLM.
  Raison : reproductible + testable (cf. principe de fiabilité du CLAUDE.md global).
- **Convention de ton** : suit `.claude/memory/reponses-tickets.md`
  (vouvoiement, accusé de réception → réponse → prochaine étape → clôture,
  pas de délai chiffré, avertissement de relecture humaine en fin de texte).

## Étapes
1. [ ] Créer `src/reply.ts` : fonction pure `buildReply(ticket): string` (injectable, testable).
       (fichiers touchés : `src/reply.ts`)
2. [ ] Ajouter la route `GET /tickets/:id/reply` typée par générique `{ Params: { id: string } }`,
       réutilise `getTicket`, 404 si absent. (fichiers touchés : `src/server.ts`, importe `src/tickets.ts`)
3. [ ] Tests à écrire (`test/reply.test.ts`, base mémoire injectée) :
       - ticket existant → réponse non vide contenant sujet + formule de clôture ;
       - réponse se termine toujours par l'avertissement « Relecture humaine » ;
       - `buildReply` déterministe (même ticket → même sortie) ;
       - route sur id inconnu → 404 `{ error: "ticket not found" }`.
4. [ ] Vérif : `npm run build` (exit 0), `npm test` (vert), `GET /health` OK,
       `GET /tickets/1001/reply` en `127.0.0.1` (Windows).

## Fichiers touchés
- `src/reply.ts` (nouveau) · `src/server.ts` (route) · `test/reply.test.ts` (nouveau).
- Aucune modif de schéma DB, de `config.ts`, ni de `seed.ts`.

## Risques identifiés
- **Qualité non vérifiable objectivement** : le contenu rédigé ne se teste pas au mot près
  → garde-fou = avertissement de relecture humaine + tests uniquement sur invariants structurels.
- **Dérive vs pattern** : le template dans `src/reply.ts` peut diverger de
  `.claude/memory/reponses-tickets.md` → garder les deux alignés, référencer le pattern en commentaire.
- **CI ne lance pas `tsc`** : type-check à faire à la main (`npm run build`).
- **Import ESM** : penser à l'extension `.js` sur les imports internes.
- **Choix de route (GET lecture vs POST + écriture fichier)** non tranché → à valider avant l'étape 1.
