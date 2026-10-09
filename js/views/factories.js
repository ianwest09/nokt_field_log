/* Factories — CMT capability tracker (Appendix A). */
var Views = window.Views || {};
var Factories = (function () {

  function blank() {
    return {
      id: DB.uid('fac'), name: '', contact: '', phone: '', email: '', address: '',
      dateContacted: '', status: 'Not contacted', rating: '', notes: '', a: {},
      createdAt: UI.nowISO(), updatedAt: UI.nowISO()
    };
  }
  function statusCls(s) {
    if (s === 'Shortlisted') return 'pass';
    if (s === 'Rejected') return 'fail';
    if (s === 'Quoted' || s === 'Visited') return 'acc';
    if (s === 'Replied') return 'acc';
    return '';
  }
  function ans(f, q, key) { return (f.a && f.a[q] && f.a[q][key] !== undefined) ? f.a[q][key] : ''; }
  function moqBasis(f) { return ans(f, 'q5', 'basis') || '—'; }

  function questionnaireText(f) {
    var t = CFG.QUESTIONNAIRE_INTRO + '\n';
    CFG.FACTORY_QUESTIONS.forEach(function (q, i) { t += (i + 1) + '. ' + q.q + '\n\n'; });
    t += CFG.QUESTIONNAIRE_OUTRO;
    return t;
  }

  return { blank: blank, statusCls: statusCls, ans: ans, moqBasis: moqBasis, questionnaireText: questionnaireText };
})();

/* ---------------- list ---------------- */
Views.factories = function (app) {
  UI.setBar({
    title: 'Factories', eyebrow: 'CMT capability',
    actions: [
      { icon: 'chart', label: 'Compare', onClick: function () { UI.go('factories/compare'); } },
      { icon: 'dl', label: 'Export CSV', onClick: exportCsv }
    ]
  });
  var q = '', sort = 'name', list = [];

  DB.all('factories').then(function (r) { list = r; draw(); });

  var holder = UI.el('div');
  var sortSel = UI.select({
    value: sort, options: [{ v: 'name', l: 'A–Z' }, { v: 'status', l: 'Status' }, { v: 'moq', l: 'MOQ' }, { v: 'price', l: 'CMT price' }, { v: 'date', l: 'Recent' }],
    onInput: function (v) { sort = v; draw(); }
  });
  sortSel.classList.remove('f'); sortSel.style.margin = '0';
  app.appendChild(UI.searchBar('Search factories', function (v) { q = v; draw(); }, sortSel));
  app.appendChild(holder);
  UI.fab('New factory', function () {
    var f = Factories.blank();
    DB.put('factories', f).then(function () { UI.go('factories/' + f.id); });
  });

  function draw() {
    UI.clear(holder);
    var rows = list.filter(function (f) {
      return !q || (f.name + ' ' + f.address + ' ' + f.notes + ' ' + f.contact).toLowerCase().indexOf(q) >= 0;
    });
    rows.sort(function (a, b) {
      if (sort === 'status') return CFG.FACTORY_STATUS.indexOf(a.status) - CFG.FACTORY_STATUS.indexOf(b.status);
      if (sort === 'moq') return (Factories.ans(a, 'q6', 'moq') || 1e9) - (Factories.ans(b, 'q6', 'moq') || 1e9);
      if (sort === 'price') return (Factories.ans(a, 'q11', 'cmt') || 1e9) - (Factories.ans(b, 'q11', 'cmt') || 1e9);
      if (sort === 'date') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      return (a.name || '').localeCompare(b.name || '');
    });

    if (!rows.length) {
      holder.appendChild(UI.empty({
        icon: 'factory', title: q ? 'No matches' : 'No factories yet',
        text: q ? 'Try a different search.' : 'Add the CMTs you are approaching. The MOQ basis answer is the highest-value field in this app.',
        action: q ? null : 'Add a factory', onAction: function () {
          var f = Factories.blank(); DB.put('factories', f).then(function () { UI.go('factories/' + f.id); });
        }
      }));
      return;
    }

    var box = UI.el('div', { class: 'rows' });
    rows.forEach(function (f) {
      var answered = Object.keys(f.a || {}).filter(function (k) { return f.a[k] && (f.a[k].text || Object.keys(f.a[k]).length); }).length;
      var bits = [];
      if (Factories.ans(f, 'q6', 'moq')) bits.push('MOQ ' + Factories.ans(f, 'q6', 'moq'));
      if (Factories.ans(f, 'q5', 'basis')) bits.push(Factories.ans(f, 'q5', 'basis'));
      if (Factories.ans(f, 'q11', 'cmt')) bits.push(UI.money(Factories.ans(f, 'q11', 'cmt')) + '/u');
      bits.push(answered + '/12 answered');
      box.appendChild(UI.row({
        title: f.name || 'Untitled factory',
        sub: bits.join(' · '),
        chip: f.status, chipCls: Factories.statusCls(f.status),
        onClick: function () { UI.go('factories/' + f.id); }
      }));
    });
    holder.appendChild(box);
  }

  function exportCsv() {
    var head = ['Name', 'Status', 'Contact', 'Phone', 'Email', 'Address', 'Date contacted', 'Rating']
      .concat(CFG.FACTORY_QUESTIONS.map(function (q) { return q.short; }))
      .concat(['Notes']);
    var rows = [head];
    list.forEach(function (f) {
      var r = [f.name, f.status, f.contact, f.phone, f.email, f.address, f.dateContacted, f.rating];
      CFG.FACTORY_QUESTIONS.forEach(function (q) {
        var a = (f.a || {})[q.id] || {};
        var structured = Object.keys(a).filter(function (k) { return k !== 'text'; })
          .map(function (k) { return k + '=' + a[k]; }).join('; ');
        r.push([a.text || '', structured].filter(Boolean).join(' | '));
      });
      r.push(f.notes);
      rows.push(r);
    });
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-factories.csv');
    UI.toast('CSV exported', { type: 'good' });
  }
};

