/**
 * Custom test assertions for CLN
 */

import { expect } from 'vitest';
import type { Ora } from 'ora';

/**
 * Assert spinner success
 */
export const expectSpinnerSuccess = (
  spinner: Ora,
  expectedMessage?: string | RegExp
) => {
  expect(spinner.succeed).toHaveBeenCalled();
  
  if (expectedMessage) {
    const calls = (spinner.succeed as any).mock.calls;
    const lastCall = calls[calls.length - 1];
    
    if (typeof expectedMessage === 'string') {
      expect(lastCall[0]).toContain(expectedMessage);
    } else {
      expect(lastCall[0]).toMatch(expectedMessage);
    }
  }
};

/**
 * Assert spinner failure
 */
export const expectSpinnerFail = (
  spinner: Ora,
  expectedMessage?: string | RegExp
) => {
  expect(spinner.fail).toHaveBeenCalled();
  
  if (expectedMessage) {
    const calls = (spinner.fail as any).mock.calls;
    const lastCall = calls[calls.length - 1];
    
    if (typeof expectedMessage === 'string') {
      expect(lastCall[0]).toContain(expectedMessage);
    } else {
      expect(lastCall[0]).toMatch(expectedMessage);
    }
  }
};

/**
 * Assert command exits with success
 */
export const expectCommandSuccess = async (
  commandAction: () => Promise<void>
) => {
  await expect(commandAction()).rejects.toThrow('process.exit(0)');
  expect(process.exit).toHaveBeenCalledWith(0);
};

/**
 * Assert command exits with error
 */
export const expectCommandError = async (
  commandAction: () => Promise<void>,
  expectedExitCode: number = 1
) => {
  await expect(commandAction()).rejects.toThrow(`process.exit(${expectedExitCode})`);
  expect(process.exit).toHaveBeenCalledWith(expectedExitCode);
};

/**
 * Assert error message is properly sanitized
 */
export const expectSanitizedError = (
  errorMessage: string
) => {
  // Should not contain sensitive information
  expect(errorMessage).not.toMatch(/\/home\/[^/]+/);
  expect(errorMessage).not.toMatch(/https?:\/\/[^\s]+/);
  expect(errorMessage).not.toMatch(/git@[^\s]+/);
  expect(errorMessage).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
};

/**
 * Assert validation error
 */
export const expectValidationError = (
  fn: () => any,
  expectedMessage?: string | RegExp
) => {
  expect(fn).toThrow();
  
  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      expect(fn).toThrow(expectedMessage);
    } else {
      expect(fn).toThrow(expectedMessage);
    }
  }
};

/**
 * Assert async function completes within time limit
 */
export const expectCompletesWithin = async (
  fn: () => Promise<any>,
  timeLimit: number
) => {
  const start = performance.now();
  await fn();
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(timeLimit);
};