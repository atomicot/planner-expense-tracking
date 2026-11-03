/* App shell: boots the core, loads modules, hash router, sidebar / bottom nav, scope switcher.
   Navigation is built from the modules that registered a `nav` — nothing here names a feature. */
App.main = (() => {
  const { esc, $, $$, initials, debounce } = App.util;
  const icons = App.icons;
  let current = null;

  const pages = () => App.modules.pages();
  const route = () => {
    const r = location.hash.replace(/^#\/?/, '').split('?')[0];
    const list = pages();
    return (list.find((m) => m.id === r) || list[0]).id;
  };
  const navLabel = (id, short) => App.i18n.t(short && App.i18n.has('navShort.' + id) ? 'navShort.' + id : 'nav.' + id);

  function renderShell() {
    const t = App.i18n.t;
    const u = App.store.user;
    const r = route();
    const links = (short) => pages().map((m) => `
      <a class="nav-link ${m.id === r ? 'active' : ''}" href="#/${m.id}" data-route="${m.id}">${icons[m.nav.icon] || icons.logo}<span>${navLabel(m.id, short)}</span></a>`).join('');
    $('#root').innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <div class="brand"><span class="brand-mark">${icons.logo}</span>Pastel Planner</div>
          <nav>${links(false)}</nav>
          <div class="spacer"></div>
          <div class="user-card">
            <span class="avatar">${esc(initials(u.name))}</span>
            <div class="meta"><div class="name">${esc(u.name)}</div><div class="mail">${esc(u.email)}</div></div>
            <button class="icon-btn plain" data-logout title="${t('signOut')}" aria-label="${t('signOut')}">${icons.logout}</button>
          </div>
        </aside>
        <main class="main">
          <header class="topbar">
            <div><div class="greet" id="greet"></div><h1 id="page-title"></h1></div>
            <div class="topbar-right" id="scope-slot"></div>
          </header>
          <section id="view"></section>
        </main>
        <nav class="bottom-nav">${links(true)}</nav>
      </div>`;
    $$('[data-logout]').forEach((b) => b.onclick = logout);
  }

  function greeting() {
    const t = App.i18n.t;
    const h = new Date().getHours();
    const k = h < 12 ? 'greet.morning' : h < 17 ? 'greet.afternoon' : 'greet.evening';
    return `${t(k)}, ${App.store.user.name}`;
  }

  function renderScope(mod) {
    const t = App.i18n.t;
    const s = App.store;
    const slot = $('#scope-slot');
    if (!slot) return;
    if (!mod.scoped) { slot.innerHTML = ''; return; }
    const isTeam = s.isTeam();
    slot.innerHTML = `
      <div class="scope">
        <button class="scope-btn" aria-haspopup="menu" aria-expanded="false">
          <span class="ico">${isTeam ? icons.users : icons.user}</span>
          <span class="lbl">${esc(s.scopeName())}</span>${icons.chevD}
        </button>
      </div>`;
    const btn = $('.scope-btn', slot);
    btn.onclick = (e) => {
      e.stopPropagation();
      const existing = $('.menu', slot);
      if (existing) { existing.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
      const menu = document.createElement('div');
      menu.className = 'menu';
      menu.setAttribute('role', 'menu');
      const item = (scope, label, ico) => {
        const active = s.scope.type === scope.type && s.scope.id === scope.id;
        return `<button class="menu-item ${active ? 'active' : ''}" role="menuitem" data-type="${scope.type}" data-id="${esc(scope.id)}">
          <span class="avatar xs">${ico}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</span>
          ${active ? `<span style="width:16px">${icons.check}</span>` : ''}</button>`;
      };
      menu.innerHTML = `
        ${item({ type: 'personal', id: s.user.id }, t('personal'), esc(initials(s.user.name)))}
        ${s.teams.length ? `<div class="menu-sep"></div><div class="menu-label">${t('teams')}</div>` : ''}
        ${s.teams.map((tm) => item({ type: 'team', id: tm.id }, tm.name, esc(initials(tm.name)))).join('')}
        ${App.modules.has('teams') ? `<div class="menu-sep"></div>
        <a class="menu-item" href="#/teams"><span class="avatar xs" style="background:var(--surface-2)">+</span>${t('team.manage')}</a>` : ''}`;
      slot.querySelector('.scope').appendChild(menu);
      btn.setAttribute('aria-expanded', 'true');
      $$('[data-type]', menu).forEach((b) => b.onclick = () => {
        s.setScope({ type: b.dataset.type, id: b.dataset.id });
        menu.remove();
      });
      const close = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); } };
      setTimeout(() => document.addEventListener('click', close), 0);
    };
  }

  async function renderView() {
    const r = route();
    const mod = App.modules.get(r);
    if (current && current !== mod && current.destroy) current.destroy();
    current = mod;
    $$('.nav-link').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    $('#page-title').textContent = navLabel(r);
    $('#greet').textContent = greeting();
    document.title = `${navLabel(r)} · Pastel Planner`;
    renderScope(mod);
    if (mod.scoped) await App.store.ensure();
    if (route() !== r) return; // navigated away while loading
    mod.render($('#view'));
  }

  const rerender = debounce(() => { if (App.store.user && $('#view')) renderView(); }, 60);

  async function logout() {
    const ok = await App.ui.confirm(App.i18n.t('signOutConfirm'), { okText: App.i18n.t('signOut') });
    if (!ok) return;
    if (current && current.destroy) current.destroy();
    current = null;
    await App.store.signOut();
    showAuth('signin');
  }

  function showAuth(tab) {
    const auth = App.api('auth');
    auth.setTab(tab);
    auth.render($('#root'), start);
  }

  function start() {
    App.prefs.fromUser(App.store.user);
    renderShell();
    renderView();
  }

  async function boot() {
    App.prefs.apply();
    $('#root').innerHTML = '';
    await App.loadModules(App.MANIFEST);
    if (!App.api('auth') || !pages().length) throw new Error('the auth module and at least one page module are required');
    let user = null;
    try { user = await App.store.init(); } catch (e) { console.error(e); }
    if (user) start();
    else {
      const hasProfiles = App.store.adapter.localProfiles && App.store.adapter.localProfiles().length;
      showAuth(hasProfiles ? 'signin' : 'signup');
    }

    window.addEventListener('hashchange', () => { if (App.store.user) renderView(); });
    App.store.on('scope', () => rerender());
    App.store.on('data', (scope) => {
      if (!App.store.user || !App.store.scope) return;
      if (!scope || App.store.scopeKey(scope) === App.store.scopeKey()) rerender();
    });
    App.store.on('teams', () => rerender());
    App.store.on('theme', () => { if (App.store.user && $('.shell')) { renderShell(); renderView(); } });
  }

  return { boot, rerender, route, logout };
})();

document.addEventListener('DOMContentLoaded', () => App.main.boot());
