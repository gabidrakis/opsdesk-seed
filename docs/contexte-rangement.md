# Où ranger quoi — les trois horizons du contexte

Classement de six informations OpsDesk dans les trois horizons (cf. Carte du contexte, CLAUDE.md).
Horizons : **Session** (volatile) · **Mémoire projet** (persistante, versionnée) · **État de tâche** (semi-persistant, disque).

| # | Information | Horizon | Où ça vit | Pourquoi là |
|---|---|---|---|---|
| 1 | Le texte du ticket #1001 qu'on traite maintenant | **Session** | fil de discussion | Propre à l'échange courant ; inutile de le persister, on le relit depuis la base au besoin. |
| 2 | Stack, commandes, modèle de données, routes | **Mémoire projet** | `CLAUDE.md` | Vrai pour tout le projet, doit être lu à chaque session et disponible au clone. |
| 3 | Convention de ton pour répondre à un ticket | **Mémoire projet** | `.claude/memory/reponses-tickets.md` | Savoir réutilisable, capitalisé une fois, rejoué à chaque réponse. |
| 4 | Pattern d'idempotence (« écrire seulement si absent ») | **Mémoire projet** | `.claude/memory/idempotence.md` | Règle de conception durable, indépendante d'une tâche précise. |
| 5 | Le plan validé d'une feature + son avancement | **État de tâche** | `plans/*.md`, `TODO.md`, `journal/<date>.md` | Propre à un chantier en cours ; vit le temps du chantier, pas au-delà. |
| 6 | `OPSDESK_API_KEY` / tout secret (clé, token) | **Aucun** de ces horizons | variable d'env / gestionnaire de secrets | Un secret ne se versionne **jamais** : ni en session (fuite), ni en mémoire projet (committé) — le hook anti-secrets bloque justement son commit. |

## À retenir
- Le réflexe : « cette info, elle survit à quoi ? » — à la fermeture du chat (→ persister),
  au clone du dépôt (→ versionner), à la fin du chantier (→ état de tâche jetable).
- Le cas piège = la ligne 6 : tout ne rentre pas dans un horizon. Les **secrets** sont
  volontairement hors-carte — leur place est un gestionnaire de secrets, pas un fichier suivi.

> Note : tableau rédigé de mon côté, à comparer au corrigé de l'écran « Les trois horizons ».
