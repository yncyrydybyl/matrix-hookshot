/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // The root directory that Jest should scan for tests and modules within
  rootDir: "spec-lib",
  testTimeout: 60000,
  setupFiles: ["<rootDir>/spec/setup-jest.js"],
};

export default config;
