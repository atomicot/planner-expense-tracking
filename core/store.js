/* Store: picks an adapter (local or Firebase), caches data per scope, emits change events.
   Modules only talk to App.store — never to localStorage or Firestore directly. */
App.store = (() => {
  const listeners = {};
  const cache = new Map(); // scopeKey -> { activities, transactions, categories, ready, unsub }
  let teamsUnsub = null;

  const s = {
    adapter: null,
    mode: 'local',
    user: null,
    teams: [],
    scope: null,

    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    emit(evt, payload) { (listeners[evt] || []).forEach((fn) => fn(payload)); },

    scopeKey(scope = s.scope) { return `${scope.type === 'team' ? 't' : 'u'}:${scope.id}`; },
    isTeam(scope = s.scope) { return scope && scope.type === 'team'; },
    team(id = s.scope && s.scope.id) { return s.teams.find((t) => t.id === id) || null; },
    scopeName(scope = s.scope) {
      if (!scope || scope.type === 'personal') return App.i18n.t('personal');
      const t = s.team(scope.id);
      return t ? t.name : '…';
    },

    async init() {
      const cfg = window.FIREBASE_CONFIG || {};
      // ?mode=local forces Local Storage even when Firebase is configured (handy for testing).
      const forceLocal = new URLSearchParams(location.search).get('mode') === 'local';
      if (cfg.apiKey && cfg.projectId && App.FirebaseAdapter && !forceLocal) {
        try {
          s.adapter = await App.FirebaseAdapter.create(cfg);
          s.mode = 'firebase';
        } catch (e) {
          console.error('Firebase failed to start, falling back to local storage', e);
          s.adapter = App.LocalAdapter.create();
          s.mode = 'local';
        }
      } else {
        s.adapter = App.LocalAdapter.create();
        s.mode = 'local';
      }
      s.adapter.onExternalChange = () => s.emit('data', null);
      const user = await s.adapter.init();
      if (user) await s.afterLogin(user);
      return user;
    },

    async afterLogin(user) {
      s.user = user;
      App.prefs.fromUser(user);
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem('pp:scope') || 'null'); } catch (e) { /* ignore */ }
      s.scope = { type: 'personal', id: user.id };
      if (teamsUnsub) teamsUnsub();
      await new Promise((resolve) => {
        let first = true;
        teamsUnsub = s.adapter.watchTeams(user.id, (teams) => {
          s.teams = teams.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          if (s.scope.type === 'team' && !s.team(s.scope.id)) s.setScope({ type: 'personal', id: user.id });
          if (first) { first = false; resolve(); } else s.emit('teams', s.teams);
        });
      });
      if (saved && saved.type === 'team' && s.team(saved.id)) s.scope = saved;
    },

    async signUp(data) { const u = await s.adapter.signUp(data); await s.afterLogin(u); return u; },
    async signIn(data) { const u = await s.adapter.signIn(data); await s.afterLogin(u); return u; },
    async signOut() {
      if (teamsUnsub) { teamsUnsub(); teamsUnsub = null; }
      cache.forEach((c) => c.unsub && c.unsub());
      cache.clear();
      await s.adapter.signOut();
      s.user = null; s.teams = []; s.scope = null;
      sessionStorage.removeItem('pp:scope');
    },
    async updateProfile(patch) {
      s.user = await s.adapter.updateProfile(s.user.id, patch);
      return s.user;
    },

    setScope(scope) {
      s.scope = scope;
      sessionStorage.setItem('pp:scope', JSON.stringify(scope));
      s.emit('scope', scope);
    },

    // ---- data per scope ----
    async ensure(scope = s.scope) {
      const key = s.scopeKey(scope);
      let c = cache.get(key);
      if (!c) {
        c = { activities: [], transactions: [], categories: [] };
        cache.set(key, c);
        const w = s.adapter.watch(scope, (kind, docs) => {
          c[kind] = docs;
          if (c.loaded) s.emit('data', scope);
        });
        c.unsub = w.unsub;
        c.ready = w.ready.then(() => { c.loaded = true; });
      }
      await c.ready;
      return c;
    },
    data(scope = s.scope) { return cache.get(s.scopeKey(scope)) || { activities: [], transactions: [], categories: [] }; },
    dropScope(scope) {
      const key = s.scopeKey(scope);
      const c = cache.get(key);
      if (c && c.unsub) c.unsub();
      cache.delete(key);
    },

    categories(kind, scope = s.scope) {
      const custom = s.data(scope).categories || [];
      return App.DEFAULT_CATEGORIES.concat(custom).filter((c) => !kind || c.kind === kind).map((c) => ({ ...c, color: App.color(c.color) }));
    },
    cat(id, scope = s.scope) {
      return s.categories(null, scope).find((c) => c.id === id)
        || { id, kind: 'activity', key: 'cat.other', emoji: '•', color: '#b8c0cc' };
    },
    catName(c) { return c.key ? App.i18n.t(c.key) : c.name; },

    memberName(uid) {
      if (s.user && uid === s.user.id) return s.user.name;
      const t = s.team();
      return (t && t.memberNames && t.memberNames[uid]) || '—';
    },

    // ---- writes (current scope unless given) ----
    async add(kind, obj, scope = s.scope) {
      const doc = { id: App.util.uid(), createdBy: s.user.id, createdAt: Date.now(), ...obj };
      await s.adapter.add(scope, kind, doc);
      return doc;
    },
    async addMany(kind, list, scope = s.scope) {
      const docs = list.map((o) => ({ id: App.util.uid(), createdBy: s.user.id, createdAt: Date.now(), ...o }));
      await s.adapter.addMany(scope, kind, docs);
      return docs;
    },
    update(kind, id, patch, scope = s.scope) { return s.adapter.update(scope, kind, id, { ...patch, updatedAt: Date.now() }); },
    remove(kind, id, scope = s.scope) { return s.adapter.remove(scope, kind, id); },
    clearScope(scope = s.scope) { return s.adapter.clearScope(scope); },

    // ---- teams ----
    createTeam(name) { return s.adapter.createTeam(s.user, name); },
    joinTeam(code) { return s.adapter.joinTeam(s.user, code.trim()); },
    leaveTeam(id) { return s.adapter.leaveTeam(s.user, id); },
    deleteTeam(id) { s.dropScope({ type: 'team', id }); return s.adapter.deleteTeam(id); },
    removeMember(teamId, uid) { return s.adapter.removeMember(teamId, uid); },
  };
  return s;
})();

