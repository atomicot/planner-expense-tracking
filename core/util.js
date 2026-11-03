/* Core helpers shared by every module: ids, dates, time, DOM. */
window.App = window.App || {};

App.util = (() => {
  const pad = (n) => String(n).padStart(2, '0');

  function uid(len = 20) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }

  // ---- dates (all local time, ISO 'YYYY-MM-DD') ----
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayISO = () => toISO(new Date());
  const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const addMonths = (iso, n) => { const d = parseISO(iso); d.setDate(1); d.setMonth(d.getMonth() + n); return toISO(d); };
  function startOfWeek(iso) { // Monday
    const d = parseISO(iso);
    const wd = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - wd);
    return toISO(d);
  }
  const startOfMonth = (iso) => iso.slice(0, 8) + '01';
  function endOfMonth(iso) { const d = parseISO(startOfMonth(iso)); d.setMonth(d.getMonth() + 1); d.setDate(0); return toISO(d); }
  function daysBetween(from, to) {
    const out = [];
    for (let d = from; d <= to; d = addDays(d, 1)) { out.push(d); if (out.length > 400) break; }
    return out;
  }
  const inRange = (iso, from, to) => iso >= from && iso <= to;

  // ---- time ----
  const toMin = (hhmm) => { if (!hhmm) return 0; const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
  const fromMin = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
  function durationMin(start, end) {
    let d = toMin(end) - toMin(start);
    if (d < 0) d += 1440; // crosses midnight
    return d;
  }
  const nowHHMM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  // ---- DOM ----
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function on(root, event, selector, handler) {
    root.addEventListener(event, (e) => {
      const el = e.target.closest(selector);
      if (el && root.contains(el)) handler(e, el);
    });
  }
  // First letter for avatars; skips Thai leading vowels (เ แ โ ใ ไ) so "เมย์" → "ม".
  const initials = (name) => ((name || '?').trim().replace(/^[เ-ไ]+/, '') || '?').slice(0, 1).toUpperCase();
  const sum = (arr, fn) => arr.reduce((s, x) => s + (fn ? fn(x) : x), 0);
  function groupBy(arr, fn) {
    const m = new Map();
    arr.forEach((x) => { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return m;
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  return {
    uid, pad, toISO, parseISO, todayISO, addDays, addMonths, startOfWeek, startOfMonth, endOfMonth, daysBetween, inRange,
    toMin, fromMin, durationMin, nowHHMM, esc, $, $$, on, initials, sum, groupBy, debounce, cssVar,
  };
})();
