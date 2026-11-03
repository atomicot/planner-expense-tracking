/* Settings module: two weeks of believable sample data so the dashboard has something to show. */
App.parts.settings = App.parts.settings || {};

App.parts.settings.addSample = async function addSample(scope) {
  const { todayISO, addDays, fromMin } = App.util;
  const th = App.prefs.get().lang === 'th';
  const s = App.store;
  const team = scope.type === 'team' ? s.team(scope.id) : null;
  const people = team ? team.memberIds : [s.user.id];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const titles = {
    'a-work': th ? ['ประชุมทีม', 'ทำรายงาน', 'ตอบอีเมล', 'ออกแบบงานใหม่'] : ['Team meeting', 'Write report', 'Emails', 'Design work'],
    'a-study': th ? ['เรียนภาษาอังกฤษ', 'อ่านหนังสือ', 'คอร์สออนไลน์'] : ['English class', 'Reading', 'Online course'],
    'a-exercise': th ? ['วิ่งที่สวน', 'โยคะ', 'ฟิตเนส'] : ['Run in the park', 'Yoga', 'Gym'],
    'a-rest': th ? ['คาเฟ่', 'งีบ', 'ดูซีรีส์'] : ['Café', 'Nap', 'Watch a series'],
    'a-family': th ? ['ทานข้าวกับครอบครัว', 'โทรหาแม่'] : ['Family dinner', 'Call mom'],
    'a-travel': th ? ['เดินทางไปทำงาน', 'ขับรถกลับบ้าน'] : ['Commute', 'Drive home'],
    'a-social': th ? ['เจอเพื่อน', 'ปาร์ตี้วันเกิด'] : ['Meet friends', 'Birthday party'],
  };
  const acts = [], txs = [];
  for (let i = -13; i <= 1; i++) {
    const date = addDays(todayISO(), i);
    const plan = [
      { c: 'a-travel', s: 8 * 60, d: 45 },
      { c: 'a-work', s: 9 * 60, d: 180 },
      { c: pick(['a-work', 'a-study']), s: 13 * 60, d: pick([90, 120, 150]) },
      { c: pick(['a-exercise', 'a-rest', 'a-social']), s: 17 * 60 + 30, d: pick([60, 90]) },
      { c: pick(['a-family', 'a-rest', 'a-study']), s: 19 * 60 + 30, d: pick([60, 90, 120]) },
    ];
    plan.forEach((pl) => {
      if (Math.random() < 0.15) return;
      const id = App.util.uid();
      acts.push({
        id, date, start: fromMin(pl.s), end: fromMin(Math.min(pl.s + pl.d, 1439)), title: pick(titles[pl.c]), categoryId: pl.c,
        note: '', done: i < 0 ? Math.random() < 0.85 : false, createdBy: pick(people), createdAt: Date.now(),
      });
      if (pl.c === 'a-travel') txs.push({ type: 'expense', amount: pick([30, 45, 60, 120]), categoryId: 'e-transport', activityId: id, date, note: '' });
      if (pl.c === 'a-social') txs.push({ type: 'expense', amount: pick([350, 520, 800]), categoryId: 'e-fun', activityId: id, date, note: '' });
      if (pl.c === 'a-study' && Math.random() < 0.3) txs.push({ type: 'expense', amount: pick([199, 450]), categoryId: 'e-other', activityId: id, date, note: th ? 'หนังสือ / คอร์ส' : 'Book / course' });
      if (pl.c === 'a-exercise' && Math.random() < 0.4) txs.push({ type: 'expense', amount: pick([80, 150]), categoryId: 'e-health', activityId: id, date, note: '' });
    });
    txs.push({ type: 'expense', amount: pick([60, 80, 95, 120]), categoryId: 'e-food', activityId: null, date, note: th ? 'มื้อกลางวัน' : 'Lunch' });
    if (Math.random() < 0.6) txs.push({ type: 'expense', amount: pick([55, 65, 90]), categoryId: 'e-food', activityId: null, date, note: th ? 'กาแฟ' : 'Coffee' });
    if (Math.random() < 0.2) txs.push({ type: 'expense', amount: pick([390, 890, 1290]), categoryId: 'e-shopping', activityId: null, date, note: '' });
    if (i === -10) txs.push({ type: 'expense', amount: 1850, categoryId: 'e-bills', activityId: null, date, note: th ? 'ค่าไฟ + เน็ต' : 'Electricity + internet' });
    if (i === -12) txs.push({ type: 'income', amount: 32000, categoryId: 'i-salary', activityId: null, date, note: '' });
    if (Math.random() < 0.15) txs.push({ type: 'income', amount: pick([1500, 2500, 4000]), categoryId: 'i-freelance', activityId: null, date, note: '' });
  }
  await s.adapter.addMany(scope, 'activities', acts);
  await s.adapter.addMany(scope, 'transactions', txs.map((x) => ({ id: App.util.uid(), createdBy: pick(people), createdAt: Date.now(), ...x })));
};
