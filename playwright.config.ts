import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno de prueba aislada (.env.test con PORT=3001 y test.db)
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  outputDir: 'test-results/',
  use: {
    baseURL: BASE_URL,
    headless: false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 1000, // Retardo de 1000ms entre acciones para visualización clara
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          slowMo: 1000,
        },
      },
    },
  ],
  webServer: {
    command: 'npm run start:test',
    url: `${BASE_URL}/horarios`,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
