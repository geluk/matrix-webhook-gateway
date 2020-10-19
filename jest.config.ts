export default {
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
  ],
  // ../ is required because we have rootDir set to src.
  coverageDirectory: '../out/coverage',
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  // coverageReporters: [
  //   "json",
  //   "text",
  //   "lcov",
  //   "clover"
  // ],

  errorOnDeprecated: true,
  maxWorkers: '50%',
  moduleFileExtensions: [
    'ts',
    'js',
  ],
  rootDir: 'src',
  testEnvironment: 'node',
  testMatch: [
    '**/?(*.)+(test).ts',
  ],

  preset: 'ts-jest',

  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
};
