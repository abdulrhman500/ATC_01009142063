// jest.config.ts
import { pathsToModuleNameMapper } from 'ts-jest';
// Assuming tsconfig.json can be imported directly as JSON in your environment
import { compilerOptions } from './tsconfig.json';

import type { JestConfigWithTsJest } from 'ts-jest'; // Optional: for type safety

const config: JestConfigWithTsJest = { // Optional: use type for safety
  // Use the ts-jest preset
  preset: 'ts-jest',

  testEnvironment: 'node',
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts"
  ],
  // This maps the paths defined in your tsconfig.json to Jest's module resolution
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  // Optional: if you need setup before each test file (like inversify container setup)
  // setupFilesAfterEnv: ['./jest.setup.ts'],
};

export default config;