/* NOKT FIELD LOG — camera capture, compression, thumbnails, lightbox. */
var Photos = (function () {

  var MAX_EDGE = 1600, QUALITY = 0.8, THUMB_EDGE = 200, THUMB_Q = 0.7;
  var urlCache = new Map();   // id -> objectURL (thumbnails, kept for session)
  var fullCache = new Map();  // id -> objectURL (revoked on lightbox close)

  /* ---------- decode + compress ---------- */
  function loadBitmap(file) {
    if (self.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(function () { return createImageBitmap(file); })
        .catch(fallback);
    }
    return fallback();
    function fallback() {
      return new Promise(function (res, rej) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); res(img); };
        img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not read that image.')); };
        img.src = url;
      });
    }
  }
  function toCanvasBlob(bmp, maxEdge, quality) {
    var w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    var scale = Math.min(1, maxEdge / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, cw, ch);
    return new Promise(function (res) {
      c.toBlob(function (b) { res({ blob: b, w: cw, h: ch }); }, 'image/jpeg', quality);
    });
  }

  function ingest(file, meta) {
    return loadBitmap(file).then(function (bmp) {
      return toCanvasBlob(bmp, MAX_EDGE, QUALITY).then(function (full) {
        return toCanvasBlob(bmp, THUMB_EDGE, THUMB_Q).then(function (thumb) {
          if (bmp.close) bmp.close();
          var id = DB.uid('ph');
          var rec = {
            id: id, module: meta.module || '', parentId: meta.parentId || '', slot: meta.slot || '',
            caption: meta.caption || '', tags: meta.tags || [], createdAt: UI.nowISO(),
            w: full.w, h: full.h, size: full.blob.size, thumb: thumb.blob
          };
          return DB.put('blobs', { id: id, blob: full.blob })
            .then(function () { return DB.put('photos', rec); })
            .then(function () { return rec; });
        });
      });
    });
  }

  /* ---------- picking ---------- */
  function openPicker(opts) {
    return new Promise(function (res) {
      var inp = UI.el('input', {
        type: 'file', accept: 'image/*', style: 'position:fixed;left:-9999px;opacity:0;width:1px;height:1px'
      });
      if (opts.camera) inp.setAttribute('capture', 'environment');
      if (opts.multiple) inp.multiple = true;
      document.body.appendChild(inp);
      var done = false;
      inp.addEventListener('change', function () {
        done = true;
        var files = [].slice.call(inp.files || []);
        inp.remove();
        res(files);
      });
      // if the user cancels there is no reliable event; clean up on next focus
      window.addEventListener('focus', function cleanup() {
        window.removeEventListener('focus', cleanup);
        setTimeout(function () { if (!done) { inp.remove(); res([]); } }, 800);
      });
      inp.click();
    });
  }

  function pick(meta) {
    return new Promise(function (resolve) {
      var close = UI.sheet({
        title: 'Add photo' + (meta.slot ? ' — ' + meta.slot : ''),
        body: UI.el('div', { class: 'sub', text: 'Images are resized to 1600 px and compressed before they are stored, so they do not fill the phone.' }),
        actions: [
          { label: 'Take photo', cls: 'pri', onClick: function () { run({ camera: true, multiple: false }); } },
          { label: 'Choose from gallery', cls: '', onClick: function () { run({ camera: false, multiple: !meta.slot }); } },
          { label: 'Cancel', cls: 'ghost', onClick: function () { resolve([]); } }
        ],
        onClose: function () { }
      });
      function run(o) {
        openPicker(o).then(function (files) {
          if (!files.length) return resolve([]);
          var killToast = UI.toast(files.length > 1 ? 'Processing ' + files.length + ' photos…' : 'Processing photo…');
          var out = [], chain = Promise.resolve();
          files.forEach(function (f) {
            chain = chain.then(function () {
              return ingest(f, meta).then(function (rec) { out.push(rec.id); })
                .catch(function (e) {
                  console.error(e);
                  UI.toast(e.quota ? e.message : 'One photo failed to save.', { type: 'bad', ms: 6000 });
                });
            });
          });
          chain.then(function () {
            killToast();
            if (out.length) UI.toast(out.length + ' photo' + (out.length > 1 ? 's' : '') + ' saved', { type: 'good' });
            resolve(out);
          });
        });
      }
    });
  }

  /* ---------- reads ---------- */
  function forParent(parentId) {
    return DB.byIndex('photos', 'parentId', parentId).then(function (r) {
      return r.sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; });
    });
  }
  function all() {
    return DB.all('photos').then(function (r) {
      return r.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    });
  }
  function countFor(parentId) { return forParent(parentId).then(function (r) { return r.length; }); }

  function thumbURL(rec) {
    if (urlCache.has(rec.id)) return urlCache.get(rec.id);
    var u = rec.thumb ? URL.createObjectURL(rec.thumb) : '';
    urlCache.set(rec.id, u);
    return u;
  }
  function fullURL(id) {
    if (fullCache.has(id)) return Promise.resolve(fullCache.get(id));
    return DB.get('blobs', id).then(function (b) {
      if (!b) return '';
      var u = URL.createObjectURL(b.blob);
      fullCache.set(id, u);
      return u;
    });
  }
  function del(id) {
    if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); }
    if (fullCache.has(id)) { URL.revokeObjectURL(fullCache.get(id)); fullCache.delete(id); }
    return DB.del('photos', id).then(function () { return DB.del('blobs', id); });
  }
  function delMany(ids) {
    return ids.reduce(function (p, id) { return p.then(function () { return del(id); }); }, Promise.resolve());
  }

  /* ---------- widgets ---------- */
  /* Free-form strip with an add button */
  function strip(o) {
    var box = UI.el('div', { class: 'ph-strip' });
    function render() {
      UI.clear(box);
      forParent(o.parentId).then(function (list) {
        if (o.slot) list = list.filter(function (p) { return p.slot === o.slot; });
        else if (o.excludeSlots) list = list.filter(function (p) { return !p.slot; });
        list.forEach(function (rec, i) {
          var cell = UI.el('button', {
            class: 'ph', type: 'button', 'aria-label': 'View photo',
            onclick: function () { lightbox(list.map(function (x) { return x.id; }), i, { onChange: render }); }
          }, [UI.el('img', { src: thumbURL(rec), alt: rec.caption || 'Photo', loading: 'lazy' })]);
          box.appendChild(cell);
        });
        box.appendChild(UI.el('button', {
          class: 'ph-add', type: 'button', onclick: function () {
            pick({ module: o.module, parentId: o.parentId, slot: o.slot || '' }).then(function (ids) {
              if (ids.length) { render(); o.onChange && o.onChange(); }
            });
          }
        }, [UI.icon('camera', 19), UI.el('span', { text: 'Add' })]));
      });
    }
    render();
    box.refresh = render;
    return box;
  }

  /* Fixed named slots — shows which are still missing */
  function slots(o) {
    var wrap = UI.el('div', {});
    var grid = UI.el('div', { class: 'ph-slots' });
    var status = UI.el('div', { class: 'f-hint' });
    wrap.appendChild(status); wrap.appendChild(grid);
    function render() {
      UI.clear(grid);
      forParent(o.parentId).then(function (list) {
        var bySlot = {};
        list.forEach(function (p) { if (p.slot) bySlot[p.slot] = p; });
        var missing = 0;
        o.slots.forEach(function (name) {
          var rec = bySlot[name];
          if (!rec) missing++;
          var cell = UI.el('button', {
            class: 'ph-slot' + (rec ? '' : ' miss'), type: 'button',
            'aria-label': name + (rec ? '' : ' — missing'),
            onclick: function () {
              if (rec) {
                var ids = o.slots.map(function (n) { return bySlot[n] && bySlot[n].id; }).filter(Boolean);
                lightbox(ids, ids.indexOf(rec.id), { onChange: render });
              } else {
                pick({ module: o.module, parentId: o.parentId, slot: name }).then(function (ids) {
                  if (ids.length) { render(); o.onChange && o.onChange(); }
                });
              }
            }
          });
          if (rec) cell.appendChild(UI.el('img', { src: thumbURL(rec), alt: name, loading: 'lazy' }));
          else cell.appendChild(UI.el('span', { class: 'plus' }, [UI.icon('plus', 20)]));
          cell.appendChild(UI.el('span', { class: 'sl', text: name }));
          grid.appendChild(cell);
        });
        status.textContent = missing === 0
          ? 'All ' + o.slots.length + ' required shots captured.'
          : missing + ' of ' + o.slots.length + ' still missing.';
        status.style.color = missing === 0 ? 'var(--pass)' : 'var(--dim2)';
      });
    }
    render();
    wrap.refresh = render;
    return wrap;
  }

  /* ---------- lightbox with pinch-zoom + swipe ---------- */
  function lightbox(ids, start, opts) {
    opts = opts || {};
    if (!ids.length) return;
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lb-img');
    var stage = document.getElementById('lb-stage');
    var idx = start || 0;
    var scale = 1, tx = 0, ty = 0;

    box.hidden = false;
    document.body.style.overflow = 'hidden';

    function apply() { img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; }
    function reset() { scale = 1; tx = 0; ty = 0; apply(); }
    function show() {
      reset();
      document.getElementById('lb-count').textContent = (idx + 1) + ' / ' + ids.length;
      img.src = '';
      fullURL(ids[idx]).then(function (u) { img.src = u; });
      DB.get('photos', ids[idx]).then(function (r) {
        document.getElementById('lb-cap').textContent = r ? [r.slot, r.caption].filter(Boolean).join(' · ') : '';
      });
    }
    show();

    var pts = new Map(), startDist = 0, startScale = 1, startMid = null, panStart = null, swipeX = 0;
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function onDown(e) {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      stage.setPointerCapture(e.pointerId);
      if (pts.size === 2) {
        var p = [].concat(Array.from(pts.values()));
        startDist = dist(p[0], p[1]); startScale = scale;
        startMid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      } else if (pts.size === 1) {
        panStart = { x: e.clientX - tx, y: e.clientY - ty }; swipeX = e.clientX;
      }
    }
    function onMove(e) {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var p = Array.from(pts.values());
      if (p.length === 2 && startDist) {
        scale = Math.min(6, Math.max(1, startScale * dist(p[0], p[1]) / startDist));
        if (scale === 1) { tx = 0; ty = 0; }
        apply();
      } else if (p.length === 1 && panStart && scale > 1) {
        tx = e.clientX - panStart.x; ty = e.clientY - panStart.y; apply();
      }
    }
    function onUp(e) {
      var was = pts.get(e.pointerId);
      pts.delete(e.pointerId);
      if (pts.size === 0) {
        if (scale <= 1.02 && was) {
          var dx = e.clientX - swipeX;
          if (Math.abs(dx) > 60 && ids.length > 1) {
            idx = (idx + (dx < 0 ? 1 : -1) + ids.length) % ids.length;
            show(); return;
          }
        }
        startDist = 0; panStart = null;
      }
    }
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);

    var dbl = 0;
    img.onclick = function () {
      var t = Date.now();
      if (t - dbl < 300) { scale = scale > 1 ? 1 : 2.5; tx = 0; ty = 0; apply(); }
      dbl = t;
    };

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      fullCache.forEach(function (u) { URL.revokeObjectURL(u); });
      fullCache.clear();
      window.removeEventListener('popstate', onPop);
      opts.onClose && opts.onClose();
    }
    function onPop() { close(); }
    window.addEventListener('popstate', onPop);

    box.querySelector('.lb-x').onclick = close;
    box.querySelector('.lb-del').onclick = function () {
      UI.confirm('Delete this photo?', 'It cannot be recovered unless you have a backup.', 'Delete', true).then(function (ok) {
        if (!ok) return;
        var gone = ids[idx];
        del(gone).then(function () {
          ids.splice(idx, 1);
          opts.onChange && opts.onChange();
          if (!ids.length) { close(); return; }
          idx = Math.min(idx, ids.length - 1);
          show();
        });
      });
    };
    UI.clear(box.querySelector('.lb-x')).appendChild(UI.icon('x', 24));
    UI.clear(box.querySelector('.lb-del')).appendChild(UI.icon('trash', 21));
  }

  function storageInfo() {
    return DB.estimate().then(function (e) {
      var usage = e.usage || 0, quota = e.quota || 0;
      return { usage: usage, quota: quota, pct: quota ? (usage / quota * 100) : 0 };
    });
  }

  return {
    pick: pick, ingest: ingest, forParent: forParent, all: all, countFor: countFor,
    thumbURL: thumbURL, fullURL: fullURL, del: del, delMany: delMany,
    strip: strip, slots: slots, lightbox: lightbox, storageInfo: storageInfo
  };
})();
