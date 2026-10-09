# NOKT FIELD LOG

An offline-first field-research app for the NOKT engineered-legging programme. Nine modules — dashboard, factories, fabrics, fit body, fit sessions, wear tests, cost model, decision log, photo library — plus reports, export and settings.

**No accounts. No server. No cloud. No telemetry. No subscription. No network calls at runtime, ever.**

Everything you type and every photo you take lives in IndexedDB on your phone. The only way data leaves the device is a backup file you deliberately export.

---

## 1. What is in this folder

```
index.html          app shell
app.css             entire design system + print stylesheet
manifest.json       PWA manifest (installable, standalone, dark)
sw.js               service worker — cache-first, precaches all 26 assets
icons/              192, 512, maskable 512, apple-touch 180
js/
  config.js         all schemas, test protocols, seed content
  zip.js            minimal store-method ZIP writer (photo bulk export)
  db.js             IndexedDB wrapper (promise-based, ~200 lines, no library)
  ui.js             icons, router, forms, sheets, toasts, autosave
  photos.js         capture, downscale, thumbnails, lightbox, quota
  seed.js           first-run seed, migrations, demo data, wipe
  views/            one file per module
  app.js            routes, boot, service worker registration
README.md           this file
```

No build step. No npm. No bundler. No dependencies. You can read every line.

---

## 2. Install it on your Android phone (the normal way)

You need the files on a URL. Pick **one** of the three deploy routes in section 3, then:

1. Open the URL in **Chrome on Android**.
2. Wait about two seconds — the service worker precaches everything on the first visit.
3. Tap the **⋮** menu → **Add to Home screen** (or **Install app**). Chrome may also show an install banner, and there is an **Install app** button at the bottom of **Settings** inside the app.
4. Confirm. A NOKT icon appears on your home screen.
5. Open it from the home screen. It launches full-screen with no browser chrome, and it works in aeroplane mode from that moment on.

**Test it properly before you rely on it:** turn on aeroplane mode, close the app completely, reopen it from the home screen. Everything must load and every photo must still be there. If it does not, the service worker did not install — revisit the URL once with data on and try again.

---

## 3. Deploy it for free, from the phone, in about five minutes

### Route A — Netlify Drop (fastest, no account needed to start)

1. Put this whole folder into a **.zip** on your phone (Files / ZArchiver / RAR — long-press the folder → Compress).
2. Go to **app.netlify.com/drop** in Chrome.
3. Tap the drop area, choose your .zip, wait.
4. You get a URL like `https://brave-tesla-12ab34.netlify.app`. That is your app. Bookmark it, then install it per section 2.
5. Make a free account afterwards to keep the site permanently and get a nicer subdomain.

To update later: drag a new .zip onto the same site in the Netlify dashboard.

### Route B — GitHub Pages (best long-term, free forever, versioned)

1. Create a free account at **github.com** on the phone browser.
2. New repository → name it `nokt-field-log` → **Public** → Create.
3. **Add file → Upload files.** Upload `index.html`, `app.css`, `manifest.json`, `sw.js`, `README.md`. GitHub's mobile web uploader does not handle folders well, so afterwards use **Add file → Create new file** and type the path `js/config.js`, paste the contents, commit — repeat for each file in `js/` and `js/views/`. Tedious once, permanent afterwards.
   *Easier alternative:* install the free **Termux** app, `pkg install git`, clone and push the folder properly.
4. **Settings → Pages → Source: Deploy from branch → main → / (root) → Save.**
5. After a minute your app is live at `https://YOURNAME.github.io/nokt-field-log/`.

Icons are binary — upload the four PNGs in `icons/` with the **Upload files** button, not the text editor.

### Route C — no internet at all

Copy the folder to the phone and open `index.html` with Chrome.

This works, but with two real limitations you should understand:
- **Service workers do not run on `file://`**, so there is no offline precache layer (you do not need one — the files are already local).
- **Chrome restricts IndexedDB on `file://`.** If the app shows a red "Storage unavailable" card on boot, this is why. Use Route A or B instead. The app detects this and tells you rather than silently losing data.

---

## 3b. The one rule about updating

**Your data lives at the URL, not in the app.** Browser storage (IndexedDB) is scoped to the
exact origin. `https://abc-123.netlify.app` and `https://xyz-789.netlify.app` are two different
worlds, and so is `http://localhost:8080`.

- **Updating at the same address** — data stays put. Nothing to do.
- **Moving to a different address** — the app will open **empty**. Your records are not
  destroyed, they are simply attached to the old address. Export a full backup on the old URL
  first, then restore it on the new one.

**Never use Netlify Drop a second time to deploy an update.** Drop mints a fresh random URL
every time, which looks exactly like total data loss. Use your existing project's Deploys tab
instead — on a phone, tap the drop panel and it opens the normal file picker.

Hosts that work the same way, if you want off Netlify: **Cloudflare Pages** (Direct upload,
free, unlimited bandwidth, stable URL, no git), **GitHub Pages** (stable URL forever, tedious
first upload from a phone), or **no host at all** — run the app off the phone itself with
Termux. See **`TERMUX.txt`** for the full walkthrough; the server is `bash ~/nokt/nokt.sh`.
Chrome treats localhost as a secure context, so the service worker, installing and storage all
work. Verified: after the first load the server can be switched off entirely and the app still
opens from cache, so Termux only runs during setup and updates.

