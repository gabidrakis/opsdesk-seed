# Bibliothèque de prompts OpsDesk

Prompts réutilisables du projet. Chaque prompt « figé » est aussi exposé comme
**slash-command de projet** dans `.claude/commands/` (versionnée, partagée au clone).

## Convention de nommage

- **Format** : `verbe-objet` en kebab-case, minuscules, sans accent.
  Exemples : `classer-ticket`, `rediger-reponse`, `resumer-tickets`.
- **Correspondance 1:1** : un prompt source `prompts/<nom>.md` ↔ une commande
  `.claude/commands/<nom>.md` de même nom (→ `/<nom>`).
- **Structure imposée** : tout prompt suit les **6 composants** étiquetés
  (Rôle · Contexte · Tâche · Contraintes & garde-fous · Exemples · Format de sortie).
- **Sortie machine** : toute classification doit être un JSON conforme à
  `src/classification/schema.ts` et passer `parseClassification`.

## Règle de relecture

Tout prompt doit porter une trace de relecture datée : une ligne
**« relu le AAAA-MM-JJ »** (ou une section « Sorties observées, relues le AAAA-MM-JJ »).
Un prompt non relu n'est pas considéré comme figé.

## Inventaire

| Prompt / commande | Usage | Relu le |
|---|---|---|
| `classer-ticket` | Classe un ticket en JSON structuré (5 clés) | 2026-07-06 |
| `rediger-reponse` | Rédige une réponse client (relecture humaine avant envoi) | 2026-07-06 |
| `resumer-tickets` | Résume les tickets ouverts (liste + compteur/catégorie) | 2026-07-06 |
