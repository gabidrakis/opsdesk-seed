import type { Ticket } from "./db.js";

// Construit une PROPOSITION de réponse client en français pour un ticket.
// Suit la convention de ton OpsDesk (.claude/memory/reponses-tickets.md) :
// vouvoiement, accusé de réception → réponse → prochaine étape → clôture,
// pas de délai chiffré. Fonction pure et déterministe (aucune I/O, aucun LLM).
//
// NB : proposition seulement — l'appelant DOIT faire relire avant tout envoi réel.

// Corps adapté à la catégorie métier (acces / facturation / bug / demande / autre).
function corpsParCategorie(categorie: string): { reponse: string; prochaineEtape: string } {
  switch (categorie) {
    case "acces":
      return {
        reponse:
          "Nous comprenons la gêne liée à ce blocage d'accès. Nous vous invitons à vérifier " +
          "l'adresse e-mail utilisée, à retenter depuis une fenêtre de navigation privée, puis " +
          "à réinitialiser votre mot de passe si le problème persiste.",
        prochaineEtape:
          "Si l'accès reste bloqué, précisez-nous l'e-mail du compte et l'horodatage d'une " +
          "tentative récente pour que nous vérifiions les journaux d'authentification.",
      };
    case "facturation":
      return {
        reponse:
          "Nous prenons votre demande de facturation au sérieux et allons la vérifier avec soin.",
        prochaineEtape:
          "Merci de nous communiquer la référence de la facture concernée afin que nous " +
          "puissions contrôler le montant et procéder à toute régularisation nécessaire.",
      };
    case "bug":
      return {
        reponse:
          "Nous avons bien noté le dysfonctionnement rencontré et le transmettons à notre équipe technique.",
        prochaineEtape:
          "Pour accélérer le diagnostic, indiquez-nous les étapes exactes de reproduction et, " +
          "si possible, l'heure approximative à laquelle l'erreur est survenue.",
      };
    case "demande":
      return {
        reponse:
          "Merci pour cette suggestion, que nous transmettons à notre équipe produit pour étude.",
        prochaineEtape:
          "Nous reviendrons vers vous si des précisions sont utiles à l'évaluation de cette demande.",
      };
    default:
      return {
        reponse:
          "Nous avons bien pris connaissance de votre message et allons y donner suite.",
        prochaineEtape:
          "Nous reviendrons vers vous avec les éléments utiles ; n'hésitez pas à compléter " +
          "votre demande si besoin.",
      };
  }
}

export function buildReplySuggestion(ticket: Ticket): string {
  const { reponse, prochaineEtape } = corpsParCategorie(ticket.category);

  return [
    "Bonjour,",
    "",
    `Nous avons bien reçu votre demande « ${ticket.subject} » et vous remercions de votre message.`,
    "",
    reponse,
    "",
    `Prochaine étape : ${prochaineEtape}`,
    "",
    "Nous restons à votre disposition.",
    "",
    "Cordialement,",
    "L'équipe Support OpsDesk",
    "",
    "⚠️ Relecture humaine OBLIGATOIRE avant envoi réel.",
  ].join("\n");
}
