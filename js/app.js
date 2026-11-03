/* App shell: hash router, sidebar / bottom nav, scope switcher, re-render on data changes. */
App.main = (() => {
  const { esc, icons, $, $$, initials, debounce } = App.util;
  const routes = ['planner', 'money', 'dashboard', 'teams', 'settings'];
  const navIcons = { planner: icons.calendar, money: icons.wallet, dashboard: icons.chart, teams: icons.users, settings: icons.settings };
  let current = null;

  const route = () => {
    const r = location.hash.replace(/^#\/?/, '').split('?')[0];
    return routes.includes(r) ? r : 'planner';
  };

  function renderShell() {
    const t = App.i18n.t;
    const u = App.store.user;
    const r = route();
    const links = (short) => routes.map((k) => `
      <a class="nav-link ${k === r ? 'active' : ''}" href="#/${k}" data-route="${k}">${navIcons[k]}<span>${t((short && k === 'money' ? 'navShort.' : 'nav.') + k)}</span></a>`).join('');
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

  function renderScope() {
    const t = App.i18n.t;
    const s = App.store;
    const slot = $('#scope-slot');
    if (!slot) return;
    const r = route();
    if (r === 'teams' || r === 'settings') { slot.innerHTML = ''; return; }
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
        <div class="menu-sep"></div>
        <a class="menu-item" href="#/teams"><span class="avatar xs" style="background:var(--surface-2)">+</span>${t('team.manage')}</a>`;
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
    const t = App.i18n.t;
    const view = App.views[r];
    if (current && current !== view && current.destroy) current.destroy();
    current = view;
    $$('.nav-link').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    $('#page-title').textContent = t('nav.' + r);
    $('#greet').textContent = greeting();
    document.title = `${t('nav.' + r)} · Pastel Planner`;
    renderScope();
    if (r !== 'teams' && r !== 'settings') await App.store.ensure();
    if (route() !== r) return; // navigated away while loading
    view.render($('#view'));
  }

  const rerender = debounce(() => { if (App.store.user && $('#view')) renderView(); }, 60);

  async function logout() {
    const ok = await App.ui.confirm(App.i18n.t('signOutConfirm'), { okText: App.i18n.t('signOut') });
    if (!ok) return;
    if (current && current.destroy) current.destroy();
    current = null;
    await App.store.signOut();
    showAuth();
  }

  function showAuth() {
    App.auth.setTab('signin');
    App.auth.render($('#root'), start);
  }

  function start() {
    App.prefs.fromUser(App.store.user);
    renderShell();
    renderView();
  }

  async function boot() {
    App.prefs.apply();
    $('#root').innerHTML = '';
    let user = null;
    try { user = await App.store.init(); } catch (e) { console.error(e); }
    if (user) start();
    else {
      const hasProfiles = App.store.adapter.localProfiles && App.store.adapter.localProfiles().length;
      App.auth.setTab(hasProfiles ? 'signin' : 'signup');
      App.auth.render($('#root'), start);
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

  return { boot, rerender, route };
})();

document.addEventListener('DOMContentLoaded', () => App.main.boot());
