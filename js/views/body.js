/* Fit body — Appendix C 18-point measurement sets, ease calculator, diff. */
var Views = window.Views || {};

var Body = (function () {
  function blank() {
    return {
      id: DB.uid('body'), date: UI.today(), subject: '', mass: '', height: '', notes: '',
      m: {}, createdAt: UI.nowISO(), updatedAt: UI.nowISO()
    };
  }
  function filled(b) {
    return CFG.BODY_ALL.filter(function (f) { var v = (b.m || {})[f.id]; return v !== '' && v !== undefined && v !== null; }).length;
  }
  function ratios(b) {
    var m = b.m || {};
    function r(a, c) { return (m[a] && m[c]) ? (m[a] / m[c]) : null; }
    return {
      whr: r('waistLow', 'hipFull'),
      twr: r('thighMid', 'waistLow'),
      rise: r('riseFront', 'riseBack')
    };
  }
  return { blank: blank, filled: filled, ratios: ratios };
})();

/* ---------------- list ---------------- */
Views.body = function (app) {
  UI.setBar({
    title: 'Fit body', eyebrow: 'Appendix C',
    actions: [
      { icon: 'calc', label: 'Ease calculator', onClick: function () { UI.go('body/ease'); } },
      { icon: 'dl', label: 'Export CSV', onClick: exportCsv }
    ]
  });
  var list = [];
  var holder = UI.el('div');
  app.appendChild(holder);
  DB.all('bodysets').then(function (r) {
    list = r.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    draw();
  });
  UI.fab('New measurement set', function () {
    var b = Body.blank();
    DB.put('bodysets', b).then(function () { UI.go('body/' + b.id); });
  });

  function draw() {
    UI.clear(holder);
    if (!list.length) {
      holder.appendChild(UI.empty({
        icon: 'ruler', title: 'No measurement sets',
        text: 'Capture all 18 points on your fit body. Nothing downstream — block, ease, grading — can be engineered without this.',
        action: 'Capture measurements',
        onAction: function () { var b = Body.blank(); DB.put('bodysets', b).then(function () { UI.go('body/' + b.id); }); }
      }));
      return;
    }
    if (list.length >= 2) {
      holder.appendChild(UI.el('button', {
        class: 'btn acc', style: 'margin-bottom:14px', type: 'button',
        onclick: function () { UI.go('body/diff'); }
      }, [UI.icon('chart', 18), UI.el('span', { text: 'Compare two sets' })]));
    }
    var box = UI.el('div', { class: 'rows' });
    list.forEach(function (b) {
      var n = Body.filled(b);
      box.appendChild(UI.row({
        title: b.subject || 'Unnamed subject',
        sub: UI.dateStr(b.date) + ' · ' + n + '/' + CFG.BODY_ALL.length + ' points' + (b.mass ? ' · ' + b.mass + ' kg' : ''),
        chip: n === CFG.BODY_ALL.length ? 'Complete' : 'Partial',
        chipCls: n === CFG.BODY_ALL.length ? 'pass' : 'cond',
        onClick: function () { UI.go('body/' + b.id); }
      }));
    });
    holder.appendChild(box);
  }

  function exportCsv() {
    var head = ['Date', 'Subject', 'Height', 'Mass'].concat(CFG.BODY_ALL.map(function (f) { return f.label; })).concat(['Notes']);
    var rows = [head];
    list.forEach(function (b) {
      rows.push([b.date, b.subject, b.height, b.mass]
        .concat(CFG.BODY_ALL.map(function (f) { return (b.m || {})[f.id] || ''; }))
        .concat([b.notes]));
    });
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-measurements.csv');
    UI.toast('CSV exported', { type: 'good' });
  }
};

