/* Small UI components shared by several modules. */
App.components = (() => {
  const { esc, $, $$ } = App.util;
  const S = () => App.store;
  const t = (k) => App.i18n.t(k);

  // <option>s of main categories; expense categories are grouped (Needs / Wants / Savings / Other).
  function mainOptions(kind, selected) {
    const cats = S().categories(kind);
    const opt = (c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.emoji} ${esc(S().catName(c))}</option>`;
    if (kind !== 'expense') return cats.map(opt).join('');
    return App.EXPENSE_GROUPS.map((g) => {
      const inGroup = cats.filter((c) => c.group === g.id);
      return inGroup.length ? `<optgroup label="${esc(t(g.key))}">${inGroup.map(opt).join('')}</optgroup>` : '';
    }).join('');
  }
  function subOptions(catId, selected) {
    const c = S().cat(catId);
    return `<option value="">${t('subNone')}</option>` + (c.subs || []).map((sub) =>
      `<option value="${sub}" ${sub === selected ? 'selected' : ''}>${esc(S().subName(c, sub))}</option>`).join('');
  }

  // Main category dropdown + subcategory dropdown that follows it. Read with readCatPicker(root).
  function catPicker(kind, catId, subId, id = 'cp') {
    const first = catId && S().cat(catId).kind === kind ? catId : S().categories(kind)[0].id;
    const c = S().cat(first);
    return `<div class="row cat-picker" data-cat-picker data-kind="${kind}">
      <div class="field"><label for="${id}-main">${t('category')}</label>
        <select id="${id}-main" class="select" data-role="main">${mainOptions(kind, first)}</select></div>
      <div class="field" data-role="sub-field" ${(c.subs || []).length ? '' : 'hidden'}><label for="${id}-sub">${t('subcategory')}</label>
        <select id="${id}-sub" class="select" data-role="sub">${subOptions(first, subId)}</select></div>
    </div>`;
  }
  function bindCatPicker(root) {
    $$('[data-cat-picker]', root).forEach((wrap) => {
      const main = $('[data-role=main]', wrap);
      main.onchange = () => {
        $('[data-role=sub]', wrap).innerHTML = subOptions(main.value, null);
        $('[data-role=sub-field]', wrap).hidden = !(S().cat(main.value).subs || []).length;
      };
    });
  }
  function readCatPicker(root) {
    const wrap = $('[data-cat-picker]', root);
    return { categoryId: $('[data-role=main]', wrap).value, subId: $('[data-role=sub]', wrap).value || null };
  }

  // One compact dropdown of "main" and "main › sub" choices (value "catId|subId"), for tight rows.
  function catSubOptions(kind, catId, subId) {
    const cats = S().categories(kind);
    const block = (c) => `<optgroup label="${c.emoji} ${esc(S().catName(c))}">
      <option value="${c.id}|" ${c.id === catId && !subId ? 'selected' : ''}>${esc(S().catName(c))}</option>
      ${(c.subs || []).map((sub) => `<option value="${c.id}|${sub}" ${c.id === catId && sub === subId ? 'selected' : ''}>› ${esc(S().subName(c, sub))}</option>`).join('')}
    </optgroup>`;
    return cats.map(block).join('');
  }
  const parseCatSub = (v) => { const [categoryId, subId] = String(v).split('|'); return { categoryId, subId: subId || null }; };

  return { mainOptions, subOptions, catPicker, bindCatPicker, readCatPicker, catSubOptions, parseCatSub };
})();
