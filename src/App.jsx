import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell, Page, Card } from './kit/AppShell.jsx';
import { Icons } from './kit/Icons.jsx';
import { useStore } from './store/StoreProvider.jsx';
import { TodayScreen } from './screens/TodayScreen.jsx';
import { HistoryScreen } from './screens/HistoryScreen.jsx';
import { NutritionScreen } from './screens/NutritionScreen.jsx';
import { SettingsScreen } from './screens/SettingsScreen.jsx';
import { todayStr } from './store/utils.js';

const ProgressScreen = lazy(() =>
  import('./screens/ProgressScreen.jsx').then((m) => ({ default: m.ProgressScreen }))
);

function ProgressFallback() {
  return (
    <Page>
      <Card>
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--fg-3)' }}>
          Loading charts…
        </div>
      </Card>
    </Page>
  );
}

const THEME_KEY = 'tt-theme';
const TAB_KEY = 'tt-tab';

function formatSubtitle(tab, now) {
  if (tab === 'today') {
    return now.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }
  if (tab === 'history') return 'All sessions';
  if (tab === 'nutrition') return 'Daily log';
  if (tab === 'progress') return 'Last 6 weeks';
  if (tab === 'settings') return 'Account + data';
  return '';
}

export function App() {
  const [tab, setTab] = useState(() => localStorage.getItem(TAB_KEY) || 'today');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [currentDate, setCurrentDate] = useState(() => todayStr());
  useEffect(() => { localStorage.setItem(TAB_KEY, tab); }, [tab]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  const { syncStatus, user, authReady } = useStore();
  const now = useMemo(() => new Date(), []);
  const subtitle = formatSubtitle(tab, now);

  const openDay = useCallback((ds) => {
    if (ds) setCurrentDate(ds);
    setTab('today');
  }, []);

  const onSyncClick = useCallback(() => setTab('settings'), []);

  if (!authReady) {
    return (
      <AppShell
        tab={tab}
        setTab={setTab}
        theme={theme}
        subtitle={subtitle}
        leadingIcon={Icons.dumbbell}
        syncStatus="syncing"
        signedIn={false}
      >
        <Page>
          <Card>
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--fg-3)' }}>
              Loading…
            </div>
          </Card>
        </Page>
      </AppShell>
    );
  }

  return (
    <AppShell
      tab={tab}
      setTab={setTab}
      theme={theme}
      subtitle={subtitle}
      leadingIcon={Icons.dumbbell}
      syncStatus={syncStatus}
      signedIn={!!user}
      onSyncClick={onSyncClick}
    >
      {tab === 'today' && <TodayScreen currentDate={currentDate} setCurrentDate={setCurrentDate} />}
      {tab === 'history' && <HistoryScreen onOpenDay={openDay} />}
      {tab === 'nutrition' && <NutritionScreen />}
      {tab === 'progress' && (
        <Suspense fallback={<ProgressFallback />}>
          <ProgressScreen />
        </Suspense>
      )}
      {tab === 'settings' && <SettingsScreen theme={theme} onTheme={setTheme} />}
    </AppShell>
  );
}
