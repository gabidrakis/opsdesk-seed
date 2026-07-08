import type BetterSqlite3 from "better-sqlite3";
import { db as defaultDb, type Ticket } from "./db.js";

type DB = BetterSqlite3.Database;

// Retourne tous les tickets, du plus recent au plus ancien.
export function listTickets(database: DB = defaultDb): Ticket[] {
  return database
    .prepare("SELECT * FROM tickets ORDER BY created_at DESC")
    .all() as Ticket[];
}

// Retourne un ticket par son identifiant, ou undefined s'il n'existe pas.
export function getTicket(id: number, database: DB = defaultDb): Ticket | undefined {
  return database
    .prepare("SELECT * FROM tickets WHERE id = ?")
    .get(id) as Ticket | undefined;
}

// Compteurs de tickets par statut, restreints aux 3 statuts attendus.
export type TicketStats = { open: number; in_progress: number; closed: number };

// Fonction PURE : compte les tickets par statut. Aucun acces base, aucun SQL.
// Les statuts hors des 3 cles attendues sont ignores.
export function computeTicketStats(tickets: Ticket[]): TicketStats {
  const stats: TicketStats = { open: 0, in_progress: 0, closed: 0 };
  for (const t of tickets) {
    if (t.status === "open" || t.status === "in_progress" || t.status === "closed") {
      stats[t.status] += 1;
    }
  }
  return stats;
}

// Met a jour le statut d'un ticket. Retourne true si une ligne a ete modifiee.
export function updateTicketStatus(
  id: number,
  status: string,
  database: DB = defaultDb,
): boolean {
  const result = database
    .prepare("UPDATE tickets SET status = ? WHERE id = ?")
    .run(status, id);
  return result.changes > 0;
}
