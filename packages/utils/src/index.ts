// Shared utility functions across all EBOSS apps

/**
 * Format a date string to a human-readable locale format.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a short unique ID (not cryptographically secure).
 */
export function generateId(prefix = ''): string {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Safely parse JSON, returning undefined on failure.
 */
export function safeJsonParse<T>(json: string): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
