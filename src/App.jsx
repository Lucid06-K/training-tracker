import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './kit/AppShell.jsx';
import { Icons } from './kit/Icons.jsx';
import { useStore } from './store/StoreProvider.jsx';
import { TodayScreen } from './screens/TodayScreen.jsx';
import { HistoryScreen } from './screens/HistoryScreen.jsx';
import { NutritionScreen } from './screens/NutritionScreen.jsx';
import { ProgressScreen } from './screens/ProgressScreen.jsx';
import { SettingsScreen } from './screens/SettingsScreen.jsx';

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
  useEffect(() => { localStorage.setItem(TAB_KEY, tab); }, [tab]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  const { syncStatus, user } = useStore();
  const now = useMemo(() => new Date(), []);
  const subtitle = formatSubtitle(tab, now);

  return (
    <AppShell
      tab={tab}
      setTab={setTab}
      theme={theme}
      subtitle={subtitle}
      leadingIcon={Icons.dumbbell}
      syncStatus={syncStatus}
      signedIn={!!user}
    >
      {tab === 'today' && <TodayScreen />}
      {tab === 'history' && <HistoryScreen />}
      {tab === 'nutrition' && <NutritionScreen />}
      {tab === 'progress' && <ProgressScreen />}
      {tab === 'settings' && <SettingsScreen theme={theme} onTheme={setTheme} />}
    </AppShell>
  );
}
