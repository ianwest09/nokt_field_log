/* Fabric swatches — Appendix B 10-test protocol. */
var Views = window.Views || {};

var Fabrics = (function () {
  /* Thresholds live in config.js ONLY. Previously they were duplicated here as hardcoded
     test ids, which silently went stale the moment the spec changed. */
  function autoResult(test, v) {
    if (v === '' || v === null || v === undefined || isNaN(v)) return '';
    v = Number(v);
    var hasMin = typeof test.min === 'number', hasMax = typeof test.max === 'number';
    if (!hasMin && !hasMax) return '';
    if (hasMin && v < test.min) return 'fail';
    if (hasMax && v > test.max) return 'fail';
    return 'pass';
  }
  function verdict(f) {
    var tests = f.tests || {}, pass = 0, fail = 0, tested = 0, critFail = false;
    CFG.FABRIC_TESTS.forEach(function (t) {
      var r = (tests[t.id] || {}).r;
      if (r === 'pass') { pass++; tested++; }
      else if (r === 'fail') { fail++; tested++; if (t.critical) critFail = true; }
    });
    var code, cls;
    if (critFail) { code = 'REJECT'; cls = 'fail'; }
    else if (tested === 0) { code = 'UNTESTED'; cls = ''; }
    else if (pass === CFG.FABRIC_TESTS.length) { code = 'PASS'; cls = 'pass'; }
    else if (fail > 0) { code = 'CONDITIONAL'; cls = 'cond'; }
    else { code = 'IN PROGRESS'; cls = 'cond'; }
    return { code: code, cls: cls, pass: pass, fail: fail, tested: tested, total: CFG.FABRIC_TESTS.length };
  }
  function nextCode(list) {
    var max = 0;
    list.forEach(function (f) {
      var m = /SW-(\d+)/.exec(f.code || ''); if (m) max = Math.max(max, Number(m[1]));
    });
    return 'SW-' + String(max + 1).padStart(3, '0');
  }
  function blank(list) {
    return {
      id: DB.uid('fab'), code: nextCode(list), supplier: '', name: '', composition: '',
      statedGsm: '', measuredGsm: '', width: 150, pricePerM: '', minCut: '', leadTime: '',
      colour: 'Black', notes: '', date: UI.today(), tests: {}, createdAt: UI.nowISO(), updatedAt: UI.nowISO()
    };
  }
  return { autoResult: autoResult, verdict: verdict, blank: blank, nextCode: nextCode };
})();

