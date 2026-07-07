// Classification en lot IDEMPOTENTE des tickets OpsDesk.
//
// Contrat de fiabilité (cf. pattern d'idempotence J3) :
//  - Lecture  : `WHERE category IS NULL AND needs_review = 0`
//               (on ne retraite ni le déjà-classé, ni l'ambigu en attente de relecture).
//  - Écriture : `UPDATE ... WHERE id = ? AND category IS NULL` (garde anti-doublon).
//  - Ambigu (confiance < seuil) : `needs_review = 1`, `category` laissé NULL — pas de décision auto.
//  - Chaque ticket traité est journalisé sur stdout.
//  - Aucune transaction autour de la boucle : chaque écriture est committée immédiatement,
//    de sorte qu'une interruption (OPSDESK_FAIL_AT) laisse le travail déjà fait persistant
//    et rejouable (reprise sans reclasser).
//
// Injection de faute : `OPSDESK_FAIL_AT=<n>` fait échouer le script APRÈS n tickets traités
// (outil de vérification de la robustesse, pas un hack).
//
// Le classifieur est DÉTERMINISTE (mots-clés FR+EN), donc reproductible : deux passes
// donnent le même résultat. Il peut être remplacé plus tard par un appel LLM derrière
// la même signature sans toucher à la logique d'idempotence.

import { db } from "../src/db.js";

const SEUIL_CONFIANCE = 0.6;

// Migration idempotente : ajoute la colonne needs_review si le schéma ne l'a pas encore.
function ensureSchema(): void {
  const cols = db.prepare(`PRAGMA table_info(tickets)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "needs_review")) {
    db.exec(`ALTER TABLE tickets ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0`);
    console.log("[schema] colonne needs_review ajoutée");
  }
}

// Classifieur déterministe : renvoie une catégorie du référentiel OpsDesk + une confiance.
// Rien de reconnu -> faible confiance (le ticket partira en relecture humaine).
//
// Matching par MOT ENTIER (`\b…\b`) et non par sous-chaîne : évite les faux positifs
// du type « access » ⊃ « acces » ou « changelog in » ⊃ « log in ».
function classify(subject: string, body: string): { categorie: string; confiance: number } {
  const t = `${subject} ${body}`.toLowerCase();
  const echapper = (m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const has = (mots: string[]) => mots.some((m) => new RegExp(`\\b${echapper(m)}\\b`).test(t));

  if (has(["log in", "login", "credentials", "password", "2fa", "two-factor", "locked", "account", "connexion", "mot de passe", "authentification"]))
    return { categorie: "acces", confiance: 0.9 };
  if (has(["invoice", "charge", "billed", "billing", "refund", "subscription", "facture", "remboursement", "paiement"]))
    return { categorie: "facturation", confiance: 0.9 };
  if (has(["crash", "500", "error", "bug", "duplicated", "broken", "reloads", "server error", "plante", "erreur"]))
    return { categorie: "bug", confiance: 0.9 };
  if (has(["add", "dark mode", "feature", "admin", "additional", "evolution", "ajout"]))
    return { categorie: "demande", confiance: 0.9 };

  return { categorie: "autre", confiance: 0.3 };
}

function main(): void {
  ensureSchema();

  const brut = process.env.OPSDESK_FAIL_AT;
  const failAt = brut === undefined ? undefined : Number(brut);
  const avecFaute = failAt !== undefined && Number.isInteger(failAt) && failAt >= 0;

  const pending = db
    .prepare(`SELECT id, subject, body FROM tickets WHERE category IS NULL AND needs_review = 0 ORDER BY id`)
    .all() as Array<{ id: number; subject: string; body: string }>;

  const setCategory = db.prepare(`UPDATE tickets SET category = @categorie WHERE id = @id AND category IS NULL`);
  const flagReview = db.prepare(`UPDATE tickets SET needs_review = 1 WHERE id = @id AND category IS NULL`);

  console.log(
    `[classify-batch] ${pending.length} ticket(s) à traiter` + (avecFaute ? ` (OPSDESK_FAIL_AT=${failAt})` : ""),
  );

  let traites = 0;
  let classes = 0;
  let enRelecture = 0;

  for (const ticket of pending) {
    if (avecFaute && traites >= (failAt as number)) {
      console.error(`[classify-batch] crash simulé après ${traites} ticket(s) traité(s) (OPSDESK_FAIL_AT=${failAt})`);
      process.exit(1);
    }

    const { categorie, confiance } = classify(ticket.subject, ticket.body);
    const ts = new Date().toISOString();

    if (confiance < SEUIL_CONFIANCE) {
      flagReview.run({ id: ticket.id });
      enRelecture++;
      console.log(`[${ts}] ticket ${ticket.id} -> needs_review (confiance ${confiance.toFixed(2)})`);
    } else {
      const modifie = setCategory.run({ id: ticket.id, categorie }).changes; // 1 seulement si encore NULL
      if (modifie) classes++;
      console.log(`[${ts}] ticket ${ticket.id} -> ${categorie} (confiance ${confiance.toFixed(2)})`);
    }

    traites++;
  }

  const restants = (
    db.prepare(`SELECT count(*) AS n FROM tickets WHERE category IS NULL AND needs_review = 0`).get() as { n: number }
  ).n;

  console.log(`[classify-batch] terminé : ${classes} classé(s), ${enRelecture} en relecture, ${restants} restant(s).`);
}

main();
