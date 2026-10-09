/* Reports — printable HTML, save as PDF via Chrome's print dialog. */
var Views = window.Views || {};

Views.reports = function (app) {
  UI.setBar({ title: 'Reports', eyebrow: 'Print / PDF', back: function () { UI.go('more'); } });

  var opts = { factories: true, fabrics: true, body: true, fit: true, wear: true, cost: true, decisions: true, photos: true };

  app.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:14px' }, [
    'Builds a clean document you can save as PDF with Chrome: ',
    UI.el('b', { text: 'Print → Save as PDF' }), '. No PDF library, nothing uploaded.'
  ]));

  var card = UI.card([]);
  [
    ['factories', 'Factory comparison'],
    ['fabrics', 'Fabric test results'],
    ['body', 'Body measurements'],
    ['fit', 'Fit sessions + issues'],
    ['wear', 'Wear tests'],
    ['cost', 'Cost model'],
    ['decisions', 'Decision log'],
    ['photos', 'Include photos']
  ].forEach(function (o) {
    card.appendChild(UI.checkbox({ label: o[1], checked: opts[o[0]], onInput: function (v) { opts[o[0]] = v; DB.setMeta('reportOpts', opts); } }));
  });
  app.appendChild(card);

  app.appendChild(UI.el('button', {
    class: 'btn pri', style: 'margin-top:14px', type: 'button', onclick: function () { DB.setMeta('reportOpts', opts).then(function () { UI.go('reports/view'); }); }
  }, [UI.icon('print', 18), UI.el('span', { text: 'Build report' })]));

};

