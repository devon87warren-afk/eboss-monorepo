'use client';

import { useState, useMemo } from 'react';
import { logEntries, currentAsset } from '@/lib/mock-data';
import type { LogEntry, LogType, Asset } from '@/types/dashboard';

interface UseLogsOptions {
  typeFilter?: LogType | 'all';
  dateRange?: { start: string; end: string };
}

interface UseLogsReturn {
  logs: LogEntry[];
  groupedLogs: Record<string, LogEntry[]>;
  asset: Asset;
  typeFilter: LogType | 'all';
  setTypeFilter: (filter: LogType | 'all') => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  expandedLogs: Set<string>;
  toggleLogExpanded: (logId: string) => void;
}

export function useLogs(assetId?: string, options: UseLogsOptions = {}): UseLogsReturn {
  const [typeFilter, setTypeFilter] = useState<LogType | 'all'>(options.typeFilter || 'all');
  const [dateRange, setDateRange] = useState(
    options.dateRange || { start: 'Oct 24', end: 'Oct 25' }
  );
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set(['log-1'])); // First log expanded by default

  const filteredLogs = useMemo(() => {
    let result = [...logEntries];

    if (typeFilter !== 'all') {
      result = result.filter((log) => log.type === typeFilter);
    }

    return result;
  }, [typeFilter]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce(
      (groups, log) => {
        const date = log.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(log);
        return groups;
      },
      {} as Record<string, LogEntry[]>
    );
  }, [filteredLogs]);

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  return {
    logs: filteredLogs,
    groupedLogs,
    asset: currentAsset,
    typeFilter,
    setTypeFilter,
    dateRange,
    setDateRange,
    expandedLogs,
    toggleLogExpanded,
  };
}
