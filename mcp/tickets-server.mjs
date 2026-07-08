// Serveur MCP « tickets » : SEUL point d'accès à la base tickets pour l'agent.
// Expose exactement 3 outils intentionnels et gouvernés — AUCUN outil SQL générique
// (pas de run_query / execute_sql). Chaque outil construit lui-même une requête
// PARAMÉTRÉE (jamais de concaténation de chaîne) → dépendance de sécurité.
//
// Tourne sous `node` nu (cf. `claude mcp add tickets -- node …/mcp/tickets-server.mjs`),
// donc ce fichier n'importe aucun `.ts` : il ouvre sa propre connexion better-sqlite3.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import { z } from "zod";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const STATUTS = ["open", "in_progress", "closed"];

// --- Logique métier : requêtes PARAMÉTRÉES, `db` injectable pour les tests ---

// Liste les tickets, optionnellement filtrés par statut (le plus récent d'abord).
export function listTickets(db, { status } = {}) {
  if (status) {
    return db
      .prepare("SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC")
      .all(status);
  }
  return db.prepare("SELECT * FROM tickets ORDER BY created_at DESC").all();
}

// Retourne un ticket par id, ou une erreur GÉRÉE (pas d'exception) s'il est absent.
export function getTicket(db, { id }) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  return ticket ?? { erreur: `ticket ${id} introuvable` };
}

// Met à jour le statut d'un ticket. Confirmation, ou erreur gérée si l'id n'existe pas.
export function updateTicketStatus(db, { id, status }) {
  const res = db
    .prepare("UPDATE tickets SET status = ? WHERE id = ?")
    .run(status, id);
  if (res.changes === 0) return { erreur: `ticket ${id} introuvable` };
  return { ok: true, id, status };
}

// --- Câblage MCP : 3 outils, aucune surface SQL générique ---

const asText = (valeur) => ({
  content: [{ type: "text", text: JSON.stringify(valeur) }],
});

export function buildServer(db) {
  const server = new McpServer({ name: "tickets", version: "1.0.0" });

  server.registerTool(
    "list_tickets",
    {
      title: "Lister les tickets",
      description:
        "Liste les tickets, optionnellement filtrés par statut. LECTURE SEULE. " +
        "N'utilise pas cet outil pour modifier un ticket.",
      inputSchema: { status: z.enum(STATUTS).optional() },
    },
    async (args) => asText(listTickets(db, args)),
  );

  server.registerTool(
    "get_ticket",
    {
      title: "Récupérer un ticket",
      description:
        "Retourne un ticket par son id, ou une erreur gérée si l'id est introuvable. " +
        "LECTURE SEULE.",
      inputSchema: { id: z.number().int() },
    },
    async (args) => asText(getTicket(db, args)),
  );

  server.registerTool(
    "update_ticket_status",
    {
      title: "Changer le statut d'un ticket",
      description:
        "Met à jour le statut d'un ticket (open | in_progress | closed). " +
        "SEULE écriture autorisée par ce serveur ; aucune suppression, aucun SQL libre.",
      inputSchema: {
        id: z.number().int(),
        status: z.enum(STATUTS),
      },
    },
    async (args) => asText(updateTicketStatus(db, args)),
  );

  return server;
}

// Ouvre la base réelle. Chemin via env OPSDESK_DB, sinon data/opsdesk.db du projet
// (résolu depuis l'emplacement du script → robuste quel que soit le cwd de lancement).
function openDefaultDb() {
  const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const dbPath = process.env.OPSDESK_DB ?? join(projectRoot, "data", "opsdesk.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

// Démarrage réel UNIQUEMENT en point d'entrée (`node mcp/tickets-server.mjs`).
// À l'import (tests), on ne démarre pas de transport.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = buildServer(openDefaultDb());
  await server.connect(new StdioServerTransport());
}
