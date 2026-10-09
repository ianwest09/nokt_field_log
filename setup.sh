PORT=8080
APP="$HOME/nokt"
say(){ printf '\n  %s\n' "$*"; }
die(){ printf '\n  ----------------------------------------\n  STOPPED: %s\n  %s\n  ----------------------------------------\n\n' "$1" "$2"; exit 1; }

printf '\n  NOKT FIELD LOG — setup\n  ----------------------\n'

# ---- 1. packages ----------------------------------------------------------
if ! command -v unzip >/dev/null 2>&1 || ! command -v python >/dev/null 2>&1; then
  say "[1/5] installing python + unzip (a few minutes, leave it alone) ..."
  pkg install -y python unzip || die "could not install packages" "Run 'pkg upgrade -y' first, then paste this again."
else
  say "[1/5] python + unzip already installed"
fi
PY=python; command -v python >/dev/null 2>&1 || PY=python3

# ---- 2. storage permission ------------------------------------------------
DL="$HOME/storage/downloads"
if [ ! -d "$DL" ]; then
  say "[2/5] asking for storage access — TAP ALLOW ON THE POPUP"
  termux-setup-storage
  n=0
  while [ ! -d "$DL" ] && [ "$n" -lt 30 ]; do sleep 1; n=$((n+1)); done
fi
[ -d "$DL" ] || die "no access to Downloads" "Run 'termux-setup-storage' and tap Allow, then paste this again."
say "[2/5] storage access OK"

# ---- 3. find the zip (look everywhere sensible, then wait for it) ---------
findzip(){
  for d in "$DL" "$HOME/storage/shared/Download" "$HOME/storage/shared/Downloads" "$HOME/storage/downloads"; do
    [ -d "$d" ] || continue
    f=$(ls -t "$d"/*[Nn][Oo][Kk][Tt]*.zip 2>/dev/null | head -1)
    [ -n "$f" ] && { echo "$f"; return 0; }
  done
  f=$(find "$HOME/storage/shared" -maxdepth 3 -iname '*nokt*.zip' 2>/dev/null | head -1)
  [ -n "$f" ] && { echo "$f"; return 0; }
  return 1
}
ZIP=$(findzip) || true
if [ -z "$ZIP" ]; then
  say "[3/5] no zip yet — download NOKT-FIELD-LOG.zip in Chrome now, I will wait (2 min)"
  n=0
  while [ "$n" -lt 40 ]; do
    sleep 3; n=$((n+1))
    ZIP=$(findzip) || true
    [ -n "$ZIP" ] && break
  done
fi
[ -n "$ZIP" ] || die "no NOKT zip found on the phone" "Download NOKT-FIELD-LOG.zip in Chrome, then paste this again."
say "[3/5] found $(basename "$ZIP")"

# ---- 4. unpack ------------------------------------------------------------
mkdir -p "$APP" && cd "$APP" || die "could not create $APP" "Check storage space."
unzip -oq "$ZIP" 2>/dev/null || die "the zip would not open" "Download it again — the file is probably incomplete."
[ -f "$APP/index.html" ] || die "that zip is not the app" "index.html is missing. Check you downloaded the right file."
say "[4/5] installed $(ls -1 "$APP" | wc -l) items into $APP"

# ---- 5. shortcut + server -------------------------------------------------
grep -q "alias nokt=" "$HOME/.bashrc" 2>/dev/null || echo "alias nokt='bash $APP/nokt.sh'" >> "$HOME/.bashrc"
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock
pkill -f "http.server $PORT" >/dev/null 2>&1
sleep 1
say "[5/5] starting server"

cat <<'MSG'

  ========================================================
   DONE. The server is running (this screen will look
   frozen — that is correct).

   1. Switch to Chrome and open EXACTLY:

          http://localhost:8080

      NOT 127.0.0.1. NOT another port. Your data is
      saved per-address, and a wrong address silently
      shows a clean app with none of your work.

   2. Settings -> Import backup -> pick your .json

   3. Chrome menu -> Add to Home screen

   After that you can close Termux. The app keeps
   working from the home screen icon.

   Next time:      type  nokt
   Stop server:    Ctrl+C
  ========================================================

MSG

cd "$APP" && exec "$PY" -m http.server "$PORT" --bind 127.0.0.1
