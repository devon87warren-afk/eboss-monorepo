/**
 * Test Setup File
 *
 * Global test configuration, mocks, and utilities for Vitest.
 */

import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// ============================================================================
// CLEANUP
// ============================================================================

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ============================================================================
// GLOBAL MOCKS
// ============================================================================

// Mock window.matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (used by some UI components)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock console.warn and console.error to suppress known warnings
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = vi.fn((...args) => {
    // Suppress specific warnings if needed
    const message = args[0]?.toString() || '';
    if (message.includes('Supabase not configured')) {
      return;
    }
    originalWarn.apply(console, args);
  });

  console.error = vi.fn((...args) => {
    // Suppress specific errors if needed
    const message = args[0]?.toString() || '';
    if (message.includes('Warning: ReactDOM.render')) {
      return;
    }
    originalError.apply(console, args);
  });
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
