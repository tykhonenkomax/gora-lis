import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5180/gora-lis/', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180/gora-lis/',
    env: { VITE_SUPABASE_URL: 'https://booking-test.invalid', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only' },
    reuseExistingServer: false,
  },
})
