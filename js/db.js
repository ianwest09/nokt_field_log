/* Promise-wrapped IndexedDB. No libraries. */
var DB = (function () {
  var NAME = 'nokt-field-log', VER = 1, db = null, blocked = false, failReason = '';

  var STORES = {
    meta: { key: 'k' },
    tasks: { key: 'id', idx: [['week', 'week']] },
    gates: { key: 'id' },
    factories: { key: 'id', idx: [['updatedAt', 'updatedAt']] },
    fabrics: { key: 'id', idx: [['updatedAt', 'updatedAt']] },
    bodysets: { key: 'id', idx: [['date', 'date']] },
    fitsessions: { key: 'id', idx: [['date', 'date']] },
    weartests: { key: 'id', idx: [['date', 'date']] },
    decisions: { key: 'id', idx: [['status', 'status']] },
    photos: { key: 'id', idx: [['parentId', 'parentId'], ['module', 'module'], ['createdAt', 'createdAt']] },
    blobs: { key: 'id' }
  };
  var RECORD_STORES = ['tasks', 'gates', 'factories', 'fabrics', 'bodysets', 'fitsessions', 'weartests', 'decisions'];

  function open() {
    if (db) return Promise.resolve(db);
    return new Promise(function (res, rej) {
      if (!self.indexedDB) { blocked = true; failReason = 'This browser has no IndexedDB available.'; return rej(new Error(failReason)); }
      var req;
      try { req = indexedDB.open(NAME, VER); }
      catch (e) { blocked = true; failReason = e.message; return rej(e); }

      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        Object.keys(STORES).forEach(function (name) {
          var cfg = STORES[name], s;
          if (!d.objectStoreNames.contains(name)) s = d.createObjectStore(name, { keyPath: cfg.key });
          else s = e.target.transaction.objectStore(name);
          (cfg.idx || []).forEach(function (ix) {
            if (!s.indexNames.contains(ix[0])) s.createIndex(ix[0], ix[1], { unique: false });
          });
        });
      };
      req.onsuccess = function () { db = req.result; db.onversionchange = function () { db.close(); db = null; }; res(db); };
      req.onerror = function () {
        blocked = true;
        failReason = (req.error && req.error.message) || 'IndexedDB was blocked.';
        rej(req.error || new Error(failReason));
      };
      req.onblocked = function () { rej(new Error('Database blocked by another open tab.')); };
    });
  }

  function tx(store, mode) {
    return open().then(function (d) {
      return d.transaction(store, mode || 'readonly').objectStore(store);
    });
  }
  function wrap(request) {
    return new Promise(function (res, rej) {
      request.onsuccess = function () { res(request.result); };
      request.onerror = function () { rej(request.error); };
    });
  }

  function get(store, id) { return tx(store).then(function (s) { return wrap(s.get(id)); }); }
  function all(store) { return tx(store).then(function (s) { return wrap(s.getAll()); }); }
  function count(store) { return tx(store).then(function (s) { return wrap(s.count()); }); }
  function put(store, obj) {
    return tx(store, 'readwrite').then(function (s) { return wrap(s.put(obj)); })
      .catch(function (e) { throw annotate(e); });
  }
  function bulkPut(store, arr) {
    if (!arr.length) return Promise.resolve();
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(store, 'readwrite'), s = t.objectStore(store);
        arr.forEach(function (o) { s.put(o); });
        t.oncomplete = function () { res(); };
        t.onerror = function () { rej(annotate(t.error)); };
        t.onabort = function () { rej(annotate(t.error)); };
      });
    });
  }
  function del(store, id) { return tx(store, 'readwrite').then(function (s) { return wrap(s.delete(id)); }); }
  function clear(store) { return tx(store, 'readwrite').then(function (s) { return wrap(s.clear()); }); }
  function byIndex(store, index, value) {
    return tx(store).then(function (s) { return wrap(s.index(index).getAll(value)); });
  }

  function annotate(e) {
    if (!e) return new Error('Unknown storage error');
    if (e.name === 'QuotaExceededError' || /quota/i.test(e.message || '')) {
      var err = new Error('Device storage is full. Export a backup, then delete some photos.');
      err.quota = true; return err;
    }
    return e;
  }

  function meta(key, dflt) {
    return get('meta', key).then(function (r) { return r === undefined ? dflt : r.v; });
  }
  function setMeta(key, v) { return put('meta', { k: key, v: v }); }

  function uid(prefix) {
    return (prefix || 'r') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* clear every store except nothing — used by "Clear all data" */
  function nuke() {
    return open().then(function (d) {
      var names = Object.keys(STORES);
      return new Promise(function (res, rej) {
        var t = d.transaction(names, 'readwrite');
        names.forEach(function (n) { t.objectStore(n).clear(); });
        t.oncomplete = res; t.onerror = function () { rej(t.error); };
      });
    });
  }

  function estimate() {
    if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate();
    return Promise.resolve({ usage: 0, quota: 0 });
  }

  return {
    open: open, get: get, all: all, put: put, del: del, clear: clear, count: count,
    bulkPut: bulkPut, byIndex: byIndex, meta: meta, setMeta: setMeta, uid: uid,
    nuke: nuke, estimate: estimate, STORES: STORES, RECORD_STORES: RECORD_STORES,
    status: function () { return { blocked: blocked, reason: failReason }; }
  };
})();
