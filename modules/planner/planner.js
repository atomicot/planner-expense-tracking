/* Planner module page: week strip, day timeline with activity blocks, and the day's money.
   The money card uses App.api('money') and is hidden when the money module isn't loaded. */
(() => {
  const { esc, $, $$, todayISO, addDays, startOfWeek, toMin, durationMin, sum, initials } = App.util;
  const icons = App.icons;
  const { openActivity } = App.parts.planner;
  const S = () => App.store;
  const HOUR_PX = 60;
  let date = todayISO();
  let nowTimer = null;

  // Assign overlapping blocks to side-by-side columns.
  function layout(acts) {
    const items = acts.map((a) => {
      const s = toMin(a.start);
      return { a, s, e: s + Math.max(durationMin(a.start, a.end), 1) };
    }).sort((p, q) => p.s - q.s || q.e - p.e);
    let cluster = [], clusterEnd = -1;
    const flush = () => {
      const cols = [];
      cluster.forEach((it) => {
        let c = cols.findIndex((end) => end <= it.s);
        if (c === -1) { c = cols.length; cols.push(0); }
        cols[c] = it.e; it.col = c;
      });
      cluster.forEach((it) => { it.cols = cols.length; });
    };
    items.forEach((it) => {
      if (it.s >= clusterEnd && cluster.length) { flush(); cluster = []; }
      cluster.push(it);
      clusterEnd = Math.max(clusterEnd, it.e);
    });
    if (cluster.length) flush();
    return items;
  }

  function render(el) {
    const t = App.i18n.t;
    const money = App.api('money');
    const d = S().data();
    const week0 = startOfWeek(date);
    const days = Array.from({ length: 7 }, (_, i) => addDays(week0, i));
    const today = todayISO();
    const acts = d.activities.filter((a) => a.date === date);
    const txs = d.transactions.filter((x) => x.date === date).sort((p, q) => (q.createdAt || 0) - (p.createdAt || 0));
    const minutes = sum(acts, (a) => durationMin(a.start, a.end));
    const income = sum(txs.filter((x) => x.type === 'income'), (x) => x.amount);
    const expense = sum(txs.filter((x) => x.type === 'expense'), (x) => x.amount);
    const doneN = acts.filter((a) => a.done).length;

    // timeline range
    let h0 = 6;
    const h1 = 24;
    acts.forEach((a) => { h0 = Math.min(h0, Math.floor(toMin(a.start) / 60)); });
    const hours = Array.from({ length: h1 - h0 }, (_, i) => h0 + i);
    const items = layout(acts);
    const costOf = (id) => {
      const lx = d.transactions.filter((x) => x.activityId === id);
      return sum(lx, (x) => (x.type === 'income' ? x.amount : -x.amount));
    };

    const blocks = items.map((it) => {
      const a = it.a; const c = S().cat(a.categoryId);
      const top = it.s - h0 * 60;
      const height = Math.max(Math.min(it.e, h1 * 60) - it.s, 30);
      const w = 100 / it.cols;
      const net = costOf(a.id);
      const short = height < 50;
      return `<div class="tl-block ${a.done ? 'done' : ''}" data-act="${a.id}" tabindex="0" role="button"
        style="top:${top}px;height:${height}px;left:calc(${w * it.col}% + 2px);width:calc(${w}% - 4px);
        background:color-mix(in srgb, ${c.color} 24%, var(--surface));box-shadow:inset 4px 0 0 ${c.color}">
        <div class="t"><button class="check" data-check="${a.id}" aria-label="${t('act.markDone')}">${a.done ? icons.check : ''}</button>
          <span>${c.emoji}</span><span class="title">${esc(a.title)}</span>
          ${short && net ? `<span class="m"><span class="cost">${net > 0 ? '+' : '−'}${App.i18n.money(Math.abs(net))}</span></span>` : ''}</div>
        ${short ? '' : `<div class="m"><span>${a.start}–${a.end}</span>
          ${net ? `<span class="cost">${net > 0 ? '+' : '−'}${App.i18n.money(Math.abs(net))}</span>` : ''}
          ${S().isTeam() ? `<span class="avatar xs" title="${esc(S().memberName(a.createdBy))}">${esc(initials(S().memberName(a.createdBy)))}</span>` : ''}</div>`}
      </div>`;
    }).join('');

    const moneyCard = money ? `
        <div class="card">
          <div class="card-head"><h3>${t('dayMoney')}</h3>
            <button class="btn soft sm" data-add-tx>${icons.plus}${t('add')}</button></div>
          ${txs.length ? `<div class="money-list">${txs.map((x) => money.txRow(x)).join('')}</div>`
            : `<div class="empty"><span class="em">🪙</span>${t('money.emptyDay')}</div>`}
          ${txs.length ? `<div class="set-row" style="border-top:1px solid var(--line);margin-top:6px;padding-bottom:0">
            <span class="muted small">${t('net')}</span><b class="num" style="color:${income - expense >= 0 ? 'var(--income)' : 'var(--expense)'}">${income - expense >= 0 ? '+' : '−'}${App.i18n.money(Math.abs(income - expense))}</b></div>` : ''}
        </div>` : '';

    el.innerHTML = `
      <div class="week-head">
        <div class="month">${App.i18n.monthYear(date)}</div>
        <div class="ctrls">
          <button class="icon-btn" data-nav="-7" aria-label="${t('prevWeek')}">${icons.chevL}</button>
          <button class="btn ghost sm" data-today>${t('today')}</button>
          <button class="icon-btn" data-nav="7" aria-label="${t('nextWeek')}">${icons.chevR}</button>
        </div>
      </div>
      <div class="week-strip">${days.map((dd) => {
        const n = d.activities.filter((a) => a.date === dd).length;
        return `<button class="day-pill ${dd === date ? 'active' : ''} ${dd === today ? 'today' : ''}" data-day="${dd}">
          <span class="wd">${App.i18n.weekday(dd)}</span><span class="dn">${+dd.slice(8)}</span>
          <span class="dots">${'<i></i>'.repeat(Math.min(n, 3))}</span></button>`;
      }).join('')}</div>
      <div class="summary-chips">
        <div class="sum-chip"><span class="ic">🗓️</span><div><div class="v num">${acts.length}</div><div class="k">${t('activities')}${acts.length ? ` · ${t('doneN', { n: doneN })}` : ''}</div></div></div>
        <div class="sum-chip"><span class="ic">⏱️</span><div><div class="v num">${App.i18n.hours(minutes)}</div><div class="k">${t('plannedTime')}</div></div></div>
        ${money ? `<div class="sum-chip"><span class="ic" style="background:var(--expense-soft)">💸</span><div><div class="v num">${App.i18n.money(expense)}</div><div class="k">${t('expense')}</div></div></div>
        <div class="sum-chip"><span class="ic" style="background:var(--income-soft)">💰</span><div><div class="v num">${App.i18n.money(income)}</div><div class="k">${t('income')}</div></div></div>` : ''}
      </div>
      <div class="planner-grid ${money ? '' : 'solo'}">
        <div class="card">
          <div class="card-head"><h3>${t('schedule')} <span class="sub">· ${App.i18n.date(date, 'long')}</span></h3>
            <button class="btn soft sm" data-add-act>${icons.plus}${t('act.new')}</button></div>
          <div class="timeline" style="height:${hours.length * HOUR_PX}px">
            ${hours.map((h) => `<div class="tl-hour"><span class="h num">${String(h).padStart(2, '0')}:00</span><div class="slot" data-hour="${h}" title="${t('act.addAt', { h: String(h).padStart(2, '0') + ':00' })}"></div></div>`).join('')}
            <div class="tl-blocks">${blocks}</div>
            ${date === today ? `<div class="tl-now" data-now></div>` : ''}
          </div>
          ${acts.length ? '' : `<p class="muted small" style="text-align:center;margin:8px 0 0">${t('planner.emptyHint')}</p>`}
        </div>
        ${moneyCard}
      </div>
      <button class="fab" data-add-act aria-label="${t('act.new')}">${icons.plus}</button>`;

    // position the "now" line
    const tl = $('.timeline', el);
    const placeNow = () => {
      const n = $('[data-now]', el);
      if (n) n.style.top = `${toMin(App.util.nowHHMM()) - h0 * 60}px`;
    };
    placeNow();
    clearInterval(nowTimer);
    nowTimer = setInterval(placeNow, 60000);

    // events
    $$('[data-day]', el).forEach((b) => b.onclick = () => { date = b.dataset.day; render(el); });
    $$('[data-nav]', el).forEach((b) => b.onclick = () => { date = addDays(date, +b.dataset.nav); render(el); });
    $('[data-today]', el).onclick = () => { date = todayISO(); render(el); };
    $$('[data-add-act]', el).forEach((b) => b.onclick = () => openActivity({ date }));
    if (money) {
      $('[data-add-tx]', el).onclick = () => money.openTransaction({ date });
      money.bindTxRows(el);
    }
    tl.addEventListener('click', (e) => {
      const chk = e.target.closest('[data-check]');
      if (chk) {
        e.stopPropagation();
        const a = d.activities.find((x) => x.id === chk.dataset.check);
        S().update('activities', a.id, { done: !a.done });
        return;
      }
      const blk = e.target.closest('[data-act]');
      if (blk) { openActivity({ activity: d.activities.find((x) => x.id === blk.dataset.act) }); return; }
      const slot = e.target.closest('[data-hour]');
      if (slot) openActivity({ date, start: `${String(slot.dataset.hour).padStart(2, '0')}:00` });
    });
    tl.addEventListener('keydown', (e) => {
      const blk = e.target.closest('[data-act]');
      if (blk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); blk.click(); }
    });
  }

  App.modules.register({
    id: 'planner',
    nav: { order: 10, icon: 'calendar' },
    scoped: true,
    render,
    destroy() { clearInterval(nowTimer); },
    api: { openActivity, setDate(d) { date = d; } },
  });
})();
