import { Page, Card, Segmented } from '../kit/AppShell.jsx';

export function SettingsScreen({ theme, onTheme }) {
  return (
    <Page>
      <Card title="Appearance">
        <Segmented
          value={theme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' }
          ]}
          onChange={onTheme}
        />
      </Card>
      <Card title="Settings">
        <p className="tt-muted">More settings wiring up in next commit.</p>
      </Card>
    </Page>
  );
}
