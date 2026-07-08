# Note d'arbitrage · Orchestration J4 (OpsDesk)
Daté : 2026-07-08

Sur OpsDesk, j'ai livré la feature `GET /tickets/stats` via un pipeline **séquentiel**
planner→builder→reviewer : le *planner* produit une spec (`plans/stats.plan.md`) sans écrire
de code, le *builder* l'implémente fidèlement (`computeTicketStats` + route + tests) sans
replanifier, le *reviewer* juge la diff et rend un verdict (`reviews/stats.review.md`) sans
coder. La non-superposition des rôles est **garantie par les outils** de chaque agent — seul le
builder porte `Write`/`Edit` —, pas seulement par leurs prompts. J'ai choisi le séquentiel +
observable parce qu'il rend le processus **reproductible, traçable et reprenable** : l'état
transite par des **fichiers versionnés** (plan, review, TODO, journal) plutôt que par des
contextes volatils, et **deux points de contrôle humains** — accepter le plan, accepter le
verdict — placent la décision là où elle m'engage, la jonction builder→reviewer restant une
gate **automatique** (vitest vert, invariant I3). Je n'ai pas opté pour un **spawn massif
parallèle** car, comme le soutient **Zechner**, il constitue un anti-pattern : coûteux en
tokens, peu observable et débogable, avec des agents qui **divergent faute d'état partagé
fiable** — soit exactement l'inverse des trois propriétés que je vise. Le seul cas où je le
reconsidérerais est celui de **sous-tâches réellement indépendantes et vérifiables
objectivement**, sans coordination ni état partagé — par exemple classer 500 tickets ou
chercher un pattern dans N fichiers en parallèle —, où l'absence de coordination fait
précisément disparaître l'anti-pattern.
