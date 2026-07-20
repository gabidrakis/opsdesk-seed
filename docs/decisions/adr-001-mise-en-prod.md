# ADR-001 · Mise en production de l'agent de revue : pipeline éphémère vs agent persistant
Daté : 2026-07-20 · Module 5 (OpsDesk)

- **Statut : PROPOSÉ — en attente d'arbitrage de Gabi.** (La décision ci-dessous est une
  recommandation argumentée ; elle n'est actée que lorsque Gabi la valide et passe le statut
  à « Accepté ».)

## Contexte
OpsDesk doit brancher un **agent de revue de PR** en production (CI). Deux architectures d'agent
s'opposent, et le choix engage l'observabilité, le coût et la sûreté :
- **Agent éphémère (pipeline)** — invoqué sur un événement (`pull_request`), produit un artefact
  (verdict + commentaire), puis **meurt** ; aucun état conservé entre deux exécutions.
- **Agent persistant (canal)** — reste **vivant**, écoute une messagerie, garde un **état** ;
  pertinent quand il y a un besoin **conversationnel continu** (cas d'étude : OpenClaw, multimodal).

Le fil rouge a déjà tranché une question voisine en J4 (orchestration séquentielle observable vs
spawn massif) : voir [note d'arbitrage J4](../../portfolio/J4-arbitrage-orchestration.md).

## Options considérées
### Option A — Pipeline éphémère (agent invoqué en CI)
- Invocation `claude -p` sur `pull_request` ; artefact `reviews/revue-<sha>.json` + commentaire idempotent ; le job meurt.
- État = **fichiers versionnés / commentaire de PR**, pas une mémoire vive.

### Option B — Agent persistant (canal / service)
- Un service qui écoute en continu, garde le contexte des PR, dialogue.
- Repli technique documenté si besoin d'un runner autonome : Agent SDK TypeScript
  (`@anthropic-ai/claude-agent-sdk`, fonction `query()`).

## Critères de décision
1. **Reproductible** — état de départ défini, mêmes entrées → mêmes sorties.
2. **Observable** — le déroulé est traçable (Job Summary, commentaire, logs).
3. **Reprenable** — un plantage se reprend sans tout refaire.
4. **Coût borné** — pas de consommation continue de quota ; boucle bornée.
5. **Sûreté** — surface d'attaque minimale ; l'agent ne merge jamais.
6. **Besoin réel** — la revue de PR est-elle **événementielle** ou **conversationnelle** ?

## Décision proposée (à trancher)
> **Recommandation : Option A — pipeline éphémère.**

Justification par critère :
- La revue de PR est **événementielle** par nature (un push → une revue) : aucun besoin
  conversationnel continu → le critère 6 tranche seul pour A.
- **Reproductible / reprenable** (1, 3) : l'état vit dans des fichiers et le commentaire de PR, pas
  dans un contexte volatil ; un re-run manuel rejoue à l'identique.
- **Observable** (2) : Job Summary à chaque exécution + commentaire idempotent.
- **Coût borné** (4) : le process meurt après l'artefact ; `timeout-minutes: 10`, diff seul,
  court-circuit des PR triviales (tout-`.md`) — vs un persistant qui consomme en veille.
- **Sûreté** (5) : `permissions: contents: read`, pas de service exposé en continu.
- L'agent persistant (B) resterait pertinent **uniquement** si un besoin conversationnel continu
  émergeait (triage interactif, dialogue multi-tours) — hors périmètre OpsDesk aujourd'hui.

**Zone à trancher par Gabi** : accepter A, ou demander B (ou un hybride). Tant que le statut est
« Proposé », l'ADR n'engage pas.

## Conséquences
- **Si A accepté** (recommandé) : on garde l'implémentation livrée
  ([workflow](../../.github/workflows/revue-agentique.yml) + scripts purs) ; rien à réécrire.
  Le verrou anti-merge reste **externe** au job (branch protection `main`, action humaine H2).
- **Si B** : réécriture en service persistant (hébergement, gestion d'état, supervision) — coût et
  surface d'attaque supérieurs ; à ne financer que si le besoin conversationnel est avéré.
- **Anti-pattern écarté dans les deux cas** : le **spawn massif** de sous-agents parallèles non
  observables/reprenables (cf. Zechner, note J4) — sauf sous-tâches réellement indépendantes et
  vérifiables (ex. classer 500 tickets en parallèle).

## Références
- Plan d'implémentation : [plans/revue-agentique.md](../../plans/revue-agentique.md)
- Repli runner autonome : Agent SDK TypeScript `@anthropic-ai/claude-agent-sdk` (`query()`)
- Cas d'étude agent persistant : OpenClaw (Peter Steinberger) · Pi Coding Agent (Mario Zechner, `@earendil-works/pi-coding-agent`)
