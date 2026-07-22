# TODO · J5 — Revue agentique en CI

Source : `plans/revue-agentique.md` (validé le 2026-07-20 ; Décisions A = gitignore, B = 1 few-shot).

- [x] Étape 1 : prompt de revue versionné `.github/agent/revue-pr.md` (grille 6 composants + 1 paire few-shot) + `.gitignore` pour `reviews/revue-*.json`
- [x] Étape 2 : `scripts/revue-agent.mjs` — `nettoyerSortie()` pure + garde CLI (`claude -p`, écrit `reviews/revue-<sha>.json`)
- [x] Étape 3 : `scripts/publier-verdict.mjs` — `validerVerdict()` + `rendreMarkdown()` pures + `upsertCommentaire()` (`gh api`)
- [x] Étape 4 : `.github/workflows/revue-agentique.yml` — check tout-`.md`, timeout 10, Job Summary
- [x] Étape 5 : tests Vitest `.mjs` — `test/revue-agent.test.mjs` + `test/publier-verdict.test.mjs` (fonctions pures)
- [x] Étape 6 : capitalisation `CLAUDE.md` (section « Revue agentique en CI ») + journal
- [x] Étape 7 : ADR `docs/decisions/adr-001-mise-en-prod.md` (décision PROPOSÉE, à trancher par Gabi)
- [x] Étape 8 : index portfolio `docs/portfolio/README.md` (5 livrables, liens valides)
- [x] Étape 9 : script de démo `docs/portfolio/demo.md` (5 min, rejouable)

## Reste (actions humaines non déléguées — H1–H4)
- [ ] H1 : créer le secret `ANTHROPIC_API_KEY` (Actions secret)
- [ ] H2 : branch protection `main` (Require a pull request + Require approvals 1)
- [ ] H3 : connecter le fork à la plateforme d'éval
- [ ] H4 : démo rejouable (2 pushes → 1 commentaire mis à jour, Job Summary, re-run sans doublon)
