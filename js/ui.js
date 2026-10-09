/* NOKT FIELD LOG — DOM, icons, router, forms, toasts, sheets. No dependencies. */
var UI = (function () {

  /* ---------------- icons ---------------- */
  var P = {
    back: 'M15 18l-6-6 6-6',
    chev: 'M9 18l6-6-6-6',
    down: 'M6 9l6 6 6-6',
    plus: 'M12 5v14M5 12h14',
    x: 'M18 6L6 18M6 6l12 12',
    check: 'M20 6L9 17l-5-5',
    camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z|M12 17a4 4 0 100-8 4 4 0 000 8z',
    image: 'M3 3h18v18H3zM3 15l5-5 4 4 3-3 6 6',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
    dl: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    up: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v14',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
    gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z|M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    factory: 'M2 20h20M4 20V9l5 3V9l5 3V9l5 3v8M8 20v-4h3v4',
    layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    ruler: 'M3 9h18v6H3zM7 9v3M11 9v4M15 9v3M19 9v4',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    calc: 'M5 2h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM8 6h8v3H8zM8 13h1M12 13h1M16 13h1M8 17h1M12 17h1M16 17h1',
    branch: 'M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9',
    images: 'M15 2H3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM2 12l4-4 3 3 3-3 4 4M20 8v12a1 1 0 01-1 1H7',
    dots: 'M12 6h.01M12 12h.01M12 18h.01',
    warn: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
    info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',
    copy: 'M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
    msg: 'M21 11.5a8.4 8.4 0 01-9 8.4 8.5 8.5 0 01-4-1L3 20l1.1-4.9a8.4 8.4 0 01-1-4A8.4 8.4 0 0112 3h.5a8.4 8.4 0 018 8z',
    mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
    chart: 'M3 3v18h18M7 16v-5M12 16V8M17 16v-9',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    note: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
    sort: 'M3 6h18M6 12h12M10 18h4',
    link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-2 2M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l2-2'
  };

  function icon(name, size) {
    var s = size || 20, svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', s); svg.setAttribute('height', s);
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    (P[name] || P.info).split('|').forEach(function (d) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d); svg.appendChild(p);
    });
    return svg;
  }

  /* ---------------- DOM ---------------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'style') n.setAttribute('style', v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { n.dataset[d] = v[d]; });
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    });
    (Array.isArray(kids) ? kids : (kids === undefined || kids === null ? [] : [kids])).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return n;
  }
  function frag(kids) { var f = document.createDocumentFragment(); (kids || []).forEach(function (c) { if (c) f.appendChild(c); }); return f; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* ---------------- format ---------------- */
  function num(v, dp) {
    if (v === '' || v === null || v === undefined || isNaN(v)) return '—';
    var n = Number(v);
    return n.toFixed(dp === undefined ? (n % 1 ? 1 : 0) : dp).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function money(v, cur) {
    if (v === '' || v === null || v === undefined || isNaN(v)) return '—';
    return (cur || 'R') + ' ' + num(Math.round(Number(v) * 100) / 100, Number(v) % 1 ? 2 : 0);
  }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dateStr(iso) {
    if (!iso) return '—';
    var d = new Date(iso); if (isNaN(d)) return '—';
    return String(d.getDate()).padStart(2, '0') + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function nowISO() { return new Date().toISOString(); }
  function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
  function bytes(n) {
    if (!n) return '0 B';
    var u = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(n) / Math.log(1024));
    return (n / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i];
  }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function debounce(fn, ms) {
    var t; var f = function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 400); };
    f.flush = function () { clearTimeout(t); fn(); }; return f;
  }

  /* ---------------- app bar ---------------- */
  function setBar(o) {
    o = o || {};
    var bar = document.getElementById('appbar'), back = document.getElementById('bar-back');
    bar.hidden = false;
    document.getElementById('bar-title').textContent = o.title || '';
    document.getElementById('bar-eyebrow').textContent = o.eyebrow || '';
    clear(back);
    if (o.back) { back.hidden = false; back.appendChild(icon('back', 22)); back.onclick = function () { typeof o.back === 'function' ? o.back() : history.back(); }; }
    else back.hidden = true;
    var acts = clear(document.getElementById('bar-actions'));
    (o.actions || []).forEach(function (a) {
      var b = el('button', { type: 'button', class: a.text ? 'txt-btn' : '', 'aria-label': a.label || a.text || '', onclick: a.onClick });
      if (a.text) b.textContent = a.text; else b.appendChild(icon(a.icon, 21));
      acts.appendChild(b);
    });
  }

  /* ---------------- router ---------------- */
  var routes = [], currentPath = '';
  function route(pattern, handler) {
    var keys = [], rx = new RegExp('^' + pattern.replace(/:[^/]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    routes.push({ rx: rx, keys: keys, h: handler });
  }
  function go(path, replace) {
    if (replace) location.replace('#/' + path.replace(/^\//, ''));
    else location.hash = '#/' + path.replace(/^\//, '');
  }
  function resolve() {
    var path = (location.hash || '#/dashboard').replace(/^#\/?/, '') || 'dashboard';
    currentPath = path;
    var app = document.getElementById('app');
    for (var i = 0; i < routes.length; i++) {
      var m = path.match(routes[i].rx);
      if (m) {
        var params = {};
        routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
        clear(app); app.scrollTop = 0; window.scrollTo(0, 0);
        app.className = 'app';
        try { routes[i].h(app, params); }
        catch (e) { console.error(e); app.appendChild(errorCard(e)); }
        syncTabs(path);
        return;
      }
    }
    go('dashboard', true);
  }
  function errorCard(e) {
    return el('div', { class: 'card' }, [
      el('div', { class: 'h2', text: 'Something broke on this screen' }),
      el('div', { class: 'sub', text: String(e && e.message || e) }),
      el('button', { class: 'btn ghost sm', style: 'margin-top:12px', text: 'Reload', onclick: function () { location.reload(); } })
    ]);
  }
  function path() { return currentPath; }

  /* ---------------- tabs ---------------- */
  var TABS = [
    { id: 'dashboard', label: 'Home', icon: 'grid' },
    { id: 'factories', label: 'Factories', icon: 'factory' },
    { id: 'fabrics', label: 'Fabric', icon: 'layers' },
    { id: 'fit', label: 'Fit', icon: 'user' },
    { id: 'more', label: 'More', icon: 'dots' }
  ];
  function buildTabs() {
    var nav = clear(document.getElementById('tabbar'));
    nav.hidden = false;
    TABS.forEach(function (t) {
      var b = el('button', { class: 'tab', type: 'button', dataset: { tab: t.id }, onclick: function () { go(t.id); } }, [
        icon(t.icon, 21), el('span', { class: 'tab-l', text: t.label })
      ]);
      nav.appendChild(b);
    });
  }
  function syncTabs(p) {
    var root = p.split('/')[0];
    var map = { body: 'fit', fitnew: 'fit', wear: 'more', cost: 'more', decisions: 'more', photos: 'more', settings: 'more', reports: 'more' };
    var active = map[root] || root;
    [].forEach.call(document.querySelectorAll('.tab'), function (t) { t.classList.toggle('on', t.dataset.tab === active); });
  }

  /* ---------------- toast ---------------- */
  function toast(msg, opts) {
    opts = opts || {};
    var box = document.getElementById('toasts');
    var t = el('div', { class: 'toast' + (opts.type ? ' ' + opts.type : '') }, [el('span', { text: msg })]);
    if (opts.action) {
      t.appendChild(el('button', {
        type: 'button', text: opts.action, onclick: function () { kill(); opts.onAction && opts.onAction(); }
      }));
    }
    box.appendChild(t);
    var to = setTimeout(kill, opts.ms || (opts.action ? 6500 : 3000));
    function kill() { clearTimeout(to); if (t.parentNode) t.parentNode.removeChild(t); }
    return kill;
  }

  /* ---------------- sheet ---------------- */
  var sheetStack = [];
  function sheet(o) {
    var root = document.getElementById('sheet-root');
    var body = clear(document.getElementById('sheet-body'));
    var foot = clear(document.getElementById('sheet-foot'));
    document.getElementById('sheet-title').textContent = o.title || '';
    if (o.body) body.appendChild(o.body);
    (o.actions || []).forEach(function (a) {
      foot.appendChild(el('button', {
        class: 'btn ' + (a.cls || ''), type: 'button', text: a.label,
        onclick: function () { if (a.keepOpen) { a.onClick && a.onClick(); } else { close(); a.onClick && a.onClick(); } }
      }));
    });
    root.hidden = false;
    var close = function () { root.hidden = true; sheetStack.pop(); o.onClose && o.onClose(); };
    sheetStack.push(close);
    root.onclick = function (e) { if (e.target.dataset && e.target.dataset.close) close(); };
    return close;
  }
  function confirm(title, msg, okLabel, danger) {
    return new Promise(function (res) {
      var done = false;
      sheet({
        title: title,
        body: el('div', { class: 'sub', text: msg }),
        actions: [
          { label: okLabel || 'Confirm', cls: danger ? 'danger' : 'pri', onClick: function () { done = true; res(true); } },
          { label: 'Cancel', cls: 'ghost', onClick: function () { done = true; res(false); } }
        ],
        onClose: function () { if (!done) res(false); }
      });
    });
  }
  function prompt(title, label, value) {
    return new Promise(function (res) {
      var inp = el('input', { class: 'inp', value: value || '', type: 'text' });
      var done = false;
      sheet({
        title: title,
        body: el('div', {}, [el('div', { class: 'f' }, [el('div', { class: 'f-lab', text: label }), inp])]),
        actions: [{ label: 'Save', cls: 'pri', onClick: function () { done = true; res(inp.value.trim()); } },
        { label: 'Cancel', cls: 'ghost', onClick: function () { done = true; res(null); } }],
        onClose: function () { if (!done) res(null); }
      });
      setTimeout(function () { inp.focus(); }, 80);
    });
  }

  /* ---------------- form controls ---------------- */
  function label(o) {
    var l = el('div', { class: 'f-lab' }, [el('span', { text: o.label })]);
    if (o.critical) l.appendChild(el('span', { class: 'chip fail', text: 'Critical' }));
    if (o.badge) l.appendChild(el('span', { class: 'chip ghost', text: o.badge }));
    return l;
  }
  function wrapField(o, control, extra) {
    var f = el('div', { class: 'f' });
    if (o.label) f.appendChild(label(o));
    f.appendChild(control);
    if (extra) f.appendChild(extra);
    if (o.hint) f.appendChild(el('div', { class: 'f-hint', text: o.hint }));
    return f;
  }
  function text(o) {
    var inp = el(o.multiline ? 'textarea' : 'input', {
      class: 'inp', placeholder: o.placeholder || '', rows: o.rows || 4,
      type: o.multiline ? null : (o.type || 'text'), inputmode: o.inputmode || null,
      autocapitalize: o.autocapitalize || 'sentences', enterkeyhint: 'done'
    });
    inp.value = o.value === null || o.value === undefined ? '' : o.value;
    inp.addEventListener('input', function () { o.onInput && o.onInput(inp.value); });
    if (o.onBlur) inp.addEventListener('blur', function () { o.onBlur(inp.value); });
    var f = wrapField(o, inp);
    f.input = inp; return f;
  }
  function number(o) {
    var w = el('div', { class: 'f-wrap' });
    var inp = el('input', {
      class: 'inp' + (o.unit ? ' has-unit' : ''), type: 'text', inputmode: 'decimal',
      placeholder: o.placeholder || '', enterkeyhint: 'done'
    });
    inp.value = (o.value === null || o.value === undefined || o.value === '') ? '' : o.value;
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/[^0-9.\-]/g, '');
      o.onInput && o.onInput(inp.value === '' ? '' : Number(inp.value));
    });
    w.appendChild(inp);
    if (o.unit) w.appendChild(el('span', { class: 'unit', text: o.unit }));
    var f = wrapField(o, w);
    f.input = inp; return f;
  }
  function select(o) {
    var s = el('select', { class: 'inp' });
    (o.options || []).forEach(function (op) {
      var v = typeof op === 'string' ? op : op.v, l = typeof op === 'string' ? op : op.l;
      var opt = el('option', { value: v, text: l });
      if (String(v) === String(o.value)) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener('change', function () { o.onInput && o.onInput(s.value); });
    var f = wrapField(o, s); f.input = s; return f;
  }
  function seg(o) {
    var box = el('div', { class: 'seg' });
    (o.options || []).forEach(function (op) {
      var v = typeof op === 'string' ? op : op.v, l = typeof op === 'string' ? op : op.l;
      var b = el('button', { type: 'button', text: l, dataset: { v: String(v).toLowerCase() } });
      if (String(o.value) === String(v)) b.classList.add('on');
      b.onclick = function () {
        var val = (o.toggle && String(o.value) === String(v)) ? '' : v;
        [].forEach.call(box.children, function (c) { c.classList.remove('on'); });
        if (val !== '') b.classList.add('on');
        o.value = val; o.onInput && o.onInput(val);
      };
      box.appendChild(b);
    });
    return wrapField(o, box);
  }
  function rating(o) {
    var box = el('div', { class: 'rate' });
    for (var i = 1; i <= (o.max || 5); i++) (function (i) {
      var b = el('button', { type: 'button', text: String(i) });
      if (Number(o.value) === i) b.classList.add('on');
      b.onclick = function () {
        var val = Number(o.value) === i && o.toggle !== false ? '' : i;
        [].forEach.call(box.children, function (c) { c.classList.remove('on'); });
        if (val !== '') b.classList.add('on');
        o.value = val; o.onInput && o.onInput(val);
      };
      box.appendChild(b);
    })(i);
    return wrapField(o, box);
  }
  function checkbox(o) {
    var b = el('button', { class: 'check' + (o.checked ? ' on' : ''), type: 'button' }, [
      el('span', { class: 'box' }, [icon('check', 15)]),
      el('span', { class: 'cl', text: o.label })
    ]);
    b.onclick = function () { o.checked = !o.checked; b.classList.toggle('on', o.checked); o.onInput && o.onInput(o.checked); };
    return b;
  }
  function slider(o) {
    var out = el('span', { class: 'chip ghost', text: (o.value === '' || o.value === undefined || o.value === null ? '—' : o.value + (o.unit || '')) });
    var lab = el('div', { class: 'f-lab' }, [el('span', { text: o.label }), out]);
    var inp = el('input', { class: 'slider', type: 'range', min: o.min || 0, max: o.max || 100, step: o.step || 1 });
    inp.value = o.value === '' || o.value === undefined || o.value === null ? (o.min || 0) : o.value;
    inp.addEventListener('input', function () { out.textContent = inp.value + (o.unit || ''); o.onInput && o.onInput(Number(inp.value)); });
    var f = el('div', { class: 'f' }, [lab, inp]);
    if (o.hint) f.appendChild(el('div', { class: 'f-hint', text: o.hint }));
    return f;
  }
  function dateField(o) {
    var inp = el('input', { class: 'inp', type: 'date', value: o.value || '' });
    inp.addEventListener('change', function () { o.onInput && o.onInput(inp.value); });
    return wrapField(o, inp);
  }
  function helpNote(txt) {
    var open = false;
    var body = el('div', { class: 'f-hint', text: txt, style: 'display:none' });
    var btn = el('button', { type: 'button', class: 'tiny', style: 'color:var(--accent);padding:10px 0;min-height:44px', text: 'How to measure' });
    btn.onclick = function () { open = !open; body.style.display = open ? 'block' : 'none'; btn.textContent = open ? 'Hide' : 'How to measure'; };
    return el('div', {}, [btn, body]);
  }

  /* ---------------- blocks ---------------- */
  function empty(o) {
    var e = el('div', { class: 'empty' }, [
      icon(o.icon || 'note', 30),
      el('div', { class: 'et', text: o.title }),
      el('div', { class: 'es', text: o.text })
    ]);
    if (o.action) e.appendChild(el('button', { class: 'btn pri', style: 'max-width:280px;margin:0 auto', type: 'button', text: o.action, onclick: o.onAction }));
    return e;
  }
  function eyebrow(t, right) {
    var d = el('div', { class: 'eyebrow', style: right ? 'display:flex;justify-content:space-between;align-items:baseline' : '' }, [el('span', { text: t })]);
    if (right) d.appendChild(right);
    return d;
  }
  function row(o) {
    var r = el(o.onClick ? 'button' : 'div', { class: 'row', type: o.onClick ? 'button' : null, onclick: o.onClick });
    if (o.dot) r.appendChild(el('span', { class: 'dot ' + o.dot }));
    if (o.icon) r.appendChild(icon(o.icon, 18));
    r.appendChild(el('div', { class: 'rl' }, [
      el('div', { class: 'rt', text: o.title }),
      o.sub ? el('div', { class: 'rs', text: o.sub }) : null
    ]));
    if (o.value) r.appendChild(el('div', { class: 'rv', text: o.value }));
    if (o.chip) r.appendChild(el('span', { class: 'chip ' + (o.chipCls || ''), text: o.chip }));
    if (o.onClick) r.appendChild(icon('chev', 17)).classList.add('chev');
    return r;
  }
  function kv(k, v, cls) {
    return el('div', { class: 'kv' }, [el('span', { class: 'k', text: k }), el('span', { class: 'v ' + (cls || ''), text: v })]);
  }
  function card(kids, cls) { return el('div', { class: 'card ' + (cls || '') }, kids); }
  function fab(labelText, onClick, iconName) {
    var b = el('button', { class: 'fab', type: 'button', onclick: onClick }, [icon(iconName || 'plus', 19), el('span', { text: labelText })]);
    document.getElementById('app').appendChild(b);
    return b;
  }
  function ring(pct, size) {
    var s = size || 64, r = (s - 7) / 2, c = 2 * Math.PI * r;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', s); svg.setAttribute('height', s); svg.setAttribute('viewBox', '0 0 ' + s + ' ' + s);
    function circle(cls, dash) {
      var c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c1.setAttribute('cx', s / 2); c1.setAttribute('cy', s / 2); c1.setAttribute('r', r);
      c1.setAttribute('fill', 'none'); c1.setAttribute('stroke-width', '4'); c1.setAttribute('class', cls);
      c1.setAttribute('stroke-linecap', 'round');
      if (dash) c1.setAttribute('stroke-dasharray', dash);
      return c1;
    }
    svg.appendChild(circle('rtrack'));
    svg.appendChild(circle('rbar', (c * pct / 100) + ' ' + c));
    var wrap = el('div', { class: 'ring-mid', style: 'width:' + s + 'px;height:' + s + 'px' }, [svg,
      el('div', { class: 'ring-pct', text: Math.round(pct) + '%' })]);
    return wrap;
  }
  function searchBar(placeholder, onInput, extra) {
    var inp = el('input', { class: 'inp', type: 'search', placeholder: placeholder, autocapitalize: 'none' });
    inp.addEventListener('input', function () { onInput(inp.value.toLowerCase()); });
    var bar = el('div', { class: 'sortbar' }, [inp]);
    if (extra) bar.appendChild(extra);
    return bar;
  }

  /* ---------------- files ---------------- */
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = c === null || c === undefined ? '' : String(c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
  }
  function share(blob, filename, title) {
    if (navigator.canShare && navigator.share) {
      try {
        var file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          return navigator.share({ files: [file], title: title || filename }).catch(function () { });
        }
      } catch (e) { }
    }
    download(blob, filename);
    return Promise.resolve();
  }
  function copy(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(txt).then(function () { toast('Copied to clipboard', { type: 'good' }); });
    }
    var ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = txt;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied to clipboard', { type: 'good' }); } catch (e) { toast('Could not copy', { type: 'bad' }); }
    ta.remove();
    return Promise.resolve();
  }

  /* ---------------- autosave ---------------- */
  var SAVERS = [];
  function flushAll() { SAVERS.forEach(function (f) { try { f.flush(); } catch (e) { } }); }
  window.addEventListener('pagehide', flushAll);
  window.addEventListener('beforeunload', flushAll);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flushAll(); });

  function saver(store, rec, onSaved) {
    var f = debounce(function () {
      rec.updatedAt = nowISO();
      DB.put(store, rec).then(function () { onSaved && onSaved(); })
        .catch(function (e) {
          toast(e.quota ? e.message : ('Could not save — ' + (e.message || e)), { type: 'bad', ms: 8000 });
        });
    }, 400);
    SAVERS.push(f);
    if (SAVERS.length > 24) SAVERS.splice(0, SAVERS.length - 24);
    return f;
  }
  function savedTick() {
    var t = el('span', { class: 'chip ghost', text: 'Saved' });
    setTimeout(function () { t.remove(); }, 1400);
    return t;
  }

  function banner(o) {
    var box = document.getElementById('banners');
    box.hidden = false;
    var b = el('div', { class: 'banner ' + (o.type || '') }, [
      icon(o.type === 'bad' ? 'warn' : (o.type === 'warn' ? 'warn' : 'info'), 17),
      el('span', { html: o.html || esc(o.text) })
    ]);
    if (o.action) b.appendChild(el('button', { type: 'button', text: o.action, onclick: function () { o.onAction && o.onAction(); b.remove(); if (!box.children.length) box.hidden = true; } }));
    box.appendChild(b);
    sizeBanners();
    return b;
  }
  function sizeBanners() {
    var box = document.getElementById('banners');
    var h = (box && !box.hidden && box.children.length) ? box.offsetHeight + 8 : 0;
    document.documentElement.style.setProperty('--banner-h', h + 'px');
  }
  function clearBanners() {
    var b = document.getElementById('banners'); clear(b); b.hidden = true; sizeBanners();
  }

  return {
    icon: icon, el: el, frag: frag, clear: clear,
    num: num, money: money, dateStr: dateStr, today: today, nowISO: nowISO, daysBetween: daysBetween, bytes: bytes, esc: esc,
    debounce: debounce, setBar: setBar, route: route, go: go, resolve: resolve, path: path,
    buildTabs: buildTabs, toast: toast, sheet: sheet, confirm: confirm, prompt: prompt,
    text: text, number: number, select: select, seg: seg, rating: rating, checkbox: checkbox,
    slider: slider, date: dateField, helpNote: helpNote, label: label,
    empty: empty, eyebrow: eyebrow, row: row, kv: kv, card: card, fab: fab, ring: ring, searchBar: searchBar,
    saver: saver, savedTick: savedTick,
    download: download, csv: csv, share: share, copy: copy, banner: banner, clearBanners: clearBanners, sizeBanners: sizeBanners
  };
})();
