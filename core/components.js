/* Small UI components shared by several modules. */
App.components = (() => {
  const { esc, $, $$ } = App.util;
  const S = () => App.store;

  // Category picker as chips. Read the choice from wrap.dataset.value after bindCatChips().
  function catChips(kind, selected) {
    return `<div class="chips cat-chips">${S().categories(kind).map((c) => `
      <button type="button" class="chip ${c.id === selected ? 'active' : ''}" data-cat="${c.id}">
        <span>${c.emoji}</span>${esc(S().catName(c))}</button>`).join('')}</div>`;
  }
  function bindCatChips(root) {
    $$('.cat-chips', root).forEach((wrap) => {
      wrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cat]');
        if (!b) return;
        $$('[data-cat]', wrap).forEach((x) => x.classList.toggle('active', x === b));
        wrap.dataset.value = b.dataset.cat;
      });
      const a = $('.chip.active', wrap);
      wrap.dataset.value = a ? a.dataset.cat : '';
    });
  }
  // Category picker as <option>s.
  const catOptions = (kind, selected) => S().categories(kind)
    .map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.emoji} ${esc(S().catName(c))}</option>`).join('');

  return { catChips, bindCatChips, catOptions };
})();
