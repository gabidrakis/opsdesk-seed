// Revue agentique — étape « publication » (J5, Module 5).
// Fonctions PURES exportées (validerVerdict, rendreMarkdown) + upsert idempotent.
// `gh api` est un effet de bord externe : NON unit-testé (couvert par la démo H4).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Marqueur caché : ancre l'idempotence (2 pushes → 1 commentaire mis à jour).
export const MARQUEUR = "<!-- opsdesk-revue-agent -->";

const VERDICTS = new Set(["approve", "request_changes", "comment"]);
const SEVERITES = new Set(["info", "attention", "bloquant"]);

// Valide la FORME du verdict (pas le fond). Renvoie true si conforme, lève sinon.
// Barrière de sûreté : un JSON non conforme ne doit rien publier.
export function validerVerdict(obj) {
  if (obj === null || typeof obj !== "object") throw new Error("verdict : objet attendu");
  if (!VERDICTS.has(obj.verdict)) throw new Error(`verdict : valeur hors whitelist (${obj.verdict})`);
  if (!Array.isArray(obj.findings)) throw new Error("verdict : findings doit être un tableau");
  if (typeof obj.summary !== "string") throw new Error("verdict : summary doit être une chaîne");
  for (const f of obj.findings) {
    if (f === null || typeof f !== "object") throw new Error("finding : objet attendu");
    if (!SEVERITES.has(f.severite)) throw new Error(`finding : severite invalide (${f.severite})`);
    if (typeof f.fichier !== "string") throw new Error("finding : fichier doit être une chaîne");
    if (typeof f.message !== "string") throw new Error("finding : message doit être une chaîne");
  }
  return true;
}

// Rend le commentaire markdown (humain) à partir du verdict (machine). Pure.
export function rendreMarkdown(verdict) {
  const lignes = [
    MARQUEUR,
    `## Revue agentique · \`${verdict.verdict}\``,
    "",
    verdict.summary,
    "",
  ];
  if (verdict.findings.length === 0) {
    lignes.push("_Aucun point soulevé._");
  } else {
    for (const f of verdict.findings) {
      lignes.push(`- **${f.severite}** \`${f.fichier}\` — ${f.message}`);
    }
  }
  return lignes.join("\n");
}

// ---- Effet de bord : upsert du commentaire de PR (non unit-testé) ----
function upsertCommentaire(numeroPr, corps) {
  const repo = process.env.GITHUB_REPOSITORY; // "owner/repo" (fourni par Actions)
  if (!repo) throw new Error("GITHUB_REPOSITORY absent");

  // Liste paginée → un seul tableau (sinon JSON.parse casse au-delà d'une page).
  const brut = execFileSync(
    "gh",
    ["api", "--paginate", "--slurp", `repos/${repo}/issues/${numeroPr}/comments`],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  const pages = JSON.parse(brut);
  const commentaires = Array.isArray(pages[0]) ? pages.flat() : pages;
  const existant = commentaires.find((c) => typeof c.body === "string" && c.body.includes(MARQUEUR));

  if (existant) {
    execFileSync("gh", ["api", "--method", "PATCH", `repos/${repo}/issues/comments/${existant.id}`,
      "-f", `body=${corps}`], { stdio: ["ignore", "ignore", "inherit"] });
    console.error(`[publier-verdict] commentaire ${existant.id} mis à jour (upsert)`);
  } else {
    execFileSync("gh", ["api", "--method", "POST", `repos/${repo}/issues/${numeroPr}/comments`,
      "-f", `body=${corps}`], { stdio: ["ignore", "ignore", "inherit"] });
    console.error("[publier-verdict] nouveau commentaire posté");
  }
}

function numeroPrDepuisEnv() {
  if (process.argv[2]) return process.argv[2];
  // GITHUB_REF = "refs/pull/<n>/merge" sur un événement pull_request.
  const m = (process.env.GITHUB_REF ?? "").match(/refs\/pull\/(\d+)\//);
  if (!m) throw new Error("numéro de PR introuvable (arg ou GITHUB_REF)");
  return m[1];
}

function main() {
  const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const verdict = JSON.parse(readFileSync(`reviews/revue-${sha}.json`, "utf8"));
  try {
    validerVerdict(verdict);
  } catch (err) {
    console.error(`[publier-verdict] verdict non conforme, rien publié : ${err.message}`);
    process.exit(1);
  }
  upsertCommentaire(numeroPrDepuisEnv(), rendreMarkdown(verdict));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
