import { useMemo, useState } from 'react';
import { Page, Card, Modal } from '../kit/AppShell.jsx';
import { Icons } from '../kit/Icons.jsx';
import { ProgressRing } from '../kit/Extras.jsx';
import { useStore } from '../store/StoreProvider.jsx';
import { formatShortDate, parseNumber, todayStr } from '../store/utils.js';

const QUICK_MEALS = [
  { name: 'Chicken Breast 150g', amount: '150g', protein: 46 },
  { name: 'Greek Yogurt 200g', amount: '200g', protein: 20 },
  { name: 'Eggs x3', amount: '3 eggs', protein: 18 },
  { name: 'Protein Shake', amount: '1 scoop', protein: 25 },
  { name: 'Cottage Cheese 200g', amount: '200g', protein: 22 }
];

const MEAS_FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' }
];

function AddMealModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [protein, setProtein] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      amount: amount.trim(),
      protein: parseNumber(protein, 0),
      time: new Date().toTimeString().slice(0, 5)
    });
    setName(''); setAmount(''); setProtein('');
    onClose();
  };

  const applyQuick = (q) => { setName(q.name); setAmount(q.amount); setProtein(String(q.protein)); };

  return (
    <Modal open={open} onClose={onClose} title="Add Meal">
      <div className="tt-label">Food</div>
      <input className="tt-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Chicken breast" />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="tt-label">Amount</div>
          <input className="tt-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150g" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="tt-label">Protein (g)</div>
          <input className="tt-input" type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="46" />
        </div>
      </div>
      <div className="tt-eyebrow" style={{ marginTop: 14 }}>Quick add</div>
      <div className="tt-btn-row">
        {QUICK_MEALS.map((q) => (
          <button key={q.name} type="button" className="tt-chip" onClick={() => applyQuick(q)}>
            {q.name} · {q.protein}g
          </button>
        ))}
      </div>
      <button className="tt-btn tt-btn-primary tt-btn-block" style={{ marginTop: 14 }} onClick={submit}>Add Meal</button>
    </Modal>
  );
}

