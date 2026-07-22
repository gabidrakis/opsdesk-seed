# Pattern · Répondre à un ticket OpsDesk

> **Source de vérité = le slash-command `/rediger-reponse`** (`.claude/commands/rediger-reponse.md`).
> Cette mémoire n'en est qu'un **résumé de rappel** et doit rester alignée dessus — ne pas la
> laisser diverger (leçon du Lab 4 : une convention dupliquée et en conflit ne s'applique pas).

## Quand l'utiliser
Dès qu'on demande « propose/rédige une réponse au ticket #<id> ». Réflexe : lancer `/rediger-reponse`.

## Entrées
- ID ticket dans la table `tickets` (base `data/opsdesk.db`, chemin via env `OPSDESK_DB`),
  ou récupéré via `GET http://127.0.0.1:3000/tickets/:id` (Windows : `127.0.0.1`).
- Champs utiles : `subject`, `body`, `category`, `priority`.

## Convention de ton (résumé du slash-command)
- **Langue du ticket** : ticket en anglais → réponse en anglais ; en français → en français.
- Vouvoiement, ton professionnel, courtois et empathique.
- **Un seul paragraphe, 4–6 phrases** : accuse réception → reformule le problème → indique la prochaine étape.
- Pas de jargon interne, **pas de délai chiffré** non garanti.
- Décision sensible (remboursement, litige, sécurité → `besoin_humain: true`) : ne pas trancher,
  indiquer qu'un conseiller humain prend le relais.

## Sortie
- Un fichier `replies/<id>.md`. **Ne rien modifier d'autre.**
- Terminer **obligatoirement** par : `⚠️ **Relecture humaine avant envoi.**`

## Garde-fou
- **Relecture humaine OBLIGATOIRE avant envoi réel** — aucune réponse n'est envoyée automatiquement
  (irréversible + non vérifiable objectivement → décision humaine).

Voir aussi : [[idempotence]] pour les traitements en lot.
