import { useEffect, useMemo, useRef, useState } from 'react';
import { Page, Card, Modal, Segmented, Tag, Banner } from '../kit/AppShell.jsx';
import { Icons } from '../kit/Icons.jsx';
import { Confetti, PRToast } from '../kit/Extras.jsx';
import { useStore } from '../store/StoreProvider.jsx';
import {
  DAYS,
  computeStreak,
  dayOfWeek,
  fmtElapsed,
  formatShortDate,
  getISOWeek,
  getWarmupType,
  getWeekDates,
  getYouTubeId,
  haptic,
  isBouldering,
  isDragonBoating,
  parseNumber,
  suggestSet,
  todayStr
} from '../store/utils.js';
import { EXERCISE_ALTERNATIVES, RATING_LABELS, WARMUP_ROUTINES } from '../store/defaults.js';

const BOULDER_GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'];

const RECAP_KEY = 'training_recap_dismissed_week';

function getLastWeekRecap(data) {
  const wk = getWeekDates(-1);
  let sessions = 0, volume = 0, dbDist = 0, bSends = 0, highGrade = -1, prs = 0;
  let proteinDays = 0, proteinTotal = 0;
  wk.forEach((ds) => {
    const log = data.logs?.[ds];
    if (log && log.completed) {
      sessions++;
      if (log.exercises) {
        Object.values(log.exercises).forEach((e) => (e.sets || []).forEach((s) => {
          if (s.done && s.weight && s.reps) volume += parseFloat(s.weight) * parseInt(s.reps);
        }));
      }
      if (log.distance) dbDist += log.distance;
      if (log.routes) {
        const sends = Object.values(log.routes).reduce((s, v) => s + v, 0);
        bSends += sends;
        for (let i = BOULDER_GRADES.length - 1; i >= 0; i--) {
          if ((log.routes[BOULDER_GRADES[i]] || 0) > 0 && i > highGrade) { highGrade = i; break; }
        }
      }
    }
    const nut = data.nutrition?.[ds];
    if (nut?.meals) {
      const dp = nut.meals.reduce((s, m) => s + (m.protein || 0), 0);
      if (dp > 0) { proteinDays++; proteinTotal += dp; }
    }
  });
  Object.values(data.prs || {}).forEach((p) => { if (wk.includes(p.date)) prs++; });
  return {
    sessions,
    volume: Math.round(volume),
    prs,
    avgProtein: proteinDays ? Math.round(proteinTotal / proteinDays) : 0,
    dbDist,
    bSends,
    highGrade: highGrade >= 0 ? BOULDER_GRADES[highGrade] : '—'
  };
}

