/* Decision log — fact → assumption → hypothesis → recommendation. */
var Views = window.Views || {};

var Decisions = (function () {
  function blank() {
    return {
      id: DB.uid('dec'), ref: '', title: '', date: UI.today(), status: 'Open', confidence: 'Low',
      fact: '', assumption: '', hypothesis: '', rec: '', mind: '', links: '',
      createdAt: UI.nowISO(), updatedAt: UI.nowISO()
    };
  }
  function statusCls(s) { return s === 'Resolved' ? 'pass' : s === 'Reversed' ? 'cond' : ''; }
  return { blank: blank, statusCls: statusCls };
})();

Views.decisions = function (app) {
  UI.setBar({
    title: 'Decision log', eyebrow: 'Evidence discipline', back: function () { UI.go('more'); },
    actions: [{ icon: 'dl', label: 'Export CSV', onClick: exportCsv }]
  });
  var list = [], filter = 'All', q = '', holder = UI.el('div');

  var filterSel = UI.select({
    value: filter, options: ['All'].concat(CFG.DEC_STATUS),
    onInput: function (v) { filter = v; draw(); }
  });
  filterSel.classList.remove('f'); filterSel.style.margin = '0';
  app.appendChild(UI.searchBar('Search decisions', function (v) { q = v; draw(); }, filterSel));
  app.appendChild(holder);

  DB.all('decisions').then(function (r) {
    list = r.sort(function (a, b) { return (a.ref || 'zz').localeCompare(b.ref || 'zz') || (b.date || '').localeCompare(a.date || ''); });
    draw();
  });
  UI.fab('New decision', function () {
    var d = Decisions.blank();
    DB.put('decisions', d).then(function () { UI.go('decisions/' + d.id); });
  });

  function draw() {
    UI.clear(holder);
    var rows = list.filter(function (d) {
      if (filter !== 'All' && d.status !== filter) return false;
      return !q || (d.title + ' ' + d.fact + ' ' + d.rec + ' ' + (d.ref || '')).toLowerCase().indexOf(q) >= 0;
    });
    if (!rows.length) {
      holder.appendChild(UI.empty({
        icon: 'branch', title: 'Nothing here',
        text: 'Every entry separates fact from assumption from hypothesis from recommendation. If you cannot fill in the fact, you do not have one.',
        action: 'New decision',
        onAction: function () { var d = Decisions.blank(); DB.put('decisions', d).then(function () { UI.go('decisions/' + d.id); }); }
      }));
      return;
    }
    var box = UI.el('div', { class: 'rows' });
    rows.forEach(function (d) {
      box.appendChild(UI.row({
        title: (d.ref ? d.ref + ' · ' : '') + (d.title || 'Untitled'),
        sub: 'Confidence: ' + (d.confidence || '—') + ' · ' + UI.dateStr(d.date),
        chip: d.status, chipCls: Decisions.statusCls(d.status),
        onClick: function () { UI.go('decisions/' + d.id); }
      }));
    });
    holder.appendChild(box);
  }

  function exportCsv() {
    var rows = [['Ref', 'Title', 'Date', 'Status', 'Confidence', 'Fact', 'Assumption', 'Hypothesis', 'Recommendation', 'What would change my mind', 'Links']];
    list.forEach(function (d) {
      rows.push([d.ref, d.title, d.date, d.status, d.confidence, d.fact, d.assumption, d.hypothesis, d.rec, d.mind, d.links]);
    });
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-decisions.csv');
    UI.toast('CSV exported', { type: 'good' });
  }
};

Views['decisions/:id'] = function (app, params) {
  DB.get('decisions', params.id).then(function (d) {
    if (!d) { UI.toast('Not found', { type: 'bad' }); return UI.go('decisions'); }
    var save = UI.saver('decisions', d);

    UI.setBar({
      eyebrow: d.ref ? 'Decision ' + d.ref : 'Decision',
      title: d.title || 'Untitled',
      back: function () { save.flush(); UI.go('decisions'); },
      actions: [{ icon: 'dots', label: 'More', onClick: menu }]
    });

    var head = UI.card([]);
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.text({ label: 'Reference', value: d.ref, placeholder: 'Q9', onInput: function (v) { d.ref = v; save(); } }),
      UI.date({ label: 'Date', value: d.date, onInput: function (v) { d.date = v; save(); } })
    ]));
    head.appendChild(UI.text({
      label: 'Question / title', value: d.title, multiline: true, rows: 2,
      onInput: function (v) { d.title = v; document.getElementById('bar-title').textContent = v || 'Untitled'; save(); }
    }));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.select({ label: 'Status', value: d.status, options: CFG.DEC_STATUS, onInput: function (v) { d.status = v; save(); } }),
      UI.select({ label: 'Confidence', value: d.confidence, options: CFG.DEC_CONF, onInput: function (v) { d.confidence = v; save(); } })
    ]));
    app.appendChild(head);

    section('1 · Fact', 'What is known, with source. If you cannot cite it, it is not a fact.', 'fact');
    section('2 · Assumption', 'What remains uncertain. Name it so it can be attacked.', 'assumption');
    section('3 · Hypothesis', 'What you believe is true but have not proven.', 'hypothesis');
    section('4 · Recommendation', 'The proposed direction, and the single next action.', 'rec');

    app.appendChild(UI.eyebrow('Falsification'));
    app.appendChild(UI.text({
      label: 'What would change my mind', value: d.mind, multiline: true, rows: 3,
      placeholder: 'The specific evidence that would overturn this.',
      onInput: function (v) { d.mind = v; save(); }
    }));
    app.appendChild(UI.text({
      label: 'Linked records / sources', value: d.links, multiline: true, rows: 2,
      onInput: function (v) { d.links = v; save(); }
    }));
    app.appendChild(UI.eyebrow('Photos'));
    app.appendChild(Photos.strip({ module: 'decisions', parentId: d.id }));

    function section(title, hint, key) {
      app.appendChild(UI.eyebrow(title));
      var c = UI.card([]);
      c.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:10px', text: hint }));
      c.appendChild(UI.text({ value: d[key], multiline: true, rows: 4, onInput: function (v) { d[key] = v; save(); } }));
      app.appendChild(c);
    }

    function menu() {
      UI.sheet({
        title: d.title || 'Decision',
        body: UI.el('div', { class: 'sub', text: 'Record actions.' }),
        actions: [
          {
            label: 'Duplicate', cls: '', onClick: function () {
              var c = JSON.parse(JSON.stringify(d));
              c.id = DB.uid('dec'); c.ref = ''; c.title = (d.title || '') + ' (copy)'; c.createdAt = UI.nowISO();
              DB.put('decisions', c).then(function () { UI.go('decisions/' + c.id); });
            }
          },
          {
            label: 'Delete', cls: 'danger', onClick: function () {
              UI.confirm('Delete this decision?', 'It cannot be recovered without a backup.', 'Delete', true).then(function (ok) {
                if (!ok) return;
                Photos.forParent(d.id).then(function (ps) { return Photos.delMany(ps.map(function (p) { return p.id; })); })
                  .then(function () { return DB.del('decisions', d.id); })
                  .then(function () { UI.go('decisions'); UI.toast('Deleted'); });
              });
            }
          }
        ]
      });
    }
  });
};