/* ---------------- list ---------------- */
Views.fabrics = function (app) {
  UI.setBar({
    title: 'Fabric swatches', eyebrow: 'Appendix B',
    actions: [
      { icon: 'note', label: 'Spec', onClick: specSheet },
      { icon: 'chart', label: 'Compare', onClick: function () { UI.go('fabrics/compare'); } },
      { icon: 'dl', label: 'Export CSV', onClick: exportCsv }
    ]
  });

  /* ---- the 8-parameter spec, readable while standing in a fabric shop ---- */
  function specSheet() {
    var body = UI.el('div');
    body.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px',
      text: 'NOKT-01 ALPHA fabric spec v1. A supplier who cannot answer P1-P4 is a reseller reading a label, not a source.' }));

    CFG.FABRIC_SPEC.forEach(function (x) {
      var c = UI.card([]);
      c.style.marginBottom = '10px';
      c.appendChild(UI.el('div', { class: 'tiny', text: x.p }));
      c.appendChild(UI.el('div', { class: 'h2', style: 'margin:2px 0 8px', text: x.name }));
      c.appendChild(UI.kv('Target', x.target));
      c.appendChild(UI.kv('Accept', x.accept));
      c.appendChild(UI.kv('Reject', x.reject, 'fail'));
      c.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-top:8px', text: x.why }));
      body.appendChild(c);
    });

    body.appendChild(UI.eyebrow('Supplier enquiry'));
    var msg = UI.card([UI.el('div', { class: 'sub', style: 'white-space:pre-wrap', text: CFG.SUPPLIER_ENQUIRY })]);
    body.appendChild(msg);
    body.appendChild(UI.el('button', {
      class: 'btn pri', style: 'margin-top:10px', type: 'button', text: 'Copy enquiry',
      onclick: function () { UI.copy(CFG.SUPPLIER_ENQUIRY); }
    }));

    body.appendChild(UI.eyebrow('Send to'));
    CFG.SUPPLIER_CONTACTS.forEach(function (sup) {
      var c = UI.card([]);
      c.style.marginBottom = '8px';
      c.appendChild(UI.el('div', { class: 'h2', style: 'margin-bottom:4px', text: sup.name }));
      c.appendChild(UI.el('div', { class: 'f-hint', text: sup.note }));
      var row = UI.el('div', { class: 'chips', style: 'margin-top:10px' });
      if (sup.tel) row.appendChild(UI.el('a', { class: 'btn ghost sm', href: 'tel:' + sup.tel, text: 'Call' }));
      if (sup.tel) row.appendChild(UI.el('a', { class: 'btn ghost sm', target: '_blank', rel: 'noopener',
        href: 'https://wa.me/' + sup.tel.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(CFG.SUPPLIER_ENQUIRY), text: 'WhatsApp' }));
      if (sup.email) row.appendChild(UI.el('a', { class: 'btn ghost sm',
        href: 'mailto:' + sup.email + '?subject=' + encodeURIComponent('Black technical stretch knit - enquiry') +
          '&body=' + encodeURIComponent(CFG.SUPPLIER_ENQUIRY), text: 'Email' }));
      if (sup.web) row.appendChild(UI.el('a', { class: 'btn ghost sm', target: '_blank', rel: 'noopener', href: sup.web, text: 'Website' }));
      c.appendChild(row);
      body.appendChild(c);
    });

    /* ---- AC Activewear real price list (Apr 2026). Offline reference for a
       supplier conversation. Prices exclude VAT; min cut 1 m; usable width 150 cm. ---- */
    body.appendChild(UI.eyebrow('AC Activewear price list  -  Apr 2026, excl VAT'));
    var pl = UI.card([]);
    pl.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-bottom:10px',
      text: 'Minimum cut 1 metre. Usable width 150 cm. 24 hours notice. Caroline Hansen, 078 184 0200. Ranked picks are the three black candidates for NOKT-01.' }));
    CFG.AC_PRICELIST.slice().sort(function (a, b) {
      var pa = a.pick || 99, pb = b.pick || 99;
      if (pa !== pb) return pa - pb;
      return b.gsm - a.gsm;
    }).forEach(function (x) {
      var row = UI.el('div', { class: 'card', style: 'margin-bottom:8px;padding:10px' });
      var head = UI.el('div', { style: 'display:flex;justify-content:space-between;gap:8px;align-items:baseline' });
      head.appendChild(UI.el('div', { class: 'h2', style: 'margin:0',
        text: (x.pick ? x.pick + '. ' : '') + x.f + '  ' + x.gsm + ' gsm' }));
      head.appendChild(UI.el('div', { class: 'h2', style: 'margin:0;white-space:nowrap', text: 'R' + x.roll + '/m' }));
      row.appendChild(head);
      row.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-top:4px', text: x.comp }));
      row.appendChild(UI.el('div', { class: 'tiny', style: 'margin-top:2px',
        text: x.col + '   -   R' + x.m + '/m cut, R' + x.roll + '/m by roll' }));
      pl.appendChild(row);
    });
    body.appendChild(pl);

    body.appendChild(UI.eyebrow('Unanswered  -  ask before ordering a roll'));
    var qs = UI.card([]);
    CFG.AC_QUERIES.forEach(function (t, i) {
      qs.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-bottom:8px', text: (i + 1) + '.  ' + t }));
    });
    body.appendChild(qs);
    body.appendChild(UI.el('button', {
      class: 'btn', style: 'margin-top:10px', type: 'button', text: 'Copy questions',
      onclick: function () {
        UI.copy(CFG.AC_QUERIES.map(function (t, i) { return (i + 1) + '. ' + t; }).join('\n\n'));
      }
    }));

    UI.sheet({ title: 'Fabric spec v1', body: body });
  }
  var q = '', sort = 'code', list = [];
  var holder = UI.el('div');
  var sortSel = UI.select({
    value: sort, options: [{ v: 'code', l: 'Code' }, { v: 'verdict', l: 'Verdict' }, { v: 'price', l: 'Price' }, { v: 'gsm', l: 'Weight' }],
    onInput: function (v) { sort = v; draw(); }
  });
  sortSel.classList.remove('f'); sortSel.style.margin = '0';
  app.appendChild(UI.searchBar('Search swatches', function (v) { q = v; draw(); }, sortSel));
  app.appendChild(holder);

  DB.all('fabrics').then(function (r) { list = r; draw(); });
  UI.fab('New swatch', function () {
    var f = Fabrics.blank(list);
    DB.put('fabrics', f).then(function () { UI.go('fabrics/' + f.id); });
  });

  function draw() {
    UI.clear(holder);
    var rows = list.filter(function (f) {
      return !q || (f.code + ' ' + f.supplier + ' ' + f.name + ' ' + f.composition).toLowerCase().indexOf(q) >= 0;
    });
    var order = { PASS: 0, CONDITIONAL: 1, 'IN PROGRESS': 2, UNTESTED: 3, REJECT: 4 };
    rows.sort(function (a, b) {
      if (sort === 'verdict') return order[Fabrics.verdict(a).code] - order[Fabrics.verdict(b).code];
      if (sort === 'price') return (a.pricePerM || 1e9) - (b.pricePerM || 1e9);
      if (sort === 'gsm') return (b.measuredGsm || b.statedGsm || 0) - (a.measuredGsm || a.statedGsm || 0);
      return (a.code || '').localeCompare(b.code || '');
    });

    if (!rows.length) {
      holder.appendChild(UI.empty({
        icon: 'layers', title: q ? 'No matches' : 'No swatches yet',
        text: q ? 'Try a different search.' : 'Log every swatch you receive and run the 10-test protocol. Tests 1, 2, 5 and 7 are critical — one failure rejects the fabric.',
        action: q ? null : 'Add a swatch',
        onAction: function () { var f = Fabrics.blank(list); DB.put('fabrics', f).then(function () { UI.go('fabrics/' + f.id); }); }
      }));
      return;
    }
    var box = UI.el('div', { class: 'rows' });
    rows.forEach(function (f) {
      var v = Fabrics.verdict(f);
      box.appendChild(UI.row({
        title: (f.code ? f.code + ' · ' : '') + (f.name || 'Unnamed'),
        sub: [f.supplier, (f.measuredGsm || f.statedGsm ? (f.measuredGsm || f.statedGsm) + ' gsm' : ''),
        (f.pricePerM ? UI.money(f.pricePerM) + '/m' : ''), v.tested + '/' + v.total + ' tested'].filter(Boolean).join(' · '),
        chip: v.code, chipCls: v.cls,
        onClick: function () { UI.go('fabrics/' + f.id); }
      }));
    });
    holder.appendChild(box);
  }

  function exportCsv() {
    var head = ['Code', 'Supplier', 'Fabric', 'Composition', 'Stated gsm', 'Measured gsm', 'Width', 'Price/m', 'Min cut', 'Lead time', 'Colour', 'Verdict']
      .concat(CFG.FABRIC_TESTS.map(function (t) { return t.n + '. ' + t.name; })).concat(['Notes']);
    var rows = [head];
    list.forEach(function (f) {
      var r = [f.code, f.supplier, f.name, f.composition, f.statedGsm, f.measuredGsm, f.width, f.pricePerM, f.minCut, f.leadTime, f.colour, Fabrics.verdict(f).code];
      CFG.FABRIC_TESTS.forEach(function (t) {
        var x = (f.tests || {})[t.id] || {};
        r.push([x.r || 'not tested', x.v !== undefined && x.v !== '' ? x.v + (t.unit || '') : '', x.n || ''].filter(Boolean).join(' | '));
      });
      r.push(f.notes);
      rows.push(r);
    });
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-fabrics.csv');
    UI.toast('CSV exported', { type: 'good' });
  }
};

