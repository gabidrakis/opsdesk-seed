import { z } from "zod";

// Schéma de la sortie de classification produite par le LLM (clés en français).
// Décrit l'écran « Sortie structurée » (Lab 2) ; catégories = référentiel métier
// OpsDesk (voir CLAUDE.md / src/seed.ts). Toute sortie non conforme est rejetée.
export const ClassificationSchema = z.object({
  categorie: z.enum(["acces", "facturation", "bug", "demande", "autre"]),
  priorite: z.number().int().min(1).max(3),
  besoin_humain: z.boolean(),
  confiance: z.number().min(0).max(1),
  justification: z.string().min(1).max(280),
});

export type Classification = z.infer<typeof ClassificationSchema>;
