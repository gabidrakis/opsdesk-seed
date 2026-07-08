// Wrapper trivial : matérialise le saut « slash-command → fonction déterministe ».
// Lit l'argument CLI, le passe comme `body` (le `subject` reste optionnel/vide),
// appelle classifierTicket et imprime le résultat en JSON sur stdout.
// Un corps vide ressort en { erreur: ... } (jamais une exception).
import { classifierTicket } from "./classifier-ticket.mjs";

const body = process.argv[2] ?? "";
const resultat = classifierTicket({ subject: "", body });
console.log(JSON.stringify(resultat));
