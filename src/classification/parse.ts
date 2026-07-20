import { ClassificationSchema, type Classification } from "./schema.js";

// Extrait le premier objet JSON complet d'un texte potentiellement bavard.
// Repère la première accolade ouvrante puis suit la profondeur — en ignorant
// les accolades situées à l'intérieur des chaînes — jusqu'à sa fermeture.
function extraireJson(texte: string): string {
  const debut = texte.indexOf("{");
  if (debut === -1) {
    throw new Error("Aucun objet JSON trouvé dans la réponse");
  }

  let profondeur = 0;
  let dansChaine = false;
  let echappe = false;

  for (let i = debut; i < texte.length; i++) {
    const c = texte[i];

    if (dansChaine) {
      if (echappe) echappe = false;
      else if (c === "\\") echappe = true;
      else if (c === '"') dansChaine = false;
      continue;
    }

    if (c === '"') dansChaine = true;
    else if (c === "{") profondeur++;
    else if (c === "}") {
      profondeur--;
      if (profondeur === 0) return texte.slice(debut, i + 1);
    }
  }

  throw new Error("Objet JSON incomplet dans la réponse");
}

// Extrait puis valide la classification renvoyée par le LLM.
// Lève une erreur explicite si le JSON est absent, mal formé, ou non conforme.
export function parseClassification(raw: string): Classification {
  const json = extraireJson(raw);

  let donnees: unknown;
  try {
    donnees = JSON.parse(json);
  } catch {
    throw new Error("JSON extrait mais mal formé (JSON.parse a échoué)");
  }

  return ClassificationSchema.parse(donnees);
}
