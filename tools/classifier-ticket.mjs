import { ClassificationSchema } from "../src/classification/schema.ts";

// Classification DÉTERMINISTE (stub à règles). Le lab porte sur le CONTRAT de
// l'outil, pas sur la qualité de classification : un système réel délèguerait
// cette logique à un modèle. Rester déterministe rend l'outil TESTABLE.
export function classifierTicket({ subject = "", body }) {
  if (!body) return { erreur: "corps vide, classification impossible" };
  const t = `${subject} ${body}`.toLowerCase();
  const categorie =
    /connexion|login|403|acc[eè]s|mot de passe/.test(t) ? "acces" :
    /factur|paiement|abonnement|rembours/.test(t)       ? "facturation" :
    /erreur|bug|plante|crash|500/.test(t)                ? "bug" :
    /pourriez|possible|ajouter|demande/.test(t)          ? "demande" : "autre";
  const priorite = /urgent|bloqu|impossible|critique/.test(t) ? 3
                 : /erreur|bug/.test(t) ? 2 : 1;
  const sortie = {
    categorie, priorite,
    besoin_humain: categorie === "autre" || priorite === 3,
    confiance: 0.6,
    justification: `Classé '${categorie}' (priorité ${priorite}) par règles sur sujet+corps.`,
  };
  const res = ClassificationSchema.safeParse(sortie);
  return res.success
    ? res.data
    : { erreur: `sortie non conforme: ${res.error.issues.map((i) => i.message).join(", ")}` };
}
