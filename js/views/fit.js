/* Fit sessions — 12 fixed photo slots, issue log, body-zone heat summary. */
var Views = window.Views || {};

var Fit = (function () {
  function blank() {
    return {
      id: DB.uid('fit'), date: UI.today(), patternVersion: '', garmentCode: '', fabricId: '',
      fitModel: '', verdict: 'Not assessed', notes: '', issues: [],
      createdAt: UI.nowISO(), updatedAt: UI.nowISO()
    };
  }
  function sevCls(s) { return s >= 4 ? 'fail' : s >= 3 ? 'cond' : 'pass'; }
  function verdictCls(v) {
    if (v === 'Approve') return 'pass';
    if (v === 'Reject') return 'fail';
    if (v === 'Major corrections') return 'fail';
    if (v === 'Minor corrections') return 'cond';
    return '';
  }
  function zoneSummary(s) {
    var map = {};
    (s.issues || []).forEach(function (i) {
      if (!i.zone) return;
      if (!map[i.zone]) map[i.zone] = { n: 0, max: 0 };
      map[i.zone].n++;
      map[i.zone].max = Math.max(map[i.zone].max, Number(i.severity) || 0);
    });
    return Object.keys(map).map(function (k) { return { zone: k, n: map[k].n, max: map[k].max }; })
      .sort(function (a, b) { return b.max - a.max || b.n - a.n; });
  }
  return { blank: blank, sevCls: sevCls, verdictCls: verdictCls, zoneSummary: zoneSummary };
})();

/* ---------------- list ---------------- */
Views.fit = function (app) {
  UI.setBar({
    title: 'Fit sessions', eyebrow: 'Fitting room',
    actions: [
      { icon: 'ruler', label: 'Fit body', onClick: function () { UI.go('body'); } },
      { icon: 'dl', label: 'Export CSV', onClick: exportCsv }
    ]
  });
  var list = [], holder = UI.el('div');
  app.appendChild(holder);
  DB.all('fitsessions').then(function (r) {
    list = r.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    draw();
  });
  UI.fab('New session', function () {
    var s = Fit.blank();
    DB.put('fitsessions', s).then(function () { UI.go('fit/' + s.id); });
  });

  function draw() {
    UI.clear(holder);
    holder.appendChild(UI.el('button', {
      class: 'btn ghost', style: 'margin-bottom:14px', type: 'button', onclick: function () { UI.go('body'); }
    }, [UI.icon('ruler', 18), UI.el('span', { text: 'Fit body measurements' })]));

    if (!list.length) {
      holder.appendChild(UI.empty({
        icon: 'user', title: 'No fit sessions',
        text: 'Log every fitting. Twelve fixed photo slots, so you never finish a session and discover the squat shot is missing.',
        action: 'Start a session',
        onAction: function () { var s = Fit.blank(); DB.put('fitsessions', s).then(function () { UI.go('fit/' + s.id); }); }
      }));
      return;
    }
    var box = UI.el('div', { class: 'rows' });
    list.forEach(function (s) {
      var worst = (s.issues || []).reduce(function (m, i) { return Math.max(m, Number(i.severity) || 0); }, 0);
      box.appendChild(UI.row({
        title: s.garmentCode || 'Untitled garment',
        sub: UI.dateStr(s.date) + ' · ' + (s.patternVersion || 'no pattern version') + ' · ' + (s.issues || []).length + ' issues' + (worst ? ' · worst ' + worst + '/5' : ''),
        chip: s.verdict, chipCls: Fit.verdictCls(s.verdict),
        onClick: function () { UI.go('fit/' + s.id); }
      }));
    });
    holder.appendChild(box);
  }

  function exportCsv() {
    var rows = [['Date', 'Garment', 'Pattern version', 'Fit model', 'Verdict', 'Zone', 'Issue type', 'Severity', 'Description', 'Correction']];
    list.forEach(function (s) {
      if (!(s.issues || []).length) rows.push([s.date, s.garmentCode, s.patternVersion, s.fitModel, s.verdict, '', '', '', '', '']);
      (s.issues || []).forEach(function (i) {
        rows.push([s.date, s.garmentCode, s.patternVersion, s.fitModel, s.verdict, i.zone, i.type, i.severity, i.desc, i.fix]);
      });
    });
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-fit-sessions.csv');
    UI.toast('CSV exported', { type: 'good' });
  }
};

