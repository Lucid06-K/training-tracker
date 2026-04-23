import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Injects a BUILD_ID into sw.js (replaces __BUILD_ID__).
// This forces a new service-worker cache name on every build,
// so clients never get stuck on a stale HTML shell.
function swBuildId() {
  const buildId = Date.now().toString(36);
  return {
    name: 'sw-build-id',
    closeBundle() {
      const swOut = path.resolve('dist', 'sw.js');
      if (!fs.existsSync(swOut)) return;
      const src = fs.readFileSync(swOut, 'utf8').replace(/__BUILD_ID__/g, buildId);
      fs.writeFileSync(swOut, src);
    }
  };
}

export default defineConfig({
  plugins: [react(), swBuildId()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          recharts: ['recharts']
        }
      }
    }
  },
  server: { port: 5173, host: true }
});
