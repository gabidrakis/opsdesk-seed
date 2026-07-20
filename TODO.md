# TODO · J5 — Revue agentique en CI

Source : `plans/revue-agentique.md` (validé le 2026-07-20 ; Décisions A = gitignore, B = 1 few-shot).

- [ ] Étape 1 : prompt de revue versionné `.github/agent/revue-pr.md` (grille 6 composants + 1 paire few-shot) + `.gitignore` pour `reviews/revue-*.json`
- [ ] Étape 2 : `scripts/revue-agent.mjs` — `nettoyerSortie()` pure + garde CLI (`claude -p`, écrit `reviews/revue-<sha>.json`)
- [ ] Étape 3 : `scripts/publier-verdict.mjs` — `validerVerdict()` + `rendreMarkdown()` pures + `upsertCommentaire()` (`gh api`)
- [ ] Étape 4 : `.github/workflows/revue-agentique.yml` — check tout-`.md`, timeout 10, Job Summary
- [ ] Étape 5 : tests Vitest `.mjs` — `test/revue-agent.test.mjs` + `test/publier-verdict.test.mjs` (fonctions pures)
- [ ] Étape 6 : capitalisation `CLAUDE.md` (section « Revue agentique en CI ») + journal
