# Démo · OpsDesk agentique (5 min, rejouable sans aide orale)

But : dérouler seul, commandes à copier-coller, sorties attendues indiquées. Windows : API en
**`127.0.0.1`** (pas `localhost` → IPv6), et **`curl.exe`**. Prérequis : Node 20–23, dépôt cloné.

---

## 0:00 — Départ reproductible (30 s)
```bash
npm ci
npm run seed       # vide puis réinsère 12 tickets à id fixes 1001–1012
```
Attendu : installation OK ; seed affiche la réinsertion (base `data/opsdesk.db` remise à plat).

## 0:30 — Fondation + cible vérifiable (1 min)
```bash
npm run build      # tsc → exit 0 (type-check)
npx vitest run     # suite complète
```
Attendu : **build exit 0**, **46 tests verts** (dont `revue-agent` + `publier-verdict`).
```bash
npm run dev &                          # serveur sur 0.0.0.0:3000
curl.exe -s 127.0.0.1:3000/health      # -> {"status":"ok"}
curl.exe -s 127.0.0.1:3000/tickets/stats
```
Attendu : `/health` = `{"status":"ok"}` ; `/tickets/stats` = compteurs par statut. (Arrêter : `kill %1`.)

## 1:30 — Sortie structurée validée (J2/J4) (1 min)
```bash
npx tsx tools/run-classifier.mjs "Impossible de me connecter, erreur 403"
```
Attendu : **JSON conforme** au schéma (`categorie`, `priorite`, `besoin_humain`, `confiance`,
`justification`) — validé par `safeParse`, jamais recopié. Corps vide → `{ "erreur": … }` (pas de throw).

## 2:30 — Fiabilité : idempotence + reprise après crash (J3) (1 min)
```bash
npx tsx scripts/classify-batch.ts                 # 1er passage : classe les tickets
npx tsx scripts/classify-batch.ts                 # 2e passage : 0 reclassé (idempotent)
OPSDESK_FAIL_AT=3 npx tsx scripts/classify-batch.ts   # crash simulé après 3 → exit 1
npx tsx scripts/classify-batch.ts                 # reprise : ne refait que le reste
```
Attendu : 2e passage sans effet (upsert, pas de doublon) ; après le crash `OPSDESK_FAIL_AT`, la
reprise repart où on s'était arrêté. Trace horodatée dans `journal/classify-batch-<date>.md`.

## 3:30 — Cœur M5 : la revue agentique en CI (1 min)
Fonctions **pures** prouvées sans lancer l'agent :
```bash
npx vitest run test/revue-agent.test.mjs test/publier-verdict.test.mjs   # 13 cas verts
```
Puis montrer les 4 verrous sur les fichiers versionnés :
- `.github/workflows/revue-agentique.yml` : `permissions: contents: read` (agent ne merge jamais),
  `timeout-minutes: 10`, court-circuit tout-`.md`, **Job Summary**.
- `scripts/publier-verdict.mjs` : `validerVerdict` (JSON invalide → rien publié) + marqueur
  `<!-- opsdesk-revue-agent -->` (upsert idempotent).

### Démonstration en conditions réelles (H4) — nécessite H1/H2/H3 faits
1. Créer le secret `ANTHROPIC_API_KEY` (H1) et la branch protection `main` (H2).
2. Ouvrir une PR de test qui touche un `.ts` → le workflow tourne, poste **1 commentaire** de verdict.
3. **Pousser un 2e commit** → le commentaire est **mis à jour** (toujours 1 seul, pas de doublon).
4. Vérifier le **Job Summary** (PR, commit, verdict, nb findings, durée, horodatage UTC).
5. *Actions → Re-run jobs* → toujours **1 commentaire** (idempotence prouvée). Aucun re-run automatique.

## 4:30 — Récap garde-fous (30 s)
Agent ne merge jamais (branch protection) · secrets hors du code (Actions secret + hook actif) ·
sortie structurée validée (job échoue si non-JSON) · idempotence (upsert) · boucle bornée
(timeout, pas de re-run auto, pas de spawn massif) · coût borné (diff seul, court-circuit trivial) ·
observabilité (Job Summary) · données sensibles non exfiltrées (diff seul, pas le repo).

> Index des livrables : [README.md](README.md) · Décision d'archi : [ADR-001](../decisions/adr-001-mise-en-prod.md).
