import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { Page, Card } from '../kit/AppShell.jsx';
import { useStore } from '../store/StoreProvider.jsx';
import { computeStreak, getWeekDates } from '../store/utils.js';

const BOULDER_GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'];
const TAB_OPTIONS = [
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'bouldering', label: 'Bouldering' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'measurements', label: 'Measures' }
];

function getExerciseHistory(data, exId) {
  const out = [];
  Object.keys(data.logs || {}).sort().forEach((ds) => {
    const l = data.logs[ds];
    const el = l?.exercises?.[exId];
    if (!el?.sets) return;
    const done = el.sets.filter((s) => s.done);
    if (done.length === 0) return;
    const max = Math.max(...done.map((s) => parseFloat(s.weight) || 0));
    out.push({ date: ds.slice(5), maxWeight: max, sets: done.length });
  });
  return out;
}

function getBoulderingHistory(data) {
  return Object.keys(data.logs || {})
    .sort()
    .filter((ds) => data.logs[ds]?.routes)
    .map((ds) => {
      const routes = data.logs[ds].routes;
      const sends = Object.values(routes).reduce((s, v) => s + v, 0);
      let hi = -1;
      for (let i = BOULDER_GRADES.length - 1; i >= 0; i--) {
        if ((routes[BOULDER_GRADES[i]] || 0) > 0) { hi = i; break; }
      }
      return { date: ds.slice(5), sends, highIdx: hi, routes };
    });
}

function LineChartCard({ title, data, dataKey, color = 'var(--accent)', yLabel, yFormatter, yTicks }) {
  if (!data || data.length < 2) {
    return (
      <Card title={title}>
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--fg-3)', fontSize: 12 }}>Need more data.</div>
      </Card>
    );
  }
  return (
    <Card title={title}>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="var(--divider)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: 'var(--fg-3)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormatter}
              ticks={yTicks}
              width={30}
            />
            <Tooltip
              contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--fg-2)' }}
              formatter={(v) => (yFormatter ? yFormatter(v) : v)}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function BarChartCard({ title, data, dataKey = 'sends', color = 'var(--info)' }) {
  if (!data || data.length === 0) return null;
  return (
    <Card title={title}>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--divider)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 10 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function WeeklyStats({ data }) {
  const wk = getWeekDates();
  const wkCompleted = wk.filter((d) => data.logs?.[d]?.completed).length;
  const wkVol = wk.reduce((s, d) => {
    const l = data.logs?.[d];
    if (!l) return s;
    return s + Object.values(l.exercises || {}).reduce(
      (ss, e) => ss + (e.sets || []).filter((st) => st.done).reduce(
        (sss, st) => sss + (parseFloat(st.weight) || 0) * (parseInt(st.reps) || 0),
        0
      ),
      0
    );
  }, 0);
  const wkProtein = wk.reduce((s, d) => {
    const n = data.nutrition?.[d];
    return s + (n ? n.meals.reduce((ss, m) => ss + (m.protein || 0), 0) : 0);
  }, 0);
  const wkPRs = wk.filter((d) => Object.values(data.prs || {}).some((p) => p.date === d)).length;
  const volFmt = wkVol >= 1000 ? `${Math.round(wkVol / 1000)}k` : Math.round(wkVol);

  return (
    <Card title="This week">
      <div className="tt-stat-grid">
        <div className="tt-stat"><div className="tt-stat-v">{wkCompleted}/7</div><div className="tt-stat-l">Sessions</div></div>
        <div className="tt-stat"><div className="tt-stat-v">{volFmt}</div><div className="tt-stat-l">Volume (kg)</div></div>
        <div className="tt-stat"><div className="tt-stat-v">{wkPRs}</div><div className="tt-stat-l">PRs Hit</div></div>
        <div className="tt-stat"><div className="tt-stat-v">{Math.round(wkProtein / 7)}g</div><div className="tt-stat-l">Avg Protein/Day</div></div>
      </div>
    </Card>
  );
}

function TabPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {TAB_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`tt-chip ${value === opt.value ? 'on' : ''}`}
          style={{ justifyContent: 'center', fontWeight: 600, fontSize: 12 }}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function GradeDistribution({ bh }) {
  const totals = {};
  bh.forEach((h) => Object.entries(h.routes).forEach(([g, c]) => { totals[g] = (totals[g] || 0) + c; }));
  const all = Object.values(totals).reduce((s, v) => s + v, 0);
  if (!all) return null;
  return (
    <Card title="Grade distribution">
      {BOULDER_GRADES.map((g) => {
        const n = totals[g] || 0;
        if (!n) return null;
        const pct = Math.round((n / all) * 100);
        return (
          <div key={g} className="tt-row">
            <span style={{ fontWeight: 700, minWidth: 36 }}>{g}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--info)' }} />
            </div>
            <span className="tt-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{n} · {pct}%</span>
          </div>
        );
      })}
    </Card>
  );
}

