import { describe, it, expect } from "vitest";
import { nettoyerSortie } from "../scripts/revue-agent.mjs";

// Cible la SEULE fonction pure du script (le call `claude` est externe, non testé ici).
describe("nettoyerSortie", () => {
  const json = '{ "verdict": "approve", "findings": [], "summary": "ok" }';

  it("retire une clôture ```json … ```", () => {
    expect(nettoyerSortie("```json\n" + json + "\n```")).toBe(json);
  });

  it("retire une clôture ``` … ``` sans langage", () => {
    expect(nettoyerSortie("```\n" + json + "\n```")).toBe(json);
  });

  it("laisse un JSON nu intact", () => {
    expect(nettoyerSortie(json)).toBe(json);
  });

  it("gère les espaces autour", () => {
    expect(nettoyerSortie("  \n" + json + "\n  ")).toBe(json);
  });
});
