# TODO · reply-endpoint (GET /tickets/:id/reply-suggestion)

Source : `plans/reply-endpoint.md` (validé le 2026-07-07).

- [x] Étape 1 : `src/reply.ts` — `buildReplySuggestion(ticket)` pure, sans I/O
- [x] Étape 2 : route `GET /tickets/:id/reply-suggestion` dans `src/server.ts` (fabrique `buildApp` injectable + garde `listen`)
- [x] Étape 3 : `test/reply-endpoint.test.ts` via `app.inject` — 200+contenu, avertissement, déterminisme, 404
- [x] Étape 4 : vérif `npm run build` + `npm test` + fumée `GET /tickets/1001/reply-suggestion` en 127.0.0.1
