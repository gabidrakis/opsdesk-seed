# Grille de diagnostic « agentic-ready » — OpsDesk

> Gabarit prêt à l'emploi pour le **Lab J1.3** (diagnostic agentic-ready du fil rouge
> OpsDesk) du parcours P3 « Architecte agentique ». 6 dimensions notées **0 / 1 / 2**,
> score total **/12**. Sert de **mètre** : la progression J1→J5 se mesure par la remontée
> de ce score.
>
> **Source faisant foi** : grille §1.5 de [J1-fondations.md](../cours/J1-fondations.md)
> (réutilisée à l'identique au Lab J1.3, §3).
>
> **Convention** : `[…]` = zone à renseigner avant usage. La note finale est **décidée par
> l'humain** (l'agent propose, l'ingénieur dispose). Chaque note s'adosse à une **preuve du
> repo** (chemin de fichier, sortie de commande).
>
> **Deux échelles distinctes** : cette grille note l'**état du repo** (6 dimensions ×
> 0/1/2, score /12) — à ne pas confondre avec la grille d'évaluation des **compétences de
> l'apprenant** (5 critères × 1-5, /25, cf. [evaluation.md](evaluation.md)). Les deux
> s'appliquent à des objets et des moments différents.

---

## En-tête (à remplir)

| Champ | Valeur |
|-------|--------|
| Dépôt diagnostiqué | `opsdesk/` (copie de travail, **jamais** le seed) |
| Branche / état | `etat/j1-fin` (mémoire projet créée + relue) — score de fin J1 |
| Auteur du diagnostic | Gabi (gabidrakis) |
| **Date** | 2026-07-03 (score de fin J1) · 2026-07-02 (score d'entrée) |
| **Score total** | **5 / 12** — score de fin J1, daté 2026-07-03 · **3 / 12** score d'entrée (seed), daté 2026-07-02 |

> Reporter ici **chaque passage** (score d'entrée à l'arrivée sur le seed, puis score après
> J1.5, puis aux journées suivantes), **daté**, pour matérialiser la progression.

### Passages (progression datée)

| Passage | Date | Branche / état | Score | Delta |
|---------|------|----------------|-------|-------|
| Entrée (Lab J1.3, seed) | 2026-07-02 | `main` (seed) | **3 / 12** | — |
| Fin J1 (mémoire créée + relue, Lab 6) | 2026-07-03 | `etat/j1-fin` | **5 / 12** | dim. 1 *Mémoire projet* **0 → 2** (+2) |

---

## Mode d'emploi

1. **Copier ce gabarit** à la racine du dépôt OpsDesk (toutes les commandes des labs
   s'exécutent depuis la **racine** du dépôt, sans préfixe `./opsdesk` ni `--prefix`) :
   ```bash
   cp docs/gabarits/agentic-readiness.md ./AGENTIC-READINESS.md
   ```
2. Pour **chacune des 6 dimensions**, choisir la note **0 / 1 / 2** et écrire une
   **justification d'une ligne** adossée à une **preuve** (chemin de fichier ou commande).
3. **Calculer le score total** (somme des 6 notes, sur 12) et le reporter, **daté**, dans
   l'en-tête.
4. Demander à l'agent un **contre-diagnostic** pour challenger la notation :
   > « Voici ma grille d'agentic-readiness remplie pour ce repo. Es-tu d'accord avec chaque
   > note 0/1/2 ? Indique tout désaccord avec la preuve correspondante. »
   Puis **arbitrer en humain** : garder, ajuster, trancher.
5. **Re-noter** après chaque évolution (ex. après la création de `CLAUDE.md` en J1.5, la
   dimension *Mémoire projet* remonte) et **dater** chaque passage.

> **Garde-fou** : on **ne corrige pas** le secret en clair au stade du diagnostic J1 (motif
> `opsdesk_live_…` dans `src/config.ts`) ; on le **documente** comme risque sous la dimension
> *Gouvernance*. Il est traité en J2 via le hook de gouvernance.

---

## Grille des 6 dimensions (note 0 / 1 / 2)

| # | Dimension | Question | 0 — non-agentic | 1 — partiel | 2 — agentic-ready |
|---|-----------|----------|-----------------|-------------|-------------------|
| 1 | **Mémoire projet** (contexte / `CLAUDE.md`) | L'agent connaît-il le projet et ses conventions sans qu'on les répète ? | Pas de `CLAUDE.md` / `AGENTS.md` | Mémoire amorcée mais incomplète / non relue | `CLAUDE.md` écrit, relu par l'humain, à jour |
| 2 | **Cibles vérifiables** (tests / CI) | Existe-t-il un « ça marche » testable et automatisé ? | Tests absents/partiels, pas de CI | `npm test` partiel **ou** CI absente | `npm test` vert + CI GitHub Actions verte, cible claire |
| 3 | **Conventions explicites** | Le style et les règles sont-ils écrits, pas seulement « dans la tête » ? | Implicites dans le code | Partiellement documentées | Documentées (README, lint/format, schémas) |
| 4 | **Observabilité** | Voit-on ce que fait l'agent (plans, traces, état) ? | Boîte noire | Traces partielles | État-en-fichiers (plans, `TODO.md`), traces exploitables |
| 5 | **Gouvernance** (relecture humaine / secrets) | Y a-t-il des garde-fous, une relecture tracée, une gestion des secrets ? | Aucun garde-fou ; **secret en clair** (`opsdesk_live_…` dans `src/config.ts`) | Relecture occasionnelle ; secret repéré non traité | Relecture systématique tracée ; **aucun secret en clair** (hook de gouvernance) |
| 6 | **Capitalisation** (prompts / commandes réutilisables) | Réutilise-t-on prompts, slash-commands et règles d'une session à l'autre ? | Repart de zéro à chaque fois | Quelques bouts capitalisés | Bibliothèque de prompts/commandes versionnée et réutilisée |

### Fiche de notation (à remplir)

| # | Dimension | Note (0/1/2) | Justification (1 ligne) + preuve (fichier / commande) |
|---|-----------|--------------|--------------------------------------------------------|
| 1 | Mémoire projet | 2 | *(entrée : 0)* `CLAUDE.md` **écrit et relu/corrigé par l'humain** (brouillon commit `6194e89` sur `etat/j1-fin`, puis version corrigée : seed destructif, modèle de données + énums, env `OPSDESK_DB`, critères de réussite, pièges Windows). À jour vs `src/`. Re-test A/B (`notes-j1.md`, Lab 6) : **3 devinettes/erreurs disparues**. *(Commit 2 de correction en attente ; arbitrage humain.)* |
| 2 | Cibles vérifiables (tests / CI) | 1 | Tests présents (`test/tickets.test.ts` ; `npm test` = `vitest run`) + CI (`.github/workflows/ci.yml` : npm ci + npm test), mais **CI jamais exécutée verte sur le fork** (0 run). → passe à **2** dès qu'une CI verte est constatée. |
| 3 | Conventions explicites | 1 | `README.md` documente stack/routes/schéma, mais les conventions (imports ESM `.js`, gestion d'erreurs Fastify `reply.code().send()`) restent **implicites dans le code** ; pas de linter/formatter. |
| 4 | Observabilité | 1 | `Fastify({ logger: true })` (`src/server.ts`) → traces de requêtes, mais **aucun état-en-fichiers** (pas de `TODO.md`/plans) ni trace d'agent. → **0** si l'on juge que le log applicatif ne compte pas comme observabilité agentique. |
| 5 | Gouvernance (relecture / secrets) | 0 | Secret en clair `OPSDESK_API_KEY = "opsdesk_live_…"` dans `src/config.ts` ; aucun garde-fou ni relecture tracée. *(Documenté ici, **non corrigé** — traité en J2 via hook de gouvernance.)* |
| 6 | Capitalisation | 0 | Aucun prompt/slash-command réutilisable pour le travail applicatif ; on repart de zéro à chaque session. |
| | **TOTAL** | 5 / 12 | *(entrée : 3)* Fin J1 : dim. 1 *Mémoire projet* **0 → 2** (+2). Dims 2–6 inchangées. (proposé — arbitrage humain ; reporté dans l'en-tête, daté 2026-07-03) |

---

## Lecture du score (indicative)

| Score /12 | Lecture |
|-----------|---------|
| 0–3 | **Non-agentic** : l'agent travaille à l'aveugle (état typique du seed OpsDesk). |
| 4–7 | **En transition** : premières fondations posées (mémoire, cibles), reste à instrumenter et gouverner. |
| 8–10 | **Agentic-ready** : autonome et observable ; consolider gouvernance et capitalisation. |
| 11–12 | **Mature** : autonome, observable, gouverné et capitalisé de bout en bout. |

> Repères internes pour situer la progression, **pas** un seuil de réussite. La note finale
> reste décidée par l'humain.

---

## Lien avec le Lab J1.3 et le portfolio

- **Lab J1.3** (J1 — Fondations, §3) : produire le **score d'entrée** d'OpsDesk-seed à partir
  de `notes-j1.md` (sorties J1.1/J1.2) et de la grille §1.5 ; le copier en
  `AGENTIC-READINESS.md`, noter les 6 dimensions, calculer le score **/12** daté, puis
  confronter au **contre-diagnostic** de l'agent avant arbitrage humain.
- **Lab J1.5** : après création du `CLAUDE.md` (mémoire projet) relu par l'humain, **recalculer
  le score** (la dimension *Mémoire projet* remonte) — le delta est une **preuve de progression**.
- **Portfolio** : la checklist remplie **entre au portfolio** et sert de
  **mètre** réutilisé pour mesurer les progrès J2→J5 (mémoire J3, agents/MCP J4, mise en
  production J5).

> Cohérent avec le fil rouge **OpsDesk** (TypeScript/Node + Fastify + SQLite/better-sqlite3 +
> Vitest + GitHub Actions ; npm partout) et avec la grille d'auto-évaluation quotidienne
> (5 critères, 1-5) qui, elle, note la **posture** du participant — à ne pas confondre avec
> cette grille, qui note l'**état du dépôt**.
