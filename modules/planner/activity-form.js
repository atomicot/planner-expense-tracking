/* Planner module: add / edit an activity — category + subcategory, priority (Eisenhower), repeat,
   and the money lines linked to it. Opened with an *instance* (see core/schedule.js): edits apply to
   the whole series; done-ness and money lines belong to the instance's day. */
App.parts.planner = (() => {
  const { esc, $, $$, todayISO, toMin, fromMin, durationMin } = App.util;
  const icons = App.icons;
  const { catPicker, bindCatPicker, readCatPicker, catSubOptions, parseCatSub } = App.components;
  const sched = App.schedule;
  const S = () => App.store;

  function roundNow() {
    const m = toMin(App.util.nowHHMM());
    return fromMin(Math.min(Math.ceil(m / 30) * 30, 23 * 60));
  }

  // 2×2 Eisenhower picker: columns urgent / not urgent, rows important / not important.
  function priorityPicker(selected) {
    const t = App.i18n.t;
    return `<div class="prio-grid" data-prio data-value="${selected || ''}">
      <span></span><span class="prio-axis">${t('urgent')}</span><span class="prio-axis">${t('notUrgent')}</span>
      <span class="prio-axis side">${t('important')}</span>${prioBtn('do', selected)}${prioBtn('plan', selected)}
      <span class="prio-axis side">${t('notImportant')}</span>${prioBtn('delegate', selected)}${prioBtn('later', selected)}
    </div>`;
  }
  function prioBtn(id, selected) {
    const t = App.i18n.t;
    const p = App.PRIORITIES.find((x) => x.id === id);
    return `<button type="button" class="prio-btn prio-${id} ${selected === id ? 'active' : ''}" data-v="${id}" aria-pressed="${selected === id}">
      <span class="e">${p.emoji}</span><span class="n">${t('prio.' + id)}</span><span class="h">${t('prio.' + id + '.hint')}</span></button>`;
  }

  function openActivity({ activity: inst, date, start } = {}) {
    const t = App.i18n.t;
    const editing = !!inst;
    const stored = editing ? S().data().activities.find((x) => x.id === inst.id) || inst : null;
    const st = start || roundNow();
    const a = stored || {
      title: '', date: date || todayISO(), start: st, end: fromMin(Math.min(toMin(st) + 60, 1439)),
      categoryId: 'a-work', subId: null, note: '', priority: null, repeat: null,
    };
    const day = editing ? inst.date : a.date; // the occurrence being edited
    const recurringNow = editing && sched.isRecurring(stored);
    const linked = editing ? sched.linked(S().data().transactions, inst) : [];
    const lines = linked.map((x) => ({ ...x }));
    const rep = (a.repeat && a.repeat.freq) || 'none';

    const lineHTML = (l, i) => `
      <div class="line-item" data-i="${i}">
        <div class="seg income-expense" data-role="type">
          <button type="button" data-v="expense" class="${l.type === 'expense' ? 'active' : ''}" aria-label="${t('expense')}">−</button>
          <button type="button" data-v="income" class="${l.type === 'income' ? 'active' : ''}" aria-label="${t('income')}">+</button>
        </div>
        <input class="input num" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${l.amount ?? ''}" data-role="amount" aria-label="${t('amount')}">
        <select class="select" data-role="cat" aria-label="${t('category')}">${catSubOptions(l.type, l.categoryId, l.subId)}</select>
        <button type="button" class="icon-btn plain" data-role="del" aria-label="${t('delete')}">${icons.x}</button>
      </div>`;

    App.ui.modal({
      title: editing ? t('act.edit') : t('act.new'),
      body: `
        <div class="field"><label for="a-title">${t('act.title')}</label>
          <input id="a-title" class="input" value="${esc(a.title)}" placeholder="${t('act.titlePh')}" maxlength="120"></div>
        ${catPicker('activity', a.categoryId, a.subId, 'a-cat')}
        <div class="row when">
          <div class="field"><label for="a-date" data-date-label>${rep === 'none' ? t('date') : t('act.startDate')}</label><input id="a-date" class="input" type="date" value="${a.date}"></div>
          <div class="field"><label for="a-start">${t('start')}</label><input id="a-start" class="input" type="time" value="${a.start}"></div>
          <div class="field"><label for="a-end">${t('end')}</label><input id="a-end" class="input" type="time" value="${a.end}"></div>
        </div>
        <div class="row">
          <div class="field"><label for="a-repeat">${t('act.repeat')}</label>
            <select id="a-repeat" class="select">${App.REPEATS.map((r) => `<option value="${r}" ${r === rep ? 'selected' : ''}>${t('rep.' + r)}</option>`).join('')}</select></div>
          <div class="field" data-until ${rep === 'none' ? 'hidden' : ''}><label for="a-until">${t('act.until')}</label>
            <input id="a-until" class="input" type="date" value="${(a.repeat && a.repeat.until) || ''}"></div>
        </div>
        ${recurringNow ? `<p class="muted tiny" style="margin:-6px 0 12px">↻ ${t('act.seriesNote')}</p>` : ''}
        <div class="field"><span class="label">${t('act.priority')}</span>${priorityPicker(a.priority)}</div>
        <div class="field"><label for="a-note">${t('note')}</label><textarea id="a-note" class="input" rows="2" placeholder="${t('notePh')}">${esc(a.note || '')}</textarea></div>
        ${editing ? `<label class="field" style="flex-direction:row;align-items:center;gap:10px;cursor:pointer">
          <input type="checkbox" id="a-done" ${inst.done ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary)">
          ${recurringNow ? t('act.doneOn', { d: App.i18n.date(day, 'short') }) : t('act.markDone')}</label>` : ''}
        <div class="subsection">
          <div class="subsection-head"><span class="label">${recurringNow ? t('act.moneyOn', { d: App.i18n.date(day, 'short') }) : t('act.money')}</span>
            <button type="button" class="btn soft sm" data-add-line>${icons.plus}${t('add')}</button></div>
          <div data-lines></div>
          <div class="muted tiny" data-lines-empty>${t('act.moneyHint')}</div>
        </div>`,
      foot: `${editing ? `<button class="btn danger" data-delete>${icons.trash}${t('delete')}</button>` : ''}
        <div class="right"><button class="btn ghost" data-close-btn>${t('cancel')}</button><button class="btn" data-save>${t('save')}</button></div>`,
      onMount(el, close) {
        bindCatPicker(el);

        // priority: click to pick, click again to clear
        const prio = $('[data-prio]', el);
        prio.addEventListener('click', (e) => {
          const b = e.target.closest('.prio-btn');
          if (!b) return;
          const v = prio.dataset.value === b.dataset.v ? '' : b.dataset.v;
          prio.dataset.value = v;
          $$('.prio-btn', prio).forEach((x) => { x.classList.toggle('active', x.dataset.v === v); x.setAttribute('aria-pressed', x.dataset.v === v); });
        });

        // repeat: show "until" and rename the date field
        $('#a-repeat', el).onchange = (e) => {
          const once = e.target.value === 'none';
          $('[data-until]', el).hidden = once;
          $('[data-date-label]', el).textContent = once ? t('date') : t('act.startDate');
        };

        // money lines
        const linesEl = $('[data-lines]', el);
        const drawLines = () => {
          linesEl.innerHTML = lines.map(lineHTML).join('');
          $('[data-lines-empty]', el).hidden = lines.length > 0;
        };
        const readLines = () => {
          $$('.line-item', el).forEach((row) => {
            const l = lines[+row.dataset.i];
            l.amount = parseFloat($('[data-role=amount]', row).value);
            Object.assign(l, parseCatSub($('[data-role=cat]', row).value));
          });
        };
        drawLines();
        $('[data-add-line]', el).onclick = () => {
          readLines();
          lines.push({ type: 'expense', amount: '', categoryId: 'e-food', subId: null });
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
            if (lines[i].type !== type) { lines[i].type = type; lines[i].categoryId = type === 'income' ? 'i-other' : 'e-food'; lines[i].subId = null; }
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
          const freq = $('#a-repeat', el).value;
          const until = $('#a-until', el).value || null;
          const startDate = $('#a-date', el).value || todayISO();
          if (freq !== 'none' && until && until < startDate) { App.ui.toast(t('err.untilBeforeStart')); return; }
          const data = {
            title, date: startDate, start: startV, end: endV, ...readCatPicker(el),
            priority: prio.dataset.value || null, note: $('#a-note', el).value.trim(),
            repeat: freq === 'none' ? null : { freq, until },
          };
          const willRecur = freq !== 'none';
          // done-ness: per day for recurring, a flag for one-offs
          if (editing) {
            const doneNow = $('#a-done', el).checked;
            if (willRecur) {
              const set = new Set((stored.doneDates || []));
              if (doneNow) set.add(day); else set.delete(day);
              data.doneDates = [...set].sort();
            } else data.done = doneNow;
          } else if (willRecur) data.doneDates = []; else data.done = false;

          const btn = $('[data-save]', el); btn.disabled = true;
          try {
            let id;
            if (editing) { await S().update('activities', stored.id, data); id = stored.id; } else { id = (await S().add('activities', data)).id; }
            // money lines belong to this day for a recurring activity, otherwise follow the activity's date
            const txDate = willRecur ? (editing ? day : startDate) : startDate;
            const keep = lines.filter((l) => l.amount > 0);
            const keepIds = new Set(keep.filter((l) => l.id).map((l) => l.id));
            await Promise.all(linked.filter((x) => !keepIds.has(x.id)).map((x) => S().remove('transactions', x.id)));
            const fresh = [];
            for (const l of keep) {
              const tx = { type: l.type, amount: l.amount, categoryId: l.categoryId, subId: l.subId || null, date: txDate, activityId: id, note: l.note || '' };
              if (l.id) {
                const old = linked.find((x) => x.id === l.id);
                if (old.amount !== tx.amount || old.type !== tx.type || old.categoryId !== tx.categoryId || (old.subId || null) !== tx.subId || old.date !== tx.date) await S().update('transactions', l.id, tx);
              } else fresh.push(tx);
            }
            if (fresh.length) await S().addMany('transactions', fresh);
            close();
            App.ui.toast(t('saved'));
          } catch (e) { console.error(e); App.ui.toast(t('err.generic')); btn.disabled = false; }
        };

        const del = $('[data-delete]', el);
        if (del) del.onclick = async () => {
          if (recurringNow) {
            const which = await App.ui.choice(t('act.deleteWhich'), [
              { value: 'one', label: t('act.deleteOne', { d: App.i18n.date(day, 'short') }) },
              { value: 'all', label: t('act.deleteAll'), danger: true },
            ]);
            if (!which) return;
            if (which === 'one') {
              await Promise.all(linked.map((x) => S().remove('transactions', x.id)));
              const skip = new Set(stored.skipDates || []); skip.add(day);
              const done = (stored.doneDates || []).filter((d) => d !== day);
              await S().update('activities', stored.id, { skipDates: [...skip].sort(), doneDates: done });
            } else {
              const all = S().data().transactions.filter((x) => x.activityId === stored.id);
              await Promise.all(all.map((x) => S().remove('transactions', x.id)));
              await S().remove('activities', stored.id);
            }
          } else {
            const ok = await App.ui.confirm(linked.length ? t('act.deleteConfirmMoney', { n: linked.length }) : t('act.deleteConfirm'), { okText: t('delete'), danger: true });
            if (!ok) return;
            await Promise.all(linked.map((x) => S().remove('transactions', x.id)));
            await S().remove('activities', stored.id);
          }
          close();
          App.ui.toast(t('deleted'));
        };
      },
    });
  }

  return { openActivity };
})();
