# NOKT FIELD LOG — local server for Android (Termux)
# Run with:   bash ~/nokt/nokt.sh
# Then open Chrome at:   http://localhost:8080
#
# Stop the server with Ctrl+C  (volume-down + C on the Termux keyboard).

PORT=8080
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  NOKT FIELD LOG — local server"
echo "  -----------------------------"

# 1. Are we actually pointing at the app?
if [ ! -f "$DIR/index.html" ]; then
  echo "  ERROR: no index.html in $DIR"
  echo "  The app files must sit next to this script."
  exit 1
fi

# 2. Find python
PY=""
for c in python python3; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "  ERROR: python is not installed."
  echo "  Run:  pkg install -y python"
  exit 1
fi

# 3. Clear a stale server off the port (otherwise: 'Address already in use')
pkill -f "http.server $PORT" >/dev/null 2>&1
sleep 1

# 4. Stop Android suspending the server while you use the app
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
  echo "  wake lock    : on"
fi

# 5. Install the 'nokt' shortcut once, so next time you just type: nokt
RC="$HOME/.bashrc"
if [ -w "$HOME" ] && ! grep -q "alias nokt=" "$RC" 2>/dev/null; then
  echo "alias nokt='bash $DIR/nokt.sh'" >> "$RC"
  echo "  shortcut     : installed — next time just type  nokt"
fi

echo "  serving from : $DIR"
echo "  files        : $(ls -1 "$DIR" | wc -l) items"
echo ""
echo "  OPEN THIS EXACT ADDRESS IN CHROME:"
echo ""
echo "      http://localhost:8080"
echo ""
echo "  NOT 127.0.0.1. NOT a different port. The browser treats"
echo "  localhost:8080 as a separate place from 127.0.0.1:8080 and"
echo "  from localhost:8081 — your saved data only exists at the"
echo "  address above. A wrong address shows a clean app with the"
echo "  5 default factories and none of your real work."
echo ""
echo "  Leave Termux running until the app has finished loading."
echo "  After that you can close Termux — the app keeps working."
echo "  Press Ctrl+C here to stop the server."
echo ""

# 6. Serve. Bound to 127.0.0.1 so nobody else on your wifi can read your data.
cd "$DIR" || exit 1
exec "$PY" -m http.server "$PORT" --bind 127.0.0.1
