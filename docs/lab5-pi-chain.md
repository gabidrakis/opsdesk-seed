# Lab 5 · Séquence pi.dev + débat séquentiel vs parallèle massif
Daté : 2026-07-08 · Branche : `j4-orchestration` · Optionnel

Voie retenue : **lecture + explication du YAML** (voie par défaut de l'énoncé). L'exécution
via `pi-chains` n'a pas été tentée : `@earendil-works/pi-coding-agent` n'est pas installé et
`pi-chains` est absent du registre npm (404) — cohérent avec l'avertissement « pi.dev est
volatil (rebranding Earendil en cours), ne dépends pas d'une installation ».

## Le fichier — `.pi/agent-chain.yaml` expliqué

```yaml
name: opsdesk-feature-chain
description: Livre une feature OpsDesk via la sequence planner -> builder -> reviewer.
steps:
  - name: plan
    agent: .pi/agents/planner.md
    input: $ORIGINAL
  - name: build
    agent: .pi/agents/builder.md
    input: |
      Demande initiale : $ORIGINAL
      Plan valide a implementer fidelement :
      $INPUT
  - name: review
    agent: .pi/agents/reviewer.md
    input: |
      Demande initiale : $ORIGINAL
      Implementation a relire (sortie du builder) :
      $INPUT
```

- `name` / `description` — identité de la Chain.
- `steps:` — la **liste ordonnée** des maillons ; l'ordre EST la séquence (une *Chain* = séquentiel pur).
- **Étape `plan`** : `agent:` pointe le `planner` du Lab 3 ; `input: $ORIGINAL` = la demande brute.
  Premier maillon → pas de sortie précédente, il ne consomme que `$ORIGINAL`.
- **Étape `build`** : `agent:` = `builder` ; `input` reçoit `$ORIGINAL` (rappel immuable) **+** `$INPUT`
  = la **sortie de l'étape `plan`** (le plan). L'état se propage : la spec du planner devient l'entrée du builder.
- **Étape `review`** : `agent:` = `reviewer` ; `input` = `$ORIGINAL` **+** `$INPUT` = **sortie de l'étape `build`**
  (l'implémentation/diff). `$INPUT` a glissé d'un cran.

**Mécanisme clé** : `$ORIGINAL` est **fixe** (la boussole, partout) ; `$INPUT` est **glissant**
(= « ce que le maillon précédent vient de produire »). Le chaînage transporte l'état par simple
passage sortie→entrée, sans base de données.

## Même pattern que le pipeline Claude Code (Lab 4)

| Claude Code (Lab 4) | pi.dev (`agent-chain.yaml`) |
|---|---|
| Invoquer `planner` sur la demande | step `plan`, `input: $ORIGINAL` |
| Sortie du planner → entrée du builder | `$INPUT` de l'étape `build` |
| Sortie du builder (diff) → entrée du reviewer | `$INPUT` de l'étape `review` |
| **Checkpoints humains entre les maillons (2 gates)** | **absents du YAML** — à matérialiser autrement |

C'est le **même pattern Chain**, exprimé dans un autre outil. Différence à retenir : le YAML enchaîne
les 3 maillons **automatiquement**. En pi.dev, les goulots humains du Lab 4 (accepter le plan / le verdict)
devraient être réintroduits (arrêt entre étapes, revue du `$INPUT` avant le maillon suivant) — sinon la
Chain « merge sur la parole des agents », ce que le garde-fou du Lab 4 interdit.

## Débat — spawn massif parallèle vs séquentiel

**Position de Zechner (factuelle)** : le *spawn massif* de sous-agents parallèles est un **anti-pattern**
(coûteux, peu observable/débogable, contextes qui divergent). Alternative défendue : **tmux** (quelques
agents dans des panneaux visibles) **+ état persisté en fichiers** → peu d'agents, observables, reprenables.

**Ma position (Gabi) — alimente l'exercice J4-X :**
- **POUR le parallèle massif** : il se défend quand les sous-tâches sont **indépendantes et vérifiables**
  — aucun état partagé, chaque sortie contrôlable objectivement (ex. classer 500 tickets, chercher un
  pattern dans N fichiers). Pas de coordination → pas d'anti-pattern.
- **CONTRE le parallèle massif** : **coût & contextes divergents** — coûteux en tokens, et les agents
  partent dans des directions incohérentes faute d'état partagé fiable.
