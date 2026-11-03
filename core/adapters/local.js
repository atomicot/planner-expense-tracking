/* LocalAdapter — everything lives in this browser's localStorage under one key.
   Several local profiles can share "teams" on this device; other tabs update live via the storage event. */
App.LocalAdapter = (() => {
  const KEY = 'pp:v1';
  const KINDS = ['activities', 'transactions', 'categories'];
  const empty = () => ({ version: 1, profiles: {}, creds: {}, session: null, teams: {}, records: {} });

  function create() {
    let db = load();
    const watchers = new Map(); // scopeKey -> Set<cb>
    const teamWatchers = new Set(); // { uid, cb }

    function load() {
      try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return empty(); }
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {
        App.ui.toast(App.i18n.t('storageFull'));
        throw e;
      }
    }
    const key = (scope) => `${scope.type === 'team' ? 't' : 'u'}:${scope.id}`;
    function bucket(scope) {
      const k = key(scope);
      if (!db.records[k]) db.records[k] = { activities: {}, transactions: {}, categories: {} };
      return db.records[k];
    }
    const list = (scope, kind) => Object.values(bucket(scope)[kind] || {});
    function notify(scope, kind) {
      const set = watchers.get(key(scope));
      if (!set) return;
      const kinds = kind ? [kind] : KINDS;
      set.forEach((cb) => kinds.forEach((k) => cb(k, list(scope, k))));
    }
    function notifyTeams() {
      teamWatchers.forEach((w) => w.cb(myTeams(w.uid)));
    }
    const myTeams = (uid) => Object.values(db.teams).filter((t) => t.memberIds.includes(uid)).map((t) => ({ ...t }));

    async function hash(pw, salt) {
      const text = `${salt}:${pw}`;
      if (crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
      }
      let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
      return 'd' + (h >>> 0).toString(16);
    }

    // Another tab changed the data → reload and push to every watcher.
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY) return;
      db = load();
      watchers.forEach((set, k) => {
        const [t, id] = [k[0], k.slice(2)];
        notify({ type: t === 't' ? 'team' : 'personal', id });
      });
      notifyTeams();
      if (adapter.onExternalChange) adapter.onExternalChange();
    });

    const err = (code) => { const e = new Error(code); e.code = code; return e; };

    const adapter = {
      kind: 'local',
      async init() {
        return db.session && db.profiles[db.session] ? { ...db.profiles[db.session] } : null;
      },
      async signUp({ name, email, password }) {
        email = email.trim().toLowerCase();
        if (Object.values(db.profiles).some((p) => p.email === email)) throw err('auth/email-already-in-use');
        const id = App.util.uid();
        const salt = App.util.uid(8);
        db.profiles[id] = { id, name: name.trim(), email, theme: App.DEFAULT_THEME, mode: 'auto', lang: App.prefs.get().lang, createdAt: Date.now() };
        db.creds[id] = { salt, hash: await hash(password, salt) };
        db.session = id;
        save();
        return { ...db.profiles[id] };
      },
      async signIn({ email, password }) {
        email = email.trim().toLowerCase();
        const p = Object.values(db.profiles).find((x) => x.email === email);
        if (!p) throw err('auth/invalid-credential');
        const c = db.creds[p.id];
        if (!c || (await hash(password, c.salt)) !== c.hash) throw err('auth/invalid-credential');
        db.session = p.id;
        save();
        return { ...p };
      },
      async signOut() { db.session = null; save(); },
      async updateProfile(uid, patch) {
        db.profiles[uid] = { ...db.profiles[uid], ...patch };
        if (patch.name) Object.values(db.teams).forEach((t) => { if (t.memberNames[uid]) t.memberNames[uid] = patch.name; });
        save();
        if (patch.name) notifyTeams();
        return { ...db.profiles[uid] };
      },
      localProfiles() { return Object.values(db.profiles).map((p) => ({ id: p.id, name: p.name, email: p.email })); },

      // ---- teams ----
      watchTeams(uid, cb) {
        const w = { uid, cb };
        teamWatchers.add(w);
        cb(myTeams(uid));
        return () => teamWatchers.delete(w);
      },
      async createTeam(user, name) {
        const id = App.util.uid();
        db.teams[id] = { id, name: name.trim(), ownerId: user.id, memberIds: [user.id], memberNames: { [user.id]: user.name }, createdAt: Date.now() };
        save(); notifyTeams();
        return { ...db.teams[id] };
      },
      async joinTeam(user, code) {
        const t = db.teams[code];
        if (!t) throw err('team/not-found');
        if (t.memberIds.includes(user.id)) throw err('team/already-member');
        t.memberIds.push(user.id);
        t.memberNames[user.id] = user.name;
        save(); notifyTeams();
        return { ...t };
      },
      async leaveTeam(user, id) {
        const t = db.teams[id];
        if (!t) return;
        t.memberIds = t.memberIds.filter((m) => m !== user.id);
        delete t.memberNames[user.id];
        save(); notifyTeams();
      },
      async removeMember(teamId, uid) {
        const t = db.teams[teamId];
        t.memberIds = t.memberIds.filter((m) => m !== uid);
        delete t.memberNames[uid];
        save(); notifyTeams();
      },
      async deleteTeam(id) {
        delete db.teams[id];
        delete db.records[`t:${id}`];
        save(); notifyTeams();
      },

      // ---- records ----
      watch(scope, cb) {
        const k = key(scope);
        if (!watchers.has(k)) watchers.set(k, new Set());
        watchers.get(k).add(cb);
        KINDS.forEach((kind) => cb(kind, list(scope, kind)));
        return { ready: Promise.resolve(), unsub: () => watchers.get(k) && watchers.get(k).delete(cb) };
      },
      async add(scope, kind, doc) { bucket(scope)[kind][doc.id] = doc; save(); notify(scope, kind); },
      async addMany(scope, kind, docs) { const b = bucket(scope)[kind]; docs.forEach((d) => { b[d.id] = d; }); save(); notify(scope, kind); },
      async update(scope, kind, id, patch) {
        const b = bucket(scope)[kind];
        if (!b[id]) return;
        b[id] = { ...b[id], ...patch };
        save(); notify(scope, kind);
      },
      async remove(scope, kind, id) { delete bucket(scope)[kind][id]; save(); notify(scope, kind); },
      async clearScope(scope) { db.records[key(scope)] = { activities: {}, transactions: {}, categories: {} }; save(); notify(scope); },
    };
    return adapter;
  }

  return { create };
})();