function EditMeasurementsModal({ open, onClose, onSave, initial }) {
  const [values, setValues] = useState(initial);
  const save = () => { onSave(values); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="Body Measurements">
      <div className="tt-label">Weight (kg)</div>
      <input className="tt-input" type="number" step="0.1" inputMode="decimal" value={values.weight} onChange={(e) => setValues((v) => ({ ...v, weight: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        {MEAS_FIELDS.map((f) => (
          <div key={f.key}>
            <div className="tt-label">{f.label} (cm)</div>
            <input
              className="tt-input"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button className="tt-btn tt-btn-primary tt-btn-block" style={{ marginTop: 14 }} onClick={save}>Save</button>
    </Modal>
  );
}

export function NutritionScreen() {
  const { data, update } = useStore();
  const currentDate = todayStr();
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [measModalOpen, setMeasModalOpen] = useState(false);

  const nutri = data.nutrition?.[currentDate] || { meals: [], waterL: 0 };
  const proteinMax = data.profile?.proteinMax || 110;
  const proteinMin = data.profile?.proteinMin || 88;
  const waterGoal = data.profile?.waterGoal || 2.5;
  const totalProtein = useMemo(() => nutri.meals.reduce((s, m) => s + (m.protein || 0), 0), [nutri.meals]);
  const proteinPct = Math.min(1, totalProtein / proteinMax);
  const waterPct = Math.min(1, (nutri.waterL || 0) / waterGoal);

  const addMeal = (m) => update((d) => {
    if (!d.nutrition[currentDate]) d.nutrition[currentDate] = { meals: [], waterL: 0 };
    d.nutrition[currentDate].meals.push(m);
    return d;
  });

  const removeMeal = (i) => update((d) => {
    const n = d.nutrition[currentDate];
    if (!n) return d;
    n.meals.splice(i, 1);
    return d;
  });

  const addWater = (l) => update((d) => {
    if (!d.nutrition[currentDate]) d.nutrition[currentDate] = { meals: [], waterL: 0 };
    d.nutrition[currentDate].waterL = Math.round((d.nutrition[currentDate].waterL + l) * 100) / 100;
    return d;
  });

  const resetWater = () => update((d) => {
    if (!d.nutrition[currentDate]) d.nutrition[currentDate] = { meals: [], waterL: 0 };
    d.nutrition[currentDate].waterL = 0;
    return d;
  });

  const saveMeasurements = (values) => update((d) => {
    const w = parseNumber(values.weight, null);
    if (w != null && values.weight !== '') d.bodyweight[currentDate] = w;
    const m = {};
    MEAS_FIELDS.forEach((f) => {
      const v = parseNumber(values[f.key], null);
      if (v != null && values[f.key] !== '') m[f.key] = v;
    });
    if (Object.keys(m).length) d.measurements[currentDate] = m;
    return d;
  });

  const initialMeasValues = useMemo(() => {
    const meas = data.measurements?.[currentDate] || {};
    return {
      weight: data.bodyweight?.[currentDate] ?? '',
      chest: meas.chest ?? '',
      waist: meas.waist ?? '',
      hips: meas.hips ?? '',
      arms: meas.arms ?? '',
      thighs: meas.thighs ?? ''
    };
  }, [data.measurements, data.bodyweight, currentDate]);

  const measValues = data.measurements?.[currentDate] || {};
  const showMeasurements = data.bodyweight?.[currentDate] || Object.keys(measValues).length > 0;

  return (
    <Page>
      <Card>
        <div style={{ textAlign: 'center' }}>
          <ProgressRing value={proteinPct} color="var(--success)" label={`${Math.round(totalProtein)}g`} unit={`of ${proteinMax}g`} />
          <div className="tt-muted" style={{ fontSize: 12, marginTop: 6 }}>
            Target: {proteinMin}–{proteinMax}g daily · {formatShortDate(currentDate)}
          </div>
        </div>
      </Card>

      <Card
        title="Meals"
        trailing={
          <button type="button" className="tt-btn tt-btn-primary tt-btn-sm" onClick={() => setMealModalOpen(true)}>+ Add</button>
        }
      >
        {nutri.meals.length === 0 && (
          <div style={{ textAlign: 'center', padding: 12, color: 'var(--fg-3)', fontSize: 12 }}>No meals logged</div>
        )}
        {nutri.meals.map((m, i) => (
          <div key={i} className="tt-row">
            <div>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div className="tt-muted" style={{ fontSize: 11 }}>{m.amount}{m.time ? ` · ${m.time}` : ''}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{m.protein}g</span>
              <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => removeMeal(i)} aria-label="Remove meal">
                {Icons.close}
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Card title="Water">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span>{nutri.waterL || 0}L</span>
          <span className="tt-muted">Goal · {waterGoal}L</span>
        </div>
        <div className="tt-bar" style={{ marginBottom: 12 }}>
          <div className="tt-bar-fill" style={{ width: `${waterPct * 100}%`, background: 'var(--info)' }} />
        </div>
        <div className="tt-btn-row">
          <button type="button" className="tt-chip" onClick={() => addWater(0.25)}>+250ml</button>
          <button type="button" className="tt-chip" onClick={() => addWater(0.5)}>+500ml</button>
          <button type="button" className="tt-chip" onClick={() => addWater(1)}>+1L</button>
          <button type="button" className="tt-chip" onClick={resetWater}>Reset</button>
        </div>
      </Card>

      <Card
        title="Body Measurements"
        trailing={
          <button type="button" className="tt-btn tt-btn-ghost tt-btn-sm" onClick={() => setMeasModalOpen(true)}>Edit</button>
        }
      >
        {!showMeasurements ? (
          <div style={{ textAlign: 'center', padding: 12, color: 'var(--fg-3)', fontSize: 12 }}>No measurements recorded</div>
        ) : (
          <>
            {data.bodyweight?.[currentDate] != null && (
              <div className="tt-row"><span className="tt-muted">Weight</span><span>{data.bodyweight[currentDate]} kg</span></div>
            )}
            {MEAS_FIELDS.filter((f) => measValues[f.key] != null).map((f) => (
              <div key={f.key} className="tt-row"><span className="tt-muted">{f.label}</span><span>{measValues[f.key]} cm</span></div>
            ))}
          </>
        )}
      </Card>

      <AddMealModal open={mealModalOpen} onClose={() => setMealModalOpen(false)} onAdd={addMeal} />
      <EditMeasurementsModal
        open={measModalOpen}
        onClose={() => setMeasModalOpen(false)}
        onSave={saveMeasurements}
        initial={initialMeasValues}
      />
    </Page>
  );
}