/* Preferences: theme / dark mode / language. Mirrored to localStorage for a flash-free first paint. */
App.prefs = (() => {
  let p = {};
  try { p = JSON.parse(localStorage.getItem('pp:prefs') || '{}'); } catch (e) { p = {}; }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function apply() {
    const root = document.documentElement;
    root.dataset.theme = p.theme || 'sky';
    const dark = p.mode === 'dark' || (p.mode !== 'light' && mq.matches);
    root.dataset.mode = dark ? 'dark' : 'light';
    root.lang = p.lang || 'th';
    App.i18n.setLang(p.lang || 'th');
    try { localStorage.setItem('pp:prefs', JSON.stringify(p)); } catch (e) { /* ignore */ }
  }
  mq.addEventListener('change', () => { if (!p.mode || p.mode === 'auto') { apply(); App.store.emit('theme'); } });

  return {
    get: () => ({ theme: 'sky', mode: 'auto', lang: 'th', ...p }),
    set(patch, { persist = true } = {}) {
      p = { ...p, ...patch };
      apply();
      App.store.emit('theme');
      if (persist && App.store.user) App.store.updateProfile(patch).catch((e) => console.warn(e));
    },
    fromUser(u) { p = { ...p, theme: u.theme || p.theme, mode: u.mode || p.mode, lang: u.lang || p.lang }; apply(); },
    apply,
  };
})();
