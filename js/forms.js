/* Add / edit modals for activities and transactions (shared by Planner, Money and Dashboard). */
App.forms = (() => {
  const { esc, icons, $, $$, todayISO, toMin, fromMin, durationMin } = App.util;
  const S = () => App.store;

  function catChips(kind, selected, name) {
    return `<div class="chips cat-chips" data-name="${name}">${S().categories(kind).map((c) => `
      <button type="button" class="chip ${c.id === selected ? 'active' : ''}" data-cat="${c.id}">
        <span>${c.emoji}</span>${esc(S().catName(c))}</button>`).join('')}</div>`;
  }
  function bindChips(root) {
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
  const catOptions = (kind, selected) => S().categories(kind)
    .map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.emoji} ${esc(S().catName(c))}</option>`).join('');

  // ---------- Activity ----------
  function activity({ activity: act, date, start } = {}) {
    const t = App.i18n.t;
    const editing = !!act;
    const st = start || (act && act.start) || roundNow();
    const a = act || { title: '', date: date || todayISO(), start: st, end: fromMin(Math.min(toMin(st) + 60, 1439)), categoryId: 'a-work', note: '', done: false };
    const linked = editing ? S().data().transactions.filter((x) => x.activityId === act.id) : [];
    let lines = linked.map((x) => ({ ...x }));

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
        <div class="field"><span class="label">${t('category')}</span>${catChips('activity', a.categoryId, 'cat')}</div>
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
        bindChips(el);
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

  // ---------- Transaction ----------
  function transaction({ tx, date, type, activityId } = {}) {
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
        <div class="field"><span class="label">${t('category')}</span><div data-cats>${catChips(curType, x.categoryId, 'cat')}</div></div>
        <div class="row">
          <div class="field"><label for="t-date">${t('date')}</label><input id="t-date" class="input" type="date" value="${x.date}"></div>
          <div class="field"><label for="t-act">${t('tx.activity')}</label><select id="t-act" class="select">${actOptions(x.date, x.activityId)}</select></div>
        </div>
        <div class="field"><label for="t-note">${t('note')}</label><input id="t-note" class="input" value="${esc(x.note || '')}" placeholder="${t('tx.notePh')}" maxlength="140"></div>`,
      foot: `${editing ? `<button class="btn danger" data-delete>${icons.trash}${t('delete')}</button>` : ''}
        <div class="right"><button class="btn ghost" data-close-btn>${t('cancel')}</button><button class="btn" data-save>${t('save')}</button></div>`,
      onMount(el, close) {
        bindChips(el);
        $$('[data-type] button', el).forEach((b) => b.onclick = () => {
          if (curType === b.dataset.v) return;
          curType = b.dataset.v;
          $$('[data-type] button', el).forEach((y) => y.classList.toggle('active', y === b));
          $('[data-cats]', el).innerHTML = catChips(curType, curType === 'income' ? 'i-salary' : 'e-food', 'cat');
          bindChips(el);
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

  function roundNow() {
    const m = toMin(App.util.nowHHMM());
    return fromMin(Math.min(Math.ceil(m / 30) * 30, 23 * 60));
  }

  // A transaction row (used in Planner and Money).
  function txRow(x, { showDate } = {}) {
    const t = App.i18n.t;
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

  return { activity, transaction, txRow };
})();
