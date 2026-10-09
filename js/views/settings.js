/* Settings — backup, import, storage, demo data, reset. */
var Views = window.Views || {};

var Backup = (function () {
  function b64(blob) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(',')[1]); };
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }
  function unb64(s, type) {
    var bin = atob(s), len = bin.length, arr = new Uint8Array(len);
    for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: type || 'image/jpeg' });
  }

  function exportData(withPhotos, onProgress) {
    var out = { app: 'NOKT FIELD LOG', version: 1, exported: UI.nowISO(), withPhotos: !!withPhotos, stores: {}, meta: {}, photos: [] };
    var jobs = DB.RECORD_STORES.map(function (s) {
      return DB.all(s).then(function (r) { out.stores[s] = r; });
    });
    jobs.push(DB.all('meta').then(function (r) { r.forEach(function (m) { out.meta[m.k] = m.v; }); }));
    return Promise.all(jobs).then(function () {
      if (!withPhotos) return out;
      return DB.all('photos').then(function (ps) {
        var i = 0;
        return ps.reduce(function (p, rec) {
          return p.then(function () {
            return DB.get('blobs', rec.id).then(function (b) {
              if (!b) return;
              return Promise.all([b64(b.blob), rec.thumb ? b64(rec.thumb) : Promise.resolve('')])
                .then(function (pair) {
                  out.photos.push({
                    id: rec.id, module: rec.module, parentId: rec.parentId, slot: rec.slot,
                    caption: rec.caption, tags: rec.tags, createdAt: rec.createdAt,
                    w: rec.w, h: rec.h, size: rec.size, full: pair[0], thumb: pair[1]
                  });
                  i++; onProgress && onProgress(i, ps.length);
                });
            });
          });
        }, Promise.resolve()).then(function () { return out; });
      });
    });
  }

  function importData(data, mode) {
    if (!data || data.app !== 'NOKT FIELD LOG') return Promise.reject(new Error('That file is not a NOKT Field Log backup.'));
    var start = mode === 'replace' ? DB.nuke() : Promise.resolve();
    return start.then(function () {
      var jobs = [];
      Object.keys(data.stores || {}).forEach(function (s) {
        if (DB.RECORD_STORES.indexOf(s) < 0) return;
        jobs.push(DB.bulkPut(s, data.stores[s]));
      });
      Object.keys(data.meta || {}).forEach(function (k) {
        jobs.push(DB.setMeta(k, data.meta[k]));
      });
      return Promise.all(jobs);
    }).then(function () {
      return (data.photos || []).reduce(function (p, ph) {
        return p.then(function () {
          var full = unb64(ph.full), thumb = ph.thumb ? unb64(ph.thumb) : null;
          var rec = {
            id: ph.id, module: ph.module, parentId: ph.parentId, slot: ph.slot, caption: ph.caption,
            tags: ph.tags || [], createdAt: ph.createdAt, w: ph.w, h: ph.h, size: ph.size, thumb: thumb
          };
          return DB.put('blobs', { id: ph.id, blob: full }).then(function () { return DB.put('photos', rec); });
        });
      }, Promise.resolve());
    }).then(function () { return DB.setMeta('seeded', true); });
  }

  return { exportData: exportData, importData: importData };
})();

