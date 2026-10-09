/* Wear tests — timed check-ins, degradation chart, failure points. */
var Views = window.Views || {};

var Wear = (function () {
  function blank() {
    return {
      id: DB.uid('wear'), date: UI.today(), garmentCode: '', duration: 8, activities: [],
      temp: '', underwear: 'Without', checkins: [], failures: [],
      again: '', worst: '', best: '', createdAt: UI.nowISO(), updatedAt: UI.nowISO()
    };
  }
  function avg(w, key) {
    var v = (w.checkins || []).map(function (c) { return Number(c[key]); }).filter(function (n) { return n > 0; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }
  return { blank: blank, avg: avg };
})();

/* ---------------- list ---------------- */
Views.wear = function (app) {
  UI.setBar({
    title: 'Wear tests', eyebrow: 'Field testing', back: function () { UI.go('more'); },
    actions: [{ icon: 'dl', label: 'Export CSV', onClick: exportCsv }]
  });
  var list = [], holder = UI.el('div');
  app.appendChild(holder);
  DB.all('weartests').then(function (r) {
    list = r.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    draw();
  });
  UI.fab('New wear test', function () {
    var w = Wear.blank();
    DB.put('weartests', w).then(function () { UI.go('wear/' + w.id); });
  });

  function draw() {
    UI.clear(holder);
    if (!list.length) {
      holder.appendChild(UI.empty({
        icon: 'clock', title: 'No wear tests',
        text: 'A garment that fits standing still is not a garment that works. Log check-ins over hours and watch the ratings degrade.',
        action: 'Start a wear test',
        onAction: function () { var w = Wear.blank(); DB.put('weartests', w).then(function () { UI.go('wear/' + w.id); }); }
      }));
      return;
    }
    var box = UI.el('div', { class: 'rows' });
    list.forEach(function (w) {
      var c = Wear.avg(w, 'comfort');
      box.appendChild(UI.row({
        title: w.garmentCode || 'Untitled garment',
        sub: UI.dateStr(w.date) + ' · ' + (w.duration || 0) + ' h · ' + (w.checkins || []).length + ' check-ins · ' + (w.failures || []).length + ' failures',
        value: c ? UI.num(c, 1) + '/5' : '',
        chip: w.again || '', chipCls: w.again === 'Yes' ? 'pass' : w.again === 'No' ? 'fail' : '',
        onClick: function () { UI.go('wear/' + w.id); }
      }));
    });
    holder.appendChild(box);
  }

  function exportCsv() {
    var rows = [['Date', 'Garment', 'Hours elapsed', 'Comfort', 'Support', 'Discretion', 'Temperature', 'Waistband', 'Notes']];
    list.forEach(function (w) {
      (w.checkins || []).forEach(function (c) {
        rows.push([w.date, w.garmentCode, c.h, c.comfort, c.support, c.discretion, c.temperature, c.waistband, c.notes]);
      });
    });
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-wear-tests.csv');
    UI.toast('CSV exported', { type: 'good' });
  }
};

/* ---------------- detail ---------------- */
Views['wear/:id'] = function (app, params) {
  DB.get('weartests', params.id).then(function (w) {
    if (!w) { UI.toast('Test not found', { type: 'bad' }); return UI.go('wear'); }
    w.checkins = w.checkins || []; w.failures = w.failures || []; w.activities = w.activities || [];
    var save = UI.saver('weartests', w, function () { renderChart(); });

    UI.setBar({
      eyebrow: 'Wear test', title: w.garmentCode || 'Untitled',
      back: function () { save.flush(); UI.go('wear'); },
      actions: [{ icon: 'dots', label: 'More', onClick: menu }]
    });

    var head = UI.card([]);
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.date({ label: 'Date', value: w.date, onInput: function (v) { w.date = v; save(); } }),
      UI.number({ label: 'Duration', value: w.duration, unit: 'h', onInput: function (v) { w.duration = v; save(); } })
    ]));
    head.appendChild(UI.text({
      label: 'Garment code', value: w.garmentCode, placeholder: 'NOKT-01 ALPHA T1',
      onInput: function (v) { w.garmentCode = v; document.getElementById('bar-title').textContent = v || 'Untitled'; save(); }
    }));
    head.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Ambient temp', value: w.temp, unit: '°C', onInput: function (v) { w.temp = v; save(); } }),
      UI.select({ label: 'Underwear', value: w.underwear, options: ['Without', 'With'], onInput: function (v) { w.underwear = v; save(); } })
    ]));
    head.appendChild(UI.el('div', { class: 'f-lab', text: 'Activities' }));
    CFG.ACTIVITIES.forEach(function (a) {
      head.appendChild(UI.checkbox({
        label: a, checked: w.activities.indexOf(a) >= 0,
        onInput: function (on) {
          if (on) { if (w.activities.indexOf(a) < 0) w.activities.push(a); }
          else w.activities = w.activities.filter(function (x) { return x !== a; });
          save();
        }
      }));
    });
    app.appendChild(head);

    /* chart */
    var chartBox = UI.el('div');
    app.appendChild(UI.eyebrow('Degradation over time'));
    app.appendChild(chartBox);

    /* check-ins */
    var ciBox = UI.el('div');
    app.appendChild(UI.eyebrow('Check-ins'));
    app.appendChild(ciBox);
    app.appendChild(UI.el('button', {
      class: 'btn acc', type: 'button', onclick: function () { editCheckin(null); }
    }, [UI.icon('plus', 18), UI.el('span', { text: 'Add check-in' })]));

    /* failures */
    var fBox = UI.el('div');
    app.appendChild(UI.eyebrow('Failure points'));
    app.appendChild(fBox);
    app.appendChild(UI.el('button', {
      class: 'btn ghost', type: 'button', onclick: function () { editFailure(null); }
    }, [UI.icon('warn', 18), UI.el('span', { text: 'Log a failure' })]));

    /* summary */
    app.appendChild(UI.eyebrow('End-of-test summary'));
    var sum = UI.card([]);
    sum.appendChild(UI.seg({
      label: 'Would you wear these again?', value: w.again, options: ['Yes', 'No'], toggle: true,
      onInput: function (v) { w.again = v; save(); }
    }));
    sum.appendChild(UI.text({ label: 'Single worst problem', value: w.worst, multiline: true, rows: 2, onInput: function (v) { w.worst = v; save(); } }));
    sum.appendChild(UI.text({ label: 'Single best quality', value: w.best, multiline: true, rows: 2, onInput: function (v) { w.best = v; save(); } }));
    app.appendChild(sum);

    app.appendChild(UI.eyebrow('Photos'));
    app.appendChild(Photos.strip({ module: 'wear', parentId: w.id }));

    renderCheckins(); renderFailures(); renderChart();

    function renderCheckins() {
      UI.clear(ciBox);
      if (!w.checkins.length) { ciBox.appendChild(UI.el('div', { class: 'sub', style: 'padding:8px 0', text: 'No check-ins yet. Add one at hour 0 before you leave.' })); return; }
      var box = UI.el('div', { class: 'rows' });
      w.checkins.slice().sort(function (a, b) { return a.h - b.h; }).forEach(function (c) {
        var vals = CFG.CHECKIN_METRICS.map(function (m) { return c[m.id] || '–'; }).join(' / ');
        box.appendChild(UI.row({
          title: 'Hour ' + c.h, sub: vals + (c.notes ? ' · ' + c.notes : ''),
          onClick: function () { editCheckin(c); }
        }));
      });
      ciBox.appendChild(box);
      ciBox.appendChild(UI.el('div', { class: 'tiny', style: 'margin-top:6px', text: 'Order: ' + CFG.CHECKIN_METRICS.map(function (m) { return m.label; }).join(' / ') }));
    }

    function renderFailures() {
      UI.clear(fBox);
      if (!w.failures.length) { fBox.appendChild(UI.el('div', { class: 'sub', style: 'padding:8px 0', text: 'No failures logged.' })); return; }
      var box = UI.el('div', { class: 'rows' });
      w.failures.slice().sort(function (a, b) { return (b.sev || 0) - (a.sev || 0); }).forEach(function (f) {
        box.appendChild(UI.row({
          dot: f.sev >= 4 ? 'fail' : f.sev >= 3 ? 'cond' : '',
          title: f.loc + ' — ' + f.what, sub: 'From hour ' + (f.hour || 0),
          value: (f.sev || '—') + '/5',
          onClick: function () { editFailure(f); }
        }));
      });
      fBox.appendChild(box);
    }

    function renderChart() {
      UI.clear(chartBox);
      var pts = w.checkins.slice().sort(function (a, b) { return a.h - b.h; });
      if (pts.length < 2) {
        chartBox.appendChild(UI.el('div', { class: 'sub', text: 'Add at least two check-ins to see the trend.' }));
        return;
      }
      var W = 340, H = 180, padL = 26, padB = 26, padT = 10, padR = 8;
      var maxH = Math.max.apply(null, pts.map(function (p) { return Number(p.h) || 0; })) || 1;
      var colours = ['#7FA8D9', '#45A06A', '#C9922E', '#B07FD9', '#E5484D'];
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ladder" role="img" aria-label="Ratings over time">';
      for (var y = 1; y <= 5; y++) {
        var yy = padT + (5 - y) / 4 * (H - padT - padB);
        svg += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" stroke="#26262A" stroke-width="1"/>';
        svg += '<text x="4" y="' + (yy + 3.5) + '" fill="#5E5E66" font-size="9">' + y + '</text>';
      }
      CFG.CHECKIN_METRICS.forEach(function (m, mi) {
        var d = pts.map(function (p, i) {
          var x = padL + (Number(p.h) / maxH) * (W - padL - padR);
          var v = Number(p[m.id]) || 0;
          var yy = padT + (5 - v) / 4 * (H - padT - padB);
          return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1);
        }).join(' ');
        svg += '<path d="' + d + '" fill="none" stroke="' + colours[mi] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
        pts.forEach(function (p) {
          var x = padL + (Number(p.h) / maxH) * (W - padL - padR);
          var v = Number(p[m.id]) || 0;
          var yy = padT + (5 - v) / 4 * (H - padT - padB);
          svg += '<circle cx="' + x.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="2.5" fill="' + colours[mi] + '"/>';
        });
      });
      pts.forEach(function (p) {
        var x = padL + (Number(p.h) / maxH) * (W - padL - padR);
        svg += '<text x="' + x + '" y="' + (H - 8) + '" fill="#5E5E66" font-size="9" text-anchor="middle">' + p.h + 'h</text>';
      });
      svg += '</svg>';
      var card = UI.card([]);
      card.innerHTML = svg;
      var legend = UI.el('div', { class: 'chips', style: 'margin-top:10px' });
      CFG.CHECKIN_METRICS.forEach(function (m, i) {
        legend.appendChild(UI.el('span', { class: 'chip ghost' }, [
          UI.el('span', { class: 'dot', style: 'background:' + colours[i] }), UI.el('span', { text: m.label })
        ]));
      });
      card.appendChild(legend);
      var worst = CFG.CHECKIN_METRICS.map(function (m) { return { l: m.label, v: Wear.avg(w, m.id) }; })
        .filter(function (x) { return x.v !== null; }).sort(function (a, b) { return a.v - b.v; })[0];
      if (worst) card.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-top:10px', text: 'Weakest average: ' + worst.l + ' at ' + UI.num(worst.v, 1) + '/5.' }));
      chartBox.appendChild(card);
    }

    function editCheckin(existing) {
      var c = existing || { id: DB.uid('ci'), h: w.checkins.length ? '' : 0, comfort: 3, support: 3, discretion: 3, temperature: 3, waistband: 3, notes: '' };
      var body = UI.el('div');
      body.appendChild(UI.number({ label: 'Hours elapsed', value: c.h, unit: 'h', onInput: function (v) { c.h = v; } }));
      CFG.CHECKIN_METRICS.forEach(function (m) {
        body.appendChild(UI.rating({ label: m.label, value: c[m.id], toggle: false, onInput: function (v) { c[m.id] = v; } }));
      });
      body.appendChild(UI.text({ label: 'Notes', value: c.notes, multiline: true, rows: 2, onInput: function (v) { c.notes = v; } }));
      body.appendChild(UI.el('div', { class: 'f-lab', text: 'Photo' }));
      body.appendChild(Photos.strip({ module: 'wear', parentId: w.id, slot: 'Check-in ' + c.id }));

      var actions = [{
        label: existing ? 'Save check-in' : 'Add check-in', cls: 'pri', onClick: function () {
          if (c.h === '' || c.h === null) c.h = 0;
          if (!existing) w.checkins.push(c);
          save.flush(); renderCheckins(); renderChart();
        }
      }];
      if (existing) actions.push({
        label: 'Delete', cls: 'danger', onClick: function () {
          w.checkins = w.checkins.filter(function (x) { return x.id !== c.id; });
          save.flush(); renderCheckins(); renderChart();
          UI.toast('Check-in deleted', { action: 'Undo', onAction: function () { w.checkins.push(c); save.flush(); renderCheckins(); renderChart(); } });
        }
      });
      UI.sheet({ title: existing ? 'Edit check-in' : 'New check-in', body: body, actions: actions });
    }

    function editFailure(existing) {
      var f = existing || { id: DB.uid('fail'), loc: '', what: '', hour: '', sev: 3 };
      var body = UI.el('div');
      body.appendChild(UI.select({ label: 'Location', value: f.loc || CFG.ZONES[0], options: CFG.ZONES, onInput: function (v) { f.loc = v; } }));
      if (!f.loc) f.loc = CFG.ZONES[0];
      body.appendChild(UI.text({ label: 'What failed', value: f.what, multiline: true, rows: 2, onInput: function (v) { f.what = v; } }));
      body.appendChild(UI.number({ label: 'At what hour', value: f.hour, unit: 'h', onInput: function (v) { f.hour = v; } }));
      body.appendChild(UI.rating({ label: 'Severity', value: f.sev, toggle: false, onInput: function (v) { f.sev = v; } }));
      body.appendChild(UI.el('div', { class: 'f-lab', text: 'Photo' }));
      body.appendChild(Photos.strip({ module: 'wear', parentId: w.id, slot: 'Failure ' + f.id }));

      var actions = [{
        label: existing ? 'Save' : 'Log failure', cls: 'pri', onClick: function () {
          if (!existing) w.failures.push(f);
          save.flush(); renderFailures();
        }
      }];
      if (existing) actions.push({
        label: 'Delete', cls: 'danger', onClick: function () {
          w.failures = w.failures.filter(function (x) { return x.id !== f.id; });
          save.flush(); renderFailures();
        }
      });
      UI.sheet({ title: existing ? 'Edit failure' : 'Failure point', body: body, actions: actions });
    }

    function menu() {
      UI.sheet({
        title: w.garmentCode || 'Wear test',
        body: UI.el('div', { class: 'sub', text: 'Record actions.' }),
        actions: [
          {
            label: 'Duplicate (new date)', cls: '', onClick: function () {
              var c = JSON.parse(JSON.stringify(w));
              c.id = DB.uid('wear'); c.date = UI.today(); c.checkins = []; c.failures = []; c.createdAt = UI.nowISO();
              DB.put('weartests', c).then(function () { UI.go('wear/' + c.id); UI.toast('Duplicated'); });
            }
          },
          {
            label: 'Delete wear test', cls: 'danger', onClick: function () {
              UI.confirm('Delete this wear test?', 'Check-ins, failures and photos will be removed.', 'Delete', true).then(function (ok) {
                if (!ok) return;
                Photos.forParent(w.id).then(function (ps) { return Photos.delMany(ps.map(function (p) { return p.id; })); })
                  .then(function () { return DB.del('weartests', w.id); })
                  .then(function () { UI.go('wear'); UI.toast('Deleted'); });
              });
            }
          }
        ]
      });
    }
  });
};
