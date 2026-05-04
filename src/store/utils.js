export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function dayOfWeek(dStr) {
  return new Date(dStr + 'T12:00:00').getDay();
}

export function formatDate(dStr) {
  return new Date(dStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export function formatShortDate(dStr) {
  return new Date(dStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export function getWeekDates(offset = 0) {
  const t = new Date();
  const dy = t.getDay();
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((dy + 6) % 7) + offset * 7);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    out.push(x.toISOString().split('T')[0]);
  }
  return out;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function getISOWeek(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - ((dt.getDay() + 6) % 7));
  const w1 = new Date(dt.getFullYear(), 0, 4);
  return (
    dt.getFullYear() +
    '-W' +
    String(
      1 + Math.round(((dt - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
    ).padStart(2, '0')
  );
}

const YT_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com'
]);

export function validateVideoUrl(u) {
  if (!u || typeof u !== 'string') return '';
  u = u.trim();
  if (!u) return '';
  try {
    const p = new URL(u);
    if (p.protocol !== 'https:' && p.protocol !== 'http:') return '';
    if (!YT_HOSTS.has(p.hostname)) return '';
    return u;
  } catch {
    return '';
  }
}

export function getYouTubeId(u) {
  const v = validateVideoUrl(u);
  if (!v) return null;
  try {
    const p = new URL(v);
    if (p.hostname === 'youtu.be') return p.pathname.slice(1).split('/')[0] || null;
    if (p.pathname.includes('/shorts/')) return p.pathname.split('/shorts/')[1]?.split('/')[0] || null;
    return p.searchParams.get('v') || null;
  } catch {
    return null;
  }
}

export function haptic(ms = 50) {
  try {
    navigator.vibrate && navigator.vibrate(ms);
  } catch {}
}

export function parseNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isDragonBoating(label) {
  return !!label && label.toLowerCase().includes('dragon boat');
}

export function isBouldering(label) {
  return !!label && label.toLowerCase().includes('boulder');
}

export function findWorkoutKeyForExId(data, exId) {
  for (const [k, w] of Object.entries(data.workouts || {})) {
    for (const s of w.sections || []) {
      if ((s.exercises || []).find((e) => e.id === exId)) return k;
    }
  }
  for (const [k, w] of Object.entries(data.customWorkouts || {})) {
    for (const s of w.sections || []) {
      if ((s.exercises || []).find((e) => e.id === exId)) return k;
    }
  }
  return null;
}

export function getWarmupType(label, category) {
  if (isDragonBoating(label)) return 'dragonboat';
  if (isBouldering(label)) return 'bouldering';
  return 'gym';
}

export function computeStreak(logs, scheduleMap) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const sched = scheduleMap?.[d.getDay()];
    if (sched?.category === 'rest') continue;
    if (logs?.[ds]?.completed) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// ---- Set suggestion (auto-prefill weight/reps) ----
//
// Strategy:
// 1. If we have a previous completed session for this exercise, use last
//    session's average weight. If every set hit the top of the rep range,
//    bump by the category's overload increment (progressive overload).
// 2. Otherwise fall back to the template weight × goal modifier (lower
//    bound for first attempt, conservative).
// 3. Reps prefill is the top of the template rep range so the user has
//    something to aim for; they can adjust per set.
//
// Goal modifiers tweak the *starting* weight only, not the rep target —
// the template's rep ranges already encode the goal. They're meant for
// novel exercises where we have no history.

const GOAL_WEIGHT_MOD = { strength: 1.1, hypertrophy: 1.0, endurance: 0.85 };

export function parseRepRange(reps) {
  if (reps == null) return { min: 0, max: 0 };
  const m = String(reps).match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!m) return { min: 0, max: 0 };
  const min = parseInt(m[1], 10);
  const max = m[2] ? parseInt(m[2], 10) : min;
  return { min, max };
}

function parseTemplateWeight(w) {
  if (!w) return null;
  const m = String(w).match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  const min = parseFloat(m[1]);
  const max = m[2] ? parseFloat(m[2]) : min;
  return { min, max };
}

function findLastSession(logs, exId, beforeDate) {
  const dates = Object.keys(logs || {}).filter((d) => !beforeDate || d < beforeDate).sort().reverse();
  for (const ds of dates) {
    const entry = logs[ds]?.exercises?.[exId];
    if (!entry?.sets) continue;
    const done = entry.sets.filter((s) => s.done && parseNumber(s.weight, 0) > 0 && parseNumber(s.reps, 0) > 0);
    if (done.length > 0) return { date: ds, sets: done };
  }
  return null;
}

function roundToStep(v, step) {
  if (!step) return v;
  return Math.round(v / step) * step;
}

export function suggestSet({ data, exercise, category, currentDate }) {
  const range = parseRepRange(exercise.reps);
  const repsTarget = range.max || range.min || '';
  const overload = data?.settings?.overloadIncrements?.[category] ?? 1;
  const step = overload >= 1 ? 0.5 : 0.25;

  const last = findLastSession(data?.logs || {}, exercise.id, currentDate);
  if (last) {
    const weights = last.sets.map((s) => parseFloat(s.weight) || 0);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    const hitTop = range.max > 0 && last.sets.every((s) => (parseInt(s.reps, 10) || 0) >= range.max);
    const next = hitTop ? avg + overload : avg;
    const w = roundToStep(next, step);
    return { weight: w > 0 ? w : '', reps: repsTarget };
  }

  const tw = parseTemplateWeight(exercise.weight);
  if (tw) {
    const goal = data?.profile?.goal || 'hypertrophy';
    const mod = GOAL_WEIGHT_MOD[goal] ?? 1;
    return { weight: roundToStep(tw.min * mod, step) || '', reps: range.min || repsTarget };
  }

  return { weight: '', reps: repsTarget };
}

