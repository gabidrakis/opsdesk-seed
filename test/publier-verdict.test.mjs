import { describe, it, expect } from "vitest";
import { validerVerdict, rendreMarkdown, MARQUEUR } from "../scripts/publier-verdict.mjs";

const conforme = {
  verdict: "request_changes",
  findings: [{ severite: "bloquant", fichier: "src/config.ts", message: "secret en clair" }],
  summary: "Un secret est exposé.",
};

describe("validerVerdict", () => {
  it("accepte un verdict conforme", () => {
    expect(validerVerdict(conforme)).toBe(true);
  });

  it("accepte findings vide (verdict approve)", () => {
    expect(validerVerdict({ verdict: "approve", findings: [], summary: "rien" })).toBe(true);
  });

  it("rejette un verdict hors whitelist", () => {
    expect(() => validerVerdict({ ...conforme, verdict: "merge" })).toThrow();
  });

  it("rejette findings non-tableau", () => {
    expect(() => validerVerdict({ ...conforme, findings: {} })).toThrow();
  });

  it("rejette summary non-string", () => {
    expect(() => validerVerdict({ ...conforme, summary: 42 })).toThrow();
  });

  it("rejette un champ manquant", () => {
    expect(() => validerVerdict({ verdict: "approve", findings: [] })).toThrow();
  });

  it("rejette une severite de finding invalide", () => {
    expect(() =>
      validerVerdict({ ...conforme, findings: [{ severite: "grave", fichier: "a", message: "b" }] }),
    ).toThrow();
  });
});

describe("rendreMarkdown", () => {
  it("contient le marqueur, le verdict, le summary et une ligne par finding", () => {
    const md = rendreMarkdown(conforme);
    expect(md).toContain(MARQUEUR);
    expect(md).toContain("`request_changes`");
    expect(md).toContain("Un secret est exposé.");
    expect(md).toContain("src/config.ts");
    expect(md.match(/^- \*\*/gm)).toHaveLength(1);
  });

  it("affiche _Aucun point soulevé._ si findings vide", () => {
    const md = rendreMarkdown({ verdict: "approve", findings: [], summary: "rien" });
    expect(md).toContain("_Aucun point soulevé._");
  });
});
