/* Auth module: sign in / sign up screen.
   Picking a gender previews the theme live (male → sky blue, female → sakura pink). */
(() => {
  const { esc, $, $$ } = App.util;
  const icons = App.icons;
  let tab = 'signup';
  let gender = 'female';
  let previousTheme = null;

  function errorText(e) {
    const t = App.i18n.t;
    const code = e && (e.code || e.message) || '';
    if (code.includes('email-already-in-use')) return t('err.emailUsed');
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return t('err.badLogin');
    if (code.includes('weak-password')) return t('err.weakPassword');
    if (code.includes('invalid-email')) return t('err.badEmail');
    if (code.includes('network')) return t('err.network');
    return t('err.generic');
  }

  function render(root, onDone) {
    const t = App.i18n.t;
    const lang = App.prefs.get().lang;
    const isUp = tab === 'signup';
    if (!previousTheme) previousTheme = App.prefs.get().theme;
    if (isUp) document.documentElement.dataset.theme = App.themeForGender(gender);
    else document.documentElement.dataset.theme = previousTheme;

    const genders = [
      { v: 'male', label: t('male'), color: App.THEMES.sky.primary },
      { v: 'female', label: t('female'), color: App.THEMES.sakura.primary },
      { v: 'unspecified', label: t('unspecified'), color: App.THEMES.lavender.primary },
    ];

    root.innerHTML = `
      <div class="auth-wrap">
        <form class="auth-card" novalidate>
          <div class="auth-top">
            <div class="brand"><span class="brand-mark">${icons.logo}</span>Pastel Planner</div>
            <div class="seg" role="group" aria-label="language">
              <button type="button" data-lang="th" class="${lang === 'th' ? 'active' : ''}">ไทย</button>
              <button type="button" data-lang="en" class="${lang === 'en' ? 'active' : ''}">EN</button>
            </div>
          </div>
          <h1>${isUp ? t('auth.helloNew') : t('auth.welcomeBack')}</h1>
          <p class="lead">${isUp ? t('auth.leadUp') : t('auth.leadIn')}</p>
          <div class="seg auth-tabs" role="tablist" style="display:flex">
            <button type="button" data-tab="signup" class="${isUp ? 'active' : ''}">${t('signUp')}</button>
            <button type="button" data-tab="signin" class="${!isUp ? 'active' : ''}">${t('signIn')}</button>
          </div>
          ${isUp ? `<div class="field"><label for="f-name">${t('name')}</label>
            <input id="f-name" class="input" name="name" autocomplete="nickname" placeholder="${t('auth.namePh')}" required></div>` : ''}
          <div class="field"><label for="f-email">${t('email')}</label>
            <input id="f-email" class="input" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
          <div class="field"><label for="f-pw">${t('password')}</label>
            <input id="f-pw" class="input" name="password" type="password" autocomplete="${isUp ? 'new-password' : 'current-password'}" placeholder="••••••" minlength="6" required></div>
          ${isUp ? `<div class="field"><span class="label">${t('gender')} <span class="muted small">· ${t('auth.genderHint')}</span></span>
            <div class="gender-pick">${genders.map((g) => `
              <button type="button" data-gender="${g.v}" class="${gender === g.v ? 'active' : ''}">
                <span class="sw" style="background:${g.color}"></span>${esc(g.label)}</button>`).join('')}
            </div></div>` : ''}
          <div class="form-error" role="alert"></div>
          <button class="btn block" type="submit">${isUp ? t('auth.create') : t('signIn')}</button>
          <div class="mode-pill"><span class="dot"></span>${App.store.mode === 'firebase' ? t('mode.cloud') : t('mode.local')}</div>
        </form>
      </div>`;

    const form = $('form', root);
    $$('[data-tab]', root).forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(root, onDone); });
    $$('[data-lang]', root).forEach((b) => b.onclick = () => { App.prefs.set({ lang: b.dataset.lang }, { persist: false }); render(root, onDone); });
    $$('[data-gender]', root).forEach((b) => b.onclick = () => {
      gender = b.dataset.gender;
      $$('[data-gender]', root).forEach((x) => x.classList.toggle('active', x === b));
      document.documentElement.dataset.theme = App.themeForGender(gender);
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      const errEl = $('.form-error', root);
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      errEl.textContent = '';
      if (isUp && !data.name.trim()) { errEl.textContent = t('err.nameRequired'); return; }
      if (!/^\S+@\S+\.\S+$/.test(data.email || '')) { errEl.textContent = t('err.badEmail'); return; }
      if ((data.password || '').length < 6) { errEl.textContent = t('err.weakPassword'); return; }
      const btn = $('button[type=submit]', root);
      btn.disabled = true;
      try {
        if (isUp) await App.store.signUp({ ...data, gender });
        else await App.store.signIn(data);
        previousTheme = null;
        onDone();
      } catch (ex) {
        console.warn(ex);
        errEl.textContent = errorText(ex);
        btn.disabled = false;
      }
    };
  }

  App.modules.register({
    id: 'auth',
    api: { render, setTab: (v) => { tab = v; } },
  });
})();