/* ---------------- comparison table ---------------- */
Views['factories/compare'] = function (app) {
  UI.setBar({ title: 'Comparison', eyebrow: 'Factories', back: function () { UI.go('factories'); } });
  app.className = 'app wide';
  var sort = 'cmt', dir = 1;

  DB.all('factories').then(function (list) {
    var cols = [
      { k: 'name', l: 'Factory', get: function (f) { return f.name || '—'; }, cls: 'name' },
      { k: 'status', l: 'Status', get: function (f) { return f.status; } },
      { k: 'basis', l: 'MOQ basis', get: function (f) { return Factories.ans(f, 'q5', 'basis') || '—'; }, critical: true },
      { k: 'moq', l: 'MOQ', get: function (f) { return Factories.ans(f, 'q6', 'moq') || '—'; }, num: true },
      { k: 'cmt', l: 'CMT / unit', get: function (f) { var v = Factories.ans(f, 'q11', 'cmt'); return v ? UI.money(v) : '—'; }, num: true, raw: function (f) { return Factories.ans(f, 'q11', 'cmt'); } },
      { k: 'sample', l: 'Sample', get: function (f) { var v = Factories.ans(f, 'q7', 'cost'); return v ? UI.money(v) : '—'; }, num: true, raw: function (f) { return Factories.ans(f, 'q7', 'cost'); } },
      { k: 'lead', l: 'Lead time', get: function (f) { var v = Factories.ans(f, 'q12', 'weeks'); return v ? v + ' wk' : '—'; }, num: true, raw: function (f) { return Factories.ans(f, 'q12', 'weeks'); } },
      { k: 'stretch', l: 'Stretch %', get: function (f) { var v = Factories.ans(f, 'q1', 'pct'); return v === '' ? '—' : v + '%'; }, num: true, raw: function (f) { return Factories.ans(f, 'q1', 'pct'); } },
      { k: 'flat', l: 'Flatlock', get: function (f) { var v = Factories.ans(f, 'q2', 'yes'); return v === true ? 'Yes' : v === false ? 'No' : '—'; } },
      { k: 'bond', l: 'Bonding', get: function (f) { var v = Factories.ans(f, 'q4', 'yes'); return v === true ? 'Yes' : v === false ? 'No' : '—'; } }
    ];

    var wrap = UI.el('div', { class: 'tw' });
    var table = UI.el('table');
    function draw() {
      UI.clear(table);
      var thead = UI.el('thead'), tr = UI.el('tr');
      cols.forEach(function (c) {
        var th = UI.el('th', { class: sort === c.k ? 'on' : '' });
        var b = UI.el('button', { type: 'button', text: c.l, onclick: function () { if (sort === c.k) dir = -dir; else { sort = c.k; dir = 1; } draw(); } });
        if (sort === c.k) b.appendChild(UI.icon(dir > 0 ? 'down' : 'back', 12));
        th.appendChild(b); tr.appendChild(th);
      });
      thead.appendChild(tr); table.appendChild(thead);

      var sorted = list.slice().sort(function (a, b) {
        var col = cols.filter(function (c) { return c.k === sort; })[0];
        var va = col.raw ? col.raw(a) : col.get(a), vb = col.raw ? col.raw(b) : col.get(b);
        if (col.num) { va = va === '' || va === '—' ? Infinity : Number(va); vb = vb === '' || vb === '—' ? Infinity : Number(vb); return (va - vb) * dir; }
        return String(va).localeCompare(String(vb)) * dir;
      });

      var tb = UI.el('tbody');
      sorted.forEach(function (f) {
        var r = UI.el('tr');
        cols.forEach(function (c) {
          var td = UI.el('td', { class: (c.cls || '') + (c.num ? ' r' : '') });
          var val = c.get(f);
          if (c.critical) {
            var cls = val === 'Per style' ? 'pass' : (val === 'Per size' ? 'fail' : '');
            td.appendChild(UI.el('span', { class: 'chip ' + cls, text: val }));
          } else td.textContent = val;
          r.appendChild(td);
        });
        r.onclick = function () { UI.go('factories/' + f.id); };
        r.style.cursor = 'pointer';
        tb.appendChild(r);
      });
      table.appendChild(tb);
    }
    draw();
    wrap.appendChild(table);
    app.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px' },
      ['Scroll sideways. Tap any row to open the factory. ',
        UI.el('b', { text: 'MOQ basis' }), ' is the field that swings your launch capital by 3×.']));
    app.appendChild(wrap);
  });
};

