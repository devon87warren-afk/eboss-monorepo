'use client';

import { useState, useEffect } from 'react';
import { telemetryReadings, performanceData, currentAsset } from '@/lib/mock-data';
import type { TelemetryReading, PerformanceData, Asset } from '@/types/dashboard';

interface UseTelemetryReturn {
  readings: TelemetryReading[];
  performance: PerformanceData[];
  asset: Asset;
  isUpdating: boolean;
  lastUpdated: Date;
  remoteOperationEnabled: boolean;
  setRemoteOperationEnabled: (enabled: boolean) => void;
}

// TODO(EBOSS-111, 2026-03-08): assetId param reserved for future multi-asset
// telemetry; suppress until the feature is implemented.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useTelemetry(assetId?: string): UseTelemetryReturn {
  const [readings, setReadings] = useState<TelemetryReading[]>(telemetryReadings);
  // TODO(EBOSS-111, 2026-03-08): setPerformance is wired to future live-data
  // updates; suppress until the real-time refresh logic is added.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [performance, setPerformance] = useState<PerformanceData[]>(performanceData);
  const [isUpdating, setIsUpdating] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [remoteOperationEnabled, setRemoteOperationEnabled] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);

      // Add small random variations to readings
      setReadings((prev) =>
        prev.map((reading) => ({
          ...reading,
          value: reading.value + (Math.random() - 0.5) * reading.value * 0.02,
        }))
      );

      setLastUpdated(new Date());

      setTimeout(() => setIsUpdating(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return {
    readings,
    performance,
    asset: currentAsset,
    isUpdating,
    lastUpdated,
    remoteOperationEnabled,
    setRemoteOperationEnabled,
  };
}
