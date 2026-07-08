// valider-classification.ts — valide une sortie de classification contre le
// schéma (src/classification/schema.ts) via parseClassification.
//
// Usage : npx tsx scripts/valider-classification.ts '<JSON de classification>'
// Sortie : affiche la classification validée + exit 0 si conforme ;
//          affiche l'erreur de validation + exit 1 sinon.
import { parseClassification } from "../src/classification/parse.js";

const raw = process.argv[2];
if (!raw) {
  console.error("Usage : npx tsx scripts/valider-classification.ts '<JSON>'");
  process.exit(1);
}

try {
  const classification = parseClassification(raw);
  console.log("✅ Validation OK — conforme à src/classification/schema.ts");
  console.log(JSON.stringify(classification, null, 2));
} catch (err) {
  console.error("❌ Validation ÉCHOUÉE :");
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
