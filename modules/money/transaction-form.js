/* Money module: add / edit a transaction, and the transaction row used in lists.
   Exposed to other modules through App.api('money'). */
App.parts.money = (() => {
  const { esc, $, $$, todayISO } = App.util;
  const icons = App.icons;
  const { catChips, bindCatChips } = App.components;
  const S = () => App.store;

  function openTransaction({ tx, date, type, activityId } = {}) {
    const t = App.i18n.t;
    const editing = !!tx;
    const x = tx || { type: type || 'expense', amount: '', date: date || todayISO(), categoryId: (type === 'income' ? 'i-salary' : 'e-food'), activityId: activityId || null, note: '' };
    let curType = x.type;

    const actOptions = (d, sel) => {
      const acts = S().data().activities.filter((a) => a.date === d).sort((p, q) => p.start.localeCompare(q.start));
      return `<option value="">${t('tx.noActivity')}</option>` + acts.map((a) =>
        `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${a.start} · ${esc(a.title)}</option>`).join('');
    };

    App.ui.modal({
      title: editing ? t('tx.edit') : t('tx.new'),
      body: `
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          <div class="seg income-expense" data-type>
            <button type="button" data-v="expense" class="${curType === 'expense' ? 'active' : ''}">${t('expense')}</button>
            <button type="button" data-v="income" class="${curType === 'income' ? 'active' : ''}">${t('income')}</button>
          </div></div>
        <div class="field"><label for="t-amount" class="sr-only">${t('amount')}</label>
          <input id="t-amount" class="input amount-input" type="number" inputmode="decimal" min="0" step="any" placeholder="฿0" value="${x.amount}"></div>
        <div class="field"><span class="label">${t('category')}</span><div data-cats>${catChips(curType, x.categoryId)}</div></div>
        <div class="row">
          <div class="field"><label for="t-date">${t('date')}</label><input id="t-date" class="input" type="date" value="${x.date}"></div>
          <div class="field"><label for="t-act">${t('tx.activity')}</label><select id="t-act" class="select">${actOptions(x.date, x.activityId)}</select></div>
        </div>
        <div class="field"><label for="t-note">${t('note')}</label><input id="t-note" class="input" value="${esc(x.note || '')}" placeholder="${t('tx.notePh')}" maxlength="140"></div>`,
      foot: `${editing ? `<button class="btn danger" data-delete>${icons.trash}${t('delete')}</button>` : ''}
        <div class="right"><button class="btn ghost" data-close-btn>${t('cancel')}</button><button class="btn" data-save>${t('save')}</button></div>`,
      onMount(el, close) {
        bindCatChips(el);
        $$('[data-type] button', el).forEach((b) => b.onclick = () => {
          if (curType === b.dataset.v) return;
          curType = b.dataset.v;
          $$('[data-type] button', el).forEach((y) => y.classList.toggle('active', y === b));
          $('[data-cats]', el).innerHTML = catChips(curType, curType === 'income' ? 'i-salary' : 'e-food');
          bindCatChips(el);
        });
        $('#t-date', el).onchange = (e) => { $('#t-act', el).innerHTML = actOptions(e.target.value, null); };
        $('[data-close-btn]', el).onclick = close;
        $('[data-save]', el).onclick = async () => {
          const amount = parseFloat($('#t-amount', el).value);
          if (!(amount > 0)) { $('#t-amount', el).focus(); App.ui.toast(t('err.amount')); return; }
          const data = {
            type: curType, amount, date: $('#t-date', el).value || todayISO(),
            categoryId: $('.cat-chips', el).dataset.value || (curType === 'income' ? 'i-other' : 'e-other'),
            activityId: $('#t-act', el).value || null, note: $('#t-note', el).value.trim(),
          };
          const btn = $('[data-save]', el); btn.disabled = true;
          try {
            if (editing) await S().update('transactions', tx.id, data); else await S().add('transactions', data);
            close();
            App.ui.toast(t('saved'));
          } catch (e) { console.error(e); App.ui.toast(t('err.generic')); btn.disabled = false; }
        };
        const del = $('[data-delete]', el);
        if (del) del.onclick = async () => {
          if (!(await App.ui.confirm(t('tx.deleteConfirm'), { okText: t('delete'), danger: true }))) return;
          await S().remove('transactions', tx.id);
          close();
          App.ui.toast(t('deleted'));
        };
      },
    });
  }

  // One transaction row (used by the Money page and the Planner's day money card).
  function txRow(x, { showDate } = {}) {
    const c = S().cat(x.categoryId);
    const act = x.activityId ? S().data().activities.find((a) => a.id === x.activityId) : null;
    const who = S().isTeam() ? `<span>· ${esc(S().memberName(x.createdBy))}</span>` : '';
    return `<div class="tx-row" data-tx="${x.id}" tabindex="0" role="button">
      <span class="tx-ic" style="background:color-mix(in srgb, ${c.color} 22%, var(--surface))">${c.emoji}</span>
      <div class="tx-main"><div class="a">${esc(x.note || S().catName(c))}</div>
        <div class="b">${x.note ? `<span>${esc(S().catName(c))}</span>` : ''}${showDate ? `<span>${App.i18n.date(x.date, 'short')}</span>` : ''}
          ${act ? `<span class="tag">${icons.clock.replace('<svg', '<svg width="11" height="11"')}${esc(act.title)}</span>` : ''}${who}</div></div>
      <div class="tx-amt ${x.type}">${x.type === 'income' ? '+' : '−'}${App.i18n.money(x.amount)}</div>
    </div>`;
  }

  // Make rendered rows open the edit form.
  function bindTxRows(root) {
    $$('[data-tx]', root).forEach((r) => {
      const open = () => openTransaction({ tx: S().data().transactions.find((x) => x.id === r.dataset.tx) });
      r.onclick = open;
      r.onkeydown = (e) => { if (e.key === 'Enter') open(); };
    });
  }

  return { openTransaction, txRow, bindTxRows };
})();
