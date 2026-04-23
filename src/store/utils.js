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
