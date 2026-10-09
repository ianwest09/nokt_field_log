/* Cost model — landed cost, margin, MOQ scenarios, competitor ladder. */
var Views = window.Views || {};

var Cost = (function () {
  function landed(c) {
    var fabric = (Number(c.fabricPricePerM) || 0) * (Number(c.metresPerUnit) || 0);
    var waste = fabric * (Number(c.wastage) || 0) / 100;
    return fabric + waste + (Number(c.trims) || 0) + (Number(c.cmt) || 0) +
      (Number(c.labels) || 0) + (Number(c.freight) || 0);
  }
  function margin(c) {
    var r = Number(c.retail) || 0, l = landed(c);
    return r > 0 ? (r - l) / r * 100 : 0;
  }
  function zar(comp, c) {
    var rate = comp.cur === 'EUR' ? (Number(c.fxEur) || 0) : (Number(c.fxUsd) || 0);
    return { lo: comp.lo * rate, hi: comp.hi * rate };
  }
  return { landed: landed, margin: margin, zar: zar };
})();

Views.cost = function (app) {
  var c, comps;

  UI.setBar({
    title: 'Cost model', eyebrow: 'Unit economics', back: function () { UI.go('more'); },
    actions: [{ icon: 'dl', label: 'Export CSV', onClick: function () { exportCsv(); } }]
  });

  function exportCsv() {
    if (!c) return;
    var l = Cost.landed(c);
    var rows = [['Field', 'Value']];
    Object.keys(c).forEach(function (k) { rows.push([k, c[k]]); });
    rows.push(['', '']);
    rows.push(['Landed cost', l.toFixed(2)]);
    rows.push(['Gross margin %', Cost.margin(c).toFixed(1)]);
    rows.push(['Capital — MOQ per style', (l * (Number(c.moq) || 0)).toFixed(2)]);
    rows.push(['Capital — MOQ per size', (l * (Number(c.moq) || 0) * (Number(c.sizes) || 1)).toFixed(2)]);
    UI.download(new Blob([UI.csv(rows)], { type: 'text/csv' }), 'nokt-cost-model.csv');
    UI.toast('CSV exported', { type: 'good' });
  }

  Promise.all([DB.meta('cost', CFG.COST_DEFAULTS), DB.meta('competitors', CFG.COMPETITORS)]).then(function (r) {
    c = Object.assign({}, CFG.COST_DEFAULTS, r[0] || {});
    comps = r[1] || JSON.parse(JSON.stringify(CFG.COMPETITORS));
    build();
  });

  var saveCost = UI.debounce(function () { DB.setMeta('cost', c); }, 400);
  var saveComps = UI.debounce(function () { DB.setMeta('competitors', comps); }, 400);

  function build() {
    var out = UI.el('div');

    /* ---- inputs ---- */
    app.appendChild(UI.eyebrow('Inputs'));
    var inp = UI.card([]);
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Fabric price / m', value: c.fabricPricePerM, unit: 'R', onInput: set('fabricPricePerM') }),
      UI.number({ label: 'Metres per unit', value: c.metresPerUnit, unit: 'm', onInput: set('metresPerUnit') })
    ]));
    inp.appendChild(consumption());
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Trims', value: c.trims, unit: 'R', onInput: set('trims') }),
      UI.number({ label: 'CMT / unit', value: c.cmt, unit: 'R', onInput: set('cmt') })
    ]));
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Labels + packaging', value: c.labels, unit: 'R', onInput: set('labels') }),
      UI.number({ label: 'Freight / unit', value: c.freight, unit: 'R', onInput: set('freight') })
    ]));
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Wastage', value: c.wastage, unit: '%', onInput: set('wastage') }),
      UI.number({ label: 'Retail price', value: c.retail, unit: 'R', onInput: set('retail') })
    ]));
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'Fixed costs (patterns, samples)', value: c.fixed, unit: 'R', onInput: set('fixed') }),
      UI.number({ label: 'Sizes in launch', value: c.sizes, unit: '', onInput: set('sizes') })
    ]));
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'MOQ', value: c.moq, unit: 'units', onInput: set('moq') }),
      UI.select({ label: 'MOQ basis', value: c.moqBasis, options: ['Per style', 'Per size', 'Unclear'], onInput: set('moqBasis', true) })
    ]));
    inp.appendChild(UI.el('div', { class: 'f-row' }, [
      UI.number({ label: 'ZAR per USD', value: c.fxUsd, unit: 'R', onInput: set('fxUsd') }),
      UI.number({ label: 'ZAR per EUR', value: c.fxEur, unit: 'R', onInput: set('fxEur') })
    ]));
    inp.appendChild(UI.el('div', { class: 'f-hint', text: 'Exchange rates are typed in by hand and never fetched — the app must work with no signal. Update them when you remember.' }));
    app.appendChild(inp);

    app.appendChild(out);
    app.appendChild(UI.el('div', { style: 'height:8px' }));
    draw();

    function set(key, isStr) {
      return function (v) { c[key] = isStr ? v : v; saveCost(); draw(); };
    }

    function consumption() {
      var box = UI.el('div', { class: 'calc' }, [UI.el('div', { class: 'calc-t', text: 'Consumption calculator' })]);
      var res = UI.el('span', { class: 'ov', text: '—' });
      box.appendChild(UI.el('div', { class: 'f-row3' }, [
        UI.number({ label: 'Marker width', value: c.markerWidth, unit: 'cm', onInput: function (v) { c.markerWidth = v; saveCost(); calc(); } }),
        UI.number({ label: 'Garment length', value: c.garmentLength, unit: 'cm', onInput: function (v) { c.garmentLength = v; saveCost(); calc(); } }),
        UI.number({ label: 'Efficiency', value: c.efficiency, unit: '%', onInput: function (v) { c.efficiency = v; saveCost(); calc(); } })
      ]));
      var btn = UI.el('button', { class: 'btn sm ghost', style: 'width:100%;margin-top:6px', type: 'button', text: 'Use this figure' });
      var row = UI.el('div', { class: 'out' }, [UI.el('span', { class: 'sub', text: 'Estimated metres / unit' }), res]);
      box.appendChild(row); box.appendChild(btn);
      box.appendChild(UI.el('div', { class: 'f-hint', text: 'Assumes one full garment nested per marker width. Confirm with the factory marker before you buy fabric.' }));
      function value() {
        var l = Number(c.garmentLength) || 0, e = Number(c.efficiency) || 100;
        return e ? (l / 100) / (e / 100) : 0;
      }
      function calc() { res.textContent = value() ? UI.num(value(), 2) + ' m' : '—'; }
      btn.onclick = function () { c.metresPerUnit = Math.round(value() * 100) / 100; saveCost(); UI.toast('Applied ' + c.metresPerUnit + ' m/unit'); UI.resolve(); };
      calc();
      return box;
    }

    function draw() {
      UI.clear(out);
      var l = Cost.landed(c), m = Cost.margin(c);

      /* landed */
      var lc = UI.card([]);
      lc.appendChild(UI.el('div', { class: 'eyebrow', style: 'margin-top:0', text: 'Landed cost per unit' }));
      lc.appendChild(UI.el('div', { class: 'num', text: UI.money(l) }));
      var fabric = (Number(c.fabricPricePerM) || 0) * (Number(c.metresPerUnit) || 0);
      lc.appendChild(UI.el('div', { style: 'margin-top:12px' }, [
        UI.kv('Fabric', UI.money(fabric)),
        UI.kv('Wastage ' + (c.wastage || 0) + '%', UI.money(fabric * (Number(c.wastage) || 0) / 100)),
        UI.kv('Trims', UI.money(c.trims)),
        UI.kv('CMT', UI.money(c.cmt)),
        UI.kv('Labels + packaging', UI.money(c.labels)),
        UI.kv('Freight', UI.money(c.freight))
      ]));
      out.appendChild(lc);

      /* margin */
      var mc = UI.card([]);
      mc.appendChild(UI.el('div', { class: 'eyebrow', style: 'margin-top:0', text: 'At your retail price' }));
      var mv = UI.el('div', { class: 'num', text: UI.num(m, 1) + '%' });
      if (m < 65) mv.style.color = 'var(--fail)';
      mc.appendChild(mv);
      mc.appendChild(UI.el('div', { class: 'sub', text: 'Gross margin at ' + UI.money(c.retail) }));
      if (m < 65) {
        mc.appendChild(UI.el('div', { class: 'f-hint', style: 'color:var(--fail);margin-top:8px', text: 'Below the 65% target. Either the product changes or the price does — do not quietly accept a thinner margin.' }));
      }
      mc.appendChild(UI.el('div', { style: 'margin-top:12px' }, [
        UI.kv('Gross profit / unit', UI.money((Number(c.retail) || 0) - l)),
        UI.kv('In USD', UI.money((Number(c.retail) || 0) / (Number(c.fxUsd) || 1), '$')),
        UI.kv('In EUR', UI.money((Number(c.retail) || 0) / (Number(c.fxEur) || 1), '€'))
      ]));
      out.appendChild(mc);

      /* multiples */
      var xc = UI.card([]);
      xc.appendChild(UI.el('div', { class: 'eyebrow', style: 'margin-top:0', text: 'Suggested retail' }));
      [2, 3, 4, 5].forEach(function (x) {
        var price = l * x, mg = price ? (price - l) / price * 100 : 0;
        xc.appendChild(UI.kv(x + '× landed', UI.money(price) + '  ·  ' + UI.num(mg, 0) + '%'));
      });
      out.appendChild(xc);

      /* break-even */
      var unitProfit = (Number(c.retail) || 0) - l;
      var be = unitProfit > 0 ? Math.ceil((Number(c.fixed) || 0) / unitProfit) : null;
      var bc = UI.card([]);
      bc.appendChild(UI.el('div', { class: 'eyebrow', style: 'margin-top:0', text: 'Break-even' }));
      var noFixed = !(Number(c.fixed) > 0);
      bc.appendChild(UI.el('div', { class: 'num', text: be === null ? '—' : (noFixed ? '—' : be + ' units') }));
      bc.appendChild(UI.el('div', {
        class: 'sub',
        text: be === null ? 'Retail price must exceed landed cost.'
          : noFixed ? 'Enter your fixed costs above — pattern, samples, photography, labels — to see how many units repay them.'
            : 'To recover ' + UI.money(c.fixed) + ' of fixed cost.'
      }));
      out.appendChild(bc);

      /* MOQ scenarios */
      out.appendChild(UI.eyebrow('MOQ scenario — the R30k vs R135k question'));
      var moq = Number(c.moq) || 0, sizes = Number(c.sizes) || 1;
      var perStyle = moq, perSize = moq * sizes;
      var capStyle = perStyle * l, capSize = perSize * l;
      var sc = UI.card([]);
      sc.appendChild(UI.el('div', { class: 'grid2' }, [
        scen('Per style', perStyle, capStyle, c.moqBasis === 'Per style'),
        scen('Per size × ' + sizes, perSize, capSize, c.moqBasis === 'Per size')
      ]));
      sc.appendChild(UI.el('div', {
        class: 'f-hint', style: 'margin-top:12px;color:var(--fail)',
        text: 'Difference: ' + UI.money(capSize - capStyle) + ' of stock before a single sale. Confirm the basis with the factory in writing.'
      }));
      out.appendChild(sc);

      function scen(title, units, capital, active) {
        return UI.el('div', { class: 'stat', style: active ? 'border-color:var(--accent)' : '' }, [
          UI.el('div', { class: 'k', text: title + (active ? ' · current' : '') }),
          UI.el('div', { class: 'v', text: UI.money(capital) }),
          UI.el('div', { class: 'tiny', style: 'margin-top:4px', text: units + ' units' })
        ]);
      }

      /* competitor ladder */
      out.appendChild(UI.eyebrow('Competitor price ladder', UI.el('button', {
        class: 'tiny', style: 'color:var(--accent);min-height:44px;padding:0 6px', type: 'button', text: 'Edit',
        onclick: editComps
      })));
      out.appendChild(ladder());
    }

    function ladder() {
      var rows = comps.map(function (k) {
        var z = Cost.zar(k, c);
        return { name: k.name, lo: z.lo, hi: z.hi, cur: k.cur, raw: k };
      });
      var mine = Number(c.retail) || 0;
      var max = Math.max(mine, Math.max.apply(null, rows.map(function (r) { return r.hi; }))) * 1.08 || 1;
      var card = UI.card([]);
      var W = 340, rowH = 26, H = (rows.length + 1) * rowH + 18;
      var labelW = 0;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ladder" role="img" aria-label="Competitor price ladder">';
      rows.sort(function (a, b) { return a.lo - b.lo; }).forEach(function (r, i) {
        var y = i * rowH + 12;
        var x1 = (r.lo / max) * (W - 8), x2 = (r.hi / max) * (W - 8);
        svg += '<rect x="0" y="' + y + '" width="' + Math.max(2, x2) + '" height="9" rx="2" fill="#2B2B30"/>';
        svg += '<rect x="' + x1.toFixed(1) + '" y="' + y + '" width="' + Math.max(2, x2 - x1) + '" height="9" rx="2" fill="#51606E"/>';
        svg += '<text x="2" y="' + (y - 2) + '" fill="#8A8A90" font-size="8.5">' + UI.esc(r.name) + ' · ' + UI.money(r.lo) + (r.hi !== r.lo ? '–' + UI.money(r.hi) : '') + '</text>';
      });
      var my = rows.length * rowH + 12;
      var mx = (mine / max) * (W - 8);
      svg += '<rect x="0" y="' + my + '" width="' + Math.max(2, mx) + '" height="9" rx="2" fill="#7FA8D9"/>';
      svg += '<text x="2" y="' + (my - 2) + '" fill="#F2F2F0" font-size="9" font-weight="600">NOKT · ' + UI.money(mine) + '</text>';
      svg += '<line x1="' + mx.toFixed(1) + '" y1="4" x2="' + mx.toFixed(1) + '" y2="' + (my + 11) + '" stroke="#7FA8D9" stroke-width="1" stroke-dasharray="2 2" opacity=".6"/>';
      svg += '</svg>';
      card.innerHTML = svg;
      var above = rows.filter(function (r) { return mine > r.hi; }).length;
      card.appendChild(UI.el('div', { class: 'f-hint', style: 'margin-top:10px', text: 'Your price sits above ' + above + ' of ' + rows.length + ' listed competitors. Converted at R' + (c.fxUsd || 0) + '/$ and R' + (c.fxEur || 0) + '/€.' }));
      return card;
    }

    function editComps() {
      var body = UI.el('div');
      function redraw() {
        UI.clear(body);
        comps.forEach(function (k, i) {
          var row = UI.el('div', { class: 'card' });
          row.appendChild(UI.text({ label: 'Name', value: k.name, onInput: function (v) { k.name = v; saveComps(); } }));
          row.appendChild(UI.el('div', { class: 'f-row3' }, [
            UI.number({ label: 'Low', value: k.lo, onInput: function (v) { k.lo = v; saveComps(); } }),
            UI.number({ label: 'High', value: k.hi, onInput: function (v) { k.hi = v; saveComps(); } }),
            UI.select({ label: 'Currency', value: k.cur, options: ['USD', 'EUR', 'ZAR'], onInput: function (v) { k.cur = v; saveComps(); } })
          ]));
          row.appendChild(UI.el('button', {
            class: 'btn sm danger', type: 'button', text: 'Remove', onclick: function () {
              comps.splice(i, 1); saveComps(); redraw();
            }
          }));
          body.appendChild(row);
        });
        body.appendChild(UI.el('button', {
          class: 'btn ghost', type: 'button', text: 'Add competitor', onclick: function () {
            comps.push({ id: DB.uid('cmp'), name: '', lo: 0, hi: 0, cur: 'USD' }); saveComps(); redraw();
          }
        }));
      }
      redraw();
      UI.sheet({
        title: 'Competitor ladder', body: body,
        actions: [{ label: 'Done', cls: 'pri', onClick: function () { DB.setMeta('competitors', comps).then(function () { UI.resolve(); }); } }]
      });
    }

  }
};
