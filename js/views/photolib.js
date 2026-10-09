/* Photo library — every photo, filters, tags, multi-select, ZIP export. */
var Views = window.Views || {};

var MODULE_LABEL = {
  tasks: 'Roadmap', factories: 'Factories', fabrics: 'Fabric', body: 'Fit body',
  fit: 'Fit sessions', wear: 'Wear tests', decisions: 'Decisions', '': 'Unfiled'
};

Views.photos = function (app) {
  var all = [], names = {}, sel = new Set(), selMode = false;
  var fMod = '', fFrom = '', fTo = '', q = '';
  var grid = UI.el('div', { class: 'ph-grid' });
  var info = UI.el('div', { class: 'sub', style: 'margin-bottom:10px' });

  setBar();
  function setBar() {
    UI.setBar({
      title: selMode ? sel.size + ' selected' : 'Photo library',
      eyebrow: selMode ? 'Select' : 'All modules',
      back: selMode ? function () { selMode = false; sel.clear(); setBar(); draw(); } : function () { UI.go('more'); },
      actions: selMode ? [
        { icon: 'dl', label: 'Export selected', onClick: exportSel },
        { icon: 'trash', label: 'Delete selected', onClick: delSel }
      ] : [
        { icon: 'search', label: 'Filters', onClick: filterSheet },
        { icon: 'dl', label: 'Export all', onClick: function () { exportZip(filtered()); } }
      ]
    });
  }

  app.appendChild(info);
  app.appendChild(grid);
  var selectBtn = UI.el('button', {
    class: 'btn ghost', style: 'margin-top:14px', type: 'button', text: 'Select photos',
    onclick: function () { selMode = true; setBar(); draw(); }
  });
  app.appendChild(selectBtn);

  load();
  function load() {
    Promise.all([
      Photos.all(), DB.all('factories'), DB.all('fabrics'), DB.all('bodysets'),
      DB.all('fitsessions'), DB.all('weartests'), DB.all('decisions'), DB.all('tasks')
    ]).then(function (r) {
      all = r[0];
      names = {};
      r[1].forEach(function (x) { names[x.id] = x.name || 'Factory'; });
      r[2].forEach(function (x) { names[x.id] = (x.code || '') + ' ' + (x.name || ''); });
      r[3].forEach(function (x) { names[x.id] = x.subject || 'Measurements'; });
      r[4].forEach(function (x) { names[x.id] = x.garmentCode || 'Fit session'; });
      r[5].forEach(function (x) { names[x.id] = x.garmentCode || 'Wear test'; });
      r[6].forEach(function (x) { names[x.id] = (x.ref ? x.ref + ' ' : '') + (x.title || 'Decision'); });
      r[7].forEach(function (x) { names[x.id] = 'Day ' + x.day; });
      draw();
    });
  }

  function filtered() {
    return all.filter(function (p) {
      if (fMod && (p.module || '') !== fMod) return false;
      if (fFrom && p.createdAt.slice(0, 10) < fFrom) return false;
      if (fTo && p.createdAt.slice(0, 10) > fTo) return false;
      if (q) {
        var hay = ((p.slot || '') + ' ' + (p.caption || '') + ' ' + (p.tags || []).join(' ') + ' ' + (names[p.parentId] || '')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function draw() {
    UI.clear(grid);
    var list = filtered();
    var bytes = list.reduce(function (a, p) { return a + (p.size || 0); }, 0);
    info.textContent = list.length + ' photo' + (list.length === 1 ? '' : 's') + ' · ' + UI.bytes(bytes) +
      (fMod || fFrom || fTo || q ? ' (filtered)' : '');

    selectBtn.hidden = selMode || !list.length;
    if (!list.length) {
      grid.appendChild(UI.empty({
        icon: 'images', title: 'No photos',
        text: 'Photos taken anywhere in the app appear here — fit slots, fabric tests, factory visits.'
      }));
      return;
    }
    list.forEach(function (p, i) {
      var cell = UI.el('button', {
        class: 'ph-cell' + (sel.has(p.id) ? ' sel' : ''), type: 'button',
        'aria-label': (p.slot || 'Photo') + ' — ' + (names[p.parentId] || '')
      }, [UI.el('img', { src: Photos.thumbURL(p), alt: p.slot || 'Photo', loading: 'lazy' })]);
      if (sel.has(p.id)) cell.appendChild(UI.el('span', { class: 'tick' }, [UI.icon('check', 13)]));
      var timer, longFired = false;
      cell.onclick = function () {
        if (longFired) { longFired = false; return; }
        if (selMode) {
          if (sel.has(p.id)) sel.delete(p.id); else sel.add(p.id);
          setBar(); draw();
        } else {
          Photos.lightbox(list.map(function (x) { return x.id; }), i, { onChange: load });
        }
      };
      cell.addEventListener('pointerdown', function () {
        longFired = false;
        timer = setTimeout(function () {
          longFired = true;
          if (!selMode) { selMode = true; sel.add(p.id); setBar(); draw(); }
        }, 450);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
        cell.addEventListener(ev, function () { clearTimeout(timer); });
      });
      grid.appendChild(cell);
    });
  }

  function filterSheet() {
    var body = UI.el('div');
    body.appendChild(UI.select({
      label: 'Module', value: fMod,
      options: [{ v: '', l: 'All modules' }].concat(Object.keys(MODULE_LABEL).filter(function (k) { return k; }).map(function (k) { return { v: k, l: MODULE_LABEL[k] }; })),
      onInput: function (v) { fMod = v; }
    }));
    body.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.date({ label: 'From', value: fFrom, onInput: function (v) { fFrom = v; } }),
      UI.date({ label: 'To', value: fTo, onInput: function (v) { fTo = v; } })
    ]));
    body.appendChild(UI.text({ label: 'Search slot, caption, tag or record', value: q, onInput: function (v) { q = v.toLowerCase(); } }));
    UI.sheet({
      title: 'Filter photos', body: body,
      actions: [
        { label: 'Apply', cls: 'pri', onClick: draw },
        { label: 'Clear all', cls: 'ghost', onClick: function () { fMod = ''; fFrom = ''; fTo = ''; q = ''; draw(); } }
      ]
    });
  }

  function delSel() {
    if (!sel.size) return UI.toast('Nothing selected');
    UI.confirm('Delete ' + sel.size + ' photo' + (sel.size > 1 ? 's' : '') + '?', 'They cannot be recovered without a backup.', 'Delete', true)
      .then(function (ok) {
        if (!ok) return;
        Photos.delMany(Array.from(sel)).then(function () {
          UI.toast(sel.size + ' deleted'); sel.clear(); selMode = false; setBar(); load();
        });
      });
  }
  function exportSel() {
    var list = all.filter(function (p) { return sel.has(p.id); });
    if (!list.length) return UI.toast('Nothing selected');
    exportZip(list);
  }

  function exportZip(list) {
    if (!list.length) return UI.toast('No photos to export');
    var kill = UI.toast('Packing ' + list.length + ' photos…');
    var files = [], chain = Promise.resolve();
    list.forEach(function (p, i) {
      chain = chain.then(function () {
        return DB.get('blobs', p.id).then(function (b) {
          if (!b) return;
          return b.blob.arrayBuffer().then(function (buf) {
            var who = (names[p.parentId] || 'unfiled').replace(/[^a-z0-9 _-]/gi, '').trim() || 'unfiled';
            var slot = (p.slot || 'photo').replace(/[^a-z0-9 _-]/gi, '').trim();
            var name = (MODULE_LABEL[p.module] || 'Other') + '/' + who + '/' +
              String(i + 1).padStart(3, '0') + '-' + slot + '.jpg';
            files.push({ name: name, data: new Uint8Array(buf) });
          });
        });
      });
    });
    chain.then(function () {
      kill();
      var blob = ZIP.build(files);
      UI.share(blob, 'nokt-photos-' + UI.today() + '.zip', 'NOKT photos');
      UI.toast(files.length + ' photos exported', { type: 'good' });
    }).catch(function (e) {
      kill(); UI.toast('Export failed: ' + e.message, { type: 'bad' });
    });
  }
};
