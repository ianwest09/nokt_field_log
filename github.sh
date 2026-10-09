# NOKT FIELD LOG — push to GitHub from Android (Termux)
# First run:  bash ~/nokt/github.sh
# After that: bash ~/nokt/github.sh "what I changed"

REPO=nokt_field_log
DIR="$(cd "$(dirname "$0")" && pwd)"
MSG="${1:-update $(date +%Y-%m-%d\ %H:%M)}"

say(){ printf '\n  %s\n' "$*"; }
die(){ printf '\n  ----------------------------------------\n  STOPPED: %s\n  %s\n  ----------------------------------------\n\n' "$1" "$2"; exit 1; }

printf '\n  NOKT FIELD LOG — GitHub\n  -----------------------\n'

[ -f "$DIR/index.html" ] || die "index.html not found in $DIR" "Run this from inside the app folder."

# ---- git present? ---------------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
  say "installing git ..."
  pkg install -y git || die "could not install git" "Run 'pkg upgrade -y' then try again."
fi

cd "$DIR" || exit 1

# ---- identity (once) ------------------------------------------------------
if [ -z "$(git config --global user.email 2>/dev/null)" ]; then
  printf '\n  Your GitHub email: '; read -r EMAIL
  printf '  Your name: '; read -r NAME
  git config --global user.email "$EMAIL"
  git config --global user.name "$NAME"
fi

# ---- repo (once) ----------------------------------------------------------
if [ ! -d .git ]; then
  say "creating local repository"
  git init -q
  git branch -M main
fi

printf '.DS_Store\nThumbs.db\n*.log\nnokt-backup-*.json\n' > .gitignore
touch .nojekyll

# ---- remote (once) --------------------------------------------------------
if ! git remote get-url origin >/dev/null 2>&1; then
  printf '\n  Your GitHub username: '; read -r USERNAME
  [ -n "$USERNAME" ] || die "no username given" "Run it again."
  git remote add origin "https://github.com/$USERNAME/$REPO.git"
  say "remote set to https://github.com/$USERNAME/$REPO.git"
  cat <<'NOTE'

  Before the next step, the empty repository must exist on GitHub:
    github.com  ->  +  ->  New repository
    Name:  nokt_field_log
    Do NOT tick "Add a README" or any other file.

  You will be asked for a username and password below.
  The PASSWORD IS NOT YOUR GITHUB PASSWORD. It is a token:
    github.com -> Settings -> Developer settings
      -> Personal access tokens -> Tokens (classic)
      -> Generate new token, tick the "repo" box, copy it.

NOTE
  printf '  Press enter once the empty repo exists ... '; read -r _
fi

# ---- commit ---------------------------------------------------------------
git add -A
if git diff --cached --quiet 2>/dev/null; then
  say "nothing changed since the last push"
else
  git commit -qm "$MSG" && say "committed: $MSG"
fi

# ---- push -----------------------------------------------------------------
say "pushing ..."
if git push -u origin main; then
  RAW=$(git remote get-url origin)
  case "$RAW" in
    *github.com[:/]*)
      URL=$(printf '%s' "$RAW" | sed -e 's|.*github\.com[:/]||' -e 's|\.git$||' -e 's|/*$||')
      USER_PART=${URL%%/*}
      ;;
    *)
      say "pushed to $RAW"
      exit 0
      ;;
  esac
  cat <<MSGEND

  ========================================================
   PUSHED.

   Code:  https://github.com/$URL

   To serve it as a website, once only:
     repo -> Settings -> Pages
     Source: Deploy from a branch
     Branch: main    Folder: / (root)    -> Save
     Wait 1-2 minutes.

   It will then live at:

     https://$USER_PART.github.io/$REPO/

   MIND THE TRAILING SLASH, and note this is a NEW
   address — a different storage box. The app will open
   without your records until you import your backup.
  ========================================================

MSGEND
else
  die "push was rejected" "Usual causes: the repo does not exist yet on GitHub, or you typed your password instead of a personal access token."
fi
