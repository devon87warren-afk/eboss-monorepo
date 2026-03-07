'use client';

import { useState, useMemo } from 'react';
import { assets, fleetStats } from '@/lib/mock-data';
import type { Asset, FleetStats } from '@/types/dashboard';

interface UseAssetsOptions {
  searchQuery?: string;
  statusFilter?: 'all' | 'nominal' | 'warning' | 'offline';
}

interface UseAssetsReturn {
  assets: Asset[];
  stats: FleetStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'nominal' | 'warning' | 'offline';
  setStatusFilter: (filter: 'all' | 'nominal' | 'warning' | 'offline') => void;
  getAssetById: (id: string) => Asset | undefined;
}

export function useAssets(options: UseAssetsOptions = {}): UseAssetsReturn {
  const [searchQuery, setSearchQuery] = useState(options.searchQuery || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'nominal' | 'warning' | 'offline'>(
    options.statusFilter || 'all'
  );

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.id.toLowerCase().includes(query) ||
          asset.location.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((asset) => asset.status === statusFilter);
    }

    // Sort by priority: warning > offline > nominal
    result.sort((a, b) => {
      const priority = { warning: 0, offline: 1, nominal: 2 };
      return priority[a.status] - priority[b.status];
    });

    return result;
  }, [searchQuery, statusFilter]);

  const getAssetById = (id: string): Asset | undefined => {
    return assets.find((asset) => asset.id === id);
  };

  return {
    assets: filteredAssets,
    stats: fleetStats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    getAssetById,
  };
}
