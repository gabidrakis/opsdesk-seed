# Pattern · Idempotence sur OpsDesk

- Lire uniquement `WHERE <colonne> IS NULL AND needs_review = 0` : ne retraiter ni le fait, ni l'ambigu en attente.
- Écrire avec `AND <colonne> IS NULL` dans le WHERE de l'UPDATE.
- Cas ambigus (confiance < 0.7) → `needs_review = 1`, pas de décision automatique (`category` reste NULL).
- Journaliser chaque ticket traité (dans `journal/`).
- Toujours écrire un test deux-passes avant de considérer la tâche fiable.

## Points de mise en œuvre (retenus au Lab 3)
- **Migration idempotente** : `ALTER TABLE tickets ADD COLUMN needs_review …` dans un `try/catch`
  qui ignore l'erreur « duplicate column » → rejouable sans erreur.
- **Pas de transaction englobante** : chaque écriture est committée à la volée, donc une
  interruption laisse le déjà-fait persistant et rejouable (reprise sans reclasser ni dupliquer).
- **Sortie structurée (module 2)** : `classify` renvoie un objet validé par `ClassificationSchema`
  avant toute écriture (rejette une sortie non conforme).
- **Testabilité** : exposer `classifyBatch` / `ensureNeedsReviewColumn` (fonctions exportées) et
  injecter un `classify` mocké déterministe → le test prouve la logique SQL, pas la stabilité du LLM.

## Implémentation de référence (OpsDesk)
- Script : `scripts/classify-batch.ts` (lecture `IS NULL AND needs_review=0`, écriture `AND category IS NULL`,
  seuil 0.7, journal `journal/classify-batch-<date>.md`).
- Injection de faute : `OPSDESK_FAIL_AT=<n>` → échec après *n* tickets (vérification de reprise).
- Test : `test/classify-idempotent.test.ts` (deux passes + reprise après crash, `classify` mocké).

## Vérification manuelle (base réelle)
Dé-classer un lot pour avoir de la matière, puis prouver la reprise :
```
UPDATE tickets SET category = NULL WHERE id % 3 = 0;   -- de la matière
OPSDESK_FAIL_AT=3 npx tsx scripts/classify-batch.ts    -- crash après 3
npx tsx scripts/classify-batch.ts                      -- reprise
SELECT count(*) FROM tickets WHERE category IS NULL AND needs_review = 0;  -- attendu : 0
```
`= 0` : tout ticket est soit classé, soit en `needs_review` ; aucun en suspens.
