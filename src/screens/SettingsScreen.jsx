import { useRef } from 'react';
import { Page, Card, Segmented } from '../kit/AppShell.jsx';
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

function GoogleButton({ onClick, signingIn }) {
  return (
    <button
      type="button"
      className="tt-btn"
      onClick={onClick}
      disabled={signingIn}
      style={{
        width: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 12,
        background: '#fff',
        color: '#1f1f1f',
        border: '1px solid rgba(0,0,0,.1)',
        fontWeight: 600,
        fontSize: 14
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 5.9 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 5.9 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.1 0 9.8-1.9 13.3-5.2l-6.1-5c-2 1.3-4.4 2.2-7.2 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.1 5C41.4 34.8 44 29.8 44 24c0-1.3-.1-2.3-.4-3.5z"/>
      </svg>
      {signingIn ? 'Signing in…' : 'Sign in with Google'}
    </button>
  );
}

export function SettingsScreen({ theme, onTheme }) {
  const {
    data,
    update,
    syncStatus,
    syncEnabled,
    user,
    signIn,
    signOut,
    signingIn,
    forceSync,
    resetAll,
    importData
  } = useStore();
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

      <Card title="Account">
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10 }}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  width="40"
                  height="40"
                  referrerPolicy="no-referrer"
                  style={{ borderRadius: 999, border: '1px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name || 'Signed in'}
                </div>
                {user.email && (
                  <div className="tt-muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                )}
              </div>
            </div>
            <div className="tt-row" style={{ padding: '4px 0' }}>
              <span>Sync</span>
              <span style={{ fontWeight: 600, color: syncStatus === 'connected' ? 'var(--success)' : syncStatus === 'syncing' ? 'var(--warning)' : 'var(--fg-3)' }}>
                {syncStatus === 'connected' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : 'Offline'}
              </span>
            </div>
            <div className="tt-btn-row" style={{ marginTop: 10 }}>
              <button className="tt-btn tt-btn-ghost tt-btn-sm" onClick={forceSync}>Force sync</button>
              <button className="tt-btn tt-btn-danger tt-btn-sm" onClick={signOut}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <p className="tt-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
              Sign in with Google to sync your training data across devices. Your current local data will carry over.
            </p>
            <GoogleButton onClick={signIn} signingIn={signingIn} />
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

    </Page>
  );
}
