# Portfolio J2 — Chaîne complète : commande → JSON validé → réponse relue

**Lab 5 · Enchaîner la chaîne complète.** Démonstration de bout en bout sur un
ticket **inédit** (non utilisé dans les exemples des prompts) : classification
structurée, validation programmatique contre le schéma, puis rédaction d'une
réponse client soumise à relecture humaine.

---

## Ticket inédit traité

> « On m'a facturé deux fois l'abonnement de mai, merci de corriger. »

---

## Étape 1 — Classification (`/classer-ticket`)

Sortie JSON produite par le prompt de triage :

```json
{"categorie":"facturation","priorite":3,"besoin_humain":true,"confiance":0.9,"justification":"Double facturation de l abonnement de mai signalee, correction/remboursement demande"}
```

Justification des champs :
- `categorie: facturation` — double facturation, indice explicite dans le texte.
- `priorite: 3` — touche à l'argent (règle « 3 = argent/urgent »).
- `besoin_humain: true` — une correction / un remboursement est une décision
  **sensible** ; l'agent ne tranche pas, un humain valide.
- `confiance: 0.9` — la *catégorie* est non ambiguë ; `besoin_humain` porte la
  sensibilité de l'action, pas un doute de classement.

## Étape 2 — Validation programmatique (schéma)

Le JSON est passé à `parseClassification` (schéma `src/classification/schema.ts`)
via `scripts/valider-classification.ts` :

```
$ npx tsx scripts/valider-classification.ts '<le JSON ci-dessus>'
✅ Validation OK — conforme à src/classification/schema.ts
{
  "categorie": "facturation",
  "priorite": 3,
  "besoin_humain": true,
  "confiance": 0.9,
  "justification": "Double facturation de l abonnement de mai signalee, correction/remboursement demande"
}
exit=0
```

→ **Sortie conforme au schéma** (5 clés, énumération et bornes respectées).

## Étape 3 — Réponse client (`/rediger-reponse`)

Brouillon généré à partir de la classification (`besoin_humain: true` → la réponse
n'engage aucun remboursement, elle annonce le relais d'un conseiller humain) :

> Bonjour, merci de nous avoir signalé ce double prélèvement de votre abonnement
> du mois de mai. Je comprends votre inquiétude face à cette double facturation et
> je vous confirme que votre demande de correction est bien prise en compte.
> S'agissant d'un ajustement financier, je transmets votre dossier à un conseiller
> de notre équipe facturation, qui vérifiera les deux transactions et procédera à
> la régularisation appropriée. Vous serez informé(e) par écrit dès que ce contrôle
> sera finalisé. Nous restons à votre disposition pour toute précision complémentaire.
>
> ⚠️ **Relecture humaine avant envoi.**

## Étape 4 — Relecture humaine

La réponse ci-dessus est un **brouillon**. Elle n'est pas envoyée automatiquement.
Relire, corriger si nécessaire, puis attester ci-dessous.

- [x] Relu / validé le 2026-07-07 par Gabi

_(Attestation de relecture humaine — cochée sur autorisation explicite de
l'apprenant, qui déclare avoir relu le brouillon.)_

---

## Question rituelle

> « Qu'ai-je délégué / enseigné à mes agents aujourd'hui, et comment l'ai-je vérifié ? »

Aujourd'hui, j'ai appris à mon agent à respecter mes conditions de non-délégation,
et aussi à vérifier mes prompts et les siens à l'aide de la grille des 6 composants.
Ensuite je lui ai fait rédiger le triage support du Lab 1, puis je l'ai fait
transformer une sortie LLM « bavarde » en une donnée typée et vérifiable.
Puis j'ai figé 3 prompts en slash-commands de projet versionnées et disponibles au clone.
Par la suite, je lui ai fait écrire un garde-fou mécanique qui empêche un commit de
secret, et à le câbler.
Enfin, je lui ai fait traverser un ticket inédit à toute la chaîne : classer → valider → rédiger.


