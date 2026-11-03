/* Thai / English strings and number / date formatting. */
App.i18n = (() => {
  const dict = {
    th: {
      confirm: 'ยืนยัน', cancel: 'ยกเลิก', ok: 'ตกลง', save: 'บันทึก', saved: 'บันทึกแล้ว', delete: 'ลบ', deleted: 'ลบแล้ว',
      add: 'เพิ่ม', create: 'สร้าง', join: 'เข้าร่วม', copy: 'คัดลอก', copied: 'คัดลอกแล้ว', export: 'ส่งออก', import: 'นำเข้า',
      all: 'ทั้งหมด', income: 'รายรับ', expense: 'รายจ่าย', net: 'คงเหลือสุทธิ', total: 'รวม', today: 'วันนี้', date: 'วันที่',
      start: 'เริ่ม', end: 'สิ้นสุด', category: 'หมวดหมู่', note: 'โน้ต', notePh: 'รายละเอียดเพิ่มเติม (ไม่บังคับ)', amount: 'จำนวนเงิน',
      from: 'ตั้งแต่', to: 'ถึง', you: 'คุณ', member: 'สมาชิก', hours: 'ชั่วโมง', activities: 'กิจกรรม', personal: 'ส่วนตัว', teams: 'ทีม',
      showTable: 'ดูเป็นตาราง', perDay: 'รายวัน', perMonth: 'รายเดือน', storageFull: 'พื้นที่จัดเก็บในเบราว์เซอร์เต็ม',
      signIn: 'เข้าสู่ระบบ', signUp: 'สมัครสมาชิก', signOut: 'ออกจากระบบ', signOutConfirm: 'ต้องการออกจากระบบใช่ไหม?',
      name: 'ชื่อ', email: 'อีเมล', password: 'รหัสผ่าน', gender: 'เพศ', male: 'ชาย', female: 'หญิง', unspecified: 'ไม่ระบุ',
      'auth.helloNew': 'เริ่มวางแผนวันดี ๆ ✿', 'auth.welcomeBack': 'ยินดีต้อนรับกลับ', 'auth.leadUp': 'จัดตารางชีวิต บันทึกรายรับรายจ่าย และดูภาพรวมได้ในที่เดียว',
      'auth.leadIn': 'เข้าสู่ระบบเพื่อดูแผนและบัญชีของคุณ', 'auth.namePh': 'ชื่อเล่นของคุณ', 'auth.genderHint': 'ใช้เลือกธีมสีเริ่มต้น เปลี่ยนได้ภายหลัง',
      'auth.create': 'สร้างบัญชี',
      'mode.cloud': 'ซิงก์บนคลาวด์ (Firebase)', 'mode.local': 'เก็บข้อมูลในเครื่องนี้ (Local Storage)', 'mode.auto': 'อัตโนมัติ', 'mode.light': 'สว่าง', 'mode.dark': 'มืด',
      'err.emailUsed': 'อีเมลนี้ถูกใช้แล้ว', 'err.badLogin': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'err.weakPassword': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'err.badEmail': 'รูปแบบอีเมลไม่ถูกต้อง', 'err.network': 'เชื่อมต่อเครือข่ายไม่ได้', 'err.generic': 'เกิดข้อผิดพลาด ลองอีกครั้ง',
      'err.nameRequired': 'กรุณากรอกชื่อ', 'err.titleRequired': 'กรุณาใส่ชื่อกิจกรรม', 'err.timeRange': 'เวลาเริ่มและสิ้นสุดต้องไม่เท่ากัน', 'err.amount': 'กรุณาใส่จำนวนเงิน',
      'navShort.money': 'การเงิน', 'nav.planner': 'แพลนเนอร์', 'nav.money': 'รายรับ–รายจ่าย', 'nav.dashboard': 'แดชบอร์ด', 'nav.teams': 'ทีม', 'nav.settings': 'ตั้งค่า',
      'greet.morning': 'อรุณสวัสดิ์', 'greet.afternoon': 'สวัสดีตอนบ่าย', 'greet.evening': 'สวัสดีตอนเย็น',
      'team.manage': 'จัดการทีม',
      'cat.work': 'งาน', 'cat.study': 'เรียน', 'cat.exercise': 'ออกกำลังกาย', 'cat.rest': 'พักผ่อน', 'cat.family': 'ครอบครัว', 'cat.travel': 'เดินทาง',
      'cat.social': 'สังสรรค์', 'cat.other': 'อื่น ๆ', 'cat.food': 'อาหาร', 'cat.transport': 'ค่าเดินทาง', 'cat.shopping': 'ช้อปปิ้ง', 'cat.bills': 'บิล/ค่าบริการ',
      'cat.fun': 'บันเทิง', 'cat.health': 'สุขภาพ', 'cat.salary': 'เงินเดือน', 'cat.freelance': 'ฟรีแลนซ์', 'cat.sales': 'ขายของ',
      'act.edit': 'แก้ไขกิจกรรม', 'act.new': 'เพิ่มกิจกรรม', 'act.title': 'ชื่อกิจกรรม', 'act.titlePh': 'เช่น ประชุมทีม, วิ่งตอนเย็น', 'act.markDone': 'ทำเสร็จแล้ว',
      'act.money': 'รายรับ–รายจ่ายของกิจกรรมนี้', 'act.moneyHint': 'เช่น ค่าเดินทาง ค่าอาหาร หรือรายได้จากงานนี้',
      'act.deleteConfirmMoney': 'ลบกิจกรรมนี้และรายการเงินที่ผูกไว้ {n} รายการ?', 'act.deleteConfirm': 'ต้องการลบกิจกรรมนี้ใช่ไหม?', 'act.addAt': 'เพิ่มกิจกรรมเวลา {h}',
      'tx.edit': 'แก้ไขรายการ', 'tx.new': 'เพิ่มรายการเงิน', 'tx.noActivity': '— ไม่ผูกกับกิจกรรม —', 'tx.activity': 'กิจกรรม', 'tx.notePh': 'เช่น ข้าวมันไก่, ค่าแท็กซี่',
      'tx.deleteConfirm': 'ต้องการลบรายการนี้ใช่ไหม?',
      prevWeek: 'สัปดาห์ก่อน', nextWeek: 'สัปดาห์ถัดไป', doneN: 'เสร็จ {n}', plannedTime: 'เวลาที่วางแผน', schedule: 'ตารางวัน', dayMoney: 'รายรับ–รายจ่ายวันนี้',
      'planner.emptyHint': 'แตะช่องเวลาเพื่อเพิ่มกิจกรรม', 'money.emptyDay': 'ยังไม่มีรายการในวันนี้', 'money.emptyMonth': 'ยังไม่มีรายการในเดือนนี้',
      prevMonth: 'เดือนก่อน', nextMonth: 'เดือนถัดไป', thisMonth: 'เดือนนี้', itemsN: '{n} รายการ', savedPct: 'เก็บได้ {p}% ของรายรับ',
      'range.today': 'วันนี้', 'range.week': 'สัปดาห์นี้', 'range.month': 'เดือนนี้', 'range.custom': 'กำหนดเอง',
      'kpi.time': 'เวลาที่วางแผนไว้', 'kpi.timeSub': '{n} กิจกรรม · เฉลี่ย {avg}/วัน', 'kpi.done': 'ทำสำเร็จ', 'kpi.perDay': 'เฉลี่ย {v}/วัน', 'kpi.doneTime': 'ทำเสร็จแล้ว {v}',
      'dash.timeByCat': 'ใช้เวลาไปกับอะไร', 'dash.noTime': 'ยังไม่มีกิจกรรมในช่วงนี้', 'dash.spendByCat': 'ใช้เงินไปกับอะไร', 'dash.noSpend': 'ยังไม่มีรายจ่ายในช่วงนี้',
      'dash.hoursPerDay': 'ชั่วโมงตามหมวดหมู่', 'dash.incomeVsExpense': 'รายรับเทียบรายจ่าย', 'dash.noMoney': 'ยังไม่มีรายการเงินในช่วงนี้',
      'dash.topCost': 'กิจกรรมที่ใช้เงินมากที่สุด', 'dash.noTopCost': 'ผูกรายจ่ายกับกิจกรรมเพื่อดูส่วนนี้', 'dash.whatIDid': 'ทำอะไรไปบ้าง', 'dash.members': 'สรุปรายสมาชิก',
      'dash.shareTime': 'สัดส่วนเวลา', activitiesN: '{n} กิจกรรม',
      'team.notFound': 'ไม่พบทีมจากรหัสนี้', 'team.already': 'คุณอยู่ในทีมนี้แล้ว',
      'team.localNote': 'โหมด Local: ทีมจะแชร์กันได้ระหว่างโปรไฟล์ในเบราว์เซอร์เครื่องนี้เท่านั้น หากต้องการแชร์ข้ามอุปกรณ์แบบเรียลไทม์ ให้เปิดใช้ Firebase (ดู README)',
      'team.create': 'สร้างทีมใหม่', 'team.namePh': 'ชื่อทีม เช่น ทริปเชียงใหม่', 'team.name': 'ชื่อทีม', 'team.join': 'เข้าร่วมด้วยรหัส', 'team.codePh': 'วางรหัสเชิญ',
      'team.code': 'รหัสเชิญ', 'team.owner': 'คุณเป็นเจ้าของ', 'team.inviteCode': 'รหัสเชิญ (ส่งให้เพื่อน)', 'team.remove': 'นำออกจากทีม', 'team.open': 'เปิดแพลนเนอร์ทีม',
      'team.leave': 'ออกจากทีม', 'team.empty': 'ยังไม่มีทีม สร้างทีมหรือเข้าร่วมด้วยรหัสเชิญได้เลย', 'team.created': 'สร้างทีมแล้ว', 'team.joined': 'เข้าร่วม {name} แล้ว',
      'team.deleteConfirm': 'ลบทีม "{name}" และข้อมูลทั้งหมดของทีม? ย้อนกลับไม่ได้', 'team.leaveConfirm': 'ออกจากทีม "{name}"?', 'team.removeConfirm': 'นำ {name} ออกจากทีม?',
      membersN: '{n} สมาชิก',
      'set.look': 'ธีมและการแสดงผล', 'set.lookDesc': 'เลือกโทนสีพาสเทลที่ชอบ', 'theme.sky': 'ฟ้า', 'theme.sakura': 'ชมพู', 'theme.mint': 'มิ้นต์', 'theme.lavender': 'ลาเวนเดอร์', 'theme.peach': 'พีช',
      'set.darkMode': 'โหมดมืด', 'set.language': 'ภาษา', 'set.profile': 'โปรไฟล์', 'set.categories': 'หมวดหมู่ของฉัน', 'set.categoriesDesc': 'เพิ่มหมวดหมู่เองได้ นอกเหนือจากหมวดเริ่มต้น',
      'set.scope': 'ใช้กับ', 'kind.activity': 'กิจกรรม', 'kind.expense': 'รายจ่าย', 'kind.income': 'รายรับ', 'set.noCustom': 'ยังไม่มีหมวดหมู่ที่สร้างเอง', 'set.catNamePh': 'ชื่อหมวดหมู่',
      'set.data': 'ข้อมูล', 'set.modeCloud': 'ข้อมูลซิงก์กับ Firebase และแชร์กับทีมได้แบบเรียลไทม์', 'set.modeLocal': 'ข้อมูลเก็บในเบราว์เซอร์นี้ อย่าลืมส่งออกสำรองไว้เป็นระยะ',
      'set.storage': 'ที่เก็บข้อมูล', 'set.sample': 'ข้อมูลตัวอย่าง', 'set.sampleDesc': 'เพิ่มข้อมูล 2 สัปดาห์ลงใน {scope}', 'set.sampleBtn': 'เพิ่มตัวอย่าง',
      'set.export': 'สำรอง / กู้คืน', 'set.exportDesc': 'ไฟล์ JSON ของขอบเขตที่เลือก', 'set.clear': 'ล้างข้อมูล', 'set.clearDesc': 'ลบกิจกรรมและรายการเงินทั้งหมดใน {scope}',
      'set.clearBtn': 'ล้าง', 'set.deleteCatConfirm': 'ลบหมวดหมู่นี้? รายการเดิมจะยังอยู่', 'set.sampleDone': 'เพิ่มข้อมูลตัวอย่างแล้ว ✿',
      'set.clearConfirm': 'ลบข้อมูลทั้งหมดใน "{scope}"? ย้อนกลับไม่ได้', 'set.imported': 'นำเข้า {n} รายการแล้ว', 'set.importError': 'ไฟล์ไม่ถูกต้อง',
    },
    en: {
      confirm: 'Confirm', cancel: 'Cancel', ok: 'OK', save: 'Save', saved: 'Saved', delete: 'Delete', deleted: 'Deleted',
      add: 'Add', create: 'Create', join: 'Join', copy: 'Copy', copied: 'Copied', export: 'Export', import: 'Import',
      all: 'All', income: 'Income', expense: 'Expense', net: 'Net', total: 'Total', today: 'Today', date: 'Date',
      start: 'Start', end: 'End', category: 'Category', note: 'Note', notePh: 'Extra details (optional)', amount: 'Amount',
      from: 'From', to: 'To', you: 'you', member: 'Member', hours: 'Hours', activities: 'Activities', personal: 'Personal', teams: 'Teams',
      showTable: 'Show as table', perDay: 'per day', perMonth: 'per month', storageFull: 'Browser storage is full',
      signIn: 'Sign in', signUp: 'Sign up', signOut: 'Sign out', signOutConfirm: 'Sign out now?',
      name: 'Name', email: 'Email', password: 'Password', gender: 'Gender', male: 'Male', female: 'Female', unspecified: 'Prefer not to say',
      'auth.helloNew': 'Plan a lovely day ✿', 'auth.welcomeBack': 'Welcome back', 'auth.leadUp': 'Plan your days, track income & expenses, and see the big picture in one place.',
      'auth.leadIn': 'Sign in to see your plans and money.', 'auth.namePh': 'Your nickname', 'auth.genderHint': 'sets your starting theme, change it any time',
      'auth.create': 'Create account',
      'mode.cloud': 'Synced to the cloud (Firebase)', 'mode.local': 'Saved on this device (Local Storage)', 'mode.auto': 'Auto', 'mode.light': 'Light', 'mode.dark': 'Dark',
      'err.emailUsed': 'This email is already in use', 'err.badLogin': 'Wrong email or password', 'err.weakPassword': 'Password needs at least 6 characters',
      'err.badEmail': 'That email doesn’t look right', 'err.network': 'Network error', 'err.generic': 'Something went wrong, try again',
      'err.nameRequired': 'Please enter your name', 'err.titleRequired': 'Please enter a title', 'err.timeRange': 'Start and end time can’t be the same', 'err.amount': 'Please enter an amount',
      'navShort.money': 'Money', 'nav.planner': 'Planner', 'nav.money': 'Money', 'nav.dashboard': 'Dashboard', 'nav.teams': 'Teams', 'nav.settings': 'Settings',
      'greet.morning': 'Good morning', 'greet.afternoon': 'Good afternoon', 'greet.evening': 'Good evening',
      'team.manage': 'Manage teams',
      'cat.work': 'Work', 'cat.study': 'Study', 'cat.exercise': 'Exercise', 'cat.rest': 'Rest', 'cat.family': 'Family', 'cat.travel': 'Travel',
      'cat.social': 'Social', 'cat.other': 'Other', 'cat.food': 'Food', 'cat.transport': 'Transport', 'cat.shopping': 'Shopping', 'cat.bills': 'Bills',
      'cat.fun': 'Entertainment', 'cat.health': 'Health', 'cat.salary': 'Salary', 'cat.freelance': 'Freelance', 'cat.sales': 'Sales',
      'act.edit': 'Edit activity', 'act.new': 'New activity', 'act.title': 'Title', 'act.titlePh': 'e.g. Team meeting, Evening run', 'act.markDone': 'Done',
      'act.money': 'Money for this activity', 'act.moneyHint': 'e.g. transport, food, or income from this job',
      'act.deleteConfirmMoney': 'Delete this activity and its {n} linked money item(s)?', 'act.deleteConfirm': 'Delete this activity?', 'act.addAt': 'Add activity at {h}',
      'tx.edit': 'Edit item', 'tx.new': 'New money item', 'tx.noActivity': '— Not linked —', 'tx.activity': 'Activity', 'tx.notePh': 'e.g. Lunch, Taxi',
      'tx.deleteConfirm': 'Delete this item?',
      prevWeek: 'Previous week', nextWeek: 'Next week', doneN: '{n} done', plannedTime: 'Planned time', schedule: 'Schedule', dayMoney: 'Today’s money',
      'planner.emptyHint': 'Tap a time slot to add an activity', 'money.emptyDay': 'Nothing recorded for this day', 'money.emptyMonth': 'Nothing recorded this month',
      prevMonth: 'Previous month', nextMonth: 'Next month', thisMonth: 'This month', itemsN: '{n} items', savedPct: 'Kept {p}% of income',
      'range.today': 'Today', 'range.week': 'This week', 'range.month': 'This month', 'range.custom': 'Custom',
      'kpi.time': 'Planned time', 'kpi.timeSub': '{n} activities · avg {avg}/day', 'kpi.done': 'Completed', 'kpi.perDay': 'avg {v}/day', 'kpi.doneTime': '{v} done',
      'dash.timeByCat': 'Where your time went', 'dash.noTime': 'No activities in this range', 'dash.spendByCat': 'Where your money went', 'dash.noSpend': 'No expenses in this range',
      'dash.hoursPerDay': 'Hours by category', 'dash.incomeVsExpense': 'Income vs expense', 'dash.noMoney': 'No money items in this range',
      'dash.topCost': 'Most expensive activities', 'dash.noTopCost': 'Link expenses to activities to see this', 'dash.whatIDid': 'What you did', 'dash.members': 'By member',
      'dash.shareTime': 'Share of time', activitiesN: '{n} activities',
      'team.notFound': 'No team found for this code', 'team.already': 'You’re already in this team',
      'team.localNote': 'Local mode: teams are shared only between profiles in this browser. To share across devices in real time, turn on Firebase (see README).',
      'team.create': 'Create a team', 'team.namePh': 'Team name, e.g. Chiang Mai trip', 'team.name': 'Team name', 'team.join': 'Join with a code', 'team.codePh': 'Paste invite code',
      'team.code': 'Invite code', 'team.owner': 'you own it', 'team.inviteCode': 'Invite code (share with friends)', 'team.remove': 'Remove from team', 'team.open': 'Open team planner',
      'team.leave': 'Leave', 'team.empty': 'No teams yet. Create one or join with an invite code.', 'team.created': 'Team created', 'team.joined': 'Joined {name}',
      'team.deleteConfirm': 'Delete "{name}" and all its data? This can’t be undone.', 'team.leaveConfirm': 'Leave "{name}"?', 'team.removeConfirm': 'Remove {name} from the team?',
      membersN: '{n} members',
      'set.look': 'Theme & display', 'set.lookDesc': 'Pick your favourite pastel', 'theme.sky': 'Sky', 'theme.sakura': 'Sakura', 'theme.mint': 'Mint', 'theme.lavender': 'Lavender', 'theme.peach': 'Peach',
      'set.darkMode': 'Dark mode', 'set.language': 'Language', 'set.profile': 'Profile', 'set.categories': 'My categories', 'set.categoriesDesc': 'Add your own categories on top of the defaults',
      'set.scope': 'Applies to', 'kind.activity': 'Activity', 'kind.expense': 'Expense', 'kind.income': 'Income', 'set.noCustom': 'No custom categories yet', 'set.catNamePh': 'Category name',
      'set.data': 'Data', 'set.modeCloud': 'Data syncs with Firebase and is shared with your teams in real time.', 'set.modeLocal': 'Data is stored in this browser. Export a backup now and then.',
      'set.storage': 'Storage', 'set.sample': 'Sample data', 'set.sampleDesc': 'Adds two weeks of data to {scope}', 'set.sampleBtn': 'Add sample',
      'set.export': 'Backup / restore', 'set.exportDesc': 'JSON file of the selected scope', 'set.clear': 'Clear data', 'set.clearDesc': 'Deletes every activity and money item in {scope}',
      'set.clearBtn': 'Clear', 'set.deleteCatConfirm': 'Delete this category? Existing items stay.', 'set.sampleDone': 'Sample data added ✿',
      'set.clearConfirm': 'Delete all data in "{scope}"? This can’t be undone.', 'set.imported': 'Imported {n} items', 'set.importError': 'That file isn’t a valid backup',
    },
  };

  let lang = 'th';
  const locale = () => (lang === 'th' ? 'th-TH' : 'en-GB');

  function t(key, vars) {
    let s = (dict[lang] && dict[lang][key]) ?? dict.en[key] ?? key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, v); });
    return s;
  }

  const nf = () => new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 });
  const money = (n) => `฿${nf().format(Math.round((n || 0) * 100) / 100)}`;
  const moneyCompact = (n) => `฿${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0)}`;
  function hours(min) {
    min = Math.round(min || 0);
    const h = Math.floor(min / 60), m = min % 60;
    if (lang === 'th') return h && m ? `${h} ชม. ${m} น.` : h ? `${h} ชม.` : `${m} น.`;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
  }
  const d = (iso) => App.util.parseISO(iso);
  function date(iso, style = 'short') {
    const o = style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'weekdayLong' ? { weekday: 'long', day: 'numeric', month: 'short' }
        : { day: 'numeric', month: 'short' };
    return new Intl.DateTimeFormat(locale(), o).format(d(iso));
  }
  const weekday = (iso) => new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(d(iso));
  const monthYear = (iso) => new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(d(iso));
  const monthShort = (iso) => new Intl.DateTimeFormat(locale(), { month: 'short' }).format(d(iso));

  return {
    t, money, moneyCompact, hours, date, weekday, monthYear, monthShort,
    setLang(l) { lang = dict[l] ? l : 'th'; },
    get lang() { return lang; },
  };
})();
