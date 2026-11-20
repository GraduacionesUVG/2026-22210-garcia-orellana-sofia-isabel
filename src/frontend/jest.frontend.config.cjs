module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__/unit'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: {
    '^.+\\.[jt]sx?$': ['ts-jest', { tsconfig: { allowJs: true, module: 'CommonJS', moduleResolution: 'node', jsx: 'react-jsx', isolatedModules: true, target: 'ES2022', esModuleInterop: true } }],
  },
  clearMocks: true,
};
