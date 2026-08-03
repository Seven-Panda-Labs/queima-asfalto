import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['firestore.rules.test.ts'],
    // Every case round-trips through the Firestore emulator, and the batched
    // write cases spike well past the 5s default on a loaded CI runner.
    testTimeout: 30000,
  },
})
