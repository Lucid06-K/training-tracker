import { useMemo, useState } from 'react';
import { Page, Card, Segmented, Tag } from '../kit/AppShell.jsx';
import { Icons } from '../kit/Icons.jsx';
import { useStore } from '../store/StoreProvider.jsx';
import { computeStreak, formatDate, formatShortDate, todayStr } from '../store/utils.js';
import { RATING_LABELS } from '../store/defaults.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function downloadBlob(filename, content, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

function exerciseName(allW, id) {
  for (const w of Object.values(allW)) {
    for (const s of w.sections || []) {
      const ex = (s.exercises || []).find((e) => e.id === id);
      if (ex) return ex.name;
    }
  }
  return id;
}

const LARGE_EXPORT_THRESHOLD = 500;

function exportCSV(data) {
  const logCount = Object.keys(data.logs || {}).length;
  if (logCount > LARGE_EXPORT_THRESHOLD &&
      !window.confirm(`You have ${logCount} logged sessions — generating the CSV may take a few seconds and produce a large file. Continue?`)) {
    return;
  }
  const rows = [['Date', 'Label', 'Category', 'Duration (min)', 'Completed', 'Rating', 'Exercises', 'Total Sets', 'Volume (kg)', 'Distance (m)', 'Boulder Sends', 'Notes']];
  const allW = { ...data.workouts, ...data.customWorkouts };
  const csvField = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  Object.keys(data.logs).sort().forEach((ds) => {
    const log = data.logs[ds];
    const exNames = [];
    let totalSets = 0, vol = 0;
    if (log.exercises) {
      Object.entries(log.exercises).forEach(([id, e]) => {
        const sets = e.sets || [];
        totalSets += sets.filter((s) => s.done).length;
        sets.forEach((s) => {
          if (s.done && s.weight && s.reps) vol += parseFloat(s.weight) * parseInt(s.reps);
        });
        const name = log.swaps?.[id]?.name || exerciseName(allW, id);
        exNames.push(name);
      });
    }
    const bSends = log.routes ? Object.values(log.routes).reduce((s, v) => s + v, 0) : '';
    rows.push([
      ds,
      csvField(log.label),
      csvField(log.workout),
      log.duration || '',
      log.completed ? 'Yes' : 'No',
      log.rating ? RATING_LABELS[log.rating] : '',
      csvField(exNames.join('; ')),
      totalSets,
      Math.round(vol),
      log.distance || '',
      bSends,
      csvField(log.notes)
    ]);
  });
  const csv = rows.map((r) => r.join(',')).join('\n');
  downloadBlob(`training-history-${todayStr()}.csv`, csv);
}

