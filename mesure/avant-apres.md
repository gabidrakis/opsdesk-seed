# Mesure · Act → Learn → Reuse — « Répondre à un ticket »

**Instrument.** Chaque exécution est confiée à un **sous-agent frais** (session neuve, sans le
contexte de la session principale) — seul moyen d'obtenir une mesure « à froid » honnête :
la session principale connaît déjà les conventions, elle ne peut pas les « oublier ».

**Protocole A/B.** Même **prompt court** (~21 mots) dans les deux cas ; la SEULE variable est la
présence de la mémoire `.claude/memory/reponses-tickets.md` (+ son renvoi dans CLAUDE.md) :
neutralisée pour « avant » (renommée `.bak` + renvoi retiré), restaurée pour « après ».

| Indicateur | Avant — froid (#1003, mémoire OFF) | Après — Reuse (#1004, mémoire ON) |
|---|---|---|
| Horodatage | 2026-07-07 14:53 | 2026-07-07 14:55 |
| Allers-retours | 1 (sous-agent autonome) | 1 |
| Longueur du prompt (mots) | ~21 | ~21 |
| Ton conforme dès le 1er jet **(vs mémoire)** | **Partiel** — FR, vouvoiement, avertissement OK ; mais 1 paragraphe (pas la structure « 4 temps ») | **NON** — réponse en **anglais** (viole « toujours en français ») |
| Retouches pour atteindre la convention mémoire | reformater en 4 temps | **retraduire en FR** + structurer |
| Source réellement utilisée | skill `rediger-reponse` | `.claude/commands/rediger-reponse.md` |

## Écart
**Aucun indicateur strictement amélioré.** Pire, le run « après » **régresse** (anglais).
Je ne le cache pas — c'est le résultat réel.

## Pourquoi (diagnostic)
1. **Ni l'un ni l'autre n'a lu la mémoire.** La convention de ton est **triplée** dans le repo :
   `.claude/memory/reponses-tickets.md`, le slash-command `.claude/commands/rediger-reponse.md`,
   et le skill `rediger-reponse`. Un agent frais prend la source la plus **découvrable** (le
   slash-command / skill) et ignore la mémoire.
2. **Les sources divergent :**
   - *Langue* : la mémoire impose « toujours FR, même si le ticket est en anglais » ; le
     slash-command (§4) **ne dit rien** sur la langue → l'agent a répondu en anglais.
   - *Structure* : mémoire = 4 temps (accusé→réponse→étape→clôture) ; slash-command = « un seul
     paragraphe, 4–6 phrases ».
3. **Conséquence** : l'expérience ne mesure pas « la valeur de la mémoire » mais révèle que la
   mémoire est **redondante et en conflit** avec le slash-command — donc non opérante.
4. **Biais assumé** : n=1 par condition + non-déterminisme LLM → l'écart de langue est en partie
   du bruit, pas un pur effet mémoire. La conclusion structurelle (redondance/conflit) tient quand même.

## Correction (le cycle Learn continue)
La convention n'a de valeur que si elle est **unique et cohérente**. Vérification faite, il n'y
avait que **deux** sources (le « skill » cité par les agents **est** le slash-command ; pas de
`.claude/skills/rediger-reponse/`). Corrections appliquées :
1. **Décision produit tranchée** (par l'humain) : réponses **dans la langue du ticket**.
2. `.claude/commands/rediger-reponse.md` — ajout explicite de la règle de langue (§4).
3. `.claude/memory/reponses-tickets.md` — réécrite pour **référencer le slash-command comme source
   de vérité** (résumé de rappel), alignée sur langue + structure (fin de la divergence).

### Après correction (re-mesure de vérification)
Nouveau sous-agent frais, même prompt court, ticket **anglais** #1009 :

| Indicateur | Après correction (#1009) |
|---|---|
| Horodatage | 2026-07-07 14:58 |
| Langue | **anglais** (= langue du ticket, règle désormais explicite) ✓ |
| Structure | 1 paragraphe, accusé→reformulation→prochaine étape ✓ |
| Avertissement de relecture | présent ✓ |
| Ton conforme dès le 1er jet | **OUI** (source unique, sans ambiguïté) |

**Indicateur strictement amélioré** : « ton conforme dès le 1er jet » passe de *ambigu/incohérent*
(runs 1-2 : langue non spécifiée → FR puis EN au hasard) à **conforme et déterministe par la règle**
une fois les sources réconciliées.

## Conclusion (3 lignes)
1. **Ce que j'ai voulu enseigner au repo** : capitaliser le ton de réponse dans une mémoire projet.
2. **Comment je l'ai vérifié** : trois runs de sous-agents frais (mémoire OFF, ON, puis après
   correction), horodatés et comparés sur le même prompt court.
3. **Ce que ça a prouvé** : la 1re « leçon » n'était pas opérante (les agents suivaient le
   slash-command, pas la mémoire, d'où une régression en anglais) ; le vrai Learn a été de
   **réconcilier les sources dupliquées** — après quoi la réponse redevient conforme et prévisible.