Views['reports/view'] = function (app) {
  UI.setBar({
    title: 'Report', eyebrow: 'Preview', back: function () { UI.go('reports'); },
    actions: [{ icon: 'print', label: 'Print', onClick: function () { window.print(); } }]
  });
  app.className = 'app wide';

  DB.meta('reportOpts', {}).then(function (o) {
    var opts = Object.keys(o || {}).length ? o : { factories: 1, fabrics: 1, body: 1, fit: 1, wear: 1, cost: 1, decisions: 1, photos: 1 };
    return Promise.all([
      DB.all('factories'), DB.all('fabrics'), DB.all('bodysets'), DB.all('fitsessions'),
      DB.all('weartests'), DB.all('decisions'), DB.meta('cost', CFG.COST_DEFAULTS), Photos.all()
    ]).then(function (r) { render(opts, r); });
  });

  function render(opts, r) {
    var factories = r[0], fabrics = r[1], bodies = r[2], fits = r[3], wears = r[4], decs = r[5], cost = r[6], photos = r[7];

    app.appendChild(UI.el('div', { class: 'no-print', style: 'margin-bottom:16px' }, [
      UI.el('button', { class: 'btn pri', type: 'button', onclick: function () { window.print(); } }, [UI.icon('print', 18), UI.el('span', { text: 'Print / Save as PDF' })])
    ]));

    app.appendChild(UI.el('div', { class: 'rep-h' }, [
      UI.el('div', { class: 'rt', text: 'NOKT — Development Report' }),
      UI.el('div', { class: 'rs', text: 'Generated ' + UI.dateStr(UI.today()) + ' · NOKT Field Log' })
    ]));

    if (opts.factories && factories.length) {
      sec('Factory comparison', function (s) {
        var wrap = UI.el('div', { class: 'tw' }), t = UI.el('table');
        t.appendChild(UI.el('thead', {}, [UI.el('tr', {}, [
          th('Factory'), th('Status'), th('MOQ basis'), th('MOQ'), th('CMT/unit'), th('Sample'), th('Lead'), th('Flatlock'), th('Bonding')
        ])]));
        var tb = UI.el('tbody');
        factories.forEach(function (f) {
          function a(q, k) { var v = ((f.a || {})[q] || {})[k]; return v === undefined || v === '' ? '—' : v; }
          tb.appendChild(UI.el('tr', {}, [
            td(f.name || '—'), td(f.status), td(a('q5', 'basis')), td(a('q6', 'moq')),
            td(a('q11', 'cmt') === '—' ? '—' : UI.money(a('q11', 'cmt'))),
            td(a('q7', 'cost') === '—' ? '—' : UI.money(a('q7', 'cost'))),
            td(a('q12', 'weeks') === '—' ? '—' : a('q12', 'weeks') + ' wk'),
            td(a('q2', 'yes') === true ? 'Yes' : a('q2', 'yes') === false ? 'No' : '—'),
            td(a('q4', 'yes') === true ? 'Yes' : a('q4', 'yes') === false ? 'No' : '—')
          ]));
        });
        t.appendChild(tb); wrap.appendChild(t); s.appendChild(wrap);
      });
    }

    if (opts.fabrics && fabrics.length) {
      sec('Fabric test results', function (s) {
        fabrics.forEach(function (f) {
          var v = Fabrics.verdict(f);
          var c = UI.el('div', { class: 'card' });
          c.appendChild(UI.el('div', { class: 'h2', text: (f.code || '') + ' · ' + (f.name || '') + ' — ' + v.code }));
          c.appendChild(UI.el('div', { class: 'sub', text: [f.supplier, f.composition, (f.measuredGsm || f.statedGsm) + ' gsm', f.pricePerM ? UI.money(f.pricePerM) + '/m' : ''].filter(Boolean).join(' · ') }));
          CFG.FABRIC_TESTS.forEach(function (t) {
            var x = (f.tests || {})[t.id] || {};
            c.appendChild(UI.kv(t.n + '. ' + t.name, (x.r || 'not tested').toUpperCase() + (x.v !== undefined && x.v !== '' ? ' (' + x.v + (t.unit || '') + ')' : '')));
          });
          if (f.notes) c.appendChild(UI.el('div', { class: 'sub', style: 'margin-top:8px', text: f.notes }));
          if (opts.photos) c.appendChild(photoRow(f.id));
          s.appendChild(c);
        });
      });
    }

    if (opts.body && bodies.length) {
      sec('Body measurements', function (s) {
        bodies.forEach(function (b) {
          var c = UI.el('div', { class: 'card' });
          c.appendChild(UI.el('div', { class: 'h2', text: (b.subject || 'Unnamed') + ' · ' + UI.dateStr(b.date) }));
          c.appendChild(UI.el('div', { class: 'sub', text: (b.height ? b.height + ' cm · ' : '') + (b.mass ? b.mass + ' kg' : '') }));
          CFG.BODY_ALL.forEach(function (f, i) {
            var v = (b.m || {})[f.id];
            if (v !== '' && v !== undefined) c.appendChild(UI.kv((i + 1) + '. ' + f.label, v + ' cm'));
          });
          var ra = Body.ratios(b);
          if (ra.whr) c.appendChild(UI.kv('Waist-to-hip ratio', UI.num(ra.whr, 3)));
          if (ra.rise) c.appendChild(UI.kv('Rise balance', UI.num(ra.rise, 3)));
          if (b.notes) c.appendChild(UI.el('div', { class: 'sub', style: 'margin-top:8px', text: b.notes }));
          s.appendChild(c);
        });
      });
    }

    if (opts.fit && fits.length) {
      sec('Fit sessions', function (s) {
        fits.forEach(function (f) {
          var c = UI.el('div', { class: 'card' });
          c.appendChild(UI.el('div', { class: 'h2', text: (f.garmentCode || 'Untitled') + ' · ' + UI.dateStr(f.date) }));
          c.appendChild(UI.el('div', { class: 'sub', text: [f.patternVersion, f.fitModel, 'Verdict: ' + f.verdict].filter(Boolean).join(' · ') }));
          (f.issues || []).slice().sort(function (a, b) { return (b.severity || 0) - (a.severity || 0); }).forEach(function (i) {
            c.appendChild(UI.kv(i.zone + ' — ' + i.type + ' (' + i.severity + '/5)', i.fix || i.desc || ''));
          });
          if (f.notes) c.appendChild(UI.el('div', { class: 'sub', style: 'margin-top:8px', text: f.notes }));
          if (opts.photos) c.appendChild(photoRow(f.id));
          s.appendChild(c);
        });
      });
    }

    if (opts.wear && wears.length) {
      sec('Wear tests', function (s) {
        wears.forEach(function (w) {
          var c = UI.el('div', { class: 'card' });
          c.appendChild(UI.el('div', { class: 'h2', text: (w.garmentCode || 'Untitled') + ' · ' + UI.dateStr(w.date) + ' · ' + (w.duration || 0) + ' h' }));
          c.appendChild(UI.el('div', { class: 'sub', text: (w.activities || []).join(', ') }));
          CFG.CHECKIN_METRICS.forEach(function (m) {
            var a = Wear.avg(w, m.id);
            if (a !== null) c.appendChild(UI.kv('Average ' + m.label.toLowerCase(), UI.num(a, 1) + '/5'));
          });
          (w.failures || []).forEach(function (f) { c.appendChild(UI.kv('Failure — ' + f.loc, f.what + ' (hour ' + f.hour + ', ' + f.sev + '/5)')); });
          if (w.worst) c.appendChild(UI.kv('Worst problem', w.worst));
          if (w.best) c.appendChild(UI.kv('Best quality', w.best));
          s.appendChild(c);
        });
      });
    }

    if (opts.cost) {
      sec('Cost model', function (s) {
        var l = Cost.landed(cost), m = Cost.margin(cost);
        var c = UI.el('div', { class: 'card' });
        c.appendChild(UI.kv('Landed cost / unit', UI.money(l)));
        c.appendChild(UI.kv('Retail price', UI.money(cost.retail)));
        c.appendChild(UI.kv('Gross margin', UI.num(m, 1) + '%'));
        c.appendChild(UI.kv('MOQ', (cost.moq || 0) + ' · ' + (cost.moqBasis || '—')));
        c.appendChild(UI.kv('Capital — per style', UI.money(l * (Number(cost.moq) || 0))));
        c.appendChild(UI.kv('Capital — per size × ' + (cost.sizes || 1), UI.money(l * (Number(cost.moq) || 0) * (Number(cost.sizes) || 1))));
        s.appendChild(c);
      });
    }

    if (opts.decisions && decs.length) {
      sec('Decision log', function (s) {
        decs.forEach(function (d) {
          var c = UI.el('div', { class: 'card' });
          c.appendChild(UI.el('div', { class: 'h2', text: (d.ref ? d.ref + ' · ' : '') + (d.title || '') }));
          c.appendChild(UI.el('div', { class: 'sub', text: d.status + ' · confidence ' + d.confidence }));
          if (d.fact) c.appendChild(UI.kv('Fact', d.fact));
          if (d.assumption) c.appendChild(UI.kv('Assumption', d.assumption));
          if (d.hypothesis) c.appendChild(UI.kv('Hypothesis', d.hypothesis));
          if (d.rec) c.appendChild(UI.kv('Recommendation', d.rec));
          s.appendChild(c);
        });
      });
    }

    function photoRow(parentId) {
      var ps = photos.filter(function (p) { return p.parentId === parentId; }).slice(0, 8);
      if (!ps.length) return UI.el('span');
      var g = UI.el('div', { class: 'ph-grid', style: 'margin-top:10px' });
      ps.forEach(function (p) {
        g.appendChild(UI.el('div', { class: 'ph-cell' }, [UI.el('img', { src: Photos.thumbURL(p), alt: p.slot || '' })]));
      });
      return g;
    }
    function sec(title, fill) {
      var s = UI.el('div', { class: 'rep-sec' });
      s.appendChild(UI.eyebrow(title));
      fill(s);
      app.appendChild(s);
    }
    function th(t) { return UI.el('th', { text: t }); }
    function td(t) { return UI.el('td', { text: String(t) }); }
  }
};
