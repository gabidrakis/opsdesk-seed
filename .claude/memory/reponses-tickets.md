# Pattern · Répondre à un ticket OpsDesk

Issu du cycle **Act → Learn → Reuse** : la 1re réponse produite à froid a demandé
plusieurs allers-retours (redécouverte de la base, du ton). On fige ici l'acquis pour
que la prochaine fois soit directe.

## Quand l'utiliser
Dès qu'on demande « propose/rédige une réponse au ticket #<id> ».

## Entrées
- ID ticket dans la table `tickets` (base `data/opsdesk.db`, chemin via env `OPSDESK_DB`).
- Champs utiles : `subject`, `body`, `category`, `priority` (voir modèle de données dans CLAUDE.md).
- Rappel valeurs métier : `category` ∈ {acces, facturation, bug, demande, autre} ; `priority` 1–3.

## Convention de ton (OpsDesk)
- Français, **vouvoiement**, courtois et factuel — même si le ticket est en anglais.
- Structure en 4 temps : **accusé de réception → réponse/pistes → prochaine étape → clôture**.
- Pas de **délai chiffré** ni d'engagement qu'on ne peut pas tenir sans donnée.
- Adapter au registre selon `category` (ex. `acces` = rassurer + étapes de déblocage ;
  `facturation` = demander les références utiles avant toute promesse).

## Sortie
- Un fichier `replies/<id>.md`. **Ne rien modifier d'autre.**
- Terminer par l'avertissement de relecture (cohérent avec la slash-command `/rediger-reponse`).

## Garde-fou
- **Relecture humaine OBLIGATOIRE avant envoi réel** — aucune réponse n'est envoyée automatiquement
  (irréversible + non vérifiable objectivement → décision humaine).

Voir aussi : [[idempotence]] pour les traitements en lot.
