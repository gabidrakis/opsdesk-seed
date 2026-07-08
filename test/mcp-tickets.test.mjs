import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  buildServer,
  listTickets,
  getTicket,
} from "../mcp/tickets-server.mjs";

// Base :memory: injectée : prouve la logique SQL des outils sans toucher data/opsdesk.db.
function makeDb() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE tickets (
    id INTEGER PRIMARY KEY, subject TEXT, body TEXT, category TEXT,
    priority INTEGER, status TEXT, created_at TEXT
  );`);
  const insert = db.prepare(
    "INSERT INTO tickets (id, subject, body, category, priority, status, created_at) VALUES (?,?,?,?,?,?,?)",
  );
  insert.run(1001, "Sujet A", "Corps A", "bug", 2, "open", "2026-01-01");
  insert.run(1002, "Sujet B", "Corps B", "acces", 1, "closed", "2026-01-02");
  return db;
}

// Relie un vrai Client MCP au serveur via un transport in-memory (bout-en-bout).
async function connectClient(db) {
  const server = buildServer(db);
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return client;
}

const parse = (res) => JSON.parse(res.content[0].text);

describe("serveur MCP tickets — 3 outils gouvernés", () => {
  it("expose EXACTEMENT 3 outils, aucune surface SQL générique", async () => {
    const client = await connectClient(makeDb());
    const noms = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(noms).toEqual(["get_ticket", "list_tickets", "update_ticket_status"]);
    expect(noms).not.toContain("run_query");
    expect(noms).not.toContain("execute_sql");
  });

  it("list_tickets filtre par statut", async () => {
    const client = await connectClient(makeDb());
    const tous = parse(await client.callTool({ name: "list_tickets", arguments: {} }));
    expect(tous).toHaveLength(2);
    const ouverts = parse(
      await client.callTool({ name: "list_tickets", arguments: { status: "open" } }),
    );
    expect(ouverts.map((t) => t.id)).toEqual([1001]);
  });

  it("get_ticket 999 → erreur GÉRÉE (pas de crash, pas d'exception)", async () => {
    const client = await connectClient(makeDb());
    const res = await client.callTool({ name: "get_ticket", arguments: { id: 999 } });
    expect(res.isError).toBeFalsy();
    expect(parse(res)).toEqual({ erreur: "ticket 999 introuvable" });
  });

  it("update_ticket_status change réellement le statut en base", async () => {
    const db = makeDb();
    const client = await connectClient(db);
    const res = parse(
      await client.callTool({
        name: "update_ticket_status",
        arguments: { id: 1001, status: "in_progress" },
      }),
    );
    expect(res).toEqual({ ok: true, id: 1001, status: "in_progress" });
    expect(getTicket(db, { id: 1001 }).status).toBe("in_progress");
  });

  it("écriture gardée : id inexistant → erreur gérée, aucune ligne créée", async () => {
    const db = makeDb();
    const client = await connectClient(db);
    const res = parse(
      await client.callTool({
        name: "update_ticket_status",
        arguments: { id: 999, status: "closed" },
      }),
    );
    expect(res).toEqual({ erreur: "ticket 999 introuvable" });
    expect(listTickets(db)).toHaveLength(2);
  });

  it("requête paramétrée : une valeur SQL hostile ne s'exécute pas", async () => {
    const db = makeDb();
    const client = await connectClient(db);
    // status invalide (hors enum) → refusé par la validation zod, pas d'injection possible.
    const res = await client.callTool({
      name: "list_tickets",
      arguments: { status: "open'; DROP TABLE tickets;--" },
    });
    expect(res.isError).toBe(true); // validation d'entrée rejette
    expect(listTickets(db)).toHaveLength(2); // table intacte
  });
});
