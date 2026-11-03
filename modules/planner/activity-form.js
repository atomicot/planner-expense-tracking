/* Planner module: add / edit an activity, including the money lines linked to it. */
App.parts.planner = (() => {
  const { esc, $, $$, todayISO, toMin, fromMin, durationMin } = App.util;
  const icons = App.icons;
  const { catChips, bindCatChips, catOptions } = App.components;
  const S = () => App.store;

  function roundNow() {
    const m = toMin(App.util.nowHHMM());
    return fromMin(Math.min(Math.ceil(m / 30) * 30, 23 * 60));
  }

  function openActivity({ activity: act, date, start } = {}) {
    const t = App.i18n.t;
    const editing = !!act;
    const st = start || (act && act.start) || roundNow();
    const a = act || { title: '', date: date || todayISO(), start: st, end: fromMin(Math.min(toMin(st) + 60, 1439)), categoryId: 'a-work', note: '', done: false };
    const linked = editing ? S().data().transactions.filter((x) => x.activityId === act.id) : [];
    const lines = linked.map((x) => ({ ...x }));

    const lineHTML = (l, i) => `
      <div class="line-item" data-i="${i}">
        <div class="seg income-expense" data-role="type">
          <button type="button" data-v="expense" class="${l.type === 'expense' ? 'active' : ''}" aria-label="${t('expense')}">−</button>
          <button type="button" data-v="income" class="${l.type === 'income' ? 'active' : ''}" aria-label="${t('income')}">+</button>
        </div>
        <input class="input num" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${l.amount ?? ''}" data-role="amount" aria-label="${t('amount')}">
        <select class="select" data-role="cat" aria-label="${t('category')}">${catOptions(l.type, l.categoryId)}</select>
        <button type="button" class="icon-btn plain" data-role="del" aria-label="${t('delete')}">${icons.x}</button>
      </div>`;

    App.ui.modal({
      title: editing ? t('act.edit') : t('act.new'),
      body: `
        <div class="field"><label for="a-title">${t('act.title')}</label>
          <input id="a-title" class="input" value="${esc(a.title)}" placeholder="${t('act.titlePh')}" maxlength="120"></div>
        <div class="row">
          <div class="field"><label for="a-date">${t('date')}</label><input id="a-date" class="input" type="date" value="${a.date}"></div>
        </div>
        <div class="row">
          <div class="field"><label for="a-start">${t('start')}</label><input id="a-start" class="input" type="time" value="${a.start}"></div>
          <div class="field"><label for="a-end">${t('end')}</label><input id="a-end" class="input" type="time" value="${a.end}"></div>
        </div>
        <div class="field"><span class="label">${t('category')}</span>${catChips('activity', a.categoryId)}</div>
        <div class="field"><label for="a-note">${t('note')}</label><textarea id="a-note" class="input" rows="2" placeholder="${t('notePh')}">${esc(a.note || '')}</textarea></div>
        ${editing ? `<label class="field" style="flex-direction:row;align-items:center;gap:10px;cursor:pointer">
          <input type="checkbox" id="a-done" ${a.done ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary)"> ${t('act.markDone')}</label>` : ''}
        <div class="subsection">
          <div class="subsection-head"><span class="label">${t('act.money')}</span>
            <button type="button" class="btn soft sm" data-add-line>${icons.plus}${t('add')}</button></div>
          <div data-lines></div>
          <div class="muted tiny" data-lines-empty>${t('act.moneyHint')}</div>
        </div>`,
      foot: `${editing ? `<button class="btn danger" data-delete>${icons.trash}${t('delete')}</button>` : ''}
        <div class="right"><button class="btn ghost" data-close-btn>${t('cancel')}</button><button class="btn" data-save>${t('save')}</button></div>`,
      onMount(el, close) {
        bindCatChips(el);
        const linesEl = $('[data-lines]', el);
        const drawLines = () => {
          linesEl.innerHTML = lines.map(lineHTML).join('');
          $('[data-lines-empty]', el).hidden = lines.length > 0;
        };
        const readLines = () => {
          $$('.line-item', el).forEach((row) => {
            const l = lines[+row.dataset.i];
            l.amount = parseFloat($('[data-role=amount]', row).value);
            l.categoryId = $('[data-role=cat]', row).value;
          });
        };
        drawLines();
        $('[data-add-line]', el).onclick = () => {
          readLines();
          lines.push({ type: 'expense', amount: '', categoryId: 'e-food' });
          drawLines();
          const inputs = $$('[data-role=amount]', el);
          inputs[inputs.length - 1].focus();
        };
        linesEl.addEventListener('click', (e) => {
          const row = e.target.closest('.line-item');
          if (!row) return;
          const i = +row.dataset.i;
          const typeBtn = e.target.closest('[data-role=type] button');
          if (typeBtn) {
            readLines();
            const type = typeBtn.dataset.v;
            if (lines[i].type !== type) { lines[i].type = type; lines[i].categoryId = type === 'income' ? 'i-other' : 'e-food'; }
            drawLines();
          }
          if (e.target.closest('[data-role=del]')) { readLines(); lines.splice(i, 1); drawLines(); }
        });
        $('[data-close-btn]', el).onclick = close;

        $('[data-save]', el).onclick = async () => {
          readLines();
          const title = $('#a-title', el).value.trim();
          const startV = $('#a-start', el).value;
          const endV = $('#a-end', el).value;
          if (!title) { $('#a-title', el).focus(); App.ui.toast(t('err.titleRequired')); return; }
          if (!startV || !endV || durationMin(startV, endV) === 0) { App.ui.toast(t('err.timeRange')); return; }
          const data = {
            title, date: $('#a-date', el).value || todayISO(), start: startV, end: endV,
            categoryId: $('.cat-chips', el).dataset.value || 'a-other', note: $('#a-note', el).value.trim(),
          };
          if (editing) data.done = $('#a-done', el).checked;
          const btn = $('[data-save]', el); btn.disabled = true;
          try {
            let id;
            if (editing) { await S().update('activities', act.id, data); id = act.id; } else { id = (await S().add('activities', { ...data, done: false })).id; }
            // sync linked money lines
            const keep = lines.filter((l) => l.amount > 0);
            const keepIds = new Set(keep.filter((l) => l.id).map((l) => l.id));
            await Promise.all(linked.filter((x) => !keepIds.has(x.id)).map((x) => S().remove('transactions', x.id)));
            const fresh = [];
            for (const l of keep) {
              const tx = { type: l.type, amount: l.amount, categoryId: l.categoryId, date: data.date, activityId: id, note: l.note || '' };
              if (l.id) {
                const old = linked.find((x) => x.id === l.id);
                if (old.amount !== tx.amount || old.type !== tx.type || old.categoryId !== tx.categoryId || old.date !== tx.date) await S().update('transactions', l.id, tx);
              } else fresh.push(tx);
            }
            if (fresh.length) await S().addMany('transactions', fresh);
            close();
            App.ui.toast(t('saved'));
          } catch (e) { console.error(e); App.ui.toast(t('err.generic')); btn.disabled = false; }
        };

        const del = $('[data-delete]', el);
        if (del) del.onclick = async () => {
          const ok = await App.ui.confirm(linked.length ? t('act.deleteConfirmMoney', { n: linked.length }) : t('act.deleteConfirm'), { okText: t('delete'), danger: true });
          if (!ok) return;
          await Promise.all(linked.map((x) => S().remove('transactions', x.id)));
          await S().remove('activities', act.id);
          close();
          App.ui.toast(t('deleted'));
        };
      },
    });
  }

  return { openActivity };
})();