/* ---------------- detail ---------------- */
Views['fit/:id'] = function (app, params) {
  Promise.all([DB.get('fitsessions', params.id), DB.all('fabrics')]).then(function (r) {
    var s = r[0], fabrics = r[1];
    if (!s) { UI.toast('Session not found', { type: 'bad' }); return UI.go('fit'); }
    s.issues = s.issues || [];
    var save = UI.saver('fitsessions', s, renderZones);

    UI.setBar({
      eyebrow: 'Fit session', title: s.garmentCode || 'Untitled',
      back: function () { save.flush(); UI.go('fit'); },
      actions: [{ icon: 'dots', label: 'More', onClick: menu }]
    });

    var head = UI.card([]);
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.date({ label: 'Date', value: s.date, onInput: function (v) { s.date = v; save(); } }),
      UI.text({ label: 'Pattern version', value: s.patternVersion, placeholder: 'v1 toile', onInput: function (v) { s.patternVersion = v; save(); } })
    ]));
    head.appendChild(UI.text({
      label: 'Garment / sample code', value: s.garmentCode, placeholder: 'NOKT-01 ALPHA T1',
      onInput: function (v) { s.garmentCode = v; document.getElementById('bar-title').textContent = v || 'Untitled'; save(); }
    }));
    head.appendChild(UI.select({
      label: 'Fabric used', value: s.fabricId,
      options: [{ v: '', l: '— none selected —' }].concat(fabrics.map(function (f) { return { v: f.id, l: (f.code || '') + ' ' + (f.name || '') }; })),
      onInput: function (v) { s.fabricId = v; save(); }
    }));
    if (s.fabricId) {
      var fb = fabrics.filter(function (f) { return f.id === s.fabricId; })[0];
      if (fb) head.appendChild(UI.el('button', {
        class: 'linked', type: 'button', style: 'background:none;border:0',
        onclick: function () { UI.go('fabrics/' + fb.id); }
      }, [UI.icon('link', 14), UI.el('span', { text: 'Open ' + (fb.code || fb.name) })]));
    }
    head.appendChild(UI.text({ label: 'Fit model', value: s.fitModel, onInput: function (v) { s.fitModel = v; save(); } }));
    head.appendChild(UI.select({
      label: 'Overall verdict', value: s.verdict, options: CFG.FIT_VERDICTS,
      onInput: function (v) { s.verdict = v; save(); }
    }));
    app.appendChild(head);

    /* photo slots */
    app.appendChild(UI.eyebrow('Required shots'));
    app.appendChild(Photos.slots({ module: 'fit', parentId: s.id, slots: CFG.FIT_SLOTS }));

    /* issues */
    var issuesBox = UI.el('div');
    app.appendChild(UI.eyebrow('Issue log'));
    app.appendChild(issuesBox);
    app.appendChild(UI.el('button', {
      class: 'btn acc', type: 'button', style: 'margin-top:4px',
      onclick: function () { editIssue(null); }
    }, [UI.icon('plus', 18), UI.el('span', { text: 'Log an issue' })]));

    var zonesBox = UI.el('div');
    app.appendChild(UI.eyebrow('Body-zone summary'));
    app.appendChild(zonesBox);

    app.appendChild(UI.eyebrow('Session notes'));
    app.appendChild(UI.text({ value: s.notes, multiline: true, rows: 4, onInput: function (v) { s.notes = v; save(); } }));

    renderIssues(); renderZones();

    function renderIssues() {
      UI.clear(issuesBox);
      if (!s.issues.length) {
        issuesBox.appendChild(UI.el('div', { class: 'sub', style: 'padding:8px 0', text: 'No issues logged yet.' }));
        return;
      }
      var box = UI.el('div', { class: 'rows' });
      s.issues.slice().sort(function (a, b) { return (b.severity || 0) - (a.severity || 0); }).forEach(function (i) {
        box.appendChild(UI.row({
          dot: Fit.sevCls(i.severity),
          title: i.zone + ' — ' + i.type,
          sub: i.desc || 'No description',
          value: (i.severity || '—') + '/5',
          onClick: function () { editIssue(i); }
        }));
      });
      issuesBox.appendChild(box);
    }

    function renderZones() {
      UI.clear(zonesBox);
      var sum = Fit.zoneSummary(s);
      if (!sum.length) { zonesBox.appendChild(UI.el('div', { class: 'sub', text: 'Log issues to build the zone summary.' })); return; }
      var card = UI.card([]);
      sum.forEach(function (z) {
        var colour = z.max >= 4 ? 'var(--fail)' : z.max >= 3 ? 'var(--cond)' : 'var(--pass)';
        card.appendChild(UI.el('div', { class: 'zone-bar' }, [
          UI.el('span', { class: 'zn', text: z.zone }),
          UI.el('span', { class: 'zg' }, [UI.el('i', { style: 'width:' + (z.max / 5 * 100) + '%;background:' + colour })]),
          UI.el('span', { class: 'zc', text: z.n + '×' })
        ]));
      });
      zonesBox.appendChild(card);
    }

    function editIssue(existing) {
      var i = existing || { id: DB.uid('iss'), zone: CFG.ZONES[0], type: CFG.ISSUE_TYPES[0], severity: 3, desc: '', fix: '' };
      var body = UI.el('div');
      body.appendChild(UI.select({ label: 'Body zone', value: i.zone, options: CFG.ZONES, onInput: function (v) { i.zone = v; } }));
      body.appendChild(UI.select({ label: 'Issue type', value: i.type, options: CFG.ISSUE_TYPES, onInput: function (v) { i.type = v; } }));
      body.appendChild(UI.rating({ label: 'Severity', value: i.severity, toggle: false, onInput: function (v) { i.severity = v; } }));
      body.appendChild(UI.text({ label: 'Description', value: i.desc, multiline: true, rows: 3, onInput: function (v) { i.desc = v; } }));
      body.appendChild(UI.text({ label: 'Correction required', value: i.fix, multiline: true, rows: 3, onInput: function (v) { i.fix = v; } }));
      body.appendChild(UI.el('div', { class: 'f-lab', text: 'Photo' }));
      body.appendChild(Photos.strip({ module: 'fit', parentId: s.id, slot: 'Issue: ' + i.id }));

      var actions = [{
        label: existing ? 'Save issue' : 'Add issue', cls: 'pri', onClick: function () {
          if (!existing) s.issues.push(i);
          save.flush(); renderIssues(); renderZones();
        }
      }];
      if (existing) actions.push({
        label: 'Delete issue', cls: 'danger', onClick: function () {
          s.issues = s.issues.filter(function (x) { return x.id !== i.id; });
          save.flush(); renderIssues(); renderZones();
          UI.toast('Issue deleted', { action: 'Undo', onAction: function () { s.issues.push(i); save.flush(); renderIssues(); renderZones(); } });
        }
      });
      UI.sheet({ title: existing ? 'Edit issue' : 'New issue', body: body, actions: actions });
    }

    function menu() {
      UI.sheet({
        title: s.garmentCode || 'Fit session',
        body: UI.el('div', { class: 'sub', text: 'Record actions.' }),
        actions: [
          {
            label: 'Duplicate (new date)', cls: '', onClick: function () {
              var c = JSON.parse(JSON.stringify(s));
              c.id = DB.uid('fit'); c.date = UI.today(); c.createdAt = UI.nowISO(); c.issues = [];
              DB.put('fitsessions', c).then(function () { UI.go('fit/' + c.id); UI.toast('Duplicated without issues'); });
            }
          },
          {
            label: 'Delete session', cls: 'danger', onClick: function () {
              UI.confirm('Delete this fit session?', 'All twelve photo slots and the issue log will be removed.', 'Delete', true).then(function (ok) {
                if (!ok) return;
                Photos.forParent(s.id).then(function (ps) { return Photos.delMany(ps.map(function (p) { return p.id; })); })
                  .then(function () { return DB.del('fitsessions', s.id); })
                  .then(function () { UI.go('fit'); UI.toast('Session deleted'); });
              });
            }
          }
        ]
      });
    }
  });
};
