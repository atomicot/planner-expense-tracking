/* Settings module: export / import a scope's data as JSON. */
App.parts.settings = App.parts.settings || {};

App.parts.settings.exportJSON = function exportJSON(scope) {
  const s = App.store;
  const d = s.data(scope);
  const payload = {
    app: 'uri-planner', version: 1, exportedAt: new Date().toISOString(),
    scope: { type: scope.type, name: s.scopeName(scope) },
    activities: d.activities, transactions: d.transactions, categories: d.categories,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `uri-planner-${scope.type}-${App.util.todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

App.parts.settings.importJSON = async function importJSON(file, scope) {
  const t = App.i18n.t;
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!['uri-planner', 'pastel-planner'].includes(data.app)) throw new Error('format');
    const s = App.store;
    const clean = (arr) => (Array.isArray(arr) ? arr.filter((x) => x && typeof x.id === 'string') : []);
    const acts = clean(data.activities), txs = clean(data.transactions), cats = clean(data.categories);
    if (cats.length) await s.adapter.addMany(scope, 'categories', cats);
    if (acts.length) await s.adapter.addMany(scope, 'activities', acts);
    if (txs.length) await s.adapter.addMany(scope, 'transactions', txs);
    App.ui.toast(t('set.imported', { n: acts.length + txs.length }));
  } catch (e) {
    console.error(e);
    App.ui.toast(t('set.importError'));
  }
};
