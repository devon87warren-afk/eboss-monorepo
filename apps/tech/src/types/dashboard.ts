export type AssetType = 'generator' | 'solar' | 'wind' | 'factory';
export type AssetStatus = 'nominal' | 'warning' | 'offline';
export type LogType = 'critical' | 'warning' | 'info' | 'system';

export interface AssetMetric {
  label: string;
  value: string;
  icon: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  location: string;
  metrics: AssetMetric[];
  icon: string;
}

export interface TelemetryReading {
  id: string;
  label: string;
  value: number;
  unit: string;
}

export interface PerformanceData {
  id: string;
  label: string;
  value: number;
  unit: string;
  chartPath: string;
  fillPath: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  date: string;
  type: LogType;
  title: string;
  message: string;
  icon: string;
  details?: Record<string, string>;
}

export interface ConfigToggle {
  id: string;
  label: string;
  description: string;
  type: 'toggle';
  value: boolean;
}

export interface ConfigNumber {
  id: string;
  label: string;
  description: string;
  type: 'number';
  value: number;
  unit: string;
}

export interface ConfigText {
  id: string;
  label: string;
  description: string;
  type: 'text';
  value: string;
  readonly?: boolean;
}

export type ConfigSetting = ConfigToggle | ConfigNumber | ConfigText;

export interface ConfigSection {
  id: string;
  title: string;
  icon: string;
  settings: ConfigSetting[];
}

export interface FleetStats {
  total: number;
  online: number;
  issues: number;
}