function exportPrint(data) {
  const logCount = Object.keys(data.logs || {}).length;
  if (logCount > LARGE_EXPORT_THRESHOLD &&
      !window.confirm(`You have ${logCount} logged sessions — the print preview may take a few seconds. Continue?`)) {
    return;
  }
  const w = window.open('', '_blank');
  if (!w) {
    alert('Could not open print window. Please allow popups for this site and try again.');
    return;
  }
  const allW = { ...data.workouts, ...data.customWorkouts };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = '<html><head><title>Training Report</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:20px auto;font-size:13px}h1{font-size:20px}.entry{margin-bottom:16px;padding:10px;border:1px solid #ddd;border-radius:6px}.meta{color:#666;font-size:12px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}th,td{padding:3px 6px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}</style></head><body>';
  html += `<h1>Training Report</h1><p>Generated ${esc(formatDate(todayStr()))}</p>`;
  Object.keys(data.logs).sort().reverse().forEach((ds) => {
    const log = data.logs[ds];
    html += `<div class="entry"><strong>${esc(formatDate(ds))}</strong> — ${esc(log.label || 'Workout')} ${log.completed ? '✓' : '○'} ${log.rating ? esc(RATING_LABELS[log.rating]) : ''}`;
    html += `<div class="meta">${log.duration ? log.duration + ' min' : ''}${log.distance ? ' · ' + log.distance + 'm' : ''}${log.isDrumming ? ' · Drumming' : ''}</div>`;
    if (log.exercises && Object.keys(log.exercises).length > 0) {
      html += '<table><tr><th>Exercise</th><th>Sets</th></tr>';
      Object.entries(log.exercises).forEach(([id, e]) => {
        const sets = (e.sets || []).filter((s) => s.done);
        if (sets.length) {
          const name = log.swaps?.[id]?.name || exerciseName(allW, id);
          html += `<tr><td>${esc(name)}</td><td>${esc(sets.map((s) => (s.weight || '?') + 'kg × ' + (s.reps || '?')).join(', '))}</td></tr>`;
        }
      });
      html += '</table>';
    }
    if (log.notes) html += `<div class="meta" style="margin-top:4px">Notes: ${esc(log.notes)}</div>`;
    html += '</div>';
  });
  html += '</body></html>';
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

function CalendarView({ data, month, year, setMonth, setYear, onOpenDay }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} className="tt-cal-d empty" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const log = data.logs?.[ds];
    const dow = new Date(year, month, d).getDay();
    const sched = data.schedule?.[dow];
    const cat = sched ? data.categories?.[sched.category] : null;
    const color = cat && cat.color !== 'rest'
      ? cat.color === 'upper' ? 'var(--accent)'
        : cat.color === 'lower' ? 'var(--success)'
        : cat.color === 'endurance' ? 'var(--warning)'
        : cat.color === 'sport' ? 'var(--info)'
        : 'var(--fg-3)'
      : 'transparent';
    const isToday = ds === todayStr();
    const pillColor = log?.completed ? 'var(--success)' : log ? 'var(--warning)' : 'transparent';
    cells.push(
      <button
        type="button"
        key={ds}
        className={`tt-cal-d ${isToday ? 'today' : ''}`}
        style={{ borderColor: log?.completed ? 'var(--success)' : undefined, background: 'transparent', cursor: 'pointer' }}
        onClick={() => onOpenDay && onOpenDay(ds)}
        aria-label={`Open ${ds}${log?.completed ? ' (completed)' : log ? ' (partial)' : ''}`}
      >
        {d}
        <span className="pill" style={{ background: pillColor }} />
        <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: 999, background: color }} />
      </button>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={prev} aria-label="Prev month">{Icons.chevL}</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>{MONTH_NAMES[month]} {year}</div>
        <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={next} aria-label="Next month">{Icons.chev}</button>
      </div>
      <div className="tt-cal" style={{ marginBottom: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
          <div key={i} className="tt-eyebrow" style={{ textAlign: 'center', marginBottom: 0 }}>{l}</div>
        ))}
      </div>
      <div className="tt-cal">{cells}</div>
    </Card>
  );
}

