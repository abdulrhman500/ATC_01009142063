// jest.config.ts
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' }),
  globalSetup: '<rootDir>/test/setup/globalSetup.ts',      // Path from project root
  globalTeardown: '<rootDir>/test/setup/globalTeardown.ts', // Path from project root
  setupFilesAfterEnv: ['<rootDir>/test/setup/setupFilesAfterEnv.ts'], // For loading .env.test if needed for other vars
  testTimeout: 30000, // Increase timeout to allow for container startup (default is 5s)
};