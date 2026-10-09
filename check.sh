# NOKT FIELD LOG — one-button version check
# Run:  bash ~/nokt/check.sh
#
# Answers three questions:
#   1. Is the app on this phone intact and the version it claims to be?
#   2. Is there a downloaded update sitting unopened in Downloads?
#   3. Is GitHub up to date with what is on this phone?

DIR="$(cd "$(dirname "$0")" && pwd)"
REFERENCE=a574d83a7399cdf4      # fingerprint of the build this script shipped with
REFNAME="v8"
APPFILES="index.html app.css manifest.json sw.js js icons"

G='\033[32m'; R='\033[31m'; Y='\033[33m'; D='\033[0m'
ok(){   printf "  ${G}[ OK ]${D} %s\n" "$1"; }
bad(){  printf "  ${R}[ !! ]${D} %s\n" "$1"; }
warn(){ printf "  ${Y}[ ?? ]${D} %s\n" "$1"; SKIPPED=$((SKIPPED+1)); }
fix(){  printf "         fix: %s\n" "$1"; }
head2(){ printf "\n%s\n" "$1"; }

PROBLEMS=0
SKIPPED=0

# ---------- helpers --------------------------------------------------------
HASH=""
for h in sha256sum shasum openssl; do command -v $h >/dev/null 2>&1 && HASH=$h && break; done
digest(){                       # reads stdin, prints hex
  case "$HASH" in
    sha256sum) sha256sum | cut -d' ' -f1 ;;
    shasum)    shasum -a 256 | cut -d' ' -f1 ;;
    openssl)   openssl dgst -sha256 | sed 's/.*= *//' ;;
  esac
}
digestfile(){
  case "$HASH" in
    sha256sum) sha256sum "$1" | cut -d' ' -f1 ;;
    shasum)    shasum -a 256 "$1" | cut -d' ' -f1 ;;
    openssl)   openssl dgst -sha256 "$1" | sed 's/.*= *//' ;;
  esac
}
fingerprint(){                  # $1 = folder
  ( cd "$1" 2>/dev/null || return 1
    find $APPFILES -type f 2>/dev/null | LC_ALL=C sort | while read -r f; do
      printf '%s  %s\n' "$(digestfile "$f")" "$f"
    done | digest | cut -c1-16 )
}
countfiles(){ ( cd "$1" 2>/dev/null && find $APPFILES -type f 2>/dev/null | wc -l ) }

printf '\n  NOKT FIELD LOG — version check\n  ------------------------------\n'
[ -n "$HASH" ] || { bad "no sha256 tool found (sha256sum / shasum / openssl)"; exit 1; }
[ -f "$DIR/index.html" ] || { bad "no app found in $DIR"; exit 1; }

# ---------- 1. the app on this phone ---------------------------------------
head2 "APP ON THIS PHONE   $DIR"
LOCAL=$(fingerprint "$DIR")
NFILES=$(countfiles "$DIR")
SWV=$(grep -o "nokt-field-log-v[0-9]*" "$DIR/sw.js" 2>/dev/null | head -1)
printf "  version      %s\n  fingerprint  %s\n  files        %s\n" "${SWV:-unknown}" "$LOCAL" "$NFILES"
if [ "$NFILES" != "26" ]; then
  bad "expected 26 app files, found $NFILES - the unzip was incomplete"
  fix "cd ~/nokt && unzip -o ~/storage/downloads/*NOKT*.zip"
  PROBLEMS=$((PROBLEMS+1))
elif [ "$LOCAL" = "$REFERENCE" ]; then
  ok "intact, and identical to the $REFNAME build this checker shipped with"
else
  warn "does not match the $REFNAME reference ($REFERENCE)"
  printf "         either a file was edited, or this is a newer build than the\n"
  printf "         checker. Send the fingerprint above to confirm.\n"
  PROBLEMS=$((PROBLEMS+1))
fi

# ---------- 2. an unopened update in Downloads ------------------------------
head2 "ZIP IN DOWNLOADS"
DL=""
for d in "$HOME/storage/downloads" "$HOME/storage/shared/Download" "$HOME/storage/shared/Downloads"; do
  [ -d "$d" ] && DL="$d" && break
done
if [ -z "$DL" ]; then
  warn "no access to Downloads (run termux-setup-storage) - skipped"
