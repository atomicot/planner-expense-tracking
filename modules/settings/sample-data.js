/* Settings module: two weeks of believable sample data so the dashboard has something to show —
   categories with subcategories, priorities, two recurring activities, and Needs / Wants / Savings spending. */
App.parts.settings = App.parts.settings || {};

App.parts.settings.addSample = async function addSample(scope) {
  const { todayISO, addDays, fromMin } = App.util;
  const th = App.prefs.get().lang === 'th';
  const s = App.store;
  const team = scope.type === 'team' ? s.team(scope.id) : null;
  const people = team ? team.memberIds : [s.user.id];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const L = (thText, enText) => (th ? thText : enText);
  const first = addDays(todayISO(), -13);
  const acts = [], txs = [];
  const tx = (o) => txs.push({ activityId: null, subId: null, note: '', ...o });

  // ---- recurring ----
  const pastDays = (n) => Array.from({ length: n }, (_, i) => addDays(first, i)).filter((d) => d < todayISO());
  acts.push({
    id: App.util.uid(), title: L('ประชุมทีมประจำสัปดาห์', 'Weekly team meeting'), date: first, start: '10:00', end: '11:00',
    categoryId: 'a-work', subId: 'meeting', priority: 'do', repeat: { freq: 'weekly', until: null }, note: '',
    doneDates: pastDays(14), createdBy: people[0], createdAt: Date.now(),
  });
  acts.push({
    id: App.util.uid(), title: L('วิ่งตอนเช้า', 'Morning run'), date: first, start: '06:30', end: '07:15',
    categoryId: 'a-health', subId: 'exercise', priority: 'plan', repeat: { freq: 'weekdays', until: null }, note: '',
    doneDates: pastDays(14).filter(() => Math.random() < 0.75), createdBy: pick(people), createdAt: Date.now(),
  });

  // ---- one-off activities, day by day ----
  const plans = {
    work: [['assignment', L('ทำรายงานส่งหัวหน้า', 'Report for manager')], ['project', L('ออกแบบหน้าจอใหม่', 'Design new screens')], ['deadline', L('ปิดงานก่อน deadline', 'Wrap up before deadline')]],
    afternoon: [['a-work', 'project', L('ทำโปรเจกต์ลูกค้า', 'Client project')], ['a-growth', 'course', L('เรียนคอร์สออนไลน์', 'Online course')], ['a-growth', 'reading', L('อ่านหนังสือ', 'Reading')]],
    evening: [['a-errands', 'shopping', L('ซื้อของเข้าบ้าน', 'Grocery run')], ['a-family', 'friends', L('เจอเพื่อน', 'Meet friends')], ['a-family', 'familytime', L('ทานข้าวกับครอบครัว', 'Family dinner')],
      ['a-leisure', 'movie', L('ดูหนัง', 'Movie night')], ['a-leisure', 'hobby', L('วาดรูป', 'Drawing')], ['a-errands', 'cleaning', L('ทำความสะอาดห้อง', 'Clean the room')]],
  };
  for (let i = -13; i <= 1; i++) {
    const date = addDays(todayISO(), i);
    const past = i < 0;
    const add = (o) => { const id = App.util.uid(); acts.push({ id, date, note: '', repeat: null, done: past && Math.random() < 0.85, createdBy: pick(people), createdAt: Date.now(), ...o }); return id; };

    const [wsub, wtitle] = pick(plans.work);
    add({ title: wtitle, start: '13:00', end: fromMin(13 * 60 + pick([90, 120, 150])), categoryId: 'a-work', subId: wsub, priority: pick(['do', 'plan', 'plan', 'delegate']) });
    if (Math.random() < 0.8) {
      const [cat, sub, title] = pick(plans.afternoon);
      add({ title, start: '16:00', end: fromMin(16 * 60 + pick([60, 90])), categoryId: cat, subId: sub, priority: pick(['plan', 'later', null]) });
    }
    if (Math.random() < 0.85) {
      const [cat, sub, title] = pick(plans.evening);
      const id = add({ title, start: '19:00', end: fromMin(19 * 60 + pick([60, 90, 120])), categoryId: cat, subId: sub, priority: pick(['plan', 'later', 'delegate', null]) });
      if (sub === 'shopping') tx({ type: 'expense', amount: pick([450, 680, 920]), categoryId: 'e-food', subId: 'groceries', activityId: id, date });
      if (sub === 'friends') tx({ type: 'expense', amount: pick([350, 520, 800]), categoryId: 'e-food', subId: 'eatout', activityId: id, date });
      if (sub === 'movie') tx({ type: 'expense', amount: pick([240, 360]), categoryId: 'e-fun', subId: 'movie', activityId: id, date });
    }
    if (i === -9) {
      const id = add({ title: L('จ่ายค่าไฟ ค่าเน็ต', 'Pay electricity & internet'), start: '20:30', end: '21:00', categoryId: 'a-finance', subId: 'bills', priority: 'do' });
      tx({ type: 'expense', amount: 1250, categoryId: 'e-utilities', subId: 'electricity', activityId: id, date });
      tx({ type: 'expense', amount: 599, categoryId: 'e-utilities', subId: 'internet', activityId: id, date });
    }
    if (i === -6) add({ title: L('นัดหมอฟัน', 'Dentist'), start: '17:30', end: '18:30', categoryId: 'a-health', subId: 'doctor', priority: 'plan' });

    // everyday money (not linked)
    tx({ type: 'expense', amount: pick([60, 80, 95, 120]), categoryId: 'e-food', subId: 'eatout', date, note: L('มื้อกลางวัน', 'Lunch') });
    if (Math.random() < 0.7) tx({ type: 'expense', amount: pick([32, 44, 59]), categoryId: 'e-transport', subId: 'transit', date });
    if (Math.random() < 0.25) tx({ type: 'expense', amount: pick([120, 180, 240]), categoryId: 'e-transport', subId: 'taxi', date });
    if (Math.random() < 0.15) tx({ type: 'expense', amount: pick([390, 890, 1290]), categoryId: 'e-shopping', subId: pick(['clothes', 'goods', 'gadget']), date });
    if (Math.random() < 0.12) tx({ type: 'income', amount: pick([1500, 2500, 4000]), categoryId: 'i-side', subId: 'freelance', date });
  }

  // monthly money
  const d = (n) => addDays(todayISO(), n);
  tx({ type: 'income', amount: 32000, categoryId: 'i-salary', date: d(-12) });
  tx({ type: 'expense', amount: 8500, categoryId: 'e-housing', subId: 'rent', date: d(-12) });
  tx({ type: 'expense', amount: 3000, categoryId: 'e-saving', subId: 'emergency', date: d(-12) });
  tx({ type: 'expense', amount: 2000, categoryId: 'e-invest', subId: 'fund', date: d(-11) });
  tx({ type: 'expense', amount: 419, categoryId: 'e-subs', subId: 'netflix', date: d(-11) });
  tx({ type: 'expense', amount: 149, categoryId: 'e-subs', subId: 'spotify', date: d(-11) });
  tx({ type: 'expense', amount: 300, categoryId: 'e-social', subId: 'merit', date: d(-4) });
  tx({ type: 'income', amount: 85, categoryId: 'i-invest', subId: 'interest', date: d(-2) });

  await s.adapter.addMany(scope, 'activities', acts);
  await s.adapter.addMany(scope, 'transactions', txs.map((x) => ({ id: App.util.uid(), createdBy: pick(people), createdAt: Date.now(), ...x })));
};
