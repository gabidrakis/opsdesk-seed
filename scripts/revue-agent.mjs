// Revue agentique — étape « invocation » (J5, Module 5).
// Fonction PURE exportée (nettoyerSortie) + garde CLI qui appelle l'agent.
// Le call `claude` est un effet de bord externe non déterministe : NON unit-testé
// (couvert par la démo rejouable), seul nettoyerSortie l'est.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const PROMPT_PATH = ".github/agent/revue-pr.md";

// L'agent enrobe parfois le JSON dans une clôture ```json … ``` ; on la retire
// pour obtenir du JSON nu. Pure et testable (aucun effet de bord).
export function nettoyerSortie(texte) {
  let t = String(texte).trim();
  const cloture = t.match(/^```[a-zA-Z]*\s*\n?([\s\S]*?)\n?```$/);
  if (cloture) t = cloture[1].trim();
  return t;
}

// ---- Exécution réelle (uniquement quand ce fichier est le point d'entrée) ----
function main() {
  // Diff : fichier passé en argument, sinon calculé contre origin/main.
  const cheminDiff = process.argv[2];
  const diff = cheminDiff
    ? readFileSync(cheminDiff, "utf8")
    : execFileSync("git", ["diff", "origin/main...HEAD"], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });

  const prompt = readFileSync(PROMPT_PATH, "utf8");
  const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();

  let brut;
  try {
    // Le diff (contenu non fiable) passe sur stdin, pas dans le prompt système.
    brut = execFileSync("claude", ["-p", prompt, "--output-format", "text"], {
      input: diff,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    console.error(`[revue-agent] échec de l'appel à claude : ${err.message}`);
    process.exit(1); // rien n'est écrit ni publié
  }

  const json = nettoyerSortie(brut);
  mkdirSync("reviews", { recursive: true });
  const sortie = `reviews/revue-${sha}.json`;
  writeFileSync(sortie, `${json}\n`, "utf8");
  console.error(`[revue-agent] verdict écrit dans ${sortie}`);
  // stdout = le JSON nu, consommable par publier-verdict.mjs ou un pipe.
  console.log(json);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