function WeeklyRecapCard({ data, onDismiss }) {
  const r = useMemo(() => getLastWeekRecap(data), [data]);
  const volFmt = r.volume >= 1000 ? `${(r.volume / 1000).toFixed(1)}k` : String(r.volume);
  const distFmt = r.dbDist >= 1000 ? `${(r.dbDist / 1000).toFixed(1)}km` : r.dbDist ? `${r.dbDist}m` : '—';
  const stats = [
    { v: `${r.sessions}/7`, l: 'Sessions' },
    { v: volFmt, l: 'Volume (kg)' },
    { v: `${r.avgProtein}g`, l: 'Avg protein' },
    { v: distFmt, l: 'Distance' },
    ...(r.bSends ? [{ v: r.bSends, l: 'Sends' }, { v: r.highGrade, l: 'Peak grade' }] : [])
  ];
  return (
    <Card
      title="Last week"
      trailing={
        <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={onDismiss} aria-label="Dismiss">
          {Icons.close}
        </button>
      }
    >
      <div className={stats.length > 4 ? 'tt-stat-grid-3' : 'tt-stat-grid'}>
        {stats.map((s, i) => (
          <div key={i} className="tt-stat">
            <div className="tt-stat-v">{s.v}</div>
            <div className="tt-stat-l">{s.l}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function catTag(cat) {
  if (!cat) return null;
  const color = cat.color === 'upper' ? 'upper' : cat.color === 'lower' ? 'lower' : cat.color === 'endurance' ? 'endurance' : cat.color === 'sport' ? 'sport' : cat.color === 'rest' ? 'rest' : 'custom';
  return <Tag kind={color}>{cat.name}</Tag>;
}

function WeekStrip({ current, setCurrent, data }) {
  const week = getWeekDates();
  return (
    <div className="tt-week">
      {week.map((ds) => {
        const d = new Date(ds + 'T12:00:00');
        const dw = d.getDay();
        const sched = data.schedule?.[dw];
        const cat = sched ? data.categories?.[sched.category] : null;
        const isToday = ds === todayStr();
        const isSelected = ds === current;
        const completed = data.logs?.[ds]?.completed;
        const dotColor = cat && cat.color !== 'rest'
          ? cat.color === 'upper' ? 'var(--accent)'
            : cat.color === 'lower' ? 'var(--success)'
            : cat.color === 'endurance' ? 'var(--warning)'
            : cat.color === 'sport' ? 'var(--info)'
            : 'var(--fg-3)'
          : 'transparent';
        return (
          <button
            key={ds}
            type="button"
            className={`tt-day ${isToday ? 'today' : ''} ${completed ? 'done' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => setCurrent(ds)}
          >
            <span className="dow">{DAYS[dw]}</span>
            <span className="num">{d.getDate()}</span>
            <span className="dot" style={{ background: dotColor }} />
          </button>
        );
      })}
    </div>
  );
}

function QuickBodyweight({ currentDate, data, update }) {
  const [v, setV] = useState(() => data.bodyweight?.[currentDate] ?? '');
  useEffect(() => {
    setV(data.bodyweight?.[currentDate] ?? '');
  }, [currentDate, data.bodyweight]);
  const save = () => {
    const val = parseNumber(v, null);
    update((d) => {
      d.bodyweight = d.bodyweight || {};
      if (val == null || v === '' || v === null) delete d.bodyweight[currentDate];
      else d.bodyweight[currentDate] = val;
      return d;
    });
  };
  return (
    <Card title="Weight">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          className="tt-input"
          placeholder={`${data.profile?.weight || 'kg'}`}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={save}
          style={{ flex: 1 }}
        />
        <span className="tt-muted" style={{ fontSize: 12 }}>kg</span>
      </div>
    </Card>
  );
}

function RestTimer({ enabled, sound }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          haptic(200);
          if (sound) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              [440, 554, 659].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.connect(g);
                g.connect(ctx.destination);
                osc.frequency.value = f;
                g.gain.value = 0.15;
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.12);
              });
              setTimeout(() => ctx.close().catch(() => {}), 800);
            } catch {}
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, sound]);

  if (!enabled) return null;

  const start = (s) => { setSeconds(s); setRunning(true); };
  const stop = () => { setRunning(false); setSeconds(0); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Card title="Rest Timer" className="tt-timer-card">
      <div className={`tt-timer-v ${running ? 'running' : ''}`}>{mm}:{ss}</div>
      <div className="tt-timer-presets">
        <button onClick={() => start(30)}>30s</button>
        <button onClick={() => start(60)}>1m</button>
        <button onClick={() => start(90)}>1m 30s</button>
        <button onClick={() => start(120)}>2m</button>
        <button onClick={() => start(180)}>3m</button>
        {running && <button className="stop" onClick={stop}>Stop</button>}
      </div>
    </Card>
  );
}

function Stepper({ value, step = 1, min = 0, max = 10000, onChange, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        className="tt-btn tt-btn-ghost tt-btn-sm"
        onClick={() => onChange(Math.max(min, Number(value) - step))}
      >–</button>
      <div style={{ flex: 1, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 22 }}>
        {value}<span style={{ marginLeft: 4, fontSize: 12, color: 'var(--fg-3)' }}>{unit}</span>
      </div>
      <button
        type="button"
        className="tt-btn tt-btn-ghost tt-btn-sm"
        onClick={() => onChange(Math.min(max, Number(value) + step))}
      >+</button>
    </div>
  );
}

function PresetChips({ options, value, onChange, format }) {
  return (
    <div className="tt-btn-row" style={{ marginTop: 8 }}>
      {options.map((v) => (
        <button
          key={v}
          type="button"
          className={`tt-chip ${value === v ? 'on' : ''}`}
          onClick={() => onChange(v)}
        >
          {format ? format(v) : v}
        </button>
      ))}
    </div>
  );
}

function ExerciseRow({ ex, logEntry, swap, onUpdateSet, onToggleSet, onSwap, logExists }) {
  const sets = logEntry?.sets || [];
  const allDone = sets.length > 0 && sets.every((s) => s.done);
  const display = swap || ex;
  const alts = EXERCISE_ALTERNATIVES[ex.id] || [];
  const hasSwap = !!alts.length && !!logExists;
  const videoId = getYouTubeId(display.video);
  return (
    <div className={`tt-ex ${allDone ? 'done' : ''}`}>
      <div className="tt-ex-hd">
        <div className="tt-ex-nm">
          {display.name}
          {swap && <span className="tt-muted" style={{ fontSize: 10, marginLeft: 6 }}>(swapped)</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {videoId && (
            <a
              href={display.video}
              target="_blank"
              rel="noopener noreferrer"
              className="tt-btn tt-btn-ghost tt-btn-sm"
              aria-label={`Watch ${display.name} tutorial`}
              title="Watch tutorial"
              style={{ color: '#ff0000' }}
            >
              {Icons.play}
            </a>
          )}
          {hasSwap && (
            <button
              type="button"
              className="tt-btn tt-btn-ghost tt-btn-sm"
              onClick={() => onSwap(ex)}
              aria-label={`Swap ${ex.name}`}
              title="Swap exercise"
            >
              {Icons.edit}
            </button>
          )}
        </div>
      </div>
      <div className="tt-ex-meta">
        {display.equipment && <>{display.equipment} · </>}
        {display.weight && <>{display.weight} · </>}
        {ex.reps != null && ex.reps !== '' ? `${ex.reps} reps` : ''}
        {ex.reps != null && ex.reps !== '' && ex.rest != null ? ' · ' : ''}
        {ex.rest != null ? `${ex.rest}s rest` : ''}
      </div>
      {sets.map((s, i) => (
        <div key={i} className="tt-set">
          <span className="tt-sn">{i + 1}</span>
          <input
            type="number"
            step="0.5"
            inputMode="decimal"
            className="tt-si"
            placeholder="kg"
            value={s.weight ?? ''}
            onChange={(e) => onUpdateSet(ex.id, i, 'weight', e.target.value)}
          />
          <input
            type="number"
            inputMode="numeric"
            className="tt-si"
            placeholder="reps"
            value={s.reps ?? ''}
            onChange={(e) => onUpdateSet(ex.id, i, 'reps', e.target.value)}
          />
          <button
            type="button"
            className={`tt-chk ${s.done ? 'on' : ''}`}
            onClick={() => onToggleSet(ex.id, i)}
            aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}
          >
            {s.done ? Icons.check : null}
          </button>
        </div>
      ))}
    </div>
  );
}

function SwapModal({ exercise, currentDate, onClose, update }) {
  if (!exercise) return null;
  const alts = EXERCISE_ALTERNATIVES[exercise.id] || [];

  const pick = (alt) => {
    update((d) => {
      const l = d.logs[currentDate];
      if (!l) return d;
      if (!l.swaps) l.swaps = {};
      if (alt) l.swaps[exercise.id] = { name: alt.name, equipment: alt.equipment, weight: alt.weight };
      else delete l.swaps[exercise.id];
      return d;
    });
    onClose();
  };

  return (
    <Modal open centered onClose={onClose} title={`Swap · ${exercise.name}`}>
      <p className="tt-muted" style={{ fontSize: 12, marginBottom: 12 }}>
        Pick an alternative for this session. Your sets keep their schedule (reps / rest), just the movement changes.
      </p>
      {alts.map((alt, i) => (
        <button
          key={i}
          type="button"
          className="tt-card-opaque"
          onClick={() => pick(alt)}
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 8, border: '1px solid var(--border)' }}
        >
          <div style={{ fontWeight: 600 }}>{alt.name}</div>
          <div className="tt-muted" style={{ fontSize: 11 }}>{alt.equipment} · {alt.weight}</div>
        </button>
      ))}
      <button className="tt-btn tt-btn-ghost tt-btn-block" style={{ marginTop: 8 }} onClick={() => pick(null)}>
        Revert to original
      </button>
    </Modal>
  );
}

function WorkoutLog({ log, template, currentDate, data, update, onPR }) {
  const showStretch = !!data.settings?.showStretchSection;
  const [swapTarget, setSwapTarget] = useState(null);

  const updateSet = (exId, si, field, val) => {
    update((d) => {
      const entry = d.logs[currentDate]?.exercises?.[exId];
      if (!entry) return d;
      while (entry.sets.length <= si) entry.sets.push({ weight: '', reps: '', done: false });
      entry.sets[si][field] = val;
      return d;
    });
  };

  const toggleSet = (exId, si) => {
    update((d) => {
      const entry = d.logs[currentDate]?.exercises?.[exId];
      if (!entry) return d;
      const s = entry.sets[si] || (entry.sets[si] = { weight: '', reps: '', done: false });
      s.done = !s.done;
      if (s.done) {
        haptic(30);
        const weight = parseNumber(s.weight, 0);
        const reps = parseNumber(s.reps, 0);
        if (weight > 0 && reps > 0) {
          const prev = d.prs[exId];
          if (!prev || weight > prev.weight || (weight === prev.weight && reps > prev.reps)) {
            const exName = findExerciseName(d, exId);
            d.prs[exId] = { weight, reps, date: currentDate };
            onPR && onPR({ exercise: exName, weight, reps, prevWeight: prev?.weight || 0 });
          }
        }
      }
      return d;
    });
  };

  const sections = template.sections.filter((s) => showStretch || !/stretch/i.test(s.name));

  return (
    <div>
      {log.startTime && !log.completed && (
        <div className="tt-row">
          <span className="tt-muted">Elapsed</span>
          <Elapsed start={log.startTime} />
        </div>
      )}
      {sections.map((section) => (
        <div key={section.name}>
          <div className="tt-eyebrow" style={{ marginTop: 14 }}>{section.name}</div>
          {section.exercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              ex={ex}
              logEntry={log.exercises?.[ex.id]}
              swap={log.swaps?.[ex.id]}
              onUpdateSet={updateSet}
              onToggleSet={toggleSet}
              onSwap={setSwapTarget}
              logExists={!!log}
            />
          ))}
        </div>
      ))}
      <SwapModal
        exercise={swapTarget}
        currentDate={currentDate}
        onClose={() => setSwapTarget(null)}
        update={update}
      />
    </div>
  );
}

function Elapsed({ start }) {
  const [text, setText] = useState(() => fmtElapsed(Date.now() - start));
  useEffect(() => {
    const id = setInterval(() => setText(fmtElapsed(Date.now() - start)), 1000);
    return () => clearInterval(id);
  }, [start]);
  return <span className="num" style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</span>;
}

function DragonBoatLog({ log, currentDate, data, update }) {
  const drumming = !!log.isDrumming;
  const dur = log.duration || 0;
  const dist = log.distance || 0;

  const setField = (field, val) => update((d) => {
    d.logs[currentDate][field] = val; return d;
  });
  const toggleDrum = () => update((d) => {
    const l = d.logs[currentDate]; l.isDrumming = !l.isDrumming; return d;
  });

  return (
    <div>
      <div className="tt-role-toggle" style={{ marginBottom: 12 }}>
        <button type="button" className={!drumming ? 'on' : ''} onClick={toggleDrum}>
          {Icons.paddle}
          <span>Paddling</span>
        </button>
        <button type="button" className={drumming ? 'on' : ''} onClick={toggleDrum}>
          {Icons.drum}
          <span>Drumming</span>
        </button>
      </div>
      {drumming ? (
        data.workouts.drum ? <WorkoutLog log={log} template={data.workouts.drum} currentDate={currentDate} data={data} update={update} /> : null
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <div className="tt-label">Duration</div>
            <Stepper value={dur} step={5} min={0} max={300} unit="min" onChange={(v) => setField('duration', v)} />
            <PresetChips options={[30, 45, 60, 90, 120]} value={dur} format={(v) => `${v} min`} onChange={(v) => setField('duration', v)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="tt-label">Distance Rowed</div>
            <Stepper value={dist} step={100} min={0} max={20000} unit="m" onChange={(v) => setField('distance', v)} />
            <PresetChips options={[500, 1000, 2000, 3000, 5000]} value={dist} format={(v) => v >= 1000 ? `${v / 1000}km` : `${v}m`} onChange={(v) => setField('distance', v)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="tt-label">Notes</div>
            <textarea className="tt-input" value={log.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}

function BoulderingLog({ log, currentDate, update }) {
  const routes = log.routes || {};
  const dur = log.duration || 0;
  const total = Object.values(routes).reduce((s, v) => s + v, 0);
  let peak = '—';
  for (let i = BOULDER_GRADES.length - 1; i >= 0; i--) if ((routes[BOULDER_GRADES[i]] || 0) > 0) { peak = BOULDER_GRADES[i]; break; }

  const adjustGrade = (g, delta) => update((d) => {
    const l = d.logs[currentDate];
    if (!l.routes) l.routes = {};
    l.routes[g] = Math.max(0, (l.routes[g] || 0) + delta);
    return d;
  });

  const setField = (field, val) => update((d) => { d.logs[currentDate][field] = val; return d; });

  return (
    <div>
      <div className="tt-stat-grid" style={{ marginBottom: 12 }}>
        <div className="tt-stat"><div className="tt-stat-v">{total}</div><div className="tt-stat-l">Total Sends</div></div>
        <div className="tt-stat"><div className="tt-stat-v">{peak}</div><div className="tt-stat-l">Peak</div></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div className="tt-label">Session Duration</div>
        <Stepper value={dur} step={5} min={0} max={300} unit="min" onChange={(v) => setField('duration', v)} />
        <PresetChips options={[60, 90, 120]} value={dur} format={(v) => `${v} min`} onChange={(v) => setField('duration', v)} />
      </div>
      <div className="tt-label">Routes Sent (tap +/-)</div>
      <div className="tt-grades">
        {BOULDER_GRADES.map((g) => {
          const n = routes[g] || 0;
          return (
            <div key={g} className={`tt-grade ${n > 0 ? 'has' : ''}`}>
              <div className="tt-grade-l">{g}</div>
              <div className="tt-grade-c">{n}</div>
              <div className="tt-grade-a">
                <button type="button" className="tt-grade-b" onClick={() => adjustGrade(g, -1)} aria-label={`Decrement ${g}`}>−</button>
                <button type="button" className="tt-grade-b" onClick={() => adjustGrade(g, 1)} aria-label={`Increment ${g}`}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="tt-label">Notes</div>
        <textarea className="tt-input" value={log.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
    </div>
  );
}

function SportLog({ log, currentDate, update }) {
  const setField = (field, val) => update((d) => { d.logs[currentDate][field] = val; return d; });
  return (
    <div>
      <div className="tt-label">Duration (min)</div>
      <input
        type="number"
        inputMode="numeric"
        className="tt-input"
        value={log.duration || ''}
        onChange={(e) => setField('duration', parseNumber(e.target.value, 0))}
      />
      <div className="tt-label" style={{ marginTop: 10 }}>Notes</div>
      <textarea className="tt-input" value={log.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
    </div>
  );
}

function WarmupCard({ currentDate, log, scheduled, update }) {
  const [open, setOpen] = useState(false);
  const type = getWarmupType(scheduled?.label, scheduled?.category);
  const routine = WARMUP_ROUTINES[type] || WARMUP_ROUTINES.gym;
  const done = !!log?.warmupDone;
  const state = log?.warmup || {};

  const toggle = (idx) => update((d) => {
    const l = d.logs[currentDate];
    if (!l) return d;
    if (!l.warmup) l.warmup = {};
    l.warmup[idx] = !l.warmup[idx];
    if (routine.every((_, i) => l.warmup[i])) l.warmupDone = true;
    return d;
  });

  const markAllDone = () => update((d) => {
    const l = d.logs[currentDate];
    if (!l) return d;
    l.warmup = Object.fromEntries(routine.map((_, i) => [i, true]));
    l.warmupDone = true;
    return d;
  });

  const reset = () => update((d) => {
    const l = d.logs[currentDate];
    if (!l) return d;
    l.warmup = {};
    l.warmupDone = false;
    return d;
  });

  if (done && !open) {
    return (
      <div className="tt-banner tt-banner-success" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <span style={{ width: 16, height: 16, display: 'inline-flex', color: 'var(--success)' }}>{Icons.check}</span>
        <div className="sp" style={{ fontWeight: 600 }}>Warm-up complete</div>
        <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={(e) => { e.stopPropagation(); reset(); }}>Reset</button>
      </div>
    );
  }

  return (
    <div className="tt-card-opaque">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="tt-eyebrow" style={{ margin: 0 }}>Warm-up · {type}</div>
        <div style={{ marginLeft: 'auto' }}>
          <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={markAllDone}>Skip to done</button>
        </div>
      </div>
      {routine.map((item, i) => {
        const isDone = !!state[i];
        return (
          <div key={i} className="tt-set" style={{ gap: 10, padding: '6px 0' }}>
            <button
              type="button"
              className={`tt-chk ${isDone ? 'on' : ''}`}
              style={{ marginLeft: 0 }}
              onClick={() => toggle(i)}
              aria-label={isDone ? 'Undo' : 'Mark done'}
            >
              {isDone ? Icons.check : null}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--fg-3)' : 'var(--fg-1)' }}>
                {item.name}
              </div>
              <div className="tt-muted" style={{ fontSize: 11 }}>{item.duration} · {item.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingModal({ open, onClose, onRate }) {
  return (
    <Modal open={open} onClose={onClose} title="How did that feel?">
      <div className="tt-rating" style={{ marginTop: 6 }}>
        {[1, 2, 3, 4, 5].map((r) => (
          <button key={r} className="tt-rate-b" onClick={() => onRate(r)} aria-label={`Rate ${RATING_LABELS[r]}`}>
            {Icons[`rate${r - 1}`]}
          </button>
        ))}
      </div>
      <div className="tt-rating" style={{ marginTop: 8, gap: 4 }}>
        {[1, 2, 3, 4, 5].map((r) => (
          <div key={r} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--fg-3)' }}>{RATING_LABELS[r]}</div>
        ))}
      </div>
    </Modal>
  );
}

function SwitchActivityModal({ open, onClose, data, currentCategory, onPick }) {
  if (!open) return null;
  const templates = { ...(data.workouts || {}), ...(data.customWorkouts || {}) };
  const options = Object.entries(templates)
    .filter(([key]) => key !== currentCategory)
    .map(([key, t]) => ({ key, name: t.name || data.categories?.[key]?.name || key, sections: t.sections?.length || 0 }));
  return (
    <Modal open centered onClose={onClose} title="Switch today's workout">
      <p className="tt-muted" style={{ fontSize: 12, marginBottom: 12 }}>
        Pick a different workout for today. Doesn't change your weekly schedule.
      </p>
      {options.length === 0 ? (
        <div className="tt-muted" style={{ fontSize: 13, padding: 8 }}>No other templates available.</div>
      ) : (
        options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className="tt-card-opaque"
            onClick={() => { onPick(opt.key); onClose(); }}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 8, border: '1px solid var(--border)' }}
          >
            <div style={{ fontWeight: 600 }}>{opt.name}</div>
            <div className="tt-muted" style={{ fontSize: 11 }}>{opt.sections} section{opt.sections === 1 ? '' : 's'}</div>
          </button>
        ))
      )}
    </Modal>
  );
}

function findExerciseName(data, exId) {
  for (const w of Object.values(data.workouts || {})) {
    for (const s of w.sections || []) {
      const ex = s.exercises.find((e) => e.id === exId);
      if (ex) return ex.name;
    }
  }
  for (const w of Object.values(data.customWorkouts || {})) {
    for (const s of w.sections || []) {
      const ex = s.exercises.find((e) => e.id === exId);
      if (ex) return ex.name;
    }
  }
  return 'Exercise';
}

export function TodayScreen({ currentDate: currentDateProp, setCurrentDate: setCurrentDateProp } = {}) {
  const { data, update } = useStore();
  const [internalDate, setInternalDate] = useState(todayStr());
  const currentDate = currentDateProp ?? internalDate;
  const setCurrentDate = setCurrentDateProp ?? setInternalDate;
  const [ratingOpen, setRatingOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [pr, setPR] = useState(null);
  const [recapDismissed, setRecapDismissed] = useState(() => {
    return localStorage.getItem(RECAP_KEY) === getISOWeek(new Date());
  });
  const showRecap = new Date().getDay() === 1 && !recapDismissed;
  const dismissRecap = () => {
    localStorage.setItem(RECAP_KEY, getISOWeek(new Date()));
    setRecapDismissed(true);
  };

  const dow = dayOfWeek(currentDate);
  const scheduled = data.schedule?.[dow];
  const log = data.logs?.[currentDate] || null;
  const isRest = scheduled?.category === 'rest';

  // If today's log was switched to a different workout, the active category
  // comes from the log itself, not the weekly schedule.
  const activeCategory = log?.workout || scheduled?.category;
  const template = activeCategory ? data.workouts?.[activeCategory] || data.customWorkouts?.[activeCategory] : null;
  const activeCat = activeCategory ? data.categories?.[activeCategory] : null;
  const isActivityCategory = activeCat?.color === 'sport';
  const templateMissing = !!scheduled && !log && !template && !isActivityCategory && !isRest;
  const headerLabel = log?.label || scheduled?.label;

  const startWorkout = (overrideCategory) => {
    if (!scheduled && !overrideCategory) return;
    if (!overrideCategory && templateMissing) return;
    update((d) => {
      const cat = overrideCategory || scheduled.category;
      const t = d.workouts[cat] || d.customWorkouts[cat];
      const catMeta = d.categories?.[cat];
      const label = overrideCategory
        ? (t?.name || catMeta?.name || cat)
        : scheduled.label;
      if (t) {
        const ex = {};
        t.sections.forEach((s) => s.exercises.forEach((e) => {
          const hint = suggestSet({ data: d, exercise: e, category: cat, currentDate });
          const w = hint.weight === '' ? '' : String(hint.weight);
          const r = hint.reps === '' ? '' : String(hint.reps);
          ex[e.id] = { sets: Array.from({ length: e.sets }, () => ({ weight: w, reps: r, done: false })) };
        }));
        d.logs[currentDate] = { workout: cat, label, exercises: ex, notes: '', startTime: Date.now(), completed: false, switched: !!overrideCategory };
      } else {
        d.logs[currentDate] = { workout: 'sport', label, exercises: {}, notes: '', duration: 0, distance: 0, isDrumming: false, completed: false, startTime: Date.now() };
      }
      return d;
    });
  };
  const [switchOpen, setSwitchOpen] = useState(false);

  const completeLog = (rating) => {
    update((d) => {
      if (!d.logs[currentDate]) return d;
      d.logs[currentDate].completed = true;
      d.logs[currentDate].rating = rating;
      d.logs[currentDate].endTime = Date.now();
      return d;
    });
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2600);
    setRatingOpen(false);
  };

  const deleteLog = () => {
    if (!window.confirm('Delete this log?')) return;
    update((d) => {
      delete d.logs[currentDate];
      return d;
    });
  };

  const triggerPR = (details) => {
    setPR(details);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2600);
  };

  const streak = useMemo(() => computeStreak(data.logs, data.schedule), [data.logs, data.schedule]);

  return (
    <Page>
      <WeekStrip current={currentDate} setCurrent={setCurrentDate} data={data} />

      {showRecap && <WeeklyRecapCard data={data} onDismiss={dismissRecap} />}

      {streak >= 3 && !log && (
        <Banner kind="tip" icon={Icons.flame}>
          {streak}-day streak · consider a rest day or light session.
        </Banner>
      )}

      <QuickBodyweight currentDate={currentDate} data={data} update={update} />

      {!scheduled || isRest ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 36 }}>💤</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Rest Day</div>
            <div className="tt-muted" style={{ fontSize: 12 }}>
              {formatShortDate(currentDate)}
            </div>
          </div>
        </Card>
      ) : (
        <Card
          title={headerLabel}
          trailing={catTag(activeCat)}
        >
          {log && !log.completed && (
            <WarmupCard
              currentDate={currentDate}
              log={log}
              scheduled={{ label: log.label, category: log.workout }}
              update={update}
            />
          )}
          {template && !log && (
            <button className="tt-btn tt-btn-primary tt-btn-block" onClick={() => startWorkout()}>
              Start Workout
            </button>
          )}
          {templateMissing && !log && (
            <Banner kind="tip" icon={Icons.bulb}>
              No template found for this category. Edit your schedule or add a template in Settings → Workout templates.
            </Banner>
          )}
          {!template && !templateMissing && !log && (
            <button className="tt-btn tt-btn-primary tt-btn-block" onClick={() => startWorkout()}>
              Log Activity
            </button>
          )}
          {!log && (
            <button
              className="tt-btn tt-btn-ghost tt-btn-block"
              style={{ marginTop: 8 }}
              onClick={() => setSwitchOpen(true)}
            >
              Not feeling it? Do a different workout
            </button>
          )}
          {log && template && (
            <WorkoutLog
              log={log}
              template={template}
              currentDate={currentDate}
              data={data}
              update={update}
              onPR={triggerPR}
            />
          )}
          {log && !template && isDragonBoating(log.label) && (
            <DragonBoatLog log={log} currentDate={currentDate} data={data} update={update} />
          )}
          {log && !template && isBouldering(log.label) && (
            <BoulderingLog log={log} currentDate={currentDate} update={update} />
          )}
          {log && !template && !isDragonBoating(log.label) && !isBouldering(log.label) && (
            <SportLog log={log} currentDate={currentDate} update={update} />
          )}

          {log && (
            <div className="tt-btn-row" style={{ marginTop: 14 }}>
              <button
                className={`tt-btn ${log.completed ? 'tt-btn-success' : 'tt-btn-primary'}`}
                onClick={() => (log.completed ? completeLog(log.rating || 3) : setRatingOpen(true))}
              >
                {log.completed ? 'Completed' : 'Mark Complete'}
              </button>
              <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={deleteLog}>
                Delete
              </button>
            </div>
          )}
        </Card>
      )}

      <RestTimer enabled={!!data.settings?.restTimerEnabled} sound={!!data.settings?.restTimerSound} />

      {confetti && <Confetti count={52} />}
      {pr && <PRToast {...pr} onDone={() => setPR(null)} />}
      <RatingModal open={ratingOpen} onClose={() => setRatingOpen(false)} onRate={completeLog} />
      <SwitchActivityModal
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        data={data}
        currentCategory={scheduled?.category}
        onPick={(cat) => startWorkout(cat)}
      />
    </Page>
  );
}
