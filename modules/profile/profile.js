/* Profile module page ("My profile"): who you are, a summary of your personal data,
   edit your name, your teams, and your account preferences at a glance. */
(() => {
  const { esc, $, toISO, durationMin, sum, initials } = App.util;
  const icons = App.icons;
  const S = () => App.store;

  function render(el) {
    const t = App.i18n.t;
    const i18n = App.i18n;
    const s = S();
    const u = s.user;
    const p = App.prefs.get();
    const personal = { type: 'personal', id: u.id };
    const d = s.data(personal);

    // Personal data loads on first visit (this page doesn't follow the Personal / Team switcher).
    if (!d.loaded) s.ensure(personal).then(() => { if (App.main.route() === 'profile') render(el); });

    // every occurrence up to today (recurring activities count once per day they happen)
    const acts = App.schedule.expand(d.activities, App.schedule.firstDate(d.activities), App.util.todayISO());
    const mins = sum(acts, (a) => durationMin(a.start, a.end));
    const donePct = acts.length ? Math.round((acts.filter((a) => a.done).length / acts.length) * 100) : 0;
    const income = sum(d.transactions.filter((x) => x.type === 'income'), (x) => x.amount);
    const expense = sum(d.transactions.filter((x) => x.type === 'expense'), (x) => x.amount);
    const since = u.createdAt ? i18n.date(toISO(new Date(u.createdAt)), 'long') : null;
    const cloud = s.mode === 'firebase';
    const hasTeams = App.modules.has('teams');
    const hasSettings = App.modules.has('settings');

    el.innerHTML = `
      <div class="profile-grid">
        <div class="card profile-hero full">
          <span class="avatar xl">${esc(initials(u.name))}</span>
          <div class="who">
            <div class="nm">${esc(u.name)}</div>
            <div class="em">${esc(u.email)}</div>
            <div class="chips">
              ${since ? `<span class="tag">${icons.calendar.replace('<svg', '<svg width="12" height="12"')} ${t('prof.memberSince', { d: since })}</span>` : ''}
              <span class="tag">${(cloud ? icons.cloud : icons.device).replace('<svg', '<svg width="12" height="12"')} ${cloud ? 'Firebase' : 'Local Storage'}</span>
              <span class="tag">${icons.users.replace('<svg', '<svg width="12" height="12"')} ${t('prof.teams')} ${s.teams.length}</span>
            </div>
          </div>
        </div>

        <div class="card full">
          <div class="card-head"><h3>${t('prof.summary')} <span class="sub">· ${t('prof.summarySub')}</span></h3></div>
          <div class="prof-stats">
            <div class="prof-stat"><div class="k">${t('prof.activities')}</div><div class="v">${acts.length}</div></div>
            <div class="prof-stat"><div class="k">${t('prof.hours')}</div><div class="v">${i18n.hours(mins)}</div></div>
            <div class="prof-stat"><div class="k">${t('prof.done')}</div><div class="v">${donePct}%</div></div>
            <div class="prof-stat"><div class="k">${t('prof.income')}</div><div class="v">${i18n.money(income)}</div></div>
            <div class="prof-stat"><div class="k">${t('prof.expense')}</div><div class="v">${i18n.money(expense)}</div></div>
            <div class="prof-stat"><div class="k">${t('prof.teams')}</div><div class="v">${s.teams.length}</div></div>
          </div>
        </div>

        <form class="card" data-profile>
          <div class="card-head"><h3>✏️ ${t('prof.edit')}</h3></div>
          <div class="field"><label for="pf-name">${t('name')}</label>
            <input id="pf-name" class="input" name="name" value="${esc(u.name)}" maxlength="60" required></div>
          <div class="field"><label for="pf-email">${t('email')}</label>
            <input id="pf-email" class="input" value="${esc(u.email)}" readonly aria-describedby="pf-email-hint">
            <span id="pf-email-hint" class="muted tiny">${t('prof.emailFixed')}</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" type="submit">${t('save')}</button>
            <button class="btn ghost" type="button" data-logout>${icons.logout}${t('signOut')}</button>
          </div>
        </form>

        <div class="card">
          <div class="card-head"><h3>👥 ${t('prof.myTeams')}</h3>
            ${hasTeams ? `<a class="btn soft sm" href="#/teams">${t('prof.manageTeams')}</a>` : ''}</div>
          ${s.teams.length ? s.teams.map((tm) => `
            <div class="prof-team"><span class="avatar sm">${esc(initials(tm.name))}</span>
              <span class="nm">${esc(tm.name)}</span>
              <span class="muted small">${t('prof.membersN', { n: tm.memberIds.length })}</span>
              <span class="tag">${tm.ownerId === u.id ? '👑 ' + t('prof.owner') : t('prof.memberRole')}</span></div>`).join('')
            : `<div class="empty"><span class="em">🌱</span>${t('prof.noTeams')}</div>`}
        </div>

        <div class="card full">
          <div class="card-head"><h3>⚙️ ${t('prof.account')}</h3>
            ${hasSettings ? `<a class="btn ghost sm" href="#/settings">${icons.settings}${t('prof.openSettings')}</a>` : ''}</div>
          <div class="set-row"><span class="l">${t('prof.theme')}</span>
            <span class="tag"><span class="dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${(App.THEMES[p.theme] || App.THEMES.sky).primary}"></span> ${t('theme.' + p.theme)}</span></div>
          <div class="set-row"><span class="l">${t('prof.mode')}</span><span class="tag">${t('mode.' + p.mode)}</span></div>
          <div class="set-row"><span class="l">${t('prof.language')}</span><span class="tag">${p.lang === 'en' ? 'English' : 'ไทย'}</span></div>
          <div class="set-row"><span class="l">${t('prof.storage')}</span><span class="tag">${cloud ? t('mode.cloud') : t('mode.local')}</span></div>
          <div class="set-row"><span class="l">${t('prof.userId')}</span>
            <span style="display:inline-flex;align-items:center;gap:4px"><code class="uid" title="${esc(u.id)}">${esc(u.id)}</code>
              <button class="icon-btn plain" type="button" data-copy-id aria-label="${t('copy')}">${icons.copy}</button></span></div>
        </div>
      </div>`;

    $('[data-profile]', el).onsubmit = async (e) => {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return e.target.name.focus();
      if (name === u.name) return;
      try {
        await s.updateProfile({ name });
        App.ui.toast(t('saved'));
        App.main.refresh(); // name also shows in the sidebar and greeting
      } catch (ex) { console.error(ex); App.ui.toast(t('err.generic')); }
    };
    $('[data-logout]', el).onclick = () => App.main.logout();
    $('[data-copy-id]', el).onclick = async () => {
      try { await navigator.clipboard.writeText(u.id); App.ui.toast(t('copied')); } catch (e) { App.ui.toast(u.id); }
    };
  }

  App.modules.register({
    id: 'profile',
    nav: { order: 80, icon: 'user' },
    render,
  });
})();