function ListView({ data, search, setSearch, onCopy, onOpen }) {
  const entries = useMemo(() => {
    const dates = Object.keys(data.logs || {}).sort().reverse();
    if (!search) return dates;
    const q = search.toLowerCase();
    return dates.filter((ds) => {
      const log = data.logs[ds];
      return (log.label || '').toLowerCase().includes(q) || (log.workout || '').toLowerCase().includes(q) || (log.notes || '').toLowerCase().includes(q);
    });
  }, [data.logs, search]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 16, height: 16, color: 'var(--fg-3)' }}>{Icons.search}</span>
        <input
          className="tt-input"
          placeholder="Search workouts, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {entries.length === 0 && (
        <Card><div style={{ textAlign: 'center', padding: 20, color: 'var(--fg-3)' }}>No workouts logged yet.</div></Card>
      )}
      {entries.map((ds) => {
        const log = data.logs[ds];
        const sets = Object.values(log.exercises || {}).reduce((s, e) => s + (e.sets || []).filter((x) => x.done).length, 0);
        const sends = log.routes ? Object.values(log.routes).reduce((s, v) => s + v, 0) : 0;
        return (
          <Card key={ds}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <button type="button" onClick={() => onOpen(ds)} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700 }}>{formatShortDate(ds)}</div>
                  {log.rating && <span style={{ color: 'var(--pr)', fontSize: 11, fontWeight: 700 }}>{RATING_LABELS[log.rating]}</span>}
                  <div style={{ marginLeft: 'auto' }}>
                    {log.completed ? <Tag kind="lower">Done</Tag> : <Tag kind="rest">Partial</Tag>}
                  </div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {log.label || 'Workout'}{log.isDrumming ? ' (Drumming)' : ''}
                </div>
                <div className="tt-muted" style={{ fontSize: 12 }}>
                  {[
                    sets ? `${sets} sets` : null,
                    log.duration ? `${log.duration} min` : null,
                    log.distance ? `${log.distance}m` : null,
                    sends ? `${sends} sends` : null,
                    log.notes ? log.notes.slice(0, 40) : null
                  ].filter(Boolean).join(' · ')}
                </div>
              </button>
              <button
                type="button"
                className="tt-btn tt-btn-ghost tt-btn-sm tt-btn-ico"
                onClick={() => onCopy(ds)}
                title="Copy to today"
              >
                <span className="tt-btn-ico-i">{Icons.copy}</span>
                Copy
              </button>
            </div>
          </Card>
        );
      })}
    </>
  );
}

export function HistoryScreen({ onOpenDay } = {}) {
  const { data, update } = useStore();
  const now = new Date();
  const [view, setView] = useState('calendar');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const totalSessions = Object.keys(data.logs || {}).filter((ds) => data.logs[ds]?.completed).length;
  const streak = useMemo(() => computeStreak(data.logs, data.schedule), [data.logs, data.schedule]);

  const copyWorkout = (fromDs) => {
    const toDs = todayStr();
    update((d) => {
      const src = d.logs[fromDs];
      if (!src) return d;
      const existing = d.logs[toDs];
      if (existing && existing.exercises && Object.keys(existing.exercises).length > 0) {
        if (!window.confirm('Today already has a workout. Overwrite it?')) return d;
      }
      const ex = {};
      if (src.exercises) {
        Object.entries(src.exercises).forEach(([id, e]) => {
          ex[id] = { sets: (e.sets || []).map((s) => ({ weight: s.weight, reps: s.reps, done: false })) };
        });
      }
      d.logs[toDs] = {
        workout: src.workout,
        label: src.label,
        exercises: ex,
        notes: '',
        duration: 0,
        completed: false,
        startTime: Date.now(),
        ...(src.isDrumming && { isDrumming: true }),
        ...(src.routes && { routes: {} }),
        ...(src.distance && { distance: 0 })
      };
      return d;
    });
    window.alert('Copied to today. Open the Today tab to continue.');
  };

  const openLog = (ds) => {
    if (onOpenDay) onOpenDay(ds);
  };

  return (
    <Page>
      <div className="tt-stat-grid">
        <div className="tt-stat"><div className="tt-stat-v">{totalSessions}</div><div className="tt-stat-l">Completed</div></div>
        <div className="tt-stat"><div className="tt-stat-v">{streak}</div><div className="tt-stat-l">Streak</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Segmented
            value={view}
            options={[{ value: 'calendar', label: 'Calendar' }, { value: 'list', label: 'List' }]}
            onChange={setView}
          />
        </div>
        <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm tt-btn-ico" onClick={() => exportCSV(data)} title="Export CSV">
          <span className="tt-btn-ico-i">{Icons.export}</span>CSV
        </button>
        <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm tt-btn-ico" onClick={() => exportPrint(data)} title="Print">
          <span className="tt-btn-ico-i">{Icons.print}</span>Print
        </button>
      </div>

      {view === 'calendar' ? (
        <CalendarView data={data} month={month} year={year} setMonth={setMonth} setYear={setYear} onOpenDay={onOpenDay} />
      ) : (
        <ListView data={data} search={search} setSearch={setSearch} onCopy={copyWorkout} onOpen={openLog} />
      )}
    </Page>
  );
}
