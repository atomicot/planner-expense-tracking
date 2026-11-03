/* Module registry + loader.
   Each feature lives in modules/<id>/ with its own style.css, i18n.js and scripts,
   and registers itself with App.modules.register({...}). modules/manifest.js lists which modules load.

   Module definition:
     id        'planner'
     nav       { order: 10, icon: 'calendar' }   → appears in the sidebar / bottom nav (omit for non-page modules)
     scoped    true → page follows the Personal / Team switcher and needs that scope's data loaded
     render(el)        draw the page into el (called again whenever data, scope, theme or language change)
     destroy()         optional cleanup when leaving the page
     api       { ... }  functions other modules may call through App.api('<id>')

   A module split over several files shares its internals through App.parts.<id> (private to that module;
   other modules use App.api('<id>') instead). */
App.parts = {};
App.modules = (() => {
  const list = [];
  return {
    register(def) {
      if (list.some((m) => m.id === def.id)) throw new Error(`module "${def.id}" registered twice`);
      list.push(def);
    },
    get: (id) => list.find((m) => m.id === id) || null,
    has: (id) => list.some((m) => m.id === id),
    pages: () => list.filter((m) => m.nav).sort((a, b) => a.nav.order - b.nav.order),
    all: () => list.slice(),
  };
})();

// Another module's public api, or null when that module isn't loaded.
App.api = (id) => { const m = App.modules.get(id); return m && m.api ? m.api : null; };

App.loadModules = (() => {
  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.body.appendChild(s);
  });
  const loadCss = (href) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  };

  return async function loadModules(manifest) {
    for (const m of manifest) {
      const base = `modules/${m.id}/`;
      if (m.css !== false) loadCss(base + 'style.css');
      for (const f of m.files) await loadScript(base + f); // in order: a module's later files may use earlier ones
    }
  };
})();
