import { useRef, useState } from 'react';
import { Page, Card, Segmented, Modal } from '../kit/AppShell.jsx';
import { Icons } from '../kit/Icons.jsx';
import { useStore } from '../store/StoreProvider.jsx';
import { DAYS, parseNumber, todayStr } from '../store/utils.js';

function NumberField({ label, value, onChange, step = 1, unit }) {
  return (
    <div>
      <label className="tt-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="tt-input"
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : parseNumber(e.target.value, 0))}
          style={unit ? { paddingRight: 40 } : undefined}
        />
        {unit && <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 11, color: 'var(--fg-3)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="tt-row">
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        {desc && <div className="tt-muted" style={{ fontSize: 11 }}>{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`tt-switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="tt-switch-thumb" />
      </button>
    </div>
  );
}

function SyncModal({ open, onClose, currentCode, onEnable }) {
  const [code, setCode] = useState(currentCode || '');
  const [err, setErr] = useState('');
  const submit = async () => {
    const c = code.trim().toLowerCase();
    if (!c || c.length < 4) { setErr('Code must be at least 4 characters'); return; }
    setErr('');
    const ok = await onEnable(c);
    if (ok) onClose();
    else setErr('Failed to connect — check network');
  };
  return (
    <Modal open={open} onClose={onClose} title="Cloud sync">
      <p className="tt-muted" style={{ fontSize: 12 }}>
        Enter a sync code to share data across devices. Use the same code on each device.
      </p>
      <div className="tt-label" style={{ marginTop: 10 }}>Sync code</div>
      <input
        className="tt-input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g., mytraining123"
        autoCapitalize="none"
        autoCorrect="off"
      />
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{err}</div>}
      <button className="tt-btn tt-btn-primary tt-btn-block" style={{ marginTop: 14 }} onClick={submit}>Connect</button>
    </Modal>
  );
}

export function SettingsScreen({ theme, onTheme }) {
  const { data, update, syncStatus, syncCode, syncEnabled, enableSync, disableSync, forceSync, resetAll, importData } = useStore();
  const [syncOpen, setSyncOpen] = useState(false);
  const fileInput = useRef(null);

  const setProfile = (field, val) => update((d) => { d.profile[field] = val === '' ? undefined : val; return d; });
  const setOverload = (key, val) => update((d) => {
    if (!d.settings.overloadIncrements) d.settings.overloadIncrements = {};
    d.settings.overloadIncrements[key] = val === '' ? 0 : val;
    return d;
  });
  const setSchedule = (day, field, val) => update((d) => {
    if (!d.schedule[day]) d.schedule[day] = { category: 'rest', label: '' };
    d.schedule[day][field] = val;
    return d;
  });
  const setPref = (key, val) => update((d) => { d.settings[key] = val; return d; });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-data-${todayStr()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  };

  const onImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const ok = importData(ev.target.result);
      alert(ok ? 'Imported.' : 'Invalid file.');
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const confirmReset = () => {
    if (!window.confirm('Reset ALL training data? This cannot be undone.')) return;
    if (!window.confirm('Really reset? Export first if you want a backup.')) return;
    resetAll();
  };

  const deleteCustomWorkout = (k) => {
    if (!window.confirm('Delete this custom template?')) return;
    update((d) => { delete d.customWorkouts[k]; return d; });
  };

  const allWorkouts = { ...(data.workouts || {}), ...(data.customWorkouts || {}) };

  return (
    <Page>
      <Card title="Appearance">
        <Segmented
          value={theme}
          options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
          onChange={onTheme}
        />
      </Card>

      <Card title="Profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <NumberField label="Height (cm)" value={data.profile?.height} onChange={(v) => setProfile('height', v)} />
          <NumberField label="Weight (kg)" step={0.1} value={data.profile?.weight} onChange={(v) => setProfile('weight', v)} />
          <NumberField label="Protein Min (g)" value={data.profile?.proteinMin} onChange={(v) => setProfile('proteinMin', v)} />
          <NumberField label="Protein Max (g)" value={data.profile?.proteinMax} onChange={(v) => setProfile('proteinMax', v)} />
        </div>
        <NumberField label="Water goal (L)" step={0.5} value={data.profile?.waterGoal} onChange={(v) => setProfile('waterGoal', v)} />
      </Card>

      <Card title="Progressive overload (kg / session)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NumberField label="Upper" step={0.25} value={data.settings?.overloadIncrements?.upper} onChange={(v) => setOverload('upper', v)} unit="kg" />
          <NumberField label="Lower" step={0.5} value={data.settings?.overloadIncrements?.lower} onChange={(v) => setOverload('lower', v)} unit="kg" />
          <NumberField label="Endurance" step={0.25} value={data.settings?.overloadIncrements?.endurance} onChange={(v) => setOverload('endurance', v)} unit="kg" />
          <NumberField label="Drum" step={0.25} value={data.settings?.overloadIncrements?.drum} onChange={(v) => setOverload('drum', v)} unit="kg" />
        </div>
      </Card>

      <Card title="Weekly schedule">
        {DAYS.map((dayName, i) => {
          const s = data.schedule?.[i] || { category: 'rest', label: '' };
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 120px', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{dayName}</span>
              <input
                className="tt-input"
                placeholder="Activity"
                value={s.label || ''}
                onChange={(e) => setSchedule(i, 'label', e.target.value)}
              />
              <select
                className="tt-input"
                value={s.category || 'rest'}
                onChange={(e) => setSchedule(i, 'category', e.target.value)}
              >
                {Object.entries(data.categories || {}).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>
          );
        })}
      </Card>

      <Card title="Workout templates">
        {Object.entries(allWorkouts).map(([k, w]) => {
          const ec = (w.sections || []).reduce((s, sec) => s + (sec.exercises || []).length, 0);
          const isCustom = !!data.customWorkouts?.[k];
          return (
            <div key={k} className="tt-row">
              <div>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div className="tt-muted" style={{ fontSize: 11 }}>{w.sections?.length || 0} sections · {ec} exercises</div>
              </div>
              {isCustom && (
                <button type="button" className="tt-btn tt-btn-danger tt-btn-sm" onClick={() => deleteCustomWorkout(k)}>Delete</button>
              )}
            </div>
          );
        })}
      </Card>

      <Card title="Preferences">
        <Toggle
          label="Auto rest timer"
          desc="Show rest timer card on Today"
          checked={!!data.settings?.restTimerEnabled}
          onChange={(v) => setPref('restTimerEnabled', v)}
        />
        <Toggle
          label="Timer sound"
          checked={!!data.settings?.restTimerSound}
          onChange={(v) => setPref('restTimerSound', v)}
        />
        <Toggle
          label="Show stretch sections"
          desc="Include stretch exercises in workout templates"
          checked={!!data.settings?.showStretchSection}
          onChange={(v) => setPref('showStretchSection', v)}
        />
        <Toggle
          label="Auto-track rest days"
          desc="Mark scheduled rest days complete automatically"
          checked={!!data.settings?.autoTrackRestDays}
          onChange={(v) => setPref('autoTrackRestDays', v)}
        />
      </Card>

      <Card title="Cloud sync">
        <div className="tt-row" style={{ padding: '4px 0' }}>
          <span>Status</span>
          <span style={{ fontWeight: 600, color: syncStatus === 'connected' ? 'var(--success)' : syncStatus === 'syncing' ? 'var(--warning)' : 'var(--fg-3)' }}>
            {syncEnabled ? (syncStatus === 'connected' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : 'Offline') : 'Not synced'}
          </span>
        </div>
        {syncEnabled ? (
          <>
            <div style={{ fontSize: 12, margin: '8px 0' }}>Code: <strong>{syncCode}</strong></div>
            <p className="tt-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>Use this same code on your other devices.</p>
            <div className="tt-btn-row">
              <button className="tt-btn tt-btn-ghost tt-btn-sm" onClick={forceSync}>Force Sync</button>
              <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={disableSync}>Disconnect</button>
            </div>
          </>
        ) : (
          <>
            <p className="tt-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>Sync training data across your devices.</p>
            <button className="tt-btn tt-btn-primary tt-btn-sm" onClick={() => setSyncOpen(true)}>Set up sync</button>
          </>
        )}
      </Card>

      <Card title="Data">
        <div className="tt-btn-row">
          <button className="tt-btn tt-btn-ghost tt-btn-sm tt-btn-ico" onClick={exportJSON}>
            <span className="tt-btn-ico-i">{Icons.export}</span>Export JSON
          </button>
          <button className="tt-btn tt-btn-ghost tt-btn-sm tt-btn-ico" onClick={() => fileInput.current?.click()}>
            <span className="tt-btn-ico-i">{Icons.upload}</span>Import JSON
          </button>
          <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={confirmReset}>Reset all</button>
        </div>
        <input ref={fileInput} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImport} />
      </Card>

      <SyncModal
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        currentCode={syncCode}
        onEnable={enableSync}
      />
    </Page>
  );
}
