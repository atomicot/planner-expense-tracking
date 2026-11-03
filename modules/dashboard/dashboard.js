/* Dashboard module page: where time and money went, for the current scope (personal or team) and range. */
(() => {
  const { esc, $, $$, todayISO, addDays, startOfWeek, startOfMonth, endOfMonth, daysBetween, durationMin, sum, groupBy, cssVar, initials } = App.util;
  const S = () => App.store;
  let preset = 'week';
  let custom = { from: addDays(todayISO(), -13), to: todayISO() };
  let charts = [];

  function range() {
    const today = todayISO();
    if (preset === 'today') return { from: today, to: today };
    if (preset === 'week') { const f = startOfWeek(today); return { from: f, to: addDays(f, 6) }; }
    if (preset === 'month') return { from: startOfMonth(today), to: endOfMonth(today) };
    return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
  }

  function destroyCharts() { charts.forEach((c) => c.destroy()); charts = []; }

  // Aggregate by category in the fixed category order, so colour follows the entity.
  function byCategory(items, kind, valueFn) {
    const order = S().categories(kind);
    const m = new Map();
    items.forEach((x) => m.set(x.categoryId, (m.get(x.categoryId) || 0) + valueFn(x)));
    const total = sum([...m.values()]);
    return order.filter((c) => m.get(c.id) > 0).map((c) => ({ cat: c, value: m.get(c.id), pct: total ? m.get(c.id) / total : 0 }))
      .concat([...m.keys()].filter((id) => !order.some((c) => c.id === id)).map((id) => ({ cat: S().cat(id), value: m.get(id), pct: total ? m.get(id) / total : 0 })));
  }

  function legendRows(rows, fmt) {
    return `<div class="legend">${rows.map((r) => `
      <div class="legend-row"><span class="sw" style="background:${r.cat.color}"></span>
        <span class="n">${r.cat.emoji} ${esc(S().catName(r.cat))}</span>
        <span class="val">${fmt(r.value)}</span><span class="pct">${Math.round(r.pct * 100)}%</span></div>`).join('')}</div>`;
  }

  function chartTheme() {
    return {
      text: cssVar('--text-2'), muted: cssVar('--muted'), grid: cssVar('--line-2'), surface: cssVar('--surface'),
      income: cssVar('--income'), expense: cssVar('--expense'), font: cssVar('--font') || 'sans-serif',
      tooltipBg: cssVar('--text'), tooltipText: cssVar('--surface'),
    };
  }

  function baseOptions(th) {
    return {
      responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: th.tooltipBg, titleColor: th.tooltipText, bodyColor: th.tooltipText, padding: 10, cornerRadius: 10,
          boxPadding: 4, usePointStyle: true, titleFont: { family: th.font, weight: '600' }, bodyFont: { family: th.font },
        },
      },
    };
  }

  function render(el) {
    destroyCharts();
    const t = App.i18n.t;
    const i18n = App.i18n;
    const d = S().data();
    const { from, to } = range();
    const days = daysBetween(from, to);
    const acts = d.activities.filter((a) => a.date >= from && a.date <= to);
    const txs = d.transactions.filter((x) => x.date >= from && x.date <= to);
    const mins = (a) => durationMin(a.start, a.end);
    const totalMin = sum(acts, mins);
    const doneMin = sum(acts.filter((a) => a.done), mins);
    const donePct = acts.length ? Math.round((acts.filter((a) => a.done).length / acts.length) * 100) : 0;
    const income = sum(txs.filter((x) => x.type === 'income'), (x) => x.amount);
    const expenses = txs.filter((x) => x.type === 'expense');
    const expense = sum(expenses, (x) => x.amount);
    const net = income - expense;

    const timeRows = byCategory(acts, 'activity', mins);
    const spendRows = byCategory(expenses, 'expense', (x) => x.amount);
    const multiDay = days.length > 1;
    const monthly = days.length > 62;
    const buckets = monthly ? [...new Set(days.map((x) => x.slice(0, 7)))] : days;
    const bucketOf = (iso) => (monthly ? iso.slice(0, 7) : iso);
    const bucketLabel = (b) => (monthly ? i18n.monthShort(b + '-01') : (days.length <= 7 ? `${i18n.weekday(b)} ${+b.slice(8)}` : `${+b.slice(8)}/${+b.slice(5, 7)}`));

    // top activities by linked expense
    const linkedCost = new Map();
    d.transactions.filter((x) => x.activityId && x.type === 'expense').forEach((x) => linkedCost.set(x.activityId, (linkedCost.get(x.activityId) || 0) + x.amount));
    const topActs = acts.filter((a) => linkedCost.get(a.id)).map((a) => ({ a, v: linkedCost.get(a.id) })).sort((p, q) => q.v - p.v).slice(0, 6);
    const topMax = topActs.length ? topActs[0].v : 1;

    const isTeam = S().isTeam();
    const team = S().team();
    const members = isTeam && team ? team.memberIds.map((uid) => {
      const ma = acts.filter((a) => a.createdBy === uid);
      const mt = txs.filter((x) => x.createdBy === uid);
      return {
        uid, name: S().memberName(uid), n: ma.length, min: sum(ma, mins), done: ma.filter((a) => a.done).length,
        exp: sum(mt.filter((x) => x.type === 'expense'), (x) => x.amount), inc: sum(mt.filter((x) => x.type === 'income'), (x) => x.amount),
      };
    }) : [];

    const didGroups = groupBy(acts.slice().sort((p, q) => q.date.localeCompare(p.date) || p.start.localeCompare(q.start)), (a) => a.date);

    el.innerHTML = `
      <div class="dash-filters">
        <div class="seg" data-preset>${['today', 'week', 'month', 'custom'].map((p) => `<button data-v="${p}" class="${preset === p ? 'active' : ''}">${t('range.' + p)}</button>`).join('')}</div>
        ${preset === 'custom' ? `<div class="range-inputs">
          <input class="input" type="date" data-from value="${custom.from}" aria-label="${t('from')}"><span class="muted">–</span>
          <input class="input" type="date" data-to value="${custom.to}" aria-label="${t('to')}"></div>`
          : `<span class="muted small">${i18n.date(from, 'short')}${from !== to ? ` – ${i18n.date(to, 'short')}` : ''}</span>`}
      </div>

      <div class="kpis">
        <div class="kpi hero"><div class="k">${t('kpi.time')}</div><div class="v">${i18n.hours(totalMin)}</div>
          <div class="s">${t('kpi.timeSub', { n: acts.length, avg: i18n.hours(Math.round(totalMin / days.length)) })}</div></div>
        <div class="kpi"><div class="k">${t('kpi.done')}</div><div class="v">${donePct}%</div>
          <div class="meter"><i style="width:${donePct}%"></i></div></div>
        <div class="kpi"><div class="k">${t('income')}</div><div class="v">${i18n.money(income)}</div><div class="s">${t('itemsN', { n: txs.length - expenses.length })}</div></div>
        <div class="kpi"><div class="k">${t('expense')}</div><div class="v">${i18n.money(expense)}</div><div class="s">${t('kpi.perDay', { v: i18n.money(Math.round(expense / days.length)) })}</div></div>
        <div class="kpi"><div class="k">${t('net')}</div><div class="v" style="color:${net >= 0 ? 'var(--income)' : 'var(--expense)'}">${net >= 0 ? '+' : '−'}${i18n.money(Math.abs(net))}</div>
          <div class="s">${t('kpi.doneTime', { v: i18n.hours(doneMin) })}</div></div>
      </div>

      <div class="dash-grid">
        <div class="card span-6">
          <div class="card-head"><h3>${t('dash.timeByCat')}</h3></div>
          ${timeRows.length ? `<div class="donut-wrap"><div class="chart-box donut"><canvas id="c-time" aria-label="${t('dash.timeByCat')}" role="img"></canvas>
            <div class="donut-center"><div><div class="v">${i18n.hours(totalMin)}</div><div class="k">${t('total')}</div></div></div></div>
            ${legendRows(timeRows, (v) => i18n.hours(v))}</div>` : empty('⏳', t('dash.noTime'))}
        </div>
        <div class="card span-6">
          <div class="card-head"><h3>${t('dash.spendByCat')}</h3></div>
          ${spendRows.length ? `<div class="donut-wrap"><div class="chart-box donut"><canvas id="c-spend" aria-label="${t('dash.spendByCat')}" role="img"></canvas>
            <div class="donut-center"><div><div class="v">${i18n.moneyCompact(expense)}</div><div class="k">${t('expense')}</div></div></div></div>
            ${legendRows(spendRows, (v) => i18n.money(v))}</div>` : empty('🧾', t('dash.noSpend'))}
        </div>

        ${multiDay ? `
        <div class="card span-7">
          <div class="card-head"><h3>${t('dash.hoursPerDay')} <span class="sub">· ${t(monthly ? 'perMonth' : 'perDay')}</span></h3></div>
          ${timeRows.length ? `<div class="legend inline">${timeRows.map((r) => `<span class="li"><span class="sw" style="background:${r.cat.color}"></span>${esc(S().catName(r.cat))}</span>`).join('')}</div>
            <div class="chart-box"><canvas id="c-days" role="img" aria-label="${t('dash.hoursPerDay')}"></canvas></div>
            ${tableView([t('date'), ...timeRows.map((r) => S().catName(r.cat))], buckets.filter((b) => acts.some((a) => bucketOf(a.date) === b)).map((b) =>
              [bucketLabel(b), ...timeRows.map((r) => i18n.hours(sum(acts.filter((a) => bucketOf(a.date) === b && a.categoryId === r.cat.id), mins)))]))}`
            : empty('📅', t('dash.noTime'))}
        </div>
        <div class="card span-5">
          <div class="card-head"><h3>${t('dash.incomeVsExpense')}</h3></div>
          ${txs.length ? `<div class="legend inline"><span class="li"><span class="sw" style="background:var(--income)"></span>${t('income')}</span>
            <span class="li"><span class="sw" style="background:var(--expense)"></span>${t('expense')}</span></div>
            <div class="chart-box"><canvas id="c-money" role="img" aria-label="${t('dash.incomeVsExpense')}"></canvas></div>
            ${tableView([t('date'), t('income'), t('expense')], buckets.filter((b) => txs.some((x) => bucketOf(x.date) === b)).map((b) => {
              const bx = txs.filter((x) => bucketOf(x.date) === b);
              return [bucketLabel(b), i18n.money(sum(bx.filter((x) => x.type === 'income'), (x) => x.amount)), i18n.money(sum(bx.filter((x) => x.type === 'expense'), (x) => x.amount))];
            }))}` : empty('💸', t('dash.noMoney'))}
        </div>` : ''}

        <div class="card ${multiDay ? 'span-5' : 'span-6'}">
          <div class="card-head"><h3>${t('dash.topCost')}</h3></div>
          ${topActs.length ? `<div class="bar-list">${topActs.map(({ a, v }) => {
            const c = S().cat(a.categoryId);
            return `<div class="bar-item"><div class="top"><span class="n">${c.emoji} ${esc(a.title)} <span class="muted tiny">· ${i18n.date(a.date, 'short')}</span></span><span class="v">${i18n.money(v)}</span></div>
              <div class="track"><i style="width:${(v / topMax) * 100}%;background:${c.color}"></i></div></div>`;
          }).join('')}</div>` : empty('🎯', t('dash.noTopCost'))}
        </div>
        <div class="card ${multiDay ? 'span-7' : 'span-6'}">
          <div class="card-head"><h3>${t('dash.whatIDid')}</h3><span class="sub">${t('activitiesN', { n: acts.length })}</span></div>
          ${acts.length ? `<div class="did-list">${[...didGroups.entries()].map(([day, xs]) => `
            <div class="did-day">${i18n.date(day, 'weekdayLong')}</div>
            ${xs.map((a) => { const c = S().cat(a.categoryId); return `<div class="did-item ${a.done ? 'done' : ''}">
              <span class="tm">${a.start}–${a.end}</span><span class="sw" style="background:${c.color}"></span>
              <span class="n">${a.done ? '✓ ' : ''}${esc(a.title)}${isTeam ? ` <span class="muted tiny">· ${esc(S().memberName(a.createdBy))}</span>` : ''}</span>
              <span class="muted tiny num">${i18n.hours(mins(a))}</span></div>`; }).join('')}`).join('')}</div>` : empty('🌱', t('dash.noTime'))}
        </div>

        ${isTeam ? `
        <div class="card span-12">
          <div class="card-head"><h3>${t('dash.members')}</h3><span class="sub">${esc(team ? team.name : '')}</span></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>${t('member')}</th><th class="r">${t('activities')}</th><th class="r">${t('hours')}</th><th class="r">${t('kpi.done')}</th>
              <th class="r">${t('expense')}</th><th class="r">${t('income')}</th><th style="width:28%">${t('dash.shareTime')}</th></tr></thead>
            <tbody>${members.map((m) => `<tr>
              <td><span style="display:inline-flex;align-items:center;gap:8px"><span class="avatar sm">${esc(initials(m.name))}</span>${esc(m.name)}</span></td>
              <td class="r">${m.n}</td><td class="r">${i18n.hours(m.min)}</td><td class="r">${m.n ? Math.round((m.done / m.n) * 100) : 0}%</td>
              <td class="r">${i18n.money(m.exp)}</td><td class="r">${i18n.money(m.inc)}</td>
              <td><div class="bar-item"><div class="track"><i style="width:${totalMin ? (m.min / totalMin) * 100 : 0}%;background:var(--primary)"></i></div></div></td>
            </tr>`).join('')}</tbody></table></div>
        </div>` : ''}
      </div>`;

    // ---- events ----
    $$('[data-preset] button', el).forEach((b) => b.onclick = () => { preset = b.dataset.v; render(el); });
    const f = $('[data-from]', el), tt = $('[data-to]', el);
    if (f) f.onchange = () => { custom.from = f.value || custom.from; render(el); };
    if (tt) tt.onchange = () => { custom.to = tt.value || custom.to; render(el); };

    // ---- charts ----
    if (!window.Chart) return;
    const th = chartTheme();
    Chart.defaults.font.family = th.font;
    Chart.defaults.color = th.text;

    const donut = (id, rows, fmt) => {
      const c = $(id, el);
      if (!c) return;
      charts.push(new Chart(c, {
        type: 'doughnut',
        data: { labels: rows.map((r) => `${r.cat.emoji} ${S().catName(r.cat)}`), datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => r.cat.color), borderColor: th.surface, borderWidth: 2, hoverOffset: 4, borderRadius: 4 }] },
        options: { ...baseOptions(th), cutout: '70%', plugins: { ...baseOptions(th).plugins, tooltip: { ...baseOptions(th).plugins.tooltip, callbacks: { label: (ctx) => ` ${fmt(ctx.parsed)} · ${Math.round(rows[ctx.dataIndex].pct * 100)}%` } } } },
      }));
    };
    donut('#c-time', timeRows, (v) => i18n.hours(v));
    donut('#c-spend', spendRows, (v) => i18n.money(v));

    const axes = (yFmt) => ({
      x: { stacked: false, grid: { display: false }, border: { color: th.grid }, ticks: { color: th.muted, maxRotation: 0, autoSkip: true, autoSkipPadding: 8 } },
      y: { beginAtZero: true, grid: { color: th.grid }, border: { display: false }, ticks: { color: th.muted, maxTicksLimit: 5, callback: yFmt } },
    });

    const cDays = $('#c-days', el);
    if (cDays) {
      const o = { ...baseOptions(th), scales: axes((v) => `${v}h`), interaction: { mode: 'index', intersect: false } };
      o.scales.x.stacked = true; o.scales.y.stacked = true;
      o.plugins.tooltip.callbacks = {
        label: (ctx) => (ctx.parsed.y ? ` ${ctx.dataset.label}: ${i18n.hours(Math.round(ctx.parsed.y * 60))}` : null),
        footer: (items) => `${t('total')}: ${i18n.hours(Math.round(sum(items, (i) => i.parsed.y) * 60))}`,
      };
      charts.push(new Chart(cDays, {
        type: 'bar',
        data: {
          labels: buckets.map(bucketLabel),
          datasets: timeRows.map((r) => ({
            label: S().catName(r.cat), backgroundColor: r.cat.color, borderColor: th.surface, borderWidth: { top: 2 }, borderSkipped: 'start',
            borderRadius: 4, maxBarThickness: 24,
            data: buckets.map((b) => sum(acts.filter((a) => bucketOf(a.date) === b && a.categoryId === r.cat.id), mins) / 60),
          })),
        },
        options: o,
      }));
    }

    const cMoney = $('#c-money', el);
    if (cMoney) {
      const o = { ...baseOptions(th), scales: axes((v) => i18n.moneyCompact(v)), interaction: { mode: 'index', intersect: false } };
      o.plugins.tooltip.callbacks = { label: (ctx) => ` ${ctx.dataset.label}: ${i18n.money(ctx.parsed.y)}` };
      const series = (type) => buckets.map((b) => sum(txs.filter((x) => x.type === type && bucketOf(x.date) === b), (x) => x.amount));
      charts.push(new Chart(cMoney, {
        type: 'bar',
        data: {
          labels: buckets.map(bucketLabel),
          datasets: [
            { label: t('income'), data: series('income'), backgroundColor: th.income, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 14, categoryPercentage: 0.7, barPercentage: 0.9 },
            { label: t('expense'), data: series('expense'), backgroundColor: th.expense, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 14, categoryPercentage: 0.7, barPercentage: 0.9 },
          ],
        },
        options: o,
      }));
    }
  }

  function empty(em, text) { return `<div class="empty"><span class="em">${em}</span>${esc(text)}</div>`; }

  function tableView(head, rows) {
    if (!rows.length) return '';
    return `<details class="table-view"><summary>${App.i18n.t('showTable')}</summary><div class="table-wrap"><table class="table">
      <thead><tr>${head.map((h, i) => `<th class="${i ? 'r' : ''}">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i ? 'r' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  }

  App.modules.register({
    id: 'dashboard',
    nav: { order: 30, icon: 'chart' },
    scoped: true,
    render,
    destroy: destroyCharts,
  });
})();
