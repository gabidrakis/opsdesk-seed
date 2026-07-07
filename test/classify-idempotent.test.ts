import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * J3 — Idempotence de la classification en lot (« classify-batch »).
 *
 * Ce test prouve la LOGIQUE SQL « écrire seulement si absent », pas la stabilité du LLM :
 *  - `classify` est un STUB DÉTERMINISTE (catégorie + confiance fixes par sujet).
 *    Deux passes ne peuvent donc pas diverger à cause du non-déterminisme d'un modèle :
 *    un échec ici est un vrai échec de logique, jamais un faux positif.
 *  - Le batch, la base et les compteurs sont AUTO-PORTÉS dans ce fichier (base `:memory:`).
 *    Aucune dépendance à `scripts/classify-batch.ts` (pas encore codé) ni au disque.
 *
 * Règle d'idempotence testée :
 *  - Lecture  : `WHERE category IS NULL AND needs_review = 0` (on ne relit ni le classé, ni l'ambigu en attente).
 *  - Écriture : `UPDATE ... WHERE id = ? AND category IS NULL` (garde anti-doublon).
 *  - Cas ambigu (faible confiance) : `needs_review = 1`, `category` reste NULL (pas de décision auto).
 */

type Db = InstanceType<typeof Database>;

// --- Base de test : schéma tickets + colonne `needs_review` (absente du schéma prod). ---
function makeDb(): Db {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT,
      priority INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      needs_review INTEGER NOT NULL DEFAULT 0
    );
  `);
  const insert = db.prepare(
    `INSERT INTO tickets (id, subject, body, category, priority, status, created_at)
     VALUES (@id, @subject, @body, @category, @priority, @status, @created_at)`,
  );
  // 4 tickets nets à classer, 1 ambigu (→ needs_review), 1 déjà classé (ne doit jamais bouger).
  const rows = [
    { id: 1001, subject: "Connexion impossible", body: "blocage acces", category: null, priority: 2, status: "open", created_at: "2026-06-01" },
    { id: 1002, subject: "Facture en double", body: "doublon", category: null, priority: 2, status: "open", created_at: "2026-06-01" },
    { id: 1003, subject: "Page 500", body: "erreur serveur", category: null, priority: 3, status: "open", created_at: "2026-06-01" },
    { id: 1004, subject: "Ajout de champ export", body: "evolution", category: null, priority: 1, status: "open", created_at: "2026-06-01" },
    { id: 1005, subject: "xyzzy", body: "message incomprehensible", category: null, priority: 1, status: "open", created_at: "2026-06-01" },
    { id: 1006, subject: "Deja traite", body: "rien", category: "autre", priority: 1, status: "closed", created_at: "2026-06-01" },
  ];
  const tx = db.transaction(() => rows.forEach((r) => insert.run(r)));
  tx();
  return db;
}

// --- Stub déterministe : sujet -> { categorie, confiance }. Aucun appel modèle. ---
function classify(subject: string): { categorie: string; confiance: number } {
  const s = subject.toLowerCase();
  if (s.includes("connexion")) return { categorie: "acces", confiance: 0.95 };
  if (s.includes("facture")) return { categorie: "facturation", confiance: 0.92 };
  if (s.includes("500") || s.includes("erreur")) return { categorie: "bug", confiance: 0.9 };
  if (s.includes("ajout") || s.includes("champ")) return { categorie: "demande", confiance: 0.85 };
  // Rien de reconnu -> ambigu : faible confiance, à faire relire par un humain.
  return { categorie: "autre", confiance: 0.3 };
}

const SEUIL_CONFIANCE = 0.6;

/**
 * Classe en lot les tickets non traités.
 *  - Ne lit QUE `category IS NULL AND needs_review = 0`.
 *  - Confiance < seuil -> `needs_review = 1` (category laissé NULL, pas de décision auto).
 *  - Sinon UPDATE `category` avec la garde `AND category IS NULL` (idempotent).
 *  - `failAt` : lève après avoir traité ce nombre de tickets (injection de faute, cf. OPSDESK_FAIL_AT).
 * Retourne le nombre de lignes RÉELLEMENT classées (hors needs_review).
 */
function runClassifyBatch(db: Db, opts: { failAt?: number } = {}): number {
  const pending = db
    .prepare(`SELECT id, subject FROM tickets WHERE category IS NULL AND needs_review = 0 ORDER BY id`)
    .all() as Array<{ id: number; subject: string }>;
  const setCategory = db.prepare(`UPDATE tickets SET category = @categorie WHERE id = @id AND category IS NULL`);
  const flagReview = db.prepare(`UPDATE tickets SET needs_review = 1 WHERE id = @id AND category IS NULL`);

  let traites = 0;
  let classes = 0;
  for (const t of pending) {
    if (opts.failAt !== undefined && traites >= opts.failAt) {
      throw new Error("crash simulé (OPSDESK_FAIL_AT)");
    }
    const { categorie, confiance } = classify(t.subject);
    if (confiance < SEUIL_CONFIANCE) {
      flagReview.run({ id: t.id }); // ambigu -> relecture humaine, category reste NULL
    } else {
      classes += setCategory.run({ id: t.id, categorie }).changes; // changes=1 seulement si encore NULL
    }
    traites++;
  }
  return classes;
}

// Lignes réellement classées (category renseignée).
const countClassified = (db: Db): number =>
  (db.prepare(`SELECT count(*) AS n FROM tickets WHERE category IS NOT NULL`).get() as { n: number }).n;

// Lignes RESTANT à traiter : non classées ET non marquées pour relecture.
const countPending = (db: Db): number =>
  (db.prepare(`SELECT count(*) AS n FROM tickets WHERE category IS NULL AND needs_review = 0`).get() as { n: number }).n;

describe("classify-batch · idempotence", () => {
  let db: Db;

  beforeEach(() => {
    db = makeDb();
  });

  it("relancer deux fois donne le même résultat", () => {
    runClassifyBatch(db);
    const after1 = countClassified(db);

    runClassifyBatch(db); // deuxième passe
    const after2 = countClassified(db);

    expect(after2).toBe(after1); // aucune nouvelle classification (filtre category IS NULL)
    expect(countPending(db)).toBe(0); // tout est classé ou marqué needs_review
  });

  it("la 2e passe n'écrit aucune nouvelle ligne", () => {
    runClassifyBatch(db);
    const ecrites2 = runClassifyBatch(db); // rien ne doit matcher `category IS NULL`
    expect(ecrites2).toBe(0);
  });

  it("needs_review ne contient que des tickets à faible confiance", () => {
    runClassifyBatch(db);
    const flags = db.prepare(`SELECT id, subject FROM tickets WHERE needs_review = 1`).all() as Array<{
      id: number;
      subject: string;
    }>;
    expect(flags.length).toBeGreaterThan(0);
    for (const t of flags) {
      expect(classify(t.subject).confiance).toBeLessThan(SEUIL_CONFIANCE);
      // Un ticket en relecture garde volontairement category = NULL.
      const row = db.prepare(`SELECT category FROM tickets WHERE id = ?`).get(t.id) as { category: string | null };
      expect(row.category).toBeNull();
    }
  });

  it("ne reclasse jamais un ticket déjà classé (1006)", () => {
    runClassifyBatch(db);
    runClassifyBatch(db);
    const t = db.prepare(`SELECT category FROM tickets WHERE id = 1006`).get() as { category: string };
    expect(t.category).toBe("autre"); // valeur d'origine préservée
  });

  it("reprend après un crash sans reclasser ni dupliquer (injection de faute)", () => {
    // Crash après 2 tickets traités.
    expect(() => runClassifyBatch(db, { failAt: 2 })).toThrow(/crash simulé/);
    const restantApresCrash = countPending(db);
    expect(restantApresCrash).toBeGreaterThan(0);

    // Reprise : ne touche que le reste, puis plus rien à traiter.
    runClassifyBatch(db);
    expect(countPending(db)).toBe(0);

    // Rejouer une fois de plus reste sans effet (idempotent).
    const ecrites = runClassifyBatch(db);
    expect(ecrites).toBe(0);
  });
});
