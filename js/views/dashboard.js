/* Dashboard — roadmap, gates, counts. */
var Views = window.Views || {};

Views.dashboard = function (app) {
  UI.setBar({
    eyebrow: 'NOKT', title: 'Field Log',
    actions: [
      { icon: 'print', label: 'Reports', onClick: function () { UI.go('reports'); } },
      { icon: 'gear', label: 'Settings', onClick: function () { UI.go('settings'); } }
    ]
  });

  var state = {};
  Promise.all([
    DB.all('tasks'), DB.all('gates'), DB.all('factories'), DB.all('fabrics'),
    DB.all('fitsessions'), DB.all('weartests'), DB.all('decisions'),
    DB.meta('projectStart', UI.today())
  ]).then(function (r) {
    state = {
      tasks: r[0].sort(function (a, b) { return a.day - b.day; }),
      gates: r[1].sort(function (a, b) { return a.week - b.week; }),
      factories: r[2], fabrics: r[3], fits: r[4], wears: r[5], decisions: r[6], start: r[7]
    };
    render();
  });

  function counts() {
    var s = state;
    var replied = s.factories.filter(function (f) {
      return ['Replied', 'Quoted', 'Visited', 'Shortlisted'].indexOf(f.status) >= 0;
    }).length;
    var contacted = s.factories.filter(function (f) { return f.status !== 'Not contacted'; }).length;
    var tested = s.fabrics.filter(function (f) { return Fabrics.verdict(f).tested > 0; }).length;
    var passed = s.fabrics.filter(function (f) { return Fabrics.verdict(f).code === 'PASS'; }).length;
    var open = s.decisions.filter(function (d) { return d.status === 'Open'; }).length;
    return { replied: replied, contacted: contacted, tested: tested, passed: passed, open: open };
  }

  function gateMet(g) {
    var c = counts(), s = state;
    if (g.mode === 'pass') return true;
    if (g.mode === 'notmet') return false;
    if (g.id === 'g1') return c.replied >= 2 && s.fabrics.length >= 2;
    if (g.id === 'g2') return [9, 11, 12, 13].every(function (d) { return done(d); });
    if (g.id === 'g3') return [17, 19, 20].every(function (d) { return done(d); }) &&
      s.decisions.some(function (x) { return x.ref === 'Q1' && x.status === 'Resolved'; });
    if (g.id === 'g4') return s.fits.length > 0 && s.wears.length > 0;
    return false;
    function done(d) { return s.tasks.some(function (t) { return t.day === d && t.done; }); }
  }

  function render() {
    UI.clear(app);
    var c = counts();
    var doneN = state.tasks.filter(function (t) { return t.done; }).length;
    var pct = state.tasks.length ? doneN / state.tasks.length * 100 : 0;
    var elapsed = UI.daysBetween(state.start, UI.today());

    /* progress */
    app.appendChild(UI.card([
      UI.el('div', { class: 'ring' }, [
        UI.ring(pct, 68),
        UI.el('div', { style: 'flex:1;min-width:0' }, [
          UI.el('div', { class: 'h2', text: doneN + ' of ' + state.tasks.length + ' tasks complete' }),
          UI.el('div', { class: 'sub', text: 'Day ' + (elapsed + 1) + ' of 30 · started ' + UI.dateStr(state.start) }),
          UI.el('div', { class: 'bar-mini' }, [UI.el('i', { style: 'width:' + Math.min(100, (elapsed + 1) / 30 * 100) + '%' })])
        ])
      ])
    ]));

    /* live counts */
    app.appendChild(UI.el('div', { class: 'grid2' }, [
      stat('Factories replied', c.replied + ' / ' + state.factories.length, 'factories'),
      stat('Swatches passed', c.passed + ' / ' + state.fabrics.length, 'fabrics'),
      stat('Fit sessions', String(state.fits.length), 'fit'),
      stat('Open decisions', String(c.open), 'decisions')
    ]));

    /* gates */
    app.appendChild(UI.eyebrow('Week gates'));
    state.gates.forEach(function (g) {
      var met = gateMet(g);
      var row = UI.el('div', { class: 'gate' }, [
        UI.el('span', { class: 'dot ' + (met ? 'pass' : '') }),
        UI.el('div', { class: 'gl' }, [
          UI.el('div', { class: 'gt', text: g.label }),
          UI.el('div', { class: 'gc', text: g.cond })
        ]),
        UI.el('span', { class: 'chip ' + (met ? 'pass' : ''), text: met ? 'Pass' : 'Not met' })
      ]);
      row.onclick = function () { editGate(g); };
      row.style.cursor = 'pointer';
      app.appendChild(row);
    });

    /* roadmap */
    [1, 2, 3, 4].forEach(function (w) {
      app.appendChild(UI.eyebrow('Week ' + w + ' — ' + CFG.WEEK_TITLES[w]));
      var rows = UI.el('div', { class: 'rows' });
      state.tasks.filter(function (t) { return t.week === w; }).forEach(function (t) {
        rows.appendChild(taskRow(t));
      });
      app.appendChild(rows);
    });

    /* modules */
    app.appendChild(UI.eyebrow('All modules'));
    var mods = UI.el('div', { class: 'mods' });
    [
      ['factory', 'Factories', 'CMT capability + quotes', 'factories'],
      ['layers', 'Fabric swatches', '10-test protocol', 'fabrics'],
      ['ruler', 'Fit body', '18-point measurements', 'body'],
      ['user', 'Fit sessions', 'Photo slots + issue log', 'fit'],
      ['clock', 'Wear tests', 'Timed check-ins', 'wear'],
      ['calc', 'Cost model', 'Landed cost + MOQ', 'cost'],
      ['branch', 'Decision log', 'Fact → assumption → rec', 'decisions'],
      ['images', 'Photo library', 'Everything, one grid', 'photos'],
      ['print', 'Reports', 'Print / save as PDF', 'reports'],
      ['gear', 'Settings', 'Backup, storage, demo', 'settings']
    ].forEach(function (m) {
      mods.appendChild(UI.el('button', { class: 'mod', type: 'button', onclick: function () { UI.go(m[3]); } }, [
        UI.icon(m[0], 20),
        UI.el('div', {}, [UI.el('div', { class: 'mt', text: m[1] }), UI.el('div', { class: 'ms', text: m[2] })])
      ]));
    });
    app.appendChild(mods);

    app.appendChild(UI.el('div', { class: 'tiny', style: 'text-align:center;margin-top:26px;line-height:1.6' },
      ['NOKT FIELD LOG · all data stored on this device only']));
  }

  function stat(k, v, go) {
    return UI.el('button', { class: 'stat', style: 'text-align:left', type: 'button', onclick: function () { UI.go(go); } }, [
      UI.el('div', { class: 'k', text: k }), UI.el('div', { class: 'v', text: v })
    ]);
  }

  function taskRow(t) {
    var r = UI.el('div', { class: 'row' });
    var cb = UI.el('button', {
      class: 'check' + (t.done ? ' on' : ''), type: 'button',
      style: 'width:48px;min-height:48px;flex:0 0 auto;padding:0;gap:0;align-items:center;justify-content:center;margin-left:-6px', 'aria-label': 'Mark day ' + t.day + ' complete'
    }, [UI.el('span', { class: 'box', style: 'margin-top:0' }, [UI.icon('check', 15)])]);
    cb.onclick = function (e) {
      e.stopPropagation();
      t.done = !t.done;
      cb.classList.toggle('on', t.done);
      lab.classList.toggle('strike', t.done);
      DB.put('tasks', t).then(render);
    };
    var lab = UI.el('div', { class: 'rt' + (t.done ? ' strike' : ''), text: t.title });
    lab.style.whiteSpace = 'normal';
    var open = UI.el('button', { class: 'rl', type: 'button', style: 'text-align:left' }, [
      lab,
      UI.el('div', { class: 'rs', text: 'Day ' + t.day + (t.notes ? ' · ' + t.notes : '') })
    ]);
    open.onclick = function () { editTask(t); };
    r.appendChild(cb); r.appendChild(open);
    r.appendChild(UI.icon('chev', 16)).classList.add('chev');
    return r;
  }

  function editTask(t) {
    var body = UI.el('div');
    body.appendChild(UI.el('div', { class: 'sub', style: 'margin-bottom:14px', text: 'Day ' + t.day + ' · Week ' + t.week }));
    body.appendChild(UI.text({
      label: 'Notes', value: t.notes, multiline: true, rows: 4,
      placeholder: 'What actually happened?', onInput: function (v) { t.notes = v; }
    }));
    body.appendChild(UI.el('div', { class: 'f-lab', text: 'Photos' }));
    body.appendChild(Photos.strip({ module: 'tasks', parentId: t.id }));
    UI.sheet({
      title: t.title, body: body,
      actions: [
        { label: t.done ? 'Mark not done' : 'Mark complete', cls: 'pri', onClick: function () { t.done = !t.done; DB.put('tasks', t).then(render); } },
        { label: 'Save notes', cls: '', onClick: function () { DB.put('tasks', t).then(render); } }
      ],
      onClose: function () { DB.put('tasks', t).then(render); }
    });
  }

  function editGate(g) {
    var body = UI.el('div');
    body.appendChild(UI.text({
      label: 'Condition', value: g.cond, multiline: true, rows: 3,
      onInput: function (v) { g.cond = v; }
    }));
    body.appendChild(UI.seg({
      label: 'Evaluation', value: g.mode,
      options: [{ v: 'auto', l: 'Automatic' }, { v: 'pass', l: 'Force pass' }, { v: 'notmet', l: 'Force not met' }],
      onInput: function (v) { g.mode = v; }
    }));
    body.appendChild(UI.el('div', { class: 'f-hint', text: 'Automatic evaluates the condition against your real records — factory replies, swatch count, completed tasks, resolved decisions.' }));
    UI.sheet({
      title: g.label, body: body,
      actions: [{ label: 'Save', cls: 'pri', onClick: function () { DB.put('gates', g).then(render); } }],
      onClose: function () { DB.put('gates', g).then(render); }
    });
  }
};

/* "More" launcher */
Views.more = function (app) {
  UI.setBar({ title: 'More' });
  var mods = UI.el('div', { class: 'mods' });
  [
    ['clock', 'Wear tests', 'Timed check-ins', 'wear'],
    ['calc', 'Cost model', 'Landed cost + MOQ', 'cost'],
    ['branch', 'Decision log', 'Fact → assumption → rec', 'decisions'],
    ['images', 'Photo library', 'Everything, one grid', 'photos'],
    ['ruler', 'Fit body', '18-point measurements', 'body'],
    ['print', 'Reports', 'Print / save as PDF', 'reports'],
    ['gear', 'Settings', 'Backup, storage, demo', 'settings']
  ].forEach(function (m) {
    mods.appendChild(UI.el('button', { class: 'mod', type: 'button', onclick: function () { UI.go(m[3]); } }, [
      UI.icon(m[0], 20),
      UI.el('div', {}, [UI.el('div', { class: 'mt', text: m[1] }), UI.el('div', { class: 'ms', text: m[2] })])
    ]));
  });
  app.appendChild(mods);
};
