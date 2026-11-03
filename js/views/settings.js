/* Settings: profile, theme, dark mode, language, categories, data (sample / export / import / clear). */
App.views.settings = (() => {
  const { esc, icons, $, $$, todayISO, addDays, fromMin } = App.util;
  const S = () => App.store;
  let dataScope = null; // scope the Data & Categories cards act on
  let newCat = { kind: 'activity', color: App.PALETTE[0], emoji: '⭐' };

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
              <div class="color-pick">${App.PALETTE.map((c) => `<button type="button" data-color="${c}" class="${newCat.color === c ? 'active' : ''}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
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
    $('[data-logout]', el).onclick = () => document.querySelector('.sidebar [data-logout]').click();

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

  function exportJSON(scope) {
    const s = S();
    const d = s.data(scope);
    const payload = {
      app: 'pastel-planner', version: 1, exportedAt: new Date().toISOString(),
      scope: { type: scope.type, name: s.scopeName(scope) },
      activities: d.activities, transactions: d.transactions, categories: d.categories,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pastel-planner-${scope.type}-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importJSON(file, scope) {
    const t = App.i18n.t;
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'pastel-planner') throw new Error('format');
      const s = S();
      const clean = (arr) => (Array.isArray(arr) ? arr.filter((x) => x && typeof x.id === 'string') : []);
      const acts = clean(data.activities), txs = clean(data.transactions), cats = clean(data.categories);
      if (cats.length) await s.adapter.addMany(scope, 'categories', cats);
      if (acts.length) await s.adapter.addMany(scope, 'activities', acts);
      if (txs.length) await s.adapter.addMany(scope, 'transactions', txs);
      App.ui.toast(t('set.imported', { n: acts.length + txs.length }));
    } catch (e) {
      console.error(e);
      App.ui.toast(t('set.importError'));
    }
  }

  // Two weeks of believable data so the dashboard has something to show.
  async function addSample(scope) {
    const lang = App.prefs.get().lang;
    const th = lang === 'th';
    const s = S();
    const team = scope.type === 'team' ? s.team(scope.id) : null;
    const people = team ? team.memberIds : [s.user.id];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const titles = {
      'a-work': th ? ['ประชุมทีม', 'ทำรายงาน', 'ตอบอีเมล', 'ออกแบบงานใหม่'] : ['Team meeting', 'Write report', 'Emails', 'Design work'],
      'a-study': th ? ['เรียนภาษาอังกฤษ', 'อ่านหนังสือ', 'คอร์สออนไลน์'] : ['English class', 'Reading', 'Online course'],
      'a-exercise': th ? ['วิ่งที่สวน', 'โยคะ', 'ฟิตเนส'] : ['Run in the park', 'Yoga', 'Gym'],
      'a-rest': th ? ['คาเฟ่', 'งีบ', 'ดูซีรีส์'] : ['Café', 'Nap', 'Watch a series'],
      'a-family': th ? ['ทานข้าวกับครอบครัว', 'โทรหาแม่'] : ['Family dinner', 'Call mom'],
      'a-travel': th ? ['เดินทางไปทำงาน', 'ขับรถกลับบ้าน'] : ['Commute', 'Drive home'],
      'a-social': th ? ['เจอเพื่อน', 'ปาร์ตี้วันเกิด'] : ['Meet friends', 'Birthday party'],
    };
    const acts = [], txs = [];
    for (let i = -13; i <= 1; i++) {
      const date = addDays(todayISO(), i);
      const plan = [
        { c: 'a-travel', s: 8 * 60, d: 45 },
        { c: 'a-work', s: 9 * 60, d: 180 },
        { c: pick(['a-work', 'a-study']), s: 13 * 60, d: pick([90, 120, 150]) },
        { c: pick(['a-exercise', 'a-rest', 'a-social']), s: 17 * 60 + 30, d: pick([60, 90]) },
        { c: pick(['a-family', 'a-rest', 'a-study']), s: 19 * 60 + 30, d: pick([60, 90, 120]) },
      ];
      plan.forEach((pl) => {
        if (Math.random() < 0.15) return;
        const id = App.util.uid();
        acts.push({
          id, date, start: fromMin(pl.s), end: fromMin(Math.min(pl.s + pl.d, 1439)), title: pick(titles[pl.c]), categoryId: pl.c,
          note: '', done: i < 0 ? Math.random() < 0.85 : false, createdBy: pick(people), createdAt: Date.now(),
        });
        if (pl.c === 'a-travel') txs.push({ type: 'expense', amount: pick([30, 45, 60, 120]), categoryId: 'e-transport', activityId: id, date, note: '' });
        if (pl.c === 'a-social') txs.push({ type: 'expense', amount: pick([350, 520, 800]), categoryId: 'e-fun', activityId: id, date, note: '' });
        if (pl.c === 'a-study' && Math.random() < 0.3) txs.push({ type: 'expense', amount: pick([199, 450]), categoryId: 'e-other', activityId: id, date, note: th ? 'หนังสือ / คอร์ส' : 'Book / course' });
        if (pl.c === 'a-exercise' && Math.random() < 0.4) txs.push({ type: 'expense', amount: pick([80, 150]), categoryId: 'e-health', activityId: id, date, note: '' });
      });
      txs.push({ type: 'expense', amount: pick([60, 80, 95, 120]), categoryId: 'e-food', activityId: null, date, note: th ? 'มื้อกลางวัน' : 'Lunch' });
      if (Math.random() < 0.6) txs.push({ type: 'expense', amount: pick([55, 65, 90]), categoryId: 'e-food', activityId: null, date, note: th ? 'กาแฟ' : 'Coffee' });
      if (Math.random() < 0.2) txs.push({ type: 'expense', amount: pick([390, 890, 1290]), categoryId: 'e-shopping', activityId: null, date, note: '' });
      if (i === -10) txs.push({ type: 'expense', amount: 1850, categoryId: 'e-bills', activityId: null, date, note: th ? 'ค่าไฟ + เน็ต' : 'Electricity + internet' });
      if (i === -12) txs.push({ type: 'income', amount: 32000, categoryId: 'i-salary', activityId: null, date, note: '' });
      if (Math.random() < 0.15) txs.push({ type: 'income', amount: pick([1500, 2500, 4000]), categoryId: 'i-freelance', activityId: null, date, note: '' });
    }
    await s.adapter.addMany(scope, 'activities', acts);
    await s.adapter.addMany(scope, 'transactions', txs.map((x) => ({ id: App.util.uid(), createdBy: pick(people), createdAt: Date.now(), ...x })));
  }

  return { render };
})();
