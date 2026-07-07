import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { classifyBatch, ensureNeedsReviewColumn } from "../scripts/classify-batch.js";
import type { Classification } from "../src/classification/schema.js";

/**
 * J3 — Idempotence & reprise après crash de scripts/classify-batch.ts.
 *
 * On teste la VRAIE logique SQL du script (classifyBatch importé), avec un `classify`
 * MOCKÉ déterministe : le test prouve « écrire seulement si absent », pas la stabilité du LLM.
 */

// classify mocké : sortie déterministe (catégorie fixe par sujet), conforme à ClassificationSchema.
function classifyMock(subject: string): Classification {
  const s = subject.toLowerCase();
  const categorie: Classification["categorie"] = s.includes("connexion")
    ? "acces"
    : s.includes("facture")
      ? "facturation"
      : s.includes("erreur") || s.includes("500")
        ? "bug"
        : s.includes("ajout")
          ? "demande"
          : "autre";
  const confiance = categorie === "autre" ? 0.3 : 0.9; // "autre" ambigu -> < 0.7 -> needs_review
  return { categorie, priorite: 2, besoin_humain: confiance < 0.7, confiance, justification: "mock" };
}

const opts = { classify: classifyMock };

const countPending = (db: Database.Database): number =>
  (db.prepare(`SELECT count(*) AS n FROM tickets WHERE category IS NULL AND needs_review = 0`).get() as { n: number }).n;

// Base :memory: SANS colonne needs_review (comme le schéma prod) : la migration l'ajoute.
function makeDb(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY, subject TEXT, body TEXT, category TEXT,
      priority INTEGER, status TEXT, created_at TEXT
    );
  `);
  const insert = db.prepare(
    `INSERT INTO tickets (id, subject, body, category, priority, status, created_at)
     VALUES (?, ?, ?, ?, 2, 'open', '2026-06-01')`,
  );
  // 4 tickets nets à classer, 1 ambigu (-> needs_review), 1 déjà classé (ne doit jamais bouger).
  insert.run(1001, "Connexion impossible", "blocage", null);
  insert.run(1002, "Facture en double", "doublon", null);
  insert.run(1003, "Erreur 500", "serveur", null);
  insert.run(1004, "Ajout de champ", "evolution", null);
  insert.run(1005, "xyzzy", "incompréhensible", null);
  insert.run(1006, "Déjà traité", "rien", "autre");
  return db;
}

describe("classify-batch · idempotence & reprise", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
    ensureNeedsReviewColumn(db);
  });

  it("migration needs_review est idempotente (rejouable sans erreur)", () => {
    expect(() => {
      ensureNeedsReviewColumn(db);
      ensureNeedsReviewColumn(db);
    }).not.toThrow();
  });

  it("deux passes : même résultat, zéro écriture supplémentaire à la 2e", () => {
    const r1 = classifyBatch(db, opts);
    expect(r1.classes).toBe(4); // 1001..1004
    expect(r1.enRelecture).toBe(1); // 1005 (confiance 0.3)
    expect(r1.restants).toBe(0);
    const snap1 = db.prepare(`SELECT id, category, needs_review FROM tickets ORDER BY id`).all();

    const r2 = classifyBatch(db, opts); // deuxième passe
    expect(r2.classes).toBe(0); // aucune nouvelle classification
    expect(r2.enRelecture).toBe(0);
    const snap2 = db.prepare(`SELECT id, category, needs_review FROM tickets ORDER BY id`).all();

    expect(snap2).toEqual(snap1); // état strictement identique
  });

  it("ne réécrit jamais un ticket déjà classé (1006)", () => {
    classifyBatch(db, opts);
    classifyBatch(db, opts);
    const row = db.prepare(`SELECT category FROM tickets WHERE id = 1006`).get() as { category: string };
    expect(row.category).toBe("autre");
  });

  it("reprend après un crash sans dupliquer ni reclasser", () => {
    // Crash après 2 tickets traités : les 2 écritures sont committées (pas de transaction).
    expect(() => classifyBatch(db, { ...opts, failAt: 2 })).toThrow(/crash simulé/);
    expect(countPending(db)).toBeGreaterThan(0); // il reste du travail

    // Reprise : ne traite que le reste, jusqu'à épuisement.
    classifyBatch(db, opts);
    expect(countPending(db)).toBe(0);

    // Rejouer encore : idempotent (0 écriture).
    const r = classifyBatch(db, opts);
    expect(r.classes).toBe(0);
    expect(r.enRelecture).toBe(0);
  });
});
