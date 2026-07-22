import { describe, it, expect } from "vitest";
import { classifierTicket } from "./classifier-ticket.mjs";
import { ClassificationSchema } from "../src/classification/schema.ts";

// Le lab porte sur le CONTRAT de l'outil, pas sur la finesse de classification :
// - sortie conforme au schéma du module 2 (source de vérité unique) ;
// - erreur RENVOYÉE (pas levée) sur corps vide.
describe("classifierTicket — contrat de l'outil", () => {
  it("bug évident → catégorie 'bug', sortie conforme au schéma", () => {
    const res = classifierTicket({
      subject: "Erreur au démarrage",
      body: "Le tableau de bord plante avec une erreur 500.",
    });
    expect(res.erreur).toBeUndefined();
    expect(res.categorie).toBe("bug");
    expect(ClassificationSchema.safeParse(res).success).toBe(true);
  });

  it("question ambiguë → 'autre' avec besoin_humain=true (on ne tranche pas seul)", () => {
    const res = classifierTicket({
      subject: "Question",
      body: "Bonjour, j'aurais une petite question générale.",
    });
    expect(res.erreur).toBeUndefined();
    expect(res.categorie).toBe("autre");
    expect(res.besoin_humain).toBe(true);
    expect(ClassificationSchema.safeParse(res).success).toBe(true);
  });

  it("corps vide → { erreur } SANS lever d'exception", () => {
    expect(() => classifierTicket({ subject: "x", body: "" })).not.toThrow();
    const res = classifierTicket({ subject: "x", body: "" });
    expect(res).toEqual({ erreur: "corps vide, classification impossible" });
    expect(res.categorie).toBeUndefined();
  });
});
