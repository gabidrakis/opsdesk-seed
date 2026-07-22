#!/usr/bin/env bash
# guard-commit.sh — Hook PreToolUse (filtre Bash) : refuse tout `git commit`
# dont le contenu STAGE contient un secret OpsDesk.
#
# Entree : evenement hook au format JSON sur stdin (champ .tool_input.command).
# Sortie : exit 0 = laisser passer ; exit 2 = BLOQUER (stderr = raison, relue
#          par Claude Code qui refuse alors l'appel d'outil).
# Portee : ne scanne QUE `git diff --cached`. Un `git commit -a` ne stage pas
#          au moment du scan -> non detecte (comportement documente, pas un bug).
set -u

# 1. Lire l'evenement hook depuis stdin.
input=$(cat)

# 2. Extraire la commande Bash. node est present (projet Node) et parse le JSON
#    de maniere fiable ; repli sur l'entree brute si node est indisponible.
if command -v node >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String((JSON.parse(s).tool_input||{}).command||""))}catch(e){process.stdout.write("")}})') || cmd=""
else
  cmd="$input"
fi

# 3. Ne reagir qu'aux tentatives de commit ; tout le reste passe (ex. `ls`).
if ! printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+commit'; then
  exit 0
fi

# 4. Scanner le contenu stage.
staged=$(git diff --cached 2>/dev/null) || staged=""

# 5. Motif de secret OpsDesk : prefixe des cles `opsdesk_live_...`.
secret_re='opsdesk_live_[A-Za-z0-9]+'

if printf '%s\n' "$staged" | grep -Eq "$secret_re"; then
  ts=$(date '+%Y-%m-%dT%H:%M:%S%z')
  {
    echo "==============================================================="
    echo "  COMMIT BLOQUE par scripts/guard-commit.sh"
    echo "  Horodatage : ${ts}"
    echo "  Raison     : secret detecte dans le contenu stage"
    echo "               (motif : ${secret_re})"
    echo "  Action     : retire le secret du fichier, re-stage, recommite."
    echo "==============================================================="
  } >&2
  exit 2
fi

exit 0