/* ---------------- ease calculator ---------------- */
Views['body/ease'] = function (app) {
  UI.setBar({ title: 'Negative ease', eyebrow: 'Finished garment', back: function () { UI.go('body'); } });

  Promise.all([DB.all('bodysets'), DB.meta('easeProfiles', []), DB.meta('activeBody', '')]).then(function (r) {
    var sets = r[0].sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var profiles = r[1] && r[1].length ? r[1] : JSON.parse(JSON.stringify(CFG.EASE_PRESETS));
    if (!sets.length) {
      app.appendChild(UI.empty({ icon: 'ruler', title: 'No measurements yet', text: 'Capture a measurement set first — the calculator works from real body girths.' }));
      return;
    }
    var bodyId = r[2] && sets.some(function (s) { return s.id === r[2]; }) ? r[2] : sets[0].id;
    var profIdx = 0;
    var out = UI.el('div');

    app.appendChild(UI.select({
      label: 'Measurement set', value: bodyId,
      options: sets.map(function (s) { return { v: s.id, l: (s.subject || 'Unnamed') + ' · ' + UI.dateStr(s.date) }; }),
      onInput: function (v) { bodyId = v; DB.setMeta('activeBody', v); draw(); }
    }));
    app.appendChild(UI.select({
      label: 'Ease profile', value: '0',
      options: profiles.map(function (p, i) { return { v: String(i), l: p.name }; }),
      onInput: function (v) { profIdx = Number(v); draw(); }
    }));
    app.appendChild(out);

    var saveProfiles = UI.debounce(function () { DB.setMeta('easeProfiles', profiles); }, 400);

    function draw() {
      UI.clear(out);
      var set = sets.filter(function (s) { return s.id === bodyId; })[0];
      var prof = profiles[profIdx];
      out.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:14px', text: prof.note || 'Custom profile.' }));

      CFG.EASE_ZONES.forEach(function (z) {
        var body = (set.m || {})[z.from];
        var pct = prof.zones[z.id] === undefined ? 0 : prof.zones[z.id];
        var result = UI.el('span', { class: 'ov' });
        function calc() {
          result.textContent = body ? UI.num(body * (1 - pct / 100), 1) + ' cm' : 'no body measurement';
          result.style.color = body ? '' : 'var(--dim2)';
        }
        var card = UI.el('div', { class: 'card' }, [
          UI.el('div', { class: 'card-row' }, [
            UI.el('div', { class: 'card-grow' }, [
              UI.el('div', { class: 'h2', text: z.label }),
              UI.el('div', { class: 'sub', text: 'Body ' + (body ? UI.num(body, 1) + ' cm' : '—') })
            ])
          ])
        ]);
        card.appendChild(UI.slider({
          label: 'Negative ease', value: pct, min: 0, max: 35, step: 1, unit: '%',
          onInput: function (v) { pct = v; prof.zones[z.id] = v; calc(); saveProfiles(); }
        }));
        card.appendChild(UI.el('div', { class: 'out' }, [UI.el('span', { class: 'sub', text: 'Finished garment' }), result]));
        calc();
        out.appendChild(card);
      });

      out.appendChild(UI.el('button', {
        class: 'btn ghost', style: 'margin-top:12px', type: 'button', text: 'Save as new profile',
        onclick: function () {
          UI.prompt('New ease profile', 'Name', prof.name + ' (copy)').then(function (name) {
            if (!name) return;
            profiles.push({ id: DB.uid('ease'), name: name, note: 'Custom', zones: JSON.parse(JSON.stringify(prof.zones)) });
            DB.setMeta('easeProfiles', profiles).then(function () { UI.toast('Profile saved', { type: 'good' }); UI.resolve(); });
          });
        }
      }));
      out.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-top:14px', text: 'Light compression is typically 8–15% negative ease; firm compression 15–25%. Ease should differ per zone — the calf and ankle usually need more than the hip.' }));
    }
    draw();
  });
};

/* ---------------- diff ---------------- */
Views['body/diff'] = function (app) {
  UI.setBar({ title: 'Compare sets', eyebrow: 'Fit body', back: function () { UI.go('body'); } });
  DB.all('bodysets').then(function (sets) {
    sets.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    if (sets.length < 2) { app.appendChild(UI.empty({ icon: 'ruler', title: 'Need two sets', text: 'Capture at least two measurement sets to compare.' })); return; }
    var aId = sets[1].id, bId = sets[0].id;
    var out = UI.el('div');
    var opts = sets.map(function (s) { return { v: s.id, l: (s.subject || 'Unnamed') + ' · ' + UI.dateStr(s.date) }; });
    app.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.select({ label: 'Baseline', value: aId, options: opts, onInput: function (v) { aId = v; draw(); } }),
      UI.select({ label: 'Compare to', value: bId, options: opts, onInput: function (v) { bId = v; draw(); } })
    ]));
    app.appendChild(out);
    function draw() {
      UI.clear(out);
      var A = sets.filter(function (s) { return s.id === aId; })[0];
      var B = sets.filter(function (s) { return s.id === bId; })[0];
      var box = UI.el('div', { class: 'rows' });
      CFG.BODY_ALL.forEach(function (f) {
        var va = (A.m || {})[f.id], vb = (B.m || {})[f.id];
        if ((va === '' || va === undefined) && (vb === '' || vb === undefined)) return;
        var d = (va !== undefined && vb !== undefined && va !== '' && vb !== '') ? vb - va : null;
        box.appendChild(UI.row({
          title: f.label,
          sub: (va || '—') + ' → ' + (vb || '—') + ' cm',
          value: d === null ? '' : (d > 0 ? '+' : '') + UI.num(d, 1),
          dot: d === null ? '' : (Math.abs(d) >= 1.5 ? 'fail' : Math.abs(d) >= 0.5 ? 'cond' : 'pass')
        }));
      });
      out.appendChild(box);
    }
    draw();
  });
};

