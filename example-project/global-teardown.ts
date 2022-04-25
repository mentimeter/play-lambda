import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  // Maybe i could do something to clean up state or upload traces here
}

export default globalTeardown;
