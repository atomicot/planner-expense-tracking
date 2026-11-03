/* Core UI pieces shared by modules: toast, modal, confirm. */
App.ui = (() => {
  const { esc, $ } = App.util;
  const icons = App.icons;

  function toast(msg, ms = 2200) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    $('#toast-root').appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  // Opens a modal. `onMount(el, close)` wires it up. Returns { close, el }.
  function modal({ title, body, foot, onMount, wide }) {
    const root = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" ${wide ? 'style="max-width:640px"' : ''}>
        <div class="modal-head"><h2>${esc(title)}</h2>
          <button class="icon-btn plain" data-close aria-label="close">${icons.x}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    root.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-close]').addEventListener('click', close);
    const el = wrap.querySelector('.modal');
    if (onMount) onMount(el, close);
    const first = el.querySelector('input:not([type=hidden]), select, textarea');
    if (first && window.matchMedia('(min-width: 769px)').matches) setTimeout(() => first.focus(), 30);
    return { close, el };
  }

  function confirm(message, { okText, danger } = {}) {
    const t = App.i18n.t;
    return new Promise((resolve) => {
      let done = false;
      const m = modal({
        title: t('confirm'),
        body: `<p style="margin:0 0 6px">${esc(message)}</p>`,
        foot: `<div class="right"><button class="btn ghost" data-no>${t('cancel')}</button>
               <button class="btn ${danger ? 'danger' : ''}" data-yes>${esc(okText || t('ok'))}</button></div>`,
        onMount(el, close) {
          el.querySelector('[data-no]').onclick = () => { done = true; close(); resolve(false); };
          el.querySelector('[data-yes]').onclick = () => { done = true; close(); resolve(true); };
        },
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) resolve(false); } });
      obs.observe($('#modal-root'), { childList: true });
    });
  }

  return { toast, modal, confirm };
})();
