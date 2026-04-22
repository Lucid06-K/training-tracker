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
  getWeekDates,
  haptic,
  isBouldering,
  isDragonBoating,
  parseNumber,
  todayStr
} from '../store/utils.js';
import { RATING_LABELS } from '../store/defaults.js';

const BOULDER_GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'];

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
          if (sound) { try { new AudioContext().close(); } catch {} }
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

function ExerciseRow({ ex, logEntry, onUpdateSet, onToggleSet }) {
  const sets = logEntry?.sets || [];
  const allDone = sets.length > 0 && sets.every((s) => s.done);
  return (
    <div className={`tt-ex ${allDone ? 'done' : ''}`}>
      <div className="tt-ex-hd">
        <div className="tt-ex-nm">{ex.name}</div>
      </div>
      <div className="tt-ex-meta">
        {ex.equipment && <>{ex.equipment} · </>}
        {ex.weight && <>{ex.weight} · </>}
        {ex.reps} reps · {ex.rest}s rest
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

function WorkoutLog({ log, template, currentDate, data, update, onPR }) {
  const showStretch = !!data.settings?.showStretchSection;

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
              onUpdateSet={updateSet}
              onToggleSet={toggleSet}
            />
          ))}
        </div>
      ))}
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

export function TodayScreen() {
  const { data, update } = useStore();
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [ratingOpen, setRatingOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [pr, setPR] = useState(null);

  const dow = dayOfWeek(currentDate);
  const scheduled = data.schedule?.[dow];
  const log = data.logs?.[currentDate] || null;
  const isRest = scheduled?.category === 'rest';

  const template = scheduled ? data.workouts?.[scheduled.category] || data.customWorkouts?.[scheduled.category] : null;

  const startWorkout = () => {
    if (!scheduled) return;
    update((d) => {
      const t = d.workouts[scheduled.category] || d.customWorkouts[scheduled.category];
      if (t) {
        const ex = {};
        t.sections.forEach((s) => s.exercises.forEach((e) => {
          ex[e.id] = { sets: Array.from({ length: e.sets }, () => ({ weight: '', reps: '', done: false })) };
        }));
        d.logs[currentDate] = { workout: scheduled.category, label: scheduled.label, exercises: ex, notes: '', startTime: Date.now(), completed: false };
      } else {
        d.logs[currentDate] = { workout: 'sport', label: scheduled.label, exercises: {}, notes: '', duration: 0, distance: 0, isDrumming: false, completed: false, startTime: Date.now() };
      }
      return d;
    });
  };

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
          title={scheduled.label}
          trailing={catTag(data.categories?.[scheduled.category])}
        >
          {template && !log && (
            <button className="tt-btn tt-btn-primary tt-btn-block" onClick={startWorkout}>
              Start Workout
            </button>
          )}
          {!template && !log && (
            <button className="tt-btn tt-btn-primary tt-btn-block" onClick={startWorkout}>
              Log Activity
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
    </Page>
  );
}
