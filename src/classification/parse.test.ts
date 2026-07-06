import { describe, it, expect } from "vitest";
import { parseClassification } from "./parse.js";

describe("parseClassification", () => {
  it("extrait et valide un JSON enrobé de prose", () => {
    const raw = `Voici le résultat : {"categorie":"acces","priorite":3,
      "besoin_humain":false,"confiance":0.85,"justification":"Connexion impossible"}
      Besoin d'autre chose ?`;
    const result = parseClassification(raw);
    expect(result.categorie).toBe("acces");
    expect(result.priorite).toBe(3);
  });

  it("rejette une catégorie hors énumération", () => {
    const raw = JSON.stringify({
      categorie: "spam", // ← invalide
      priorite: 1,
      besoin_humain: false,
      confiance: 0.5,
      justification: "Test",
    });
    expect(() => parseClassification(raw)).toThrow();
  });

  it("rejette une clé manquante (JSON enrobé mais incomplet)", () => {
    const raw = `Voici ma réponse : {"categorie":"bug"}`; // clés manquantes
    expect(() => parseClassification(raw)).toThrow();
  });

  // Contrôle de stabilité des clés : les 2 sorties observées au Lab 1
  // (prompts/classer-ticket.md) doivent rester valides.
  it.each([
    `{"categorie":"bug","priorite":3,"besoin_humain":false,"confiance":0.92,"justification":"L'endpoint bulk renvoie une erreur serveur (500) au-delà de 50 ids : dysfonctionnement technique"}`,
    `{"categorie":"facturation","priorite":2,"besoin_humain":true,"confiance":0.8,"justification":"Demande de remboursement au prorata après downgrade : décision financière à valider par un humain"}`,
  ])("valide la sortie observée %#", (raw) => {
    expect(() => parseClassification(raw)).not.toThrow();
  });
});