Views.settings = function (app) {
  UI.setBar({ title: 'Settings', eyebrow: 'Data & device', back: function () { UI.go('more'); } });

  /* ---- storage ---- */
  app.appendChild(UI.eyebrow('Storage on this device'));
  var storeCard = UI.card([]);
  app.appendChild(storeCard);
  refreshStorage();
  function refreshStorage() {
    UI.clear(storeCard);
    Promise.all([Photos.storageInfo(), DB.all('photos')]).then(function (r) {
      var s = r[0], photos = r[1];
      var pbytes = photos.reduce(function (a, p) { return a + (p.size || 0); }, 0);
      storeCard.appendChild(UI.el('div', { class: 'num', text: UI.bytes(s.usage) }));
      storeCard.appendChild(UI.el('div', { class: 'sub', text: s.quota ? 'of about ' + UI.bytes(s.quota) + ' available (' + UI.num(s.pct, 1) + '%)' : 'quota unknown on this browser' }));
      storeCard.appendChild(UI.el('div', { class: 'bar-mini' }, [
        UI.el('i', { style: 'width:' + Math.min(100, s.pct) + '%;background:' + (s.pct > 80 ? 'var(--fail)' : 'var(--accent)') })
      ]));
      storeCard.appendChild(UI.el('div', { style: 'margin-top:12px' }, [
        UI.kv('Photos stored', String(photos.length)),
        UI.kv('Photo data', UI.bytes(pbytes))
      ]));
      if (s.pct > 80) {
        storeCard.appendChild(UI.el('div', { class: 'f-hint', style: 'color:var(--fail);margin-top:8px', text: 'Over 80% full. Export a full backup, then delete photos you no longer need.' }));
      }
    });
  }

  /* ---- backup ---- */
  app.appendChild(UI.eyebrow('Backup — do this weekly'));
  var bCard = UI.card([]);
  bCard.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px', text: 'This is the only thing standing between you and total data loss. Nothing is stored anywhere but this phone.' }));
  bCard.appendChild(UI.el('button', {
    class: 'btn pri', type: 'button', onclick: function () { doExport(true); }
  }, [UI.icon('dl', 18), UI.el('span', { text: 'Full backup (with photos)' })]));
  bCard.appendChild(UI.el('div', { style: 'height:8px' }));
  bCard.appendChild(UI.el('button', {
    class: 'btn', type: 'button', onclick: function () { doExport(false); }
  }, [UI.icon('dl', 18), UI.el('span', { text: 'Quick backup (data only)' })]));
  bCard.appendChild(UI.el('div', { style: 'height:8px' }));
  bCard.appendChild(UI.el('button', {
    class: 'btn ghost', type: 'button', onclick: doImport
  }, [UI.icon('up', 18), UI.el('span', { text: 'Restore from backup' })]));
  var lastEl = UI.el('div', { class: 'f-hint', style: 'margin-top:10px' });
  bCard.appendChild(lastEl);
  app.appendChild(bCard);
  DB.meta('lastExport', '').then(function (v) {
    lastEl.textContent = v ? 'Last backup: ' + UI.dateStr(v) + ' (' + UI.daysBetween(v, UI.today()) + ' days ago)' : 'No backup taken yet.';
  });

  function doExport(withPhotos) {
    var kill = UI.toast(withPhotos ? 'Packing backup — this can take a minute…' : 'Building backup…');
    Backup.exportData(withPhotos, function (i, n) { /* progress */ })
      .then(function (data) {
        var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        kill();
        var name = 'nokt-backup-' + UI.today() + (withPhotos ? '-full' : '-data') + '.json';
        UI.share(blob, name, 'NOKT backup');
        DB.setMeta('lastExport', UI.today());
        lastEl.textContent = 'Last backup: ' + UI.dateStr(UI.today()) + ' (today)';
        UI.toast('Backup created — ' + UI.bytes(blob.size), { type: 'good' });
      })
      .catch(function (e) { kill(); UI.toast('Backup failed: ' + e.message, { type: 'bad' }); });
  }

  function doImport() {
    var inp = UI.el('input', { type: 'file', accept: 'application/json,.json', style: 'position:fixed;left:-9999px' });
    document.body.appendChild(inp);
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      inp.remove();
      if (!f) return;
      f.text().then(function (txt) {
        var data;
        try { data = JSON.parse(txt); } catch (e) { return UI.toast('That file is not valid JSON.', { type: 'bad' }); }
        var n = Object.keys(data.stores || {}).reduce(function (a, k) { return a + (data.stores[k] || []).length; }, 0);
        UI.sheet({
          title: 'Restore backup',
          body: UI.el('div', {}, [
            UI.el('div', { class: 'sub', text: 'From ' + UI.dateStr(data.exported) + ' · ' + n + ' records · ' + (data.photos || []).length + ' photos.' }),
            UI.el('div', { class: 'f-hint', style: 'margin-top:10px', text: 'Merge keeps what is already here and overwrites matching records. Replace wipes this device first.' })
          ]),
          actions: [
            { label: 'Merge into current data', cls: 'pri', onClick: function () { run(data, 'merge'); } },
            { label: 'Replace everything', cls: 'danger', onClick: function () { run(data, 'replace'); } },
            { label: 'Cancel', cls: 'ghost' }
          ]
        });
      });
    };
    inp.click();

    function run(data, mode) {
      var kill = UI.toast('Restoring…');
      Backup.importData(data, mode).then(function () {
        kill(); UI.toast('Restored', { type: 'good' });
        setTimeout(function () { location.reload(); }, 800);
      }).catch(function (e) { kill(); UI.toast('Restore failed: ' + e.message, { type: 'bad', ms: 7000 }); });
    }
  }

  /* ---- project ---- */
  app.appendChild(UI.eyebrow('Project'));
  var pCard = UI.card([]);
  DB.meta('projectStart', UI.today()).then(function (v) {
    pCard.appendChild(UI.date({
      label: 'Project start date', value: v,
      onInput: function (nv) { DB.setMeta('projectStart', nv).then(function () { UI.toast('Start date updated'); }); }
    }));
  });
  app.appendChild(pCard);

  /* ---- demo ---- */
  app.appendChild(UI.eyebrow('Demo & reset'));
  var dCard = UI.card([]);
  dCard.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px', text: 'Load realistic sample data to see how the app behaves when full — two factory replies, three tested swatches, a measurement set, a fit session and an eight-hour wear test. Then wipe it.' }));
  dCard.appendChild(UI.el('button', {
    class: 'btn', type: 'button', onclick: function () {
      var kill = UI.toast('Loading demo data…');
      Seed.demo().then(function () { kill(); UI.toast('Demo data loaded', { type: 'good' }); setTimeout(function () { location.reload(); }, 700); })
        .catch(function (e) { kill(); UI.toast('Failed: ' + e.message, { type: 'bad' }); });
    }
  }, [UI.icon('note', 18), UI.el('span', { text: 'Load demo data' })]));
  dCard.appendChild(UI.el('div', { style: 'height:8px' }));
  dCard.appendChild(UI.el('button', {
    class: 'btn danger', type: 'button', onclick: function () {
      UI.confirm('Clear all data?', 'Every record and every photo on this device will be deleted and the app reset to a fresh roadmap. Export a backup first if you are not certain.', 'Clear everything', true)
        .then(function (ok) {
          if (!ok) return;
          var kill = UI.toast('Clearing…');
          Seed.clearAll().then(function () { kill(); setTimeout(function () { location.reload(); }, 400); });
        });
    }
  }, [UI.icon('trash', 18), UI.el('span', { text: 'Clear all data' })]));
  app.appendChild(dCard);

  /* ---- about ---- */
  app.appendChild(UI.eyebrow('About'));
  var aCard = UI.card([]);
  aCard.appendChild(UI.kv('App', 'NOKT Field Log'));
  aCard.appendChild(UI.kv('Offline', navigator.onLine ? 'Online now' : 'Offline — still working'));
  aCard.appendChild(UI.kv('Installed', window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'Running in browser'));
  aCard.appendChild(UI.kv('Storage', 'IndexedDB, on this device only'));
  aCard.appendChild(UI.kv('Accounts', 'None. No server, no telemetry.'));
  app.appendChild(aCard);

  if (window.NOKT_INSTALL && window.NOKT_INSTALL.prompt) {
    app.appendChild(UI.el('button', {
      class: 'btn acc', style: 'margin-top:10px', type: 'button', onclick: function () {
        window.NOKT_INSTALL.prompt(); window.NOKT_INSTALL = null;
      }
    }, [UI.icon('dl', 18), UI.el('span', { text: 'Install to home screen' })]));
  } else {
    app.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-top:10px', text: 'To install: Chrome menu (⋮) → Add to home screen. The app then opens full screen and works with no signal.' }));
  }

  app.appendChild(UI.el('button', {
    class: 'btn ghost', style: 'margin-top:10px', type: 'button', text: 'Check for update',
    onclick: function () {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function (reg) {
          if (!reg) return UI.toast('No service worker — serve the app over http(s) for offline mode.', { type: 'bad', ms: 6000 });
          reg.update().then(function () { UI.toast('Checked. Reopen the app to apply any update.'); });
        });
      } else UI.toast('Service workers not available here.', { type: 'bad' });
    }
  }));
};
