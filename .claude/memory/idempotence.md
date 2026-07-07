# Pattern · Idempotence sur OpsDesk

- Lire uniquement `WHERE <colonne> IS NULL AND needs_review = 0` : ne retraiter ni le fait, ni l'ambigu en attente.
- Écrire avec `AND <colonne> IS NULL` dans le WHERE de l'UPDATE.
- Cas ambigus → `needs_review = 1`, pas de décision automatique.
- Journaliser chaque ticket traité.
- Toujours écrire un test deux-passes avant de considérer la tâche fiable.

## Implémentation de référence (OpsDesk)
- Script : `scripts/classify-batch.ts` — pas de transaction englobant la boucle, donc
  chaque écriture est committée à la volée → une interruption laisse le déjà-fait persistant
  et rejouable.
- Injection de faute : `OPSDESK_FAIL_AT=<n>` fait échouer après *n* tickets (vérif de reprise).
- Test : `test/classify-idempotent.test.ts` — deux passes + reprise après crash, avec un
  `classify` **stub déterministe** (le test prouve la logique SQL, pas la stabilité du LLM).
