/* Money module page: month summary, filters, transactions grouped by day. */
(() => {
  const { esc, $, $$, todayISO, addMonths, startOfMonth, endOfMonth, sum, groupBy } = App.util;
  const icons = App.icons;
  const { openTransaction, txRow, bindTxRows } = App.parts.money;
  const S = () => App.store;
  let month = startOfMonth(todayISO());
  let typeFilter = 'all';
  let catFilter = null;

  function render(el) {
    const t = App.i18n.t;
    const d = S().data();
    const from = month, to = endOfMonth(month);
    const inMonth = d.transactions.filter((x) => x.date >= from && x.date <= to);
    const income = sum(inMonth.filter((x) => x.type === 'income'), (x) => x.amount);
    const expense = sum(inMonth.filter((x) => x.type === 'expense'), (x) => x.amount);
    const net = income - expense;

    let list = inMonth;
    if (typeFilter !== 'all') list = list.filter((x) => x.type === typeFilter);
    if (catFilter) list = list.filter((x) => x.categoryId === catFilter);
    list = list.slice().sort((p, q) => q.date.localeCompare(p.date) || (q.createdAt || 0) - (p.createdAt || 0));
    const groups = groupBy(list, (x) => x.date);

    // expense split by group (Needs / Wants / Savings / Other)
    const expByGroup = App.EXPENSE_GROUPS.map((g) => ({
      g, v: sum(inMonth.filter((x) => x.type === 'expense' && S().cat(x.categoryId).group === g.id), (x) => x.amount),
    })).filter((r) => r.v > 0);
    const splitCard = expense ? `
      <div class="card group-split">
        <div class="card-head"><h3>${t('money.split')}</h3><span class="sub">${App.i18n.money(expense)}</span></div>
        <div class="split-bar" role="img" aria-label="${t('money.split')}">${expByGroup.map((r) => `<i style="flex:${r.v};background:${App.color(r.g.color)}" title="${esc(t(r.g.key))}"></i>`).join('')}</div>
        <div class="split-legend">${expByGroup.map((r) => `<span class="li"><span class="sw" style="background:${App.color(r.g.color)}"></span>${esc(t(r.g.key))}
          <b class="num">${App.i18n.money(r.v)}</b><span class="muted num">${Math.round((r.v / expense) * 100)}%</span></span>`).join('')}</div>
      </div>` : '';

    const usedCats = [...new Set(inMonth.filter((x) => typeFilter === 'all' || x.type === typeFilter).map((x) => x.categoryId))]
      .map((id) => S().cat(id));

    el.innerHTML = `
      <div class="week-head">
        <div class="month">${App.i18n.monthYear(month)}</div>
        <div class="ctrls">
          <button class="icon-btn" data-m="-1" aria-label="${t('prevMonth')}">${icons.chevL}</button>
          <button class="btn ghost sm" data-this>${t('thisMonth')}</button>
          <button class="icon-btn" data-m="1" aria-label="${t('nextMonth')}">${icons.chevR}</button>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="k"><span class="dot" style="background:var(--income)"></span>${t('income')}</div>
          <div class="v">${App.i18n.money(income)}</div><div class="d">${t('itemsN', { n: inMonth.filter((x) => x.type === 'income').length })}</div></div>
        <div class="stat"><div class="k"><span class="dot" style="background:var(--expense)"></span>${t('expense')}</div>
          <div class="v">${App.i18n.money(expense)}</div><div class="d">${t('itemsN', { n: inMonth.filter((x) => x.type === 'expense').length })}</div></div>
        <div class="stat hero"><div class="k">${t('net')}</div>
          <div class="v" style="color:${net >= 0 ? 'var(--income)' : 'var(--expense)'}">${net >= 0 ? '+' : '−'}${App.i18n.money(Math.abs(net))}</div>
          <div class="d">${income ? t('savedPct', { p: Math.round((net / income) * 100) }) : '&nbsp;'}</div></div>
      </div>
      ${splitCard}
      <div class="filters">
        <div class="seg income-expense" data-filter>
          ${['all', 'expense', 'income'].map((v) => `<button data-v="${v}" class="${typeFilter === v ? 'active' : ''}">${t(v)}</button>`).join('')}
        </div>
        <div class="chips">${usedCats.map((c) => `<button class="chip ${catFilter === c.id ? 'active' : ''}" data-cf="${c.id}"><span>${c.emoji}</span>${esc(S().catName(c))}</button>`).join('')}</div>
      </div>
      <div class="card">
        ${list.length ? [...groups.entries()].map(([day, xs]) => {
          const dn = sum(xs, (x) => (x.type === 'income' ? x.amount : -x.amount));
          return `<div class="day-group">
            <div class="day-group-head"><b>${App.i18n.date(day, 'weekdayLong')}</b><span class="num">${dn >= 0 ? '+' : '−'}${App.i18n.money(Math.abs(dn))}</span></div>
            <div class="money-list">${xs.map((x) => txRow(x)).join('')}</div></div>`;
        }).join('') : `<div class="empty"><span class="em">🌷</span>${t('money.emptyMonth')}<br><br>
          <button class="btn soft sm" data-add>${icons.plus}${t('tx.new')}</button></div>`}
      </div>
      <button class="fab" data-add aria-label="${t('tx.new')}">${icons.plus}</button>`;

    $$('[data-m]', el).forEach((b) => b.onclick = () => { month = addMonths(month, +b.dataset.m); catFilter = null; render(el); });
    $('[data-this]', el).onclick = () => { month = startOfMonth(todayISO()); render(el); };
    $$('[data-filter] button', el).forEach((b) => b.onclick = () => { typeFilter = b.dataset.v; catFilter = null; render(el); });
    $$('[data-cf]', el).forEach((b) => b.onclick = () => { catFilter = catFilter === b.dataset.cf ? null : b.dataset.cf; render(el); });
    const defDate = todayISO() >= from && todayISO() <= to ? todayISO() : from;
    $$('[data-add]', el).forEach((b) => b.onclick = () => openTransaction({ date: defDate, type: typeFilter === 'income' ? 'income' : 'expense' }));
    bindTxRows(el);
  }

  App.modules.register({
    id: 'money',
    nav: { order: 20, icon: 'wallet' },
    scoped: true,
    render,
    api: { openTransaction, txRow, bindTxRows },
  });
})();
