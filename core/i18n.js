/* i18n engine + strings shared by several modules.
   Each module adds its own strings in modules/<id>/i18n.js with App.i18n.add({ th: {...}, en: {...} }). */
App.i18n = (() => {
  const dict = { th: {}, en: {} };

  let lang = 'th';
  const locale = () => (lang === 'th' ? 'th-TH' : 'en-GB');

  function add(strings) {
    Object.keys(strings).forEach((l) => { dict[l] = { ...(dict[l] || {}), ...strings[l] }; });
  }
  const has = (key) => key in (dict[lang] || {}) || key in dict.en;

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
    t, has, add, money, moneyCompact, hours, date, weekday, monthYear, monthShort,
    setLang(l) { lang = dict[l] ? l : 'th'; },
    get lang() { return lang; },
  };
})();

// Shared strings: generic actions, money words, categories, shell.
App.i18n.add({
  th: {
    confirm: 'ยืนยัน', cancel: 'ยกเลิก', ok: 'ตกลง', save: 'บันทึก', saved: 'บันทึกแล้ว', delete: 'ลบ', deleted: 'ลบแล้ว',
    add: 'เพิ่ม', create: 'สร้าง', join: 'เข้าร่วม', copy: 'คัดลอก', copied: 'คัดลอกแล้ว', export: 'ส่งออก', import: 'นำเข้า',
    all: 'ทั้งหมด', income: 'รายรับ', expense: 'รายจ่าย', net: 'คงเหลือสุทธิ', total: 'รวม', today: 'วันนี้', date: 'วันที่',
    start: 'เริ่ม', end: 'สิ้นสุด', category: 'หมวดหมู่', subcategory: 'หมวดย่อย', subNone: '— ไม่ระบุ —', note: 'โน้ต', notePh: 'รายละเอียดเพิ่มเติม (ไม่บังคับ)', amount: 'จำนวนเงิน',
    from: 'ตั้งแต่', to: 'ถึง', you: 'คุณ', member: 'สมาชิก', hours: 'ชั่วโมง', activities: 'กิจกรรม', personal: 'ส่วนตัว', teams: 'ทีม',
    itemsN: '{n} รายการ', storageFull: 'พื้นที่จัดเก็บในเบราว์เซอร์เต็ม',
    signOut: 'ออกจากระบบ', signOutConfirm: 'ต้องการออกจากระบบใช่ไหม?',
    name: 'ชื่อ', email: 'อีเมล',
    'theme.sky': 'ฟ้า', 'theme.sakura': 'ชมพู', 'theme.mint': 'มิ้นต์', 'theme.lavender': 'ลาเวนเดอร์', 'theme.peach': 'พีช',
    'mode.auto': 'อัตโนมัติ', 'mode.light': 'สว่าง', 'mode.dark': 'มืด',
    'mode.cloud': 'ซิงก์บนคลาวด์ (Firebase)', 'mode.local': 'เก็บข้อมูลในเครื่องนี้ (Local Storage)',
    'err.generic': 'เกิดข้อผิดพลาด ลองอีกครั้ง', 'err.network': 'เชื่อมต่อเครือข่ายไม่ได้',
    'greet.morning': 'อรุณสวัสดิ์', 'greet.afternoon': 'สวัสดีตอนบ่าย', 'greet.evening': 'สวัสดีตอนเย็น',
    'team.manage': 'จัดการทีม',
  },
  en: {
    confirm: 'Confirm', cancel: 'Cancel', ok: 'OK', save: 'Save', saved: 'Saved', delete: 'Delete', deleted: 'Deleted',
    add: 'Add', create: 'Create', join: 'Join', copy: 'Copy', copied: 'Copied', export: 'Export', import: 'Import',
    all: 'All', income: 'Income', expense: 'Expense', net: 'Net', total: 'Total', today: 'Today', date: 'Date',
    start: 'Start', end: 'End', category: 'Category', subcategory: 'Subcategory', subNone: '— None —', note: 'Note', notePh: 'Extra details (optional)', amount: 'Amount',
    from: 'From', to: 'To', you: 'you', member: 'Member', hours: 'Hours', activities: 'Activities', personal: 'Personal', teams: 'Teams',
    itemsN: '{n} items', storageFull: 'Browser storage is full',
    signOut: 'Sign out', signOutConfirm: 'Sign out now?',
    name: 'Name', email: 'Email',
    'theme.sky': 'Sky', 'theme.sakura': 'Sakura', 'theme.mint': 'Mint', 'theme.lavender': 'Lavender', 'theme.peach': 'Peach',
    'mode.auto': 'Auto', 'mode.light': 'Light', 'mode.dark': 'Dark',
    'mode.cloud': 'Synced to the cloud (Firebase)', 'mode.local': 'Saved on this device (Local Storage)',
    'err.generic': 'Something went wrong, try again', 'err.network': 'Network error',
    'greet.morning': 'Good morning', 'greet.afternoon': 'Good afternoon', 'greet.evening': 'Good evening',
    'team.manage': 'Manage teams',
  },
});
