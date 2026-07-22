import { pathToFileURL } from "node:url";
import type BetterSqlite3 from "better-sqlite3";
import Fastify, { type FastifyInstance } from "fastify";
import { PORT } from "./config.js";
import { db as defaultDb } from "./db.js";
import { buildReplySuggestion } from "./reply.js";
import { computeTicketStats, getTicket, listTickets, updateTicketStatus } from "./tickets.js";

type DB = BetterSqlite3.Database;

// Construit l'application Fastify. `database` est injectable pour les tests
// (base :memory:), avec repli sur la base par defaut de l'application.
export function buildApp(database: DB = defaultDb, logger = true): FastifyInstance {
  const app = Fastify({ logger });

  // Sonde de sante (utilisee comme critere de verification d'environnement).
  app.get("/health", async () => {
    return { status: "ok" };
  });

  // Liste tous les tickets.
  app.get("/tickets", async () => {
    return listTickets(database);
  });

  // Retourne un ticket par identifiant.
  app.get<{ Params: { id: string } }>("/tickets/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const ticket = getTicket(id, database);
    if (!ticket) {
      return reply.code(404).send({ error: "ticket not found" });
    }
    return ticket;
  });

  // Met a jour le statut d'un ticket.
  app.post<{ Params: { id: string }; Body: { status?: string } }>(
    "/tickets/:id/status",
    async (request, reply) => {
      const id = Number(request.params.id);
      const status = request.body?.status;
      if (!status) {
        return reply.code(400).send({ error: "status is required" });
      }
      const updated = updateTicketStatus(id, status, database);
      if (!updated) {
        return reply.code(404).send({ error: "ticket not found" });
      }
      return getTicket(id, database);
    },
  );

  // Propose une reponse client pour un ticket (lecture seule, aucun envoi).
  // Renvoie { id, suggestion } ; la suggestion porte l'avertissement de relecture.
  app.get<{ Params: { id: string } }>(
    "/tickets/:id/reply-suggestion",
    async (request, reply) => {
      const id = Number(request.params.id);
      const ticket = getTicket(id, database);
      if (!ticket) {
        return reply.code(404).send({ error: "ticket not found" });
      }
      return { id: ticket.id, suggestion: buildReplySuggestion(ticket) };
    },
  );

  // Ferme un ticket (statut -> "closed"). Defaut volontaire J5 : livre SANS test,
  // pour que la revue agentique le signale sur la PR de demonstration.
  app.post<{ Params: { id: string } }>(
    "/tickets/:id/close",
    async (request, reply) => {
      const id = Number(request.params.id);
      const updated = updateTicketStatus(id, "closed", database);
      if (!updated) {
        return reply.code(404).send({ error: "ticket not found" });
      }
      return getTicket(id, database);
    },
  );

  // Compteurs de tickets par statut (open / in_progress / closed).
  app.get("/tickets/stats", async () => {
    return computeTicketStats(listTickets(database));
  });

  return app;
}

// Demarrage reel du serveur UNIQUEMENT quand ce fichier est le point d'entree
// (`tsx src/server.ts` / `node dist/server.js`). A l'import (tests), on ne demarre pas.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = buildApp();
  app
    .listen({ port: PORT, host: "0.0.0.0" })
    .then((address) => {
      app.log.info(`OpsDesk listening on ${address}`);
    })
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}
