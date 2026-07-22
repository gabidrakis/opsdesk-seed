import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/server.js";
import { computeTicketStats } from "../src/tickets.js";

// Base SQLite en memoire isolee ; on injecte un jeu de tickets au besoin.
function makeDb(rows: Array<{ id: number; status: string }> = []): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY,
      subject TEXT,
      body TEXT,
      category TEXT,
      priority INTEGER,
      status TEXT,
      created_at TEXT
    );
  `);
  const insert = db.prepare(`
    INSERT INTO tickets (id, subject, body, category, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    insert.run(r.id, "sujet", "corps", "autre", 1, r.status, "2026-05-12T09:14:00Z");
  }
  return db;
}

describe("GET /tickets/stats", () => {
  it("200 : repond avec succes", async () => {
    const app = buildApp(makeDb(), false);
    const res = await app.inject({ method: "GET", url: "/tickets/stats" });
    expect(res.statusCode).toBe(200);
  });

  it("compte correctement un jeu 2 open / 1 in_progress / 3 closed", async () => {
    const app = buildApp(
      makeDb([
        { id: 1, status: "open" },
        { id: 2, status: "open" },
        { id: 3, status: "in_progress" },
        { id: 4, status: "closed" },
        { id: 5, status: "closed" },
        { id: 6, status: "closed" },
      ]),
      false,
    );
    const res = await app.inject({ method: "GET", url: "/tickets/stats" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ open: 2, in_progress: 1, closed: 3 });
  });

  it("base vide -> tous les compteurs a zero", async () => {
    const app = buildApp(makeDb(), false);
    const res = await app.inject({ method: "GET", url: "/tickets/stats" });
    expect(res.json()).toEqual({ open: 0, in_progress: 0, closed: 0 });
  });

  it("un statut hors-liste (archived) est ignore, pas de cle supplementaire", async () => {
    const app = buildApp(
      makeDb([
        { id: 1, status: "open" },
        { id: 2, status: "archived" },
        { id: 3, status: "closed" },
      ]),
      false,
    );
    const res = await app.inject({ method: "GET", url: "/tickets/stats" });
    expect(res.json()).toEqual({ open: 1, in_progress: 0, closed: 1 });
  });

  it("non-collision : /tickets/stats ne tombe pas dans /tickets/:id (pas de 404)", async () => {
    const app = buildApp(makeDb(), false);
    const res = await app.inject({ method: "GET", url: "/tickets/stats" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).not.toEqual({ error: "ticket not found" });
  });
});

describe("computeTicketStats (unitaire, sans HTTP)", () => {
  it("compte les statuts d'un tableau en dur et ignore les statuts hors-liste", () => {
    const mk = (id: number, status: string) => ({
      id,
      subject: "s",
      body: "b",
      category: "autre",
      priority: 1,
      status,
      created_at: "2026-01-01T00:00:00Z",
    });
    const stats = computeTicketStats([
      mk(1, "open"),
      mk(2, "open"),
      mk(3, "in_progress"),
      mk(4, "closed"),
      mk(5, "archived"),
    ]);
    expect(stats).toEqual({ open: 2, in_progress: 1, closed: 1 });
  });

  it("tableau vide -> compteurs a zero", () => {
    expect(computeTicketStats([])).toEqual({ open: 0, in_progress: 0, closed: 0 });
  });
});