/* ---------------- ranked comparison ---------------- */
Views['fabrics/compare'] = function (app) {
  UI.setBar({ title: 'Swatch comparison', eyebrow: 'Fabric', back: function () { UI.go('fabrics'); } });
  app.className = 'app wide';
  DB.all('fabrics').then(function (list) {
    if (!list.length) { app.appendChild(UI.empty({ icon: 'layers', title: 'Nothing to compare', text: 'Add some swatches first.' })); return; }
    var order = { PASS: 0, CONDITIONAL: 1, 'IN PROGRESS': 2, UNTESTED: 3, REJECT: 4 };
    list.sort(function (a, b) {
      var d = order[Fabrics.verdict(a).code] - order[Fabrics.verdict(b).code];
      return d || ((a.pricePerM || 1e9) - (b.pricePerM || 1e9));
    });
    var wrap = UI.el('div', { class: 'tw' }), t = UI.el('table');
    var head = UI.el('tr', {}, [UI.el('th', { text: 'Swatch' }), UI.el('th', { text: 'Verdict' }), UI.el('th', { text: 'gsm' }), UI.el('th', { text: 'R/m' })]);
    CFG.FABRIC_TESTS.forEach(function (x) { head.appendChild(UI.el('th', { text: x.n + (x.critical ? '*' : '') })); });
    t.appendChild(UI.el('thead', {}, [head]));
    var tb = UI.el('tbody');
    list.forEach(function (f) {
      var v = Fabrics.verdict(f);
      var tr = UI.el('tr', {}, [
        UI.el('td', { class: 'name', text: (f.code || '') + ' ' + (f.name || '') }),
        UI.el('td', {}, [UI.el('span', { class: 'chip ' + v.cls, text: v.code })]),
        UI.el('td', { class: 'r', text: f.measuredGsm || f.statedGsm || '—' }),
        UI.el('td', { class: 'r', text: f.pricePerM ? UI.num(f.pricePerM) : '—' })
      ]);
      CFG.FABRIC_TESTS.forEach(function (x) {
        var r = ((f.tests || {})[x.id] || {}).r;
        var td = UI.el('td', { class: 'r' });
        td.appendChild(UI.el('span', { class: 'dot ' + (r === 'pass' ? 'pass' : r === 'fail' ? 'fail' : ''), style: 'display:inline-block' }));
        tr.appendChild(td);
      });
      tr.onclick = function () { UI.go('fabrics/' + f.id); };
      tr.style.cursor = 'pointer';
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t);
    app.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px', text: 'Ranked best to worst. * marks a critical test — a single failure forces REJECT.' }));
    app.appendChild(wrap);
    var key = UI.el('div', { class: 'card', style: 'margin-top:14px' });
    CFG.FABRIC_TESTS.forEach(function (x) {
      key.appendChild(UI.kv(x.n + '. ' + x.name + (x.critical ? ' (critical)' : ''), x.pass));
    });
    app.appendChild(key);
  });
};

/* ---------------- detail ---------------- */
Views['fabrics/:id'] = function (app, params) {
  DB.get('fabrics', params.id).then(function (f) {
    if (!f) { UI.toast('Swatch not found', { type: 'bad' }); return UI.go('fabrics'); }
    f.tests = f.tests || {};
    var save = UI.saver('fabrics', f, refreshVerdict);

    var vChip = UI.el('span', { class: 'chip' });
    UI.setBar({
      eyebrow: 'Swatch ' + (f.code || ''), title: f.name || 'Unnamed fabric',
      back: function () { save.flush(); UI.go('fabrics'); },
      actions: [{ icon: 'dots', label: 'More', onClick: menu }]
    });

    var vCard = UI.card([UI.el('div', { class: 'card-row' }, [
      UI.el('div', { class: 'card-grow' }, [
        UI.el('div', { class: 'h2', text: 'Verdict' }),
        UI.el('div', { class: 'sub', id: 'vsub' })
      ]), vChip
    ])]);
    app.appendChild(vCard);
    refreshVerdict();
    function refreshVerdict() {
      var v = Fabrics.verdict(f);
      vChip.className = 'chip ' + v.cls; vChip.textContent = v.code;
      var s = document.getElementById('vsub');
      if (s) s.textContent = v.pass + ' passed · ' + v.fail + ' failed · ' + (v.total - v.tested) + ' not tested';
    }

    /* header */
    var head = UI.card([]);
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.text({ label: 'Swatch code', value: f.code, onInput: function (v) { f.code = v; save(); } }),
      UI.date({ label: 'Date', value: f.date, onInput: function (v) { f.date = v; save(); } })
    ]));
    head.appendChild(UI.text({ label: 'Fabric name', value: f.name, placeholder: 'e.g. Formtex Lycra', onInput: function (v) { f.name = v; document.getElementById('bar-title').textContent = v || 'Unnamed fabric'; save(); } }));
    var supSel = UI.select({
      label: 'Supplier', value: f.supplier || '', options: [''].concat(CFG.FABRIC_SUPPLIERS),
      onInput: function (v) { f.supplier = v === 'Other' ? '' : v; save(); if (v === 'Other') supFree.style.display = 'block'; }
    });
    head.appendChild(supSel);
    var supFree = UI.text({ label: 'Supplier (free text)', value: f.supplier, onInput: function (v) { f.supplier = v; save(); } });
    if (CFG.FABRIC_SUPPLIERS.indexOf(f.supplier) >= 0) supFree.style.display = 'none';
    head.appendChild(supFree);
    head.appendChild(UI.text({ label: 'Composition', value: f.composition, placeholder: 'e.g. 80% nylon / 20% elastane', onInput: function (v) { f.composition = v; save(); } }));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Stated gsm', value: f.statedGsm, unit: 'gsm', onInput: function (v) { f.statedGsm = v; save(); } }),
      UI.number({ label: 'Measured gsm', value: f.measuredGsm, unit: 'gsm', onInput: function (v) { f.measuredGsm = v; save(); } })
    ]));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Width', value: f.width, unit: 'cm', onInput: function (v) { f.width = v; save(); } }),
      UI.number({ label: 'Price per metre', value: f.pricePerM, unit: 'R', onInput: function (v) { f.pricePerM = v; save(); } })
    ]));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Minimum cut', value: f.minCut, unit: 'm', onInput: function (v) { f.minCut = v; save(); } }),
      UI.text({ label: 'Lead time', value: f.leadTime, placeholder: 'e.g. 3 days', onInput: function (v) { f.leadTime = v; save(); } })
    ]));
    head.appendChild(UI.text({ label: 'Colour', value: f.colour, onInput: function (v) { f.colour = v; save(); } }));
    app.appendChild(head);

    /* calculators */
    app.appendChild(UI.eyebrow('Calculators'));
    app.appendChild(calcExtension());
    app.appendChild(calcRecovery());
    app.appendChild(calcGsm());

    /* tests */
    app.appendChild(UI.eyebrow('10-test protocol'));
    CFG.FABRIC_TESTS.forEach(function (t) {
      f.tests[t.id] = f.tests[t.id] || {};
      var x = f.tests[t.id];
      var box = UI.el('div', { class: 'card' });
      box.appendChild(UI.el('div', { class: 'card-row', style: 'margin-bottom:8px' }, [
        UI.el('div', { class: 'card-grow' }, [
          UI.el('div', { class: 'q-n', text: 'TEST ' + t.n + (t.critical ? ' · CRITICAL' : '') }),
          UI.el('div', { class: 'h2', text: t.name })
        ])
      ]));
      box.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:4px', text: t.method }));
      box.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px;color:var(--accent)', text: 'Pass: ' + t.pass }));

      if (t.input === 'number') {
        box.appendChild(UI.number({
          label: 'Measured value', value: x.v, unit: t.unit,
          onInput: function (v) {
            x.v = v;
            var auto = Fabrics.autoResult(t, v);
            if (auto) { x.r = auto; segRefresh(auto); }
            save();
          }
        }));
      } else if (t.input === 'rating') {
        box.appendChild(UI.rating({
          label: 'Rating (1–5)', value: x.v, onInput: function (v) {
            x.v = v; var auto = Fabrics.autoResult(t, v);
            if (auto) { x.r = auto; segRefresh(auto); }
            save();
          }
        }));
      }

      var segField = UI.seg({
        label: 'Result', value: x.r || '', toggle: true,
        options: [{ v: 'pass', l: 'Pass' }, { v: 'fail', l: 'Fail' }],
        onInput: function (v) { x.r = v; save(); }
      });
      box.appendChild(segField);
      function segRefresh(v) {
        var btns = segField.querySelectorAll('.seg button');
        [].forEach.call(btns, function (b) { b.classList.toggle('on', b.dataset.v === v); });
      }

      box.appendChild(UI.text({ label: 'Notes', value: x.n, multiline: true, rows: 2, onInput: function (v) { x.n = v; save(); } }));
      if (t.photo) {
        box.appendChild(UI.el('div', { class: 'f-lab', text: 'Evidence photo' }));
        box.appendChild(Photos.strip({ module: 'fabrics', parentId: f.id, slot: t.name }));
      }
      app.appendChild(box);
    });

    app.appendChild(UI.eyebrow('Notes'));
    app.appendChild(UI.text({ value: f.notes, multiline: true, rows: 4, placeholder: 'Overall judgement on this swatch.', onInput: function (v) { f.notes = v; save(); } }));
    app.appendChild(UI.eyebrow('Other photos'));
    app.appendChild(Photos.strip({ module: 'fabrics', parentId: f.id, excludeSlots: true }));

    function calcExtension() {
      var a = '', b = '', out = UI.el('span', { class: 'ov', text: '—' });
      var box = UI.el('div', { class: 'calc' }, [UI.el('div', { class: 'calc-t', text: 'Extension calculator' })]);
      box.appendChild(UI.el('div', { class: 'f-row' }, [
        UI.number({ label: 'Original', value: '', unit: 'cm', onInput: function (v) { a = v; go(); } }),
        UI.number({ label: 'Stretched', value: '', unit: 'cm', onInput: function (v) { b = v; go(); } })
      ]));
      box.appendChild(UI.el('div', { class: 'out' }, [UI.el('span', { class: 'sub', text: 'Extension' }), out]));
      function go() { out.textContent = (a && b) ? UI.num((b - a) / a * 100, 1) + '%' : '—'; }
      return box;
    }
    function calcRecovery() {
      var a = '', b = '', out = UI.el('span', { class: 'ov', text: '—' });
      var box = UI.el('div', { class: 'calc' }, [UI.el('div', { class: 'calc-t', text: 'Recovery calculator' })]);
      box.appendChild(UI.el('div', { class: 'f-row' }, [
        UI.number({ label: 'Original', value: '', unit: 'cm', onInput: function (v) { a = v; go(); } }),
        UI.number({ label: 'After release', value: '', unit: 'cm', onInput: function (v) { b = v; go(); } })
      ]));
      box.appendChild(UI.el('div', { class: 'out' }, [UI.el('span', { class: 'sub', text: 'Growth (lower is better)' }), out]));
      function go() { out.textContent = (a && b) ? UI.num((b - a) / a * 100, 1) + '%' : '—'; }
      return box;
    }
    function calcGsm() {
      var g = '', out = UI.el('span', { class: 'ov', text: '—' });
      var box = UI.el('div', { class: 'calc' }, [UI.el('div', { class: 'calc-t', text: 'gsm calculator — 10 × 10 cm square' })]);
      box.appendChild(UI.number({ label: 'Weight of square', value: '', unit: 'g', onInput: function (v) { g = v; out.textContent = g ? UI.num(g * 100, 0) + ' gsm' : '—'; } }));
      box.appendChild(UI.el('div', { class: 'out' }, [UI.el('span', { class: 'sub', text: 'Fabric weight' }), out]));
      return box;
    }

    function menu() {
      UI.sheet({
        title: f.code || 'Swatch',
        body: UI.el('div', { class: 'sub', text: 'Record actions.' }),
        actions: [
          {
            label: 'Duplicate', cls: '', onClick: function () {
              DB.all('fabrics').then(function (list) {
                var c = JSON.parse(JSON.stringify(f));
                c.id = DB.uid('fab'); c.code = Fabrics.nextCode(list); c.createdAt = UI.nowISO();
                DB.put('fabrics', c).then(function () { UI.go('fabrics/' + c.id); UI.toast('Duplicated'); });
              });
            }
          },
          {
            label: 'Delete swatch', cls: 'danger', onClick: function () {
              UI.confirm('Delete ' + (f.code || 'this swatch') + '?', 'The record and its test photos will be removed.', 'Delete', true).then(function (ok) {
                if (!ok) return;
                Photos.forParent(f.id).then(function (ps) { return Photos.delMany(ps.map(function (p) { return p.id; })); })
                  .then(function () { return DB.del('fabrics', f.id); })
                  .then(function () { UI.go('fabrics'); UI.toast('Swatch deleted'); });
              });
            }
          }
        ]
      });
    }
  });
};
