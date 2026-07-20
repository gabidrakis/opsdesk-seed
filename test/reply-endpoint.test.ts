import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { buildReplySuggestion } from "../src/reply.js";
import { buildApp } from "../src/server.js";

// Base SQLite en memoire isolee, injectee dans l'app via buildApp(db).
function makeDb(): Database.Database {
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
  db.prepare(`
    INSERT INTO tickets (id, subject, body, category, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    1001,
    "Cannot log in to the dashboard",
    "I keep getting an 'invalid credentials' error even after resetting my password twice.",
    "acces",
    3,
    "open",
    "2026-05-12T09:14:00Z",
  );
  return db;
}

describe("GET /tickets/:id/reply-suggestion", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp(makeDb(), false); // logger off en test
  });

  it("200 : suggestion non vide, contient le sujet et l'avertissement de relecture", async () => {
    const res = await app.inject({ method: "GET", url: "/tickets/1001/reply-suggestion" });
    expect(res.statusCode).toBe(200);

    const body = res.json() as { id: number; suggestion: string };
    expect(body.id).toBe(1001);
    expect(body.suggestion.length).toBeGreaterThan(0);
    expect(body.suggestion).toContain("Cannot log in to the dashboard");
    expect(body.suggestion).toMatch(/Relecture humaine/i);
  });

  it("déterminisme : deux appels renvoient exactement la même suggestion", async () => {
    const a = (await app.inject({ url: "/tickets/1001/reply-suggestion" })).json() as { suggestion: string };
    const b = (await app.inject({ url: "/tickets/1001/reply-suggestion" })).json() as { suggestion: string };
    expect(a.suggestion).toBe(b.suggestion);
  });

  it("404 : ticket inconnu", async () => {
    const res = await app.inject({ method: "GET", url: "/tickets/999999/reply-suggestion" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "ticket not found" });
  });

  it("buildReplySuggestion se termine toujours par l'avertissement", () => {
    const ticket = {
      id: 42,
      subject: "Test",
      body: "corps",
      category: "autre",
      priority: 1,
      status: "open",
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(buildReplySuggestion(ticket).trimEnd()).toMatch(/Relecture humaine OBLIGATOIRE avant envoi réel\.$/);
  });
});
