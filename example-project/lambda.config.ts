import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  globalSetup: require.resolve("./global-setup"),
  globalTeardown: require.resolve("./global-teardown"),
  globalTimeout: 30000,
  use: {
    video: "off",
    screenshot: "off",
    trace: "retain-on-failure",
    actionTimeout: 20000,
  },
  retries: 2, // Set for "check that we set it to one on repeat-each test"
};

export default config;
