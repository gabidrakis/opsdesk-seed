---
description: Classe un ticket via tools/classifier-ticket.mjs (sortie structurée imposée). Utiliser pour CLASSER un ticket ; NE PAS l'utiliser pour modifier un ticket.
allowed-tools: Bash(npx tsx:*)
argument-hint: <texte du ticket>
---

# Outil · classifier_ticket

**Quand l'utiliser** : classer un ticket (sujet + corps) en catégorie, priorité et signal
humain. **Quand NE PAS l'utiliser** : pour modifier ou mettre à jour un ticket — cet outil
*classe seulement*, il n'écrit rien.

Exécute la fonction de classification sur le ticket fourni, puis rends sa sortie **telle quelle**.
Tu ne reformules pas le ticket de tête : tu délègues au code déterministe.

Texte du ticket : $ARGUMENTS

1. Lance : `npx tsx tools/run-classifier.mjs "$ARGUMENTS"`
   (ce wrapper appelle `classifierTicket({ subject, body })` et imprime le résultat en JSON ;
   `tsx` — et non `node` nu — car l'outil importe le schéma `.ts`, source de vérité unique).
2. Renvoie **uniquement** l'objet JSON obtenu, conforme à
   `{ categorie, priorite, besoin_humain, confiance, justification }`
   — ou `{ erreur: ... }` si le corps est vide. N'ajoute aucun commentaire.
