/* NOKT FIELD LOG — first-run seeding, demo data, reset. */
var Seed = (function () {

  function ensure() {
    return DB.meta('seeded').then(function (v) {
      if (v) return migrate();
      var tasks = CFG.ROADMAP.map(function (t, i) {
        return { id: 'task_' + t.d, week: t.w, day: t.d, title: t.t, done: false, notes: '', order: i };
      });
      var gates = CFG.GATES.map(function (g) {
        return { id: g.id, week: g.w, label: g.label, cond: g.cond, mode: 'auto' };
      });
      var factories = CFG.SEED_FACTORIES.map(function (f, i) {
        return {
          id: 'fac_seed' + (i + 1), name: f.name, contact: f.contact, phone: f.phone, email: f.email,
          address: f.address, dateContacted: '', status: 'Not contacted', rating: '',
          notes: f.notes, a: {}, createdAt: UI.nowISO(), updatedAt: UI.nowISO()
        };
      });
      var decisions = CFG.SEED_DECISIONS.map(function (d, i) {
        return {
          id: 'dec_seed' + (i + 1), ref: d.n, title: d.title, date: UI.today(), status: 'Open',
          confidence: 'Low', fact: d.fact, assumption: d.assumption, hypothesis: d.hypothesis,
          rec: d.rec, mind: d.mind, links: '', createdAt: UI.nowISO(), updatedAt: UI.nowISO()
        };
      });
      return Promise.all([
        DB.bulkPut('tasks', tasks),
        DB.bulkPut('gates', gates),
        DB.bulkPut('factories', factories),
        DB.bulkPut('decisions', decisions),
        DB.setMeta('projectStart', UI.today()),
        DB.setMeta('cost', JSON.parse(JSON.stringify(CFG.COST_DEFAULTS))),
        DB.setMeta('competitors', JSON.parse(JSON.stringify(CFG.COMPETITORS))),
        DB.setMeta('easeProfiles', JSON.parse(JSON.stringify(CFG.EASE_PRESETS))),
        DB.setMeta('seeded', true)
      ]);
    });
  }

  function migrate() {
    // keep defaults present if a key was never written
    var jobs = [];
    jobs.push(DB.meta('cost').then(function (v) { if (!v) return DB.setMeta('cost', JSON.parse(JSON.stringify(CFG.COST_DEFAULTS))); }));
    jobs.push(DB.meta('competitors').then(function (v) { if (!v) return DB.setMeta('competitors', JSON.parse(JSON.stringify(CFG.COMPETITORS))); }));
    jobs.push(DB.meta('easeProfiles').then(function (v) { if (!v) return DB.setMeta('easeProfiles', JSON.parse(JSON.stringify(CFG.EASE_PRESETS))); }));
    jobs.push(DB.meta('projectStart').then(function (v) { if (!v) return DB.setMeta('projectStart', UI.today()); }));

    /* Spec v1 (03 Oct 2026): the roadmap had "request swatches" BEFORE "rewrite the spec".
       Wrong order - you cannot request the right swatches without a spec. Swap the two task
       titles, but ONLY while both are still untouched, so a tick the founder has already
       made can never end up attached to a different task. */
    jobs.push(DB.all('tasks').then(function (ts) {
      var d2 = null, d3 = null;
      ts.forEach(function (t) { if (t.day === 2) d2 = t; if (t.day === 3) d3 = t; });
      if (!d2 || !d3) return;
      if (d2.done || d3.done) return;                       // founder has acted - leave alone
      if (d2.title !== 'Request black stretch swatches from 4 suppliers') return;  // already migrated
      d2.title = 'Rewrite fabric spec — all 8 parameters';
      d3.title = 'Request 20×20 cm swatches from 4 suppliers';
      return DB.put('tasks', d2).then(function () { return DB.put('tasks', d3); });
    }));

    /* Spec v2 (09 Oct 2026): verified every factory contact by web search, including the
       unsaved WhatsApp number +27 78 161 1995, which turned out to be Troy Textiles.
       Backfill the real phone / email / address onto the five seeded records.

       Safety: only ever write into a field the founder has left EMPTY, and only replace
       a note that is still byte-identical to the v1 seed text. Anything he has typed
       himself is untouchable. */
    jobs.push(DB.all('factories').then(function (fs) {
      var V = {
        'fac_seed1': { phone: '+27 83 608 1519', email: 'hello@amaricmt.co.za',
          address: '232 Albert Rd, Woodstock, Cape Town',
          oldNote: 'Boutique. States MOQ 75 units per style. No pattern-making or fabric sourcing in house \u2014 client supplies patterns, fabric and trims. Describes itself as "quality, not affordability".' },
        'fac_seed2': { phone: '+27 63 970 7094', email: 'hello@capetowncmt.co.za',
          address: '45 M163, Observatory, Cape Town, 7925',
          oldNote: 'Lists activewear from R210. 4\u20136 week lead time. Sample-first, small MOQ claimed.' },
        'fac_seed3': { phone: '+27 78 161 1995', email: 'norbert@troytextiles.co.za',
          address: '2 Tedric Avenue, Stikland Industrial, Cape Town, 7530', contact: 'Norbert',
          oldNote: 'Claims facility fully set up for knits and stretch materials. In-house printing and embroidery. Claim not yet verified.' },
        'fac_seed4': { phone: '+27 21 224 0290', email: '', address: 'Cape Town',
          oldNote: 'End-to-end CMT, pattern-making off-site. Specialises in knit garments \u2014 mostly cotton jersey. Stretch capability unknown.' },
        'fac_seed5': { phone: '', email: '', address: 'Woodstock, Cape Town',
          oldNote: 'Lists loungewear & underwear and seamless among categories. Worth probing on gusset and pouch construction.' }
      };
      /* the two we can prove were messaged on Sat 3 Oct 2026 */
      var CONTACTED = { 'fac_seed2': '2026-10-03', 'fac_seed3': '2026-10-03' };
      var byName = {};
      CFG.SEED_FACTORIES.forEach(function (f, i) { byName['fac_seed' + (i + 1)] = f; });

      var writes = [];
      fs.forEach(function (f) {
        var v = V[f.id], fresh = byName[f.id];
        if (!v || !fresh) return;
        var dirty = false;
        ['phone', 'email', 'address', 'contact'].forEach(function (k) {
          if (!f[k] && v[k]) { f[k] = v[k]; dirty = true; }          // empty only
          else if (!f[k] && fresh[k]) { f[k] = fresh[k]; dirty = true; }
        });
        if (f.notes === v.oldNote) { f.notes = fresh.notes; dirty = true; }  // untouched only
        if (CONTACTED[f.id] && f.status === 'Not contacted' && !f.dateContacted) {
          f.status = 'Contacted'; f.dateContacted = CONTACTED[f.id]; dirty = true;
        }
        if (dirty) { f.updatedAt = UI.nowISO(); writes.push(f); }
      });
      if (!writes.length) return;
      return DB.bulkPut('factories', writes);
    }));

    return Promise.all(jobs);
  }

  /* ---------- synthetic photo so demo mode shows the real UI ---------- */
  function fakePhoto(label, hue, meta) {
    var c = document.createElement('canvas'); c.width = 900; c.height = 1200;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 900, 1200);
    g.addColorStop(0, 'hsl(' + hue + ',12%,16%)');
    g.addColorStop(1, 'hsl(' + hue + ',14%,7%)');
    x.fillStyle = g; x.fillRect(0, 0, 900, 1200);
    x.strokeStyle = 'rgba(255,255,255,.055)'; x.lineWidth = 1;
    for (var i = 0; i < 1200; i += 45) { x.beginPath(); x.moveTo(0, i); x.lineTo(900, i); x.stroke(); }
    for (var j = 0; j < 900; j += 45) { x.beginPath(); x.moveTo(j, 0); x.lineTo(j, 1200); x.stroke(); }
    x.strokeStyle = 'rgba(127,168,217,.5)'; x.lineWidth = 3;
    x.strokeRect(80, 120, 740, 960);
    x.fillStyle = '#F2F2F0'; x.font = '600 46px -apple-system,Roboto,sans-serif';
    x.textAlign = 'center';
    x.fillText(label.slice(0, 22), 450, 600);
    x.fillStyle = '#7FA8D9'; x.font = '600 22px -apple-system,Roboto,sans-serif';
    x.fillText('DEMO IMAGE', 450, 650);
    return new Promise(function (res) {
      c.toBlob(function (b) {
        res(new File([b], 'demo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    }).then(function (file) { return Photos.ingest(file, meta); });
  }

  /* ---------- demo data ---------- */
  function demo() {
    var now = UI.nowISO();
    function d(offset) {
      var dt = new Date(); dt.setDate(dt.getDate() - offset);
      return dt.toISOString().slice(0, 10);
    }

    var facUpdates = [
      { id: 'fac_seed1', status: 'Quoted', rating: 4, dateContacted: d(9), phone: '+27 21 000 0000',
        a: { q1: { text: 'Mostly woven and jersey. Some stretch for a swimwear client.', pct: 30 },
             q2: { text: 'Two flatlock, 3-needle 5-thread.', yes: true, count: 2 },
             q3: { text: 'Yes, one coverstitch.', yes: true },
             q4: { text: 'No bonding equipment.', yes: false },
             q5: { text: 'Per size. 75 units each.', basis: 'Per size' },
             q6: { text: '75 per size.', moq: 75 },
             q7: { text: 'R950, about 10 working days.', cost: 950, days: 10 },
             q8: { text: 'Client supplies pattern. We can refer a pattern-maker.', pattern: 'I supply pattern' },
             q9: { text: 'Yes — Lindiwe, does activewear patterns.', pmName: 'Lindiwe M.', pmPhone: '+27 82 000 0000' },
             q10: { text: 'Client supplies fabric and trims.', sourcing: 'I supply' },
             q11: { text: 'Roughly R185 per unit at MOQ.', cmt: 185 },
             q12: { text: '4 weeks after sample approval.', weeks: 4 } } },
      { id: 'fac_seed2', status: 'Replied', rating: 3, dateContacted: d(9),
        a: { q1: { text: 'About half our work is stretch — gym and swim.', pct: 50 },
             q2: { text: 'One flatlock machine.', yes: true, count: 1 },
             q3: { text: 'Yes.', yes: true },
             q4: { text: 'No.', yes: false },
             q5: { text: 'Per style across sizes, if sizes are in the same fabric.', basis: 'Per style' },
             q6: { text: '50 units.', moq: 50 },
             q7: { text: 'R700, 7 days.', cost: 700, days: 7 },
             q8: { text: 'We can pattern in house.', pattern: 'They make patterns' },
             q10: { text: 'We can source locally.', sourcing: 'They can source' },
             q11: { text: 'R210 at 50 units.', cmt: 210 },
             q12: { text: '4–6 weeks.', weeks: 5 } } },
      { id: 'fac_seed3', status: 'Contacted', dateContacted: d(8), a: {} },
      { id: 'fac_seed4', status: 'Rejected', rating: 2, dateContacted: d(8),
        a: { q1: { text: 'Cotton jersey only, no elastane experience.', pct: 5 }, q2: { text: 'No.', yes: false, count: 0 } } }
    ];

    var fabrics = [
      { id: 'fab_d1', code: 'SW-001', supplier: 'Chothia Bros', name: 'Formtex Lycra', composition: '80% nylon / 20% elastane',
        statedGsm: 260, measuredGsm: 258, width: 150, pricePerM: 178, minCut: 5, leadTime: '3 days', colour: 'Black',
        notes: 'Best candidate so far. Matte, dense, recovers well.', date: d(5),
        tests: { t1: { r: 'pass' }, t2: { r: 'pass' }, t3: { r: 'pass', v: 78 }, t4: { r: 'pass', v: 96 },
                 t5: { r: 'pass', v: 1.5 }, t6: { r: 'pass' }, t7: { r: 'pass', n: 'Genuinely matte under direct light.' },
                 t8: { r: 'pass', v: 4 }, t9: { r: 'pass', v: 258 }, t10: { r: 'pass' } } },
      { id: 'fab_d2', code: 'SW-002', supplier: 'Active Fabrics (Elsiesrivier)', name: 'Nylon spandex plain', composition: '78% nylon / 22% elastane',
        statedGsm: 190, measuredGsm: 188, width: 150, pricePerM: 132, minCut: 3, leadTime: 'In stock', colour: 'Black',
        notes: 'Too light. Greys out over the glute at full extension — exactly the failure mode we were warned about.', date: d(5),
        tests: { t1: { r: 'fail', n: 'Text readable at 50% stretch.' }, t2: { r: 'fail' }, t3: { r: 'pass', v: 88 },
                 t4: { r: 'pass', v: 105 }, t5: { r: 'pass', v: 2 }, t6: { r: 'pass' }, t7: { r: 'pass' },
                 t8: { r: 'pass', v: 4 }, t9: { r: 'fail', v: 188 }, t10: { r: 'pass' } } },
      { id: 'fab_d3', code: 'SW-003', supplier: 'SK Textiles', name: 'Heavy swim knit', composition: '82% poly / 18% elastane',
        statedGsm: 240, measuredGsm: 244, width: 148, pricePerM: 149, minCut: 10, leadTime: '1 week', colour: 'Black',
        notes: 'Opaque but has a sheen. Reads sportswear, not luxury. Fails the brand brief on surface.', date: d(4),
        tests: { t1: { r: 'pass' }, t2: { r: 'pass' }, t3: { r: 'pass', v: 65 }, t4: { r: 'pass', v: 82 },
                 t5: { r: 'pass', v: 2.5 }, t6: { r: 'pass' }, t7: { r: 'fail', n: 'Visible sheen. Rejected on aesthetics.' },
                 t8: { r: 'pass', v: 3 }, t9: { r: 'pass', v: 244 }, t10: { r: 'pass' } } }
    ];

    var bodyset = {
      id: 'body_d1', date: d(6), subject: 'Fit body A (founder)', mass: 78, height: 179,
      notes: 'Measured bare skin, morning, before training. Low waist marked with tape 4 cm below navel.',
      m: { waistNatural: 82, waistLow: 86, hipHigh: 92, hipFull: 99, thighUpper: 58.5, thighMid: 52,
           knee: 38.5, calfMax: 38, ankle: 23.5, riseFront: 25.5, riseBack: 35, riseTotal: 66,
           inseam: 81, outseam: 104, waistToKnee: 60, kneeToAnkle: 42, crotchDepth: 26 },
      createdAt: now, updatedAt: now
    };

    var fit = {
      id: 'fit_d1', date: d(1), patternVersion: 'v1 toile', garmentCode: 'NOKT-01 ALPHA T1',
      fabricId: 'fab_d1', fitModel: 'Fit body A', verdict: 'Major corrections',
      notes: 'First toile. Posterior closure seam reads well and the inner thigh is clean. Front volume is the problem.',
      issues: [
        { id: 'i1', zone: 'Genital region', type: 'Too tight', severity: 5, desc: 'Flattening under load. This is the "smushed" failure we set out to solve.', fix: 'Add 12 mm vertical volume to the gusset apex; rotate grain on the centre front panel.' },
        { id: 'i2', zone: 'Waistband', type: 'Rolling down', severity: 4, desc: 'Rolls within 20 minutes of walking.', fix: 'Raise front rise 15 mm, add internal elastic tape.' },
        { id: 'i3', zone: 'Glute', type: 'Wrinkling / pooling', severity: 3, desc: 'Horizontal pooling under the seat.', fix: 'Shorten back rise 8 mm, increase back-panel curvature.' },
        { id: 'i4', zone: 'Calf', type: 'Twisting / torque', severity: 2, desc: 'Posterior seam drifts ~8 mm laterally when walking.', fix: 'Check grain alignment on back panel.' },
        { id: 'i5', zone: 'Inner thigh', type: 'Seam pressure', severity: 2, desc: 'Gusset corner felt when seated.', fix: 'Round the gusset corner, move to flatlock.' }
      ],
      createdAt: now, updatedAt: now
    };

    var wear = {
      id: 'wear_d1', date: d(1), garmentCode: 'NOKT-01 ALPHA T1', duration: 8,
      activities: ['Walking', 'Gym / lifting', 'Seated work'], temp: 24, underwear: 'Without',
      checkins: [
        { id: 'c1', h: 0, comfort: 5, support: 4, discretion: 4, temperature: 5, waistband: 5, notes: 'Excellent first impression.' },
        { id: 'c2', h: 2, comfort: 4, support: 3, discretion: 4, temperature: 4, waistband: 3, notes: 'Waistband starting to move.' },
        { id: 'c3', h: 4, comfort: 3, support: 3, discretion: 3, temperature: 4, waistband: 2, notes: 'Rolling at centre front after gym.' },
        { id: 'c4', h: 8, comfort: 2, support: 2, discretion: 3, temperature: 4, waistband: 2, notes: 'Front compression became the dominant complaint.' }
      ],
      failures: [
        { id: 'f1', loc: 'Waistband', what: 'Roll-down at centre front', hour: 2, sev: 4 },
        { id: 'f2', loc: 'Gusset apex', what: 'Compression discomfort, worsening', hour: 4, sev: 5 }
      ],
      again: 'No', worst: 'Front compression. Confirms accommodation must outrank support.',
      best: 'Opacity held completely, including deep squats. Fabric choice is correct.',
      createdAt: now, updatedAt: now
    };

    var doneDays = [1, 2, 3, 4, 5, 6, 7, 8, 12, 13];

    return DB.all('factories').then(function (facs) {
      var byId = {}; facs.forEach(function (f) { byId[f.id] = f; });
      var updated = facUpdates.map(function (u) {
        var f = byId[u.id] || { id: u.id, name: u.id, a: {} };
        Object.keys(u).forEach(function (k) { f[k] = u[k]; });
        f.updatedAt = UI.nowISO();
        return f;
      });
      return DB.bulkPut('factories', updated);
    })
      .then(function () { return DB.bulkPut('fabrics', fabrics.map(function (f) { f.createdAt = now; f.updatedAt = now; return f; })); })
      .then(function () { return DB.put('bodysets', bodyset); })
      .then(function () { return DB.put('fitsessions', fit); })
      .then(function () { return DB.put('weartests', wear); })
      .then(function () { return DB.all('tasks'); })
      .then(function (tasks) {
        tasks.forEach(function (t) {
          if (doneDays.indexOf(t.day) >= 0) { t.done = true; }
          if (t.day === 1) t.notes = 'Sent to all five on WhatsApp. Two replied same day.';
          if (t.day === 8) t.notes = 'SW-002 rejected on opacity. SW-003 rejected on sheen.';
        });
        return DB.bulkPut('tasks', tasks);
      })
      .then(function () { return DB.all('decisions'); })
      .then(function (decs) {
        var q3 = decs.filter(function (d) { return d.ref === 'Q3'; })[0];
        if (q3) {
          q3.status = 'Resolved'; q3.confidence = 'Medium';
          q3.rec = 'Nylon/elastane warp knit, 258 gsm measured, matte, 150 cm, 78% lengthwise / 96% crosswise extension, 1.5% growth. SW-001 from Chothia Bros.';
          return DB.put('decisions', q3);
        }
      })
      .then(function () {
        // a handful of real (generated) photos so the photo UI is populated
        return [
          fakePhoto('Front standing', 215, { module: 'fit', parentId: 'fit_d1', slot: 'Front standing' }),
          fakePhoto('Back standing', 215, { module: 'fit', parentId: 'fit_d1', slot: 'Back standing' }),
          fakePhoto('Squat (back)', 10, { module: 'fit', parentId: 'fit_d1', slot: 'Squat (back)' }),
          fakePhoto('Waistband', 40, { module: 'fit', parentId: 'fit_d1', slot: 'Waistband' }),
          fakePhoto('SW-001 opacity', 215, { module: 'fabrics', parentId: 'fab_d1', slot: 'Opacity under stretch' }),
          fakePhoto('SW-002 FAIL', 0, { module: 'fabrics', parentId: 'fab_d2', slot: 'Opacity under stretch' }),
          fakePhoto('Machine floor', 150, { module: 'factories', parentId: 'fac_seed1', slot: '' })
        ].reduce(function (p, job) { return p.then(function () { return job; }); }, Promise.resolve());
      })
      .then(function () { return DB.setMeta('demoLoaded', true); });
  }

  function clearAll() {
    return DB.nuke().then(function () { return DB.setMeta('seeded', false); }).then(ensure);
  }

  return { ensure: ensure, migrate: migrate, demo: demo, clearAll: clearAll };
})();