export function ProgressScreen() {
  const { data } = useStore();
  const [tab, setTab] = useState('upper');

  const totalSessions = Object.keys(data.logs || {}).filter((d) => data.logs[d]?.completed).length;
  const streak = useMemo(() => computeStreak(data.logs, data.schedule), [data.logs, data.schedule]);

  const renderExerciseTab = (key) => {
    const template = data.workouts?.[key];
    if (!template) return null;
    const main = template.sections?.[0]?.exercises || [];
    const top = main.slice(0, 5);
    return top.map((ex) => {
      const hist = getExerciseHistory(data, ex.id);
      const pr = data.prs?.[ex.id];
      return (
        <LineChartCard
          key={ex.id}
          title={pr ? `${ex.name} · PR ${pr.weight}kg` : ex.name}
          data={hist}
          dataKey="maxWeight"
          color="var(--accent)"
          yFormatter={(v) => `${v}`}
        />
      );
    });
  };

  const bh = useMemo(() => getBoulderingHistory(data), [data]);

  let body;
  if (tab === 'bouldering') {
    const gradeOverTime = bh.map((h) => ({ date: h.date, highIdx: h.highIdx + 1 }));
    body = bh.length > 0 ? (
      <>
        <LineChartCard
          title="Highest grade over time"
          data={gradeOverTime}
          dataKey="highIdx"
          color="var(--info)"
          yFormatter={(v) => BOULDER_GRADES[Math.max(0, v - 1)] || ''}
          yTicks={BOULDER_GRADES.map((_, i) => i + 1)}
        />
        <BarChartCard title="Sends per session" data={bh.slice(-15)} dataKey="sends" color="var(--info)" />
        <GradeDistribution bh={bh} />
      </>
    ) : (
      <Card><div style={{ textAlign: 'center', padding: 20, color: 'var(--fg-3)', fontSize: 12 }}>No bouldering sessions yet.</div></Card>
    );
  } else if (tab === 'bodyweight') {
    const bwDates = Object.keys(data.bodyweight || {}).sort().slice(-20);
    const pts = bwDates.map((d) => ({ date: d.slice(5), weight: data.bodyweight[d] }));
    body = <LineChartCard title="Bodyweight trend" data={pts} dataKey="weight" color="var(--warning)" yFormatter={(v) => `${v}kg`} />;
  } else if (tab === 'measurements') {
    const mDates = Object.keys(data.measurements || {}).sort().slice(-20);
    const fields = [['chest', 'Chest'], ['waist', 'Waist'], ['arms', 'Arms'], ['thighs', 'Thighs']];
    const cards = fields.map(([k, label]) => {
      const pts = mDates.filter((d) => data.measurements[d][k] != null).map((d) => ({ date: d.slice(5), value: data.measurements[d][k] }));
      return <LineChartCard key={k} title={`${label} (cm)`} data={pts} dataKey="value" color="var(--info)" yFormatter={(v) => `${v}`} />;
    });
    body = cards;
  } else {
    body = renderExerciseTab(tab);
  }

  return (
    <Page>
      <WeeklyStats data={data} />
      <div className="tt-stat-grid">
        <div className="tt-stat"><div className="tt-stat-v">{totalSessions}</div><div className="tt-stat-l">All-time</div></div>
        <div className="tt-stat"><div className="tt-stat-v">{streak}</div><div className="tt-stat-l">Streak</div></div>
      </div>
      <TabPicker value={tab} onChange={setTab} />
      {body}
    </Page>
  );
}
