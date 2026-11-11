import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: path.join('scripts', 'browser'),
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  reporter: 'line',
  outputDir: path.join('test-results', 'browser'),
  use: {
    headless: true,
    actionTimeout: 10000,
    ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
    viewport: { width: 1280, height: 920 },
    screenshot: 'only-on-failure'
  }
});
