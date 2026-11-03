/* Settings module page: profile, theme, dark mode, language, categories, data (sample / export / import / clear). */
(() => {
  const { esc, $, $$ } = App.util;
  const icons = App.icons;
  const { addSample, exportJSON, importJSON } = App.parts.settings;
  const S = () => App.store;
  let dataScope = null; // scope the Data & Categories cards act on
  const newCat = { kind: 'activity', color: App.PALETTE[0], emoji: '⭐' };

  function render(el) {
    const t = App.i18n.t;
    const s = S();
    const p = App.prefs.get();
    const u = s.user;
    if (!dataScope || (dataScope.type === 'team' && !s.team(dataScope.id))) dataScope = { ...s.scope };
    const scopeOpts = [{ type: 'personal', id: u.id, name: t('personal') }].concat(s.teams.map((tm) => ({ type: 'team', id: tm.id, name: tm.name })));
    const custom = s.data(dataScope).categories || [];

    el.innerHTML = `
      <div class="settings-grid">
        <div class="card">
          <h3>🎨 ${t('set.look')}</h3><p class="desc">${t('set.lookDesc')}</p>
          <div class="swatches">${Object.entries(App.THEMES).map(([k, v]) => `
            <button class="swatch ${p.theme === k ? 'active' : ''}" data-theme="${k}" aria-pressed="${p.theme === k}">
              <span class="c" style="background:${v.soft}"><i style="background:${v.primary}"></i></span>${t('theme.' + k)}</button>`).join('')}</div>
          <div class="set-row" style="margin-top:12px"><span class="l">${t('set.darkMode')}</span>
            <div class="seg" data-mode>${['auto', 'light', 'dark'].map((m) => `<button data-v="${m}" class="${p.mode === m ? 'active' : ''}">${t('mode.' + m)}</button>`).join('')}</div></div>
          <div class="set-row"><span class="l">${t('set.language')}</span>
            <div class="seg" data-lang><button data-v="th" class="${p.lang === 'th' ? 'active' : ''}">ไทย</button><button data-v="en" class="${p.lang === 'en' ? 'active' : ''}">English</button></div></div>
        </div>

        <form class="card" data-profile>
          <h3>🙂 ${t('set.profile')}</h3><p class="desc">${esc(u.email)}</p>
          <div class="field"><label for="p-name">${t('name')}</label><input id="p-name" class="input" name="name" value="${esc(u.name)}" maxlength="60"></div>
          <div class="field"><label for="p-gender">${t('gender')}</label>
            <select id="p-gender" class="select" name="gender">${['male', 'female', 'unspecified'].map((g) => `<option value="${g}" ${u.gender === g ? 'selected' : ''}>${t(g)}</option>`).join('')}</select></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" type="submit">${t('save')}</button>
            <button class="btn ghost" type="button" data-logout>${icons.logout}${t('signOut')}</button>
          </div>
        </form>

        <div class="card">
          <h3>🏷️ ${t('set.categories')}</h3><p class="desc">${t('set.categoriesDesc')}</p>
          <div class="field"><label for="s-scope">${t('set.scope')}</label>
            <select id="s-scope" class="select" data-scope-select>${scopeOpts.map((o) => `<option value="${o.type}:${esc(o.id)}" ${o.type === dataScope.type && o.id === dataScope.id ? 'selected' : ''}>${o.type === 'team' ? '👥' : '👤'} ${esc(o.name)}</option>`).join('')}</select></div>
          <div class="cat-list">${custom.length ? custom.map((c) => `
            <div class="cat-row"><span class="em" style="background:color-mix(in srgb, ${App.color(c.color)} 25%, var(--surface))">${esc(c.emoji)}</span>
              <span class="nm3">${esc(c.name)}</span><span class="tag">${t('kind.' + c.kind)}</span>
              <button class="icon-btn plain" data-del-cat="${c.id}" aria-label="${t('delete')}">${icons.trash}</button></div>`).join('')
              : `<div class="muted small">${t('set.noCustom')}</div>`}</div>
          <form data-new-cat>
            <div class="row tight">
              <select class="select" name="kind" style="flex:0 0 120px">${['activity', 'expense', 'income'].map((k) => `<option value="${k}" ${newCat.kind === k ? 'selected' : ''}>${t('kind.' + k)}</option>`).join('')}</select>
              <input class="input" name="emoji" value="${esc(newCat.emoji)}" maxlength="4" style="flex:0 0 60px;text-align:center" aria-label="emoji">
              <input class="input" name="name" placeholder="${t('set.catNamePh')}" maxlength="30" aria-label="${t('name')}">
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap">
              <div class="color-pick">${App.PALETTE.map((c) => `<button type="button" data-color="${c}" class="${newCat.color === c ? 'active' : ''}" style="background:${App.color(c)}" aria-label="${c}"></button>`).join('')}</div>
              <button class="btn soft sm" type="submit">${icons.plus}${t('add')}</button>
            </div>
          </form>
        </div>

        <div class="card">
          <h3>💾 ${t('set.data')}</h3>
          <p class="desc">${s.mode === 'firebase' ? t('set.modeCloud') : t('set.modeLocal')}</p>
          <div class="set-row"><span class="l">${t('set.storage')}</span>
            <span class="tag">${s.mode === 'firebase' ? icons.cloud.replace('<svg', '<svg width="13" height="13"') + ' Firebase' : icons.device.replace('<svg', '<svg width="13" height="13"') + ' Local Storage'}</span></div>
          <div class="set-row"><span class="l">${t('set.sample')}<span class="muted">${t('set.sampleDesc', { scope: esc(s.scopeName(dataScope)) })}</span></span>
            <button class="btn soft sm" data-sample>${icons.sparkle}${t('set.sampleBtn')}</button></div>
          <div class="set-row"><span class="l">${t('set.export')}<span class="muted">${t('set.exportDesc')}</span></span>
            <div style="display:flex;gap:8px"><button class="btn ghost sm" data-export>${icons.download}${t('export')}</button>
              <label class="btn ghost sm" style="cursor:pointer">${icons.upload}${t('import')}<input type="file" accept="application/json,.json" data-import hidden></label></div></div>
          <div class="set-row"><span class="l">${t('set.clear')}<span class="muted">${t('set.clearDesc', { scope: esc(s.scopeName(dataScope)) })}</span></span>
            <button class="btn danger sm" data-clear>${icons.trash}${t('set.clearBtn')}</button></div>
        </div>
      </div>`;

    // look
    $$('[data-theme]', el).forEach((b) => b.onclick = () => App.prefs.set({ theme: b.dataset.theme }));
    $$('[data-mode] button', el).forEach((b) => b.onclick = () => App.prefs.set({ mode: b.dataset.v }));
    $$('[data-lang] button', el).forEach((b) => b.onclick = () => App.prefs.set({ lang: b.dataset.v }));

    // profile
    $('[data-profile]', el).onsubmit = async (e) => {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return;
      await s.updateProfile({ name, gender: e.target.gender.value });
      App.ui.toast(t('saved'));
      App.main.rerender();
      document.querySelectorAll('.user-card .name').forEach((n) => { n.textContent = name; });
    };
    $('[data-logout]', el).onclick = () => App.main.logout();

    // scope for categories & data
    $('[data-scope-select]', el).onchange = async (e) => {
      const [type, ...rest] = e.target.value.split(':');
      dataScope = { type, id: rest.join(':') };
      await s.ensure(dataScope);
      render(el);
    };
    s.ensure(dataScope).then(() => {
      if ((s.data(dataScope).categories || []).length !== custom.length) render(el);
    });

    // categories
    const form = $('[data-new-cat]', el);
    $$('[data-color]', form).forEach((b) => b.onclick = () => {
      newCat.color = b.dataset.color;
      $$('[data-color]', form).forEach((x) => x.classList.toggle('active', x === b));
    });
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      if (!name) return form.name.focus();
      newCat.kind = form.kind.value;
      newCat.emoji = form.emoji.value.trim() || '⭐';
      await s.add('categories', { kind: newCat.kind, name, emoji: newCat.emoji, color: newCat.color }, dataScope);
      App.ui.toast(t('saved'));
      render(el);
    };
    $$('[data-del-cat]', el).forEach((b) => b.onclick = async () => {
      if (!(await App.ui.confirm(t('set.deleteCatConfirm'), { okText: t('delete'), danger: true }))) return;
      await s.remove('categories', b.dataset.delCat, dataScope);
      render(el);
    });

    // data
    $('[data-sample]', el).onclick = async () => {
      await s.ensure(dataScope);
      await addSample(dataScope);
      App.ui.toast(t('set.sampleDone'));
    };
    $('[data-export]', el).onclick = () => exportJSON(dataScope);
    $('[data-import]', el).onchange = (e) => importJSON(e.target.files[0], dataScope).then(() => { e.target.value = ''; });
    $('[data-clear]', el).onclick = async () => {
      if (!(await App.ui.confirm(t('set.clearConfirm', { scope: s.scopeName(dataScope) }), { okText: t('set.clearBtn'), danger: true }))) return;
      await s.clearScope(dataScope);
      App.ui.toast(t('deleted'));
      render(el);
    };
  }

  App.modules.register({
    id: 'settings',
    nav: { order: 90, icon: 'settings' },
    render,
  });
})();