/* ---------------- detail ---------------- */
Views['body/:id'] = function (app, params) {
  if (params.id === 'ease' || params.id === 'diff') return;
  DB.get('bodysets', params.id).then(function (b) {
    if (!b) { UI.toast('Set not found', { type: 'bad' }); return UI.go('body'); }
    b.m = b.m || {};
    var save = UI.saver('bodysets', b, updateRatios);

    UI.setBar({
      eyebrow: 'Measurement set', title: b.subject || 'Unnamed',
      back: function () { save.flush(); UI.go('body'); },
      actions: [{ icon: 'dots', label: 'More', onClick: menu }]
    });

    var head = UI.card([]);
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.text({ label: 'Subject', value: b.subject, placeholder: 'Fit body A', onInput: function (v) { b.subject = v; document.getElementById('bar-title').textContent = v || 'Unnamed'; save(); } }),
      UI.date({ label: 'Date', value: b.date, onInput: function (v) { b.date = v; save(); } })
    ]));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: '18. Height', value: b.height, unit: 'cm', onInput: function (v) { b.height = v; save(); } }),
      UI.number({ label: '18. Mass', value: b.mass, unit: 'kg', onInput: function (v) { b.mass = v; save(); } })
    ]));
    app.appendChild(head);

    var ratioCard = UI.card([]);
    app.appendChild(ratioCard);
    updateRatios();
    function updateRatios() {
      UI.clear(ratioCard);
      var r = Body.ratios(b);
      ratioCard.appendChild(UI.el('div', { class: 'eyebrow', style: 'margin-top:0', text: 'Derived' }));
      ratioCard.appendChild(UI.kv('Waist-to-hip ratio', r.whr ? UI.num(r.whr, 3) : '—'));
      ratioCard.appendChild(UI.kv('Thigh-to-waist ratio', r.twr ? UI.num(r.twr, 3) : '—'));
      ratioCard.appendChild(UI.kv('Rise balance (front ÷ back)', r.rise ? UI.num(r.rise, 3) : '—'));
      var n = Body.filled(b);
      ratioCard.appendChild(UI.kv('Points captured', n + ' / ' + CFG.BODY_ALL.length, n === CFG.BODY_ALL.length ? '' : ''));
    }

    function group(title, fields, startNo) {
      app.appendChild(UI.eyebrow(title));
      fields.forEach(function (f, i) {
        var card = UI.el('div', { class: 'card' });
        card.appendChild(UI.number({
          label: (startNo + i) + '. ' + f.label, value: b.m[f.id], unit: 'cm',
          onInput: function (v) { b.m[f.id] = v; save(); }
        }));
        card.appendChild(UI.helpNote(f.help));
        app.appendChild(card);
      });
    }
    group('Girths (1–9)', CFG.BODY_GIRTHS, 1);
    group('Lengths (10–17)', CFG.BODY_LENGTHS, 10);

    app.appendChild(UI.eyebrow('Notes'));
    app.appendChild(UI.text({
      value: b.notes, multiline: true, rows: 4,
      placeholder: 'Conditions, time of day, where the low waist was marked, any asymmetry.',
      onInput: function (v) { b.notes = v; save(); }
    }));
    app.appendChild(UI.eyebrow('Photos — front, side, back'));
    app.appendChild(Photos.slots({ module: 'body', parentId: b.id, slots: ['Front', 'Side', 'Back'] }));
    app.appendChild(UI.el('div', { class: 'f-lab', style: 'margin-top:14px', text: 'Other photos' }));
    app.appendChild(Photos.strip({ module: 'body', parentId: b.id, excludeSlots: true }));

    function menu() {
      UI.sheet({
        title: b.subject || 'Measurement set',
        body: UI.el('div', { class: 'sub', text: 'Record actions.' }),
        actions: [
          {
            label: 'Duplicate as new date', cls: '', onClick: function () {
              var c = JSON.parse(JSON.stringify(b));
              c.id = DB.uid('body'); c.date = UI.today(); c.createdAt = UI.nowISO();
              DB.put('bodysets', c).then(function () { UI.go('body/' + c.id); UI.toast('Duplicated'); });
            }
          },
          {
            label: 'Delete set', cls: 'danger', onClick: function () {
              UI.confirm('Delete this measurement set?', 'The record and its photos will be removed.', 'Delete', true).then(function (ok) {
                if (!ok) return;
                Photos.forParent(b.id).then(function (ps) { return Photos.delMany(ps.map(function (p) { return p.id; })); })
                  .then(function () { return DB.del('bodysets', b.id); })
                  .then(function () { UI.go('body'); UI.toast('Deleted'); });
              });
            }
          }
        ]
      });
    }
  });
};
