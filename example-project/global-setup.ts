import type { FullConfig } from "@playwright/test";

async function globalSetup(_config: FullConfig) {
  // Where you might prepare your user state
  // Here we also use an external library to show that it works.
}

export default globalSetup;