⚠️ Two traps specific to running locally, both verified: `http://127.0.0.1:8080` is a
**different origin** from `http://localhost:8080`, and so is port `8081`. Landing on the wrong
one does not show an error — it shows a clean app with the 5 default factories re-seeded and
your real work absent. Always use `http://localhost:8080`.

## 4. Backup discipline — read this one

This app is deliberately dumb about the cloud. That means **the only copy of your research is on this phone** until you export it. A dropped phone is a dropped project.

**The rule: full backup every Sunday, and before any factory or fabric appointment.**

- **Settings → Full backup (with photos)** → produces `nokt-backup-YYYY-MM-DD.json` containing every record and every photo base64-encoded. This is the one that matters. Save it to Google Drive, email it to yourself, or both.
- **Settings → Quick backup (data only)** → same thing without photos. Small, fast, fine for a daily habit.
- **Settings → Restore** → pick a backup file, then choose **Merge** (adds missing records, keeps what you have) or **Replace** (wipes and restores exactly). Replace asks twice.
- Each module also has its own **CSV export** for when you want numbers in a spreadsheet, and the photo library has a **ZIP export** foldered as `Module/Record/001-slot.jpg`.

The app nags you with a banner if your last export is more than seven days old. Do not dismiss it without actually exporting.

**What destroys your data:** clearing Chrome's site data, uninstalling the installed app on some Android versions, "storage cleaner" apps, and Android reclaiming storage from an app you have not opened for months. None of those can touch a backup file sitting in Drive.

---

## 5. Photos

- Tap any photo slot → **Take photo** (opens the rear camera directly) or **Choose from gallery**.
- Every image is downscaled to a longest edge of **1600 px** and re-encoded as **JPEG quality 0.8**, typically 150–350 KB. A separate ~200 px thumbnail is stored for grids so lists stay instant.
- Full-size blobs live in a separate store from the record metadata, so opening a list never loads a single full image.
- **Settings** shows storage used against the browser quota and warns above 80%. The photo library lets you long-press to multi-select and delete in bulk.
- A quota-exceeded error is caught and explained rather than thrown — but if you see it, export and prune.

Rough budget: a 500 MB quota holds roughly 1,500–3,000 photos at these settings. Chrome on Android normally grants far more than that.

---

## 6. Wrapping it as a real APK (optional, free)

You do not need this. An installed PWA on Android behaves like an app in every way that matters here. But if you want a `.apk`/`.aab` — to sideload, to hand to someone, or to put on Play:

1. Deploy to a public HTTPS URL first (section 3 — Netlify or GitHub Pages; the URL must be public).
2. Go to **pwabuilder.com** in the browser.
3. Paste your URL → **Start**. It audits the manifest and service worker; this app is built to pass.
4. **Package for stores → Android → Download**. You get a signed APK/AAB plus a `signing.keypair` file.
5. **Keep `signing.keypair` and its password forever.** Without it you can never publish an update to the same app.
6. Sideload the APK: transfer it to the phone, tap it, allow "Install unknown apps" for your file manager.

Note the APK is a Trusted Web Activity — a thin wrapper that loads your deployed URL. It still works offline via the same service worker, but it points at the deployed site, so redeploying updates the app.

---

## 7. Updating the app

The service worker is cache-first with a version string (`VERSION` at the top of `sw.js`). When you change any file:

1. Bump `VERSION` in `sw.js` — e.g. `nokt-field-log-v1` → `v2`.
2. Redeploy.
3. On the phone: open the app, go to **Settings → Check for update**, then close and reopen it.

If you do not bump the version, the phone will keep serving the old cached copy. This is correct behaviour — it is what makes it work on a plane.

Your data survives updates. The database has its own version and migration path in `seed.js`, separate from the asset cache.

---

## 8. Technical notes

- **Storage:** IndexedDB database `nokt-field-log`. Stores: `meta`, `tasks`, `gates`, `factories`, `fabrics`, `bodysets`, `fitsessions`, `weartests`, `decisions`, `photos` (metadata + thumbnail), `blobs` (full images). Never localStorage for anything larger than a flag.
- **Autosave:** every field saves 400 ms after you stop typing, and flushes immediately on `pagehide`, `beforeunload` and tab-hide. Killing the browser mid-entry loses nothing.
- **Scripts are plain `<script>` tags, not ES modules** — deliberately, so `index.html` still renders when opened directly from the filesystem.
- **No charting library.** The wear-test degradation chart and the cost module's competitor price ladder are hand-written inline SVG.
- **No live FX.** The cost model's USD and EUR rates are fields you type. Any network call would break the offline guarantee.
- **Gates** (G1–G4) evaluate automatically from your records and can be manually overridden; the rules are in `config.js`.
- **Fabric verdict:** tests 1, 2, 5 and 7 are critical. A fail on any one of them forces REJECT regardless of the rest.

---

## 9. First run

The app seeds itself with the 30-day roadmap as dated tasks, the four week gates, five Cape Town CMTs as factory records, the competitor price ladder, and the cost-model defaults. Nothing is a placeholder — it is the real plan.

**Settings → Load demo data** fills every module with realistic example records so you can see what a populated app looks like. **Settings → Clear all data** wipes everything, including photos, after two confirmations.

Start on the dashboard. The first task is the one that matters.
