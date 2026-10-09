/* NOKT FIELD LOG — boot and routing. */
(function () {

  /* order matters: static segments before :id patterns */
  var ROUTES = [
    ['dashboard', Views.dashboard],
    ['more', Views.more],
    ['factories', Views.factories],
    ['factories/compare', Views['factories/compare']],
    ['factories/:id', Views['factories/:id']],
    ['fabrics', Views.fabrics],
    ['fabrics/compare', Views['fabrics/compare']],
    ['fabrics/:id', Views['fabrics/:id']],
    ['body', Views.body],
    ['body/ease', Views['body/ease']],
    ['body/diff', Views['body/diff']],
    ['body/:id', Views['body/:id']],
    ['fit', Views.fit],
    ['fit/:id', Views['fit/:id']],
    ['wear', Views.wear],
    ['wear/:id', Views['wear/:id']],
    ['cost', Views.cost],
    ['decisions', Views.decisions],
    ['decisions/:id', Views['decisions/:id']],
    ['photos', Views.photos],
    ['reports', Views.reports],
    ['reports/view', Views['reports/view']],
    ['settings', Views.settings]
  ];

  function start() {
    ROUTES.forEach(function (r) { if (r[1]) UI.route(r[0], r[1]); });
    UI.buildTabs();
    window.addEventListener('hashchange', UI.resolve);
    UI.resolve();

    var boot = document.getElementById('boot');
    boot.classList.add('out');
    setTimeout(function () { boot.remove(); }, 200);

    checkBackupAge();
    watchOnline();
  }

  function fatal(msg, detail) {
    var boot = document.getElementById('boot');
    if (boot) boot.remove();
    document.getElementById('appbar').hidden = false;
    document.getElementById('bar-title').textContent = 'Storage unavailable';
    var app = document.getElementById('app');
    UI.clear(app);
    app.appendChild(UI.card([
      UI.el('div', { class: 'h2', text: msg }),
      UI.el('div', { class: 'sub', style: 'margin-top:8px', text: detail }),
      UI.el('div', { class: 'f-hint', style: 'margin-top:12px' },
        ['Most likely causes: the page is inside an embedded preview frame, it was opened directly from a ' +
          'file:// path, or private browsing is blocking storage. Opening it in its own browser tab fixes ' +
          'the first two. Hosting the folder (GitHub Pages, Netlify Drop) fixes all of them.']),
      UI.el('button', {
        class: 'btn pri', style: 'margin-top:14px', type: 'button', text: 'Open in a new tab',
        onclick: function () { window.open(location.href, '_blank', 'noopener'); }
      }),
      UI.el('button', {
        class: 'btn ghost', style: 'margin-top:8px', type: 'button', text: 'Try again',
        onclick: function () { location.reload(); }
      })
    ]));
  }

  function checkBackupAge() {
    DB.meta('lastExport', '').then(function (v) {
      var stale = !v || UI.daysBetween(v, UI.today()) >= 7;
      if (!stale) return;
      DB.all('photos').then(function (p) {
        return Promise.all([p.length, DB.all('factories'), DB.all('fabrics')]);
      }).then(function (r) {
        var hasData = r[0] > 0 || r[1].some(function (f) { return f.status !== 'Not contacted'; }) || r[2].length > 0;
        if (!hasData) return;
        UI.banner({
          type: 'warn',
          html: v ? '<b>No backup for ' + UI.daysBetween(v, UI.today()) + ' days.</b> All data lives on this phone only.'
            : '<b>No backup taken yet.</b> All data lives on this phone only.',
          action: 'Back up',
          onAction: function () { UI.go('settings'); }
        });
      });
    });
  }

  function watchOnline() {
    window.addEventListener('offline', function () { UI.toast('Offline — the app keeps working'); });
  }

  /* ---- install prompt capture ---- */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.NOKT_INSTALL = { prompt: function () { e.prompt(); } };
  });

  /* ---- service worker ---- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('Service worker registration failed', e);
      });
    });
  }

  /* ---- go ---- */
  /* Boot watchdog.
     indexedDB.open() can hang forever without firing onsuccess, onerror or
     onblocked — notably inside a partitioned third-party iframe (preview
     panels, embeds) and in some private-browsing modes. Without this, the
     boot splash never clears and the user just sees a black screen. */
  var booted = false;
  var watchdog = setTimeout(function () {
    if (booted) return;
    booted = true;
    fatal('Storage is not responding.',
      'The database request never completed. This normally means the page is running inside an embedded frame ' +
      'or a private window, where the browser blocks storage without reporting an error.');
  }, 8000);

  DB.open()
    .then(function () { return Seed.ensure(); })
    .then(function () {
      if (booted) return;
      booted = true; clearTimeout(watchdog);
      start();
    })
    .catch(function (e) {
      if (booted) return;
      booted = true; clearTimeout(watchdog);
      console.error(e);
      fatal('This browser will not let the app store data.', String(e && e.message || e));
    });

  /* last-resort error surface */
  window.addEventListener('error', function (ev) {
    if (ev && ev.message && /QuotaExceeded/i.test(ev.message)) {
      UI.toast('Device storage is full. Export a backup, then delete some photos.', { type: 'bad', ms: 8000 });
    }
  });
  window.addEventListener('unhandledrejection', function (ev) {
    var r = ev && ev.reason;
    if (r && (r.quota || /quota/i.test(r.message || ''))) {
      UI.toast('Device storage is full. Export a backup, then delete some photos.', { type: 'bad', ms: 8000 });
    }
  });
})();
