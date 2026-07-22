// Classification en lot IDEMPOTENTE des tickets OpsDesk.
//
// Contrat de fiabilité (cf. .claude/memory/idempotence.md) :
//  - Migration au 1er lancement : ajoute la colonne `needs_review` (idempotent).
//  - Lecture  : `WHERE category IS NULL AND needs_review = 0`.
//  - Classe via la SORTIE STRUCTURÉE du module 2 (objet validé par ClassificationSchema).
//  - Écriture : `UPDATE ... WHERE id = ? AND category IS NULL` (garde anti-doublon).
//  - Confiance < 0.7 -> `needs_review = 1` (pas de décision auto ; category reste NULL).
//  - Journalise chaque ticket traité dans `journal/`.
//  - Aucune transaction englobante -> chaque écriture est committée : une interruption
//    (`OPSDESK_FAIL_AT=<n>`) laisse le déjà-fait persistant et rejouable (reprise sans reclasser).
//
// Fonctions exportées (ensureNeedsReviewColumn, classify, classifyBatch) pour être testées
// avec une base :memory: et un `classify` mocké déterministe.

import { appendFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type BetterSqlite3 from "better-sqlite3";
import { db as defaultDb } from "../src/db.js";
import { ClassificationSchema, type Classification } from "../src/classification/schema.js";

type DB = BetterSqlite3.Database;

export const SEUIL_CONFIANCE = 0.7;

// Migration idempotente : ajoute needs_review si absente. On tente l'ALTER et on ignore
// l'erreur "duplicate column name" si la colonne existe déjà (idempotent, cf. spec).
export function ensureNeedsReviewColumn(database: DB): void {
  try {
    database.exec(`ALTER TABLE tickets ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0`);
  } catch (err) {
    if (!String((err as Error).message).toLowerCase().includes("duplicate column")) {
      throw err;
    }
  }
}

// Classifieur déterministe (stub local, mots-clés FR+EN, match par mot entier).
// Réutilise la sortie structurée du module 2 : renvoie un objet VALIDÉ par ClassificationSchema.
export function classify(subject: string, body: string): Classification {
  const t = `${subject} ${body}`.toLowerCase();
  const echapper = (m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const has = (mots: string[]) => mots.some((m) => new RegExp(`\\b${echapper(m)}\\b`).test(t));

  let categorie: Classification["categorie"] = "autre";
  let confiance = 0.3;
  if (has(["log in", "login", "credentials", "password", "2fa", "two-factor", "locked", "account", "connexion", "mot de passe", "authentification"])) {
    categorie = "acces";
    confiance = 0.9;
  } else if (has(["invoice", "charge", "billed", "billing", "refund", "subscription", "facture", "remboursement", "paiement"])) {
    categorie = "facturation";
    confiance = 0.9;
  } else if (has(["crash", "500", "error", "bug", "duplicated", "broken", "reloads", "server error", "plante", "erreur"])) {
    categorie = "bug";
    confiance = 0.9;
  } else if (has(["add", "dark mode", "feature", "admin", "additional", "evolution", "ajout"])) {
    categorie = "demande";
    confiance = 0.9;
  }

  // Validation module 2 : garantit la conformité de la sortie structurée avant écriture.
  return ClassificationSchema.parse({
    categorie,
    priorite: 2,
    besoin_humain: confiance < SEUIL_CONFIANCE,
    confiance,
    justification: `classé « ${categorie} » (heuristique mots-clés, confiance ${confiance})`,
  });
}

export type BatchOptions = {
  classify?: (subject: string, body: string) => Classification;
  failAt?: number;
  log?: (line: string) => void;
};

export type BatchResult = {
  traites: number;
  classes: number;
  enRelecture: number;
  restants: number;
};

// Classe en lot les tickets non traités. Idempotent + rejouable après crash.
export function classifyBatch(database: DB, options: BatchOptions = {}): BatchResult {
  const clf = options.classify ?? classify;
  const { failAt } = options;
  const log = options.log ?? (() => {});

  const pending = database
    .prepare(`SELECT id, subject, body FROM tickets WHERE category IS NULL AND needs_review = 0 ORDER BY id`)
    .all() as Array<{ id: number; subject: string; body: string }>;

  const setCategory = database.prepare(`UPDATE tickets SET category = @categorie WHERE id = @id AND category IS NULL`);
  const flagReview = database.prepare(`UPDATE tickets SET needs_review = 1 WHERE id = @id AND category IS NULL`);

  let traites = 0;
  let classes = 0;
  let enRelecture = 0;

  for (const ticket of pending) {
    if (failAt !== undefined && traites >= failAt) {
      throw new Error(`crash simulé (OPSDESK_FAIL_AT=${failAt}) après ${traites} ticket(s) traité(s)`);
    }
    const c = clf(ticket.subject, ticket.body);
    if (c.confiance < SEUIL_CONFIANCE) {
      flagReview.run({ id: ticket.id });
      enRelecture++;
      log(`ticket ${ticket.id} -> needs_review (confiance ${c.confiance.toFixed(2)})`);
    } else {
      const modifie = setCategory.run({ id: ticket.id, categorie: c.categorie }).changes; // 1 si encore NULL
      if (modifie) classes++;
      log(`ticket ${ticket.id} -> ${c.categorie} (confiance ${c.confiance.toFixed(2)})`);
    }
    traites++;
  }

  const restants = (
    database.prepare(`SELECT count(*) AS n FROM tickets WHERE category IS NULL AND needs_review = 0`).get() as { n: number }
  ).n;

  return { traites, classes, enRelecture, restants };
}

// ---- Exécution réelle (uniquement quand ce fichier est le point d'entrée) ----
function main(): void {
  ensureNeedsReviewColumn(defaultDb);

  const brut = process.env.OPSDESK_FAIL_AT;
  const failAtNum = brut === undefined ? undefined : Number(brut);
  const failAt = failAtNum !== undefined && Number.isInteger(failAtNum) && failAtNum >= 0 ? failAtNum : undefined;

  // Journalisation dans journal/ (un fichier par jour).
  mkdirSync("journal", { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const journalPath = `journal/classify-batch-${date}.md`;
  const log = (line: string) => {
    const entry = `[${new Date().toISOString()}] ${line}`;
    console.log(entry);
    appendFileSync(journalPath, `${entry}\n`);
  };

  log(`--- run classify-batch${failAt !== undefined ? ` (OPSDESK_FAIL_AT=${failAt})` : ""} ---`);
  try {
    const res = classifyBatch(defaultDb, { failAt, log });
    log(`terminé : ${res.classes} classé(s), ${res.enRelecture} en relecture, ${res.restants} restant(s).`);
  } catch (err) {
    log(`INTERROMPU : ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
