/* Teams: create, join with a code, members, leave / delete. */
App.views.teams = (() => {
  const { esc, icons, $, $$, initials } = App.util;
  const S = () => App.store;

  function errText(e) {
    const t = App.i18n.t;
    const c = (e && (e.code || e.message)) || '';
    if (c.includes('not-found')) return t('team.notFound');
    if (c.includes('already-member')) return t('team.already');
    return t('err.generic');
  }

  function render(el) {
    const t = App.i18n.t;
    const s = S();
    const me = s.user.id;

    el.innerHTML = `
      ${s.mode === 'local' ? `<div class="note">${icons.info}<div>${t('team.localNote')}</div></div>` : ''}
      <div class="forms-2">
        <form class="card" data-create>
          <div class="card-head"><h3>✨ ${t('team.create')}</h3></div>
          <div class="inline-form"><input class="input" name="name" placeholder="${t('team.namePh')}" maxlength="60" aria-label="${t('team.name')}">
            <button class="btn" type="submit">${t('create')}</button></div>
        </form>
        <form class="card" data-join>
          <div class="card-head"><h3>🔑 ${t('team.join')}</h3></div>
          <div class="inline-form"><input class="input" name="code" placeholder="${t('team.codePh')}" autocomplete="off" spellcheck="false" aria-label="${t('team.code')}">
            <button class="btn soft" type="submit">${t('join')}</button></div>
        </form>
      </div>
      ${s.teams.length ? `<div class="team-grid">${s.teams.map((tm) => {
        const owner = tm.ownerId === me;
        return `<div class="card team-card" data-team="${tm.id}">
          <div class="top"><span class="team-ic">${esc(initials(tm.name))}</span>
            <div style="min-width:0;flex:1"><div class="nm">${esc(tm.name)}</div>
              <div class="muted small">${t('membersN', { n: tm.memberIds.length })}${owner ? ` · ${t('team.owner')}` : ''}</div></div>
            <div class="avatars">${tm.memberIds.slice(0, 4).map((u) => `<span class="avatar sm" title="${esc(tm.memberNames[u] || '')}">${esc(initials(tm.memberNames[u]))}</span>`).join('')}</div>
          </div>
          <div><div class="label" style="margin-bottom:6px">${t('team.inviteCode')}</div>
            <div class="code-box"><code>${esc(tm.id)}</code><button class="icon-btn plain" data-copy="${esc(tm.id)}" aria-label="${t('copy')}">${icons.copy}</button></div></div>
          <div>${tm.memberIds.map((u) => `<div class="member-row"><span class="avatar xs">${esc(initials(tm.memberNames[u]))}</span>
            <span class="nm2">${esc(tm.memberNames[u] || '—')}${u === me ? ` <span class="muted tiny">(${t('you')})</span>` : ''}${u === tm.ownerId ? ' 👑' : ''}</span>
            ${owner && u !== me ? `<button class="icon-btn plain" data-kick="${u}" aria-label="${t('team.remove')}">${icons.x}</button>` : ''}</div>`).join('')}</div>
          <div class="team-actions">
            <button class="btn sm" data-open>${t('team.open')}</button>
            <button class="btn ghost sm" data-dash>${t('nav.dashboard')}</button>
            ${owner ? `<button class="btn danger sm" data-del>${icons.trash}${t('delete')}</button>` : `<button class="btn ghost sm" data-leave>${t('team.leave')}</button>`}
          </div>
        </div>`;
      }).join('')}</div>` : `<div class="card"><div class="empty"><span class="em">👥</span>${t('team.empty')}</div></div>`}`;

    $('[data-create]', el).onsubmit = async (e) => {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return e.target.name.focus();
      try {
        const tm = await s.createTeam(name);
        App.ui.toast(t('team.created'));
        s.setScope({ type: 'team', id: tm.id });
      } catch (ex) { console.error(ex); App.ui.toast(t('err.generic')); }
    };
    $('[data-join]', el).onsubmit = async (e) => {
      e.preventDefault();
      const code = e.target.code.value.trim();
      if (!code) return e.target.code.focus();
      try {
        const tm = await s.joinTeam(code);
        App.ui.toast(t('team.joined', { name: tm.name }));
        s.setScope({ type: 'team', id: tm.id });
      } catch (ex) { console.warn(ex); App.ui.toast(errText(ex)); }
    };
    $$('[data-copy]', el).forEach((b) => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); App.ui.toast(t('copied')); }
      catch (e) { App.ui.toast(b.dataset.copy); }
    });
    $$('[data-team]', el).forEach((card) => {
      const id = card.dataset.team;
      const tm = s.team(id);
      $('[data-open]', card).onclick = () => { s.setScope({ type: 'team', id }); location.hash = '#/planner'; };
      $('[data-dash]', card).onclick = () => { s.setScope({ type: 'team', id }); location.hash = '#/dashboard'; };
      const del = $('[data-del]', card);
      if (del) del.onclick = async () => {
        if (!(await App.ui.confirm(t('team.deleteConfirm', { name: tm.name }), { okText: t('delete'), danger: true }))) return;
        await s.deleteTeam(id);
        App.ui.toast(t('deleted'));
      };
      const leave = $('[data-leave]', card);
      if (leave) leave.onclick = async () => {
        if (!(await App.ui.confirm(t('team.leaveConfirm', { name: tm.name }), { okText: t('team.leave'), danger: true }))) return;
        s.dropScope({ type: 'team', id });
        await s.leaveTeam(id);
      };
      $$('[data-kick]', card).forEach((b) => b.onclick = async () => {
        if (!(await App.ui.confirm(t('team.removeConfirm', { name: tm.memberNames[b.dataset.kick] }), { okText: t('team.remove'), danger: true }))) return;
        await s.removeMember(id, b.dataset.kick);
      });
    });
  }

  return { render };
})();
