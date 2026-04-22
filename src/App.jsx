import { useEffect, useState } from 'react';

export function App() {
  const [ready] = useState(true);
  useEffect(() => {
    document.body.setAttribute('data-app-theme', 'dark');
  }, []);
  return (
    <div className="tt-bootstrap">
      <h1>Training Tracker</h1>
      <p>Redesigned shell coming online — {ready ? 'ready' : 'booting'}.</p>
    </div>
  );
}
