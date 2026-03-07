/**
 * Supabase Client Mock
 *
 * Mock implementation of Supabase client for testing.
 */

import { vi } from 'vitest';

// Default mock state
let isConfigured = true;
let mockResponses: Record<string, { data: unknown; error: unknown }> = {};

/**
 * Mock Supabase query builder
 */
function createMockQueryBuilder(tableName: string) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    like: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    is: vi.fn(() => builder),
    in: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    containedBy: vi.fn(() => builder),
    range: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(() => {
      const response = mockResponses[tableName] ?? { data: null, error: null };
      return Promise.resolve(response);
    }),
    maybeSingle: vi.fn(() => {
      const response = mockResponses[tableName] ?? { data: null, error: null };
      return Promise.resolve(response);
    }),
    then: vi.fn((resolve) => {
      const response = mockResponses[tableName] ?? { data: [], error: null };
      return Promise.resolve(response).then(resolve);
    }),
  };

  // Make the builder thenable so await works
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: unknown) => void) => {
      const response = mockResponses[tableName] ?? { data: [], error: null };
      return Promise.resolve(response).then(resolve);
    },
    writable: true,
    configurable: true,
  });

  return builder;
}

/**
 * Mock Supabase channel for real-time subscriptions
 */
function createMockChannel() {
  return {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };
}

/**
 * Mock Supabase client
 */
export const mockSupabaseClient = {
  from: vi.fn((tableName: string) => createMockQueryBuilder(tableName)),
  channel: vi.fn(() => createMockChannel()),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
};

/**
 * Set whether Supabase is configured (for testing NOT_CONFIGURED paths)
 */
export function setSupabaseConfigured(configured: boolean) {
  isConfigured = configured;
}

/**
 * Mock implementation of isSupabaseConfigured
 */
export function mockIsSupabaseConfigured() {
  return isConfigured;
}

/**
 * Set mock response for a table
 */
export function setMockResponse(
  tableName: string,
  response: { data: unknown; error: unknown }
) {
  mockResponses[tableName] = response;
}

/**
 * Clear all mock responses
 */
export function clearMockResponses() {
  mockResponses = {};
}

/**
 * Reset all Supabase mocks
 */
export function resetSupabaseMocks() {
  isConfigured = true;
  mockResponses = {};
  vi.clearAllMocks();
}

/**
 * Factory to create mock Supabase module
 */
export function createSupabaseMock() {
  return {
    supabase: isConfigured ? mockSupabaseClient : null,
    isSupabaseConfigured: mockIsSupabaseConfigured,
  };
}

export default mockSupabaseClient;