/* ---------------- detail ---------------- */
Views['factories/:id'] = function (app, params) {
  DB.get('factories', params.id).then(function (f) {
    if (!f) { UI.toast('Factory not found', { type: 'bad' }); return UI.go('factories'); }
    var save = UI.saver('factories', f);

    UI.setBar({
      eyebrow: 'Factory', title: f.name || 'Untitled',
      back: function () { save.flush(); UI.go('factories'); },
      actions: [{ icon: 'dots', label: 'More', onClick: menu }]
    });

    /* header card */
    var head = UI.card([]);
    head.appendChild(UI.text({ label: 'Factory name', value: f.name, placeholder: 'e.g. Amari CMT', onInput: function (v) { f.name = v; document.getElementById('bar-title').textContent = v || 'Untitled'; save(); } }));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.text({ label: 'Contact person', value: f.contact, onInput: function (v) { f.contact = v; save(); } }),
      UI.text({ label: 'Phone', value: f.phone, type: 'tel', onInput: function (v) { f.phone = v; save(); } })
    ]));
    head.appendChild(UI.text({ label: 'Email', value: f.email, type: 'email', autocapitalize: 'none', onInput: function (v) { f.email = v; save(); } }));
    head.appendChild(UI.text({ label: 'Address', value: f.address, onInput: function (v) { f.address = v; save(); } }));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.select({ label: 'Status', value: f.status, options: CFG.FACTORY_STATUS, onInput: function (v) { f.status = v; save(); } }),
      UI.date({ label: 'Date contacted', value: f.dateContacted, onInput: function (v) { f.dateContacted = v; save(); } })
    ]));
    head.appendChild(UI.rating({ label: 'Overall rating', value: f.rating, onInput: function (v) { f.rating = v; save(); } }));
    app.appendChild(head);

    /* send questionnaire */
    var send = UI.el('button', { class: 'btn acc', type: 'button', onclick: sendSheet }, [UI.icon('msg', 18), UI.el('span', { text: 'Send questionnaire' })]);
    app.appendChild(send);

    /* questions */
    app.appendChild(UI.eyebrow('Capability questionnaire'));
    CFG.FACTORY_QUESTIONS.forEach(function (q, i) {
      f.a[q.id] = f.a[q.id] || {};
      var a = f.a[q.id];
      var box = UI.el('div', { class: q.critical ? 'crit-wrap' : 'card' });
      if (q.critical) box.appendChild(UI.el('div', { class: 'crit-tag' }, [UI.icon('warn', 13), UI.el('span', { text: 'Critical — this answer sets your launch capital' })]));
      box.appendChild(UI.el('div', { class: 'q-n', text: 'Q' + (i + 1) + ' · ' + q.short.toUpperCase() }));
      box.appendChild(UI.el('div', { class: 'q-t', text: q.q }));
      box.appendChild(control(q, a));
      box.appendChild(UI.text({
        label: 'Their answer', value: a.text, multiline: true, rows: 2,
        placeholder: 'Paste or summarise their reply', onInput: function (v) { a.text = v; save(); }
      }));
      app.appendChild(box);
    });

    function control(q, a) {
      var c = q.ctl, wrap = UI.el('div');
      if (!c) return wrap;
      if (c.type === 'slider') {
        wrap.appendChild(UI.slider({ label: c.label, value: a[c.key] === undefined ? '' : a[c.key], min: c.min, max: c.max, step: c.step, unit: c.unit, onInput: function (v) { a[c.key] = v; save(); } }));
      } else if (c.type === 'yesno' || c.type === 'yesno+num') {
        wrap.appendChild(UI.seg({
          label: 'Capability', value: a[c.key] === true ? 'yes' : a[c.key] === false ? 'no' : '',
          options: [{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }], toggle: true,
          onInput: function (v) { a[c.key] = v === 'yes' ? true : v === 'no' ? false : undefined; save(); }
        }));
        if (c.type === 'yesno+num') {
          wrap.appendChild(UI.number({ label: c.numLabel, value: a[c.numKey], unit: c.unit, onInput: function (v) { a[c.numKey] = v; save(); } }));
        }
      } else if (c.type === 'radio') {
        wrap.appendChild(UI.seg({
          label: 'Answer', value: a[c.key] || '', options: c.options, toggle: true,
          onInput: function (v) { a[c.key] = v; save(); }
        }));
      } else if (c.type === 'number') {
        wrap.appendChild(UI.number({ label: 'Value', value: a[c.key], unit: c.unit, onInput: function (v) { a[c.key] = v; save(); } }));
      } else if (c.type === 'money+days') {
        wrap.appendChild(UI.el('div', { class: 'f-row' }, [
          UI.number({ label: 'Sample cost', value: a[c.key], unit: 'R', onInput: function (v) { a[c.key] = v; save(); } }),
          UI.number({ label: 'Lead time', value: a[c.daysKey], unit: 'days', onInput: function (v) { a[c.daysKey] = v; save(); } })
        ]));
      } else if (c.type === 'contact') {
        wrap.appendChild(UI.el('div', { class: 'f-row' }, [
          UI.text({ label: 'Name', value: a[c.nameKey], onInput: function (v) { a[c.nameKey] = v; save(); } }),
          UI.text({ label: 'Phone', value: a[c.phoneKey], type: 'tel', onInput: function (v) { a[c.phoneKey] = v; save(); } })
        ]));
      }
      return wrap;
    }

    /* notes + photos */
    app.appendChild(UI.eyebrow('Notes'));
    app.appendChild(UI.text({
      value: f.notes, multiline: true, rows: 5, placeholder: 'Impressions, machinery seen, sample quality, red flags.',
      onInput: function (v) { f.notes = v; save(); }
    }));
    app.appendChild(UI.eyebrow('Photos'));
    app.appendChild(Photos.strip({ module: 'factories', parentId: f.id }));

    function sendSheet() {
      var txt = Factories.questionnaireText(f);
      var digits = (f.phone || '').replace(/[^0-9]/g, '');
      var body = UI.el('div');
      body.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:12px', text: 'All 12 questions, ready to send. Choose a channel.' }));
      var pre = UI.el('textarea', { class: 'inp', rows: 7, style: 'min-height:150px;font-size:12.5px' });
      pre.value = txt;
      body.appendChild(pre);
      UI.sheet({
        title: 'Send questionnaire', body: body,
        actions: [
          {
            label: digits ? 'WhatsApp ' + f.phone : 'WhatsApp (no number saved)', cls: 'pri', onClick: function () {
              if (!digits) return UI.toast('Add a phone number first', { type: 'bad' });
              window.open('https://wa.me/' + digits + '?text=' + encodeURIComponent(pre.value), '_blank');
              markSent();
            }
          },
          {
            label: 'Email', cls: '', onClick: function () {
              var url = 'mailto:' + (f.email || '') + '?subject=' + encodeURIComponent('Production capability enquiry — men\'s technical legwear') + '&body=' + encodeURIComponent(pre.value);
              window.location.href = url; markSent();
            }
          },
          { label: 'Copy text', cls: 'ghost', onClick: function () { UI.copy(pre.value); markSent(); } }
        ]
      });
      function markSent() {
        if (f.status === 'Not contacted') { f.status = 'Contacted'; f.dateContacted = f.dateContacted || UI.today(); save(); }
      }
    }

    function menu() {
      UI.sheet({
        title: f.name || 'Factory',
        body: UI.el('div', { class: 'sub', text: 'Record actions.' }),
        actions: [
          {
            label: 'Duplicate', cls: '', onClick: function () {
              var c = JSON.parse(JSON.stringify(f));
              c.id = DB.uid('fac'); c.name = (f.name || 'Factory') + ' (copy)'; c.createdAt = UI.nowISO();
              DB.put('factories', c).then(function () { UI.go('factories/' + c.id); UI.toast('Duplicated'); });
            }
          },
          {
            label: 'Delete factory', cls: 'danger', onClick: function () {
              UI.confirm('Delete ' + (f.name || 'this factory') + '?', 'The record and its photos will be removed. This cannot be undone without a backup.', 'Delete', true)
                .then(function (ok) {
                  if (!ok) return;
                  Photos.forParent(f.id).then(function (ps) { return Photos.delMany(ps.map(function (p) { return p.id; })); })
                    .then(function () { return DB.del('factories', f.id); })
                    .then(function () { UI.go('factories'); UI.toast('Factory deleted'); });
                });
            }
          }
        ]
      });
    }
  });
};
