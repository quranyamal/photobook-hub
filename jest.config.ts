import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(next-auth|@auth/core|@auth)/)",
  ],
};

export default createJestConfig(config);
