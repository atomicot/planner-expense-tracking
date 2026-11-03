/* Recurring activities.
   An activity is stored once. With `repeat: { freq, until }` it occurs on every matching day from its `date`
   (the series start) until `until` (optional), minus `skipDates`. Done-ness is per day in `doneDates`;
   one-off activities keep a plain `done` flag. Modules work with *instances*: one per occurrence,
   carrying `date` (that day), `startDate` (series start), `recurring` and `done`. */
App.schedule = (() => {
  const { parseISO, addDays } = App.util;
  const weekday = (iso) => parseISO(iso).getDay();

  const isRecurring = (a) => !!(a.repeat && a.repeat.freq && a.repeat.freq !== 'none');

  function occursOn(a, iso) {
    if (!isRecurring(a)) return a.date === iso;
    const r = a.repeat;
    if (iso < a.date || (r.until && iso > r.until)) return false;
    if ((a.skipDates || []).includes(iso)) return false;
    switch (r.freq) {
      case 'daily': return true;
      case 'weekdays': { const d = weekday(iso); return d >= 1 && d <= 5; }
      case 'weekly': return weekday(iso) === weekday(a.date);
      case 'monthly': return iso.slice(8) === a.date.slice(8); // same day of month (skips months without it)
      default: return false;
    }
  }

  function instance(a, iso) {
    const recurring = isRecurring(a);
    return { ...a, date: iso, startDate: a.date, recurring, done: recurring ? (a.doneDates || []).includes(iso) : !!a.done };
  }

  // Every occurrence between from and to (inclusive), as instances.
  function expand(acts, from, to) {
    const out = [];
    acts.forEach((a) => {
      if (!isRecurring(a)) {
        if (a.date >= from && a.date <= to) out.push(instance(a, a.date));
        return;
      }
      const end = a.repeat.until && a.repeat.until < to ? a.repeat.until : to;
      for (let d = a.date > from ? a.date : from; d <= end; d = addDays(d, 1)) {
        if (occursOn(a, d)) out.push(instance(a, d));
      }
    });
    return out;
  }

  // Patch that toggles done for one instance.
  function donePatch(inst) {
    if (!inst.recurring) return { done: !inst.done };
    const set = new Set(inst.doneDates || []);
    if (set.has(inst.date)) set.delete(inst.date); else set.add(inst.date);
    return { doneDates: [...set].sort() };
  }

  // Money items linked to one occurrence (a recurring activity's money is per day).
  const linked = (txs, inst) => txs.filter((x) => x.activityId === inst.id && (!inst.recurring || x.date === inst.date));

  // Earliest series start, for "all time" ranges.
  const firstDate = (acts) => acts.reduce((m, a) => (a.date < m ? a.date : m), App.util.todayISO());

  return { isRecurring, occursOn, instance, expand, donePatch, linked, firstDate };
})();
