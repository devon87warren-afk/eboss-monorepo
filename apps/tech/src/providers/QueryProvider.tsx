"use client";

/**
 * React Query Provider
 *
 * Provides TanStack Query context to the application with optimized default settings.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider component that wraps the application with TanStack Query context
 *
 * Default configuration:
 * - staleTime: 60 seconds (data considered fresh for 1 minute)
 * - gcTime: 5 minutes (unused data garbage collected after 5 minutes)
 * - retry: 1 (retry failed requests once)
 * - refetchOnWindowFocus: false (prevent refetch when window gains focus)
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