else
  ZIP=$(ls -t "$DL"/*[Nn][Oo][Kk][Tt]*.zip 2>/dev/null | head -1)
  if [ -z "$ZIP" ]; then
    ok "no NOKT zip in Downloads - nothing waiting to be installed"
  else
    printf "  file         %s\n" "$(basename "$ZIP")"
    TMP="${TMPDIR:-/tmp}/nokt-check-$$"
    rm -rf "$TMP"; mkdir -p "$TMP"
    if unzip -oq "$ZIP" -d "$TMP" 2>/dev/null; then
      ZFP=$(fingerprint "$TMP")
      ZSW=$(grep -o "nokt-field-log-v[0-9]*" "$TMP/sw.js" 2>/dev/null | head -1)
      printf "  version      %s\n  fingerprint  %s\n" "${ZSW:-unknown}" "$ZFP"
      if [ "$ZFP" = "$LOCAL" ]; then
        ok "same as what is installed - nothing to unpack"
      elif [ "$ZFP" = "$REFERENCE" ]; then
        bad "this zip is the known-good $REFNAME build; your INSTALLED copy differs"
        printf "         the zip is fine - the folder on the phone was changed.\n"
        fix "cd ~/nokt && unzip -o \"$ZIP\"   (repairs the install)"
        PROBLEMS=$((PROBLEMS+1))
      else
        bad "DIFFERENT from what is installed - you have an update sitting unopened"
        fix "cd ~/nokt && unzip -o \"$ZIP\" && bash ~/nokt/check.sh"
        PROBLEMS=$((PROBLEMS+1))
      fi
    else
      bad "that zip will not open - the download is incomplete"
      fix "download NOKT-FIELD-LOG.zip again"
      PROBLEMS=$((PROBLEMS+1))
    fi
    rm -rf "$TMP"
  fi
fi

# ---------- 3. github -------------------------------------------------------
head2 "GITHUB"
if ! command -v git >/dev/null 2>&1; then
  warn "git is not installed - skipped"
elif [ ! -d "$DIR/.git" ]; then
  warn "this folder is not a git repository yet - skipped"
  fix "bash ~/nokt/github.sh"
else
  cd "$DIR" || exit 1
  REMOTE=$(git remote get-url origin 2>/dev/null)
  printf "  remote       %s\n" "${REMOTE:-none}"

  DIRTY=$(git status --porcelain 2>/dev/null | wc -l)
  if [ "$DIRTY" -gt 0 ]; then
    bad "$DIRTY file(s) changed but not committed"
    git status --porcelain | head -5 | sed 's/^/           /'
    fix "bash ~/nokt/github.sh \"describe the change\""
    PROBLEMS=$((PROBLEMS+1))
  else
    ok "no uncommitted changes"
  fi

  if [ -z "$REMOTE" ]; then
    warn "no remote set - nothing to compare against"
  elif GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=true git fetch -q origin 2>/dev/null; then
    AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
    BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
    if [ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ]; then
      ok "GitHub is in sync with this phone"
    else
      [ "$AHEAD" != "0" ] && { bad "$AHEAD commit(s) on this phone are NOT on GitHub"; fix "bash ~/nokt/github.sh"; PROBLEMS=$((PROBLEMS+1)); }
      [ "$BEHIND" != "0" ] && { bad "GitHub has $BEHIND commit(s) this phone does not"; fix "git pull --rebase origin main"; PROBLEMS=$((PROBLEMS+1)); }
    fi
  else
    warn "could not reach GitHub (offline, or credentials needed) - sync not checked"
    printf "         last local commit: %s\n" "$(git log -1 --format='%h %s' 2>/dev/null)"
  fi
fi

# ---------- verdict ---------------------------------------------------------
printf "\n  ------------------------------\n"
if [ "$PROBLEMS" = "0" ] && [ "$SKIPPED" = "0" ]; then
  printf "  ${G}  EVERYTHING MATCHES. Nothing to do.${D}\n\n"
  exit 0
elif [ "$PROBLEMS" = "0" ]; then
  printf "  ${G}  No problems found${D}, but $SKIPPED check(s) could not run - see [ ?? ] above.\n\n"
  exit 0
else
  printf "  ${R}  $PROBLEMS thing(s) need attention - see 'fix:' above.${D}\n\n"
  exit 1
fi
