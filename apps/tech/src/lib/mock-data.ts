import type {
  Asset,
  TelemetryReading,
  PerformanceData,
  LogEntry,
  ConfigSection,
  FleetStats,
} from '@/types/dashboard';

export const fleetStats: FleetStats = {
  total: 248,
  online: 234,
  issues: 14,
};

export const assets: Asset[] = [
  {
    id: 'eboss-104',
    name: 'EBOSS-104',
    type: 'generator',
    status: 'warning',
    location: 'Sector 7G',
    icon: 'propane_tank',
    metrics: [
      { label: 'Battery', value: '32%', icon: 'battery_alert' },
      { label: 'Location', value: 'Sector 7G', icon: 'location_on' },
    ],
  },
  {
    id: 'solar-x92',
    name: 'SOLAR-X92',
    type: 'solar',
    status: 'nominal',
    location: 'North Field',
    icon: 'solar_power',
    metrics: [
      { label: 'Output', value: '12.4 kW', icon: 'bolt' },
      { label: 'Location', value: 'North Field', icon: 'location_on' },
    ],
  },
  {
    id: 'wind-t40',
    name: 'WIND-T40',
    type: 'wind',
    status: 'nominal',
    location: 'Coastal Site',
    icon: 'wind_power',
    metrics: [
      { label: 'Wind Speed', value: '18 m/s', icon: 'air' },
      { label: 'Location', value: 'Coastal Site', icon: 'location_on' },
    ],
  },
  {
    id: 'eboss-311',
    name: 'EBOSS-311',
    type: 'factory',
    status: 'offline',
    location: 'Unknown',
    icon: 'factory',
    metrics: [
      { label: 'Signal', value: 'No Signal', icon: 'signal_disconnected' },
      { label: 'Downtime', value: '2h 45m', icon: 'schedule' },
    ],
  },
  {
    id: 'gen-h20',
    name: 'GEN-H20',
    type: 'generator',
    status: 'nominal',
    location: 'Base HQ',
    icon: 'electric_bolt',
    metrics: [
      { label: 'Battery', value: '98%', icon: 'battery_full' },
      { label: 'Location', value: 'Base HQ', icon: 'location_on' },
    ],
  },
];

export const telemetryReadings: TelemetryReading[] = [
  { id: 'oil-press', label: 'Oil Press', value: 42.8, unit: 'PSI' },
  { id: 'coolant', label: 'Coolant', value: 88.2, unit: '°C' },
  { id: 'load', label: 'Load', value: 64, unit: '%' },
  { id: 'fuel-rate', label: 'Fuel Rate', value: 12.4, unit: 'L/h' },
  { id: 'intake', label: 'Intake', value: 34, unit: '°C' },
  { id: 'vibration', label: 'Vibration', value: 0.4, unit: 'mm/s' },
];

export const performanceData: PerformanceData[] = [
  {
    id: 'voltage',
    label: 'Output Voltage',
    value: 480.2,
    unit: 'V',
    chartPath: 'M0,25 Q10,24 20,26 T40,25 T60,24 T80,26 T100,25',
    fillPath: 'M0,25 Q10,24 20,26 T40,25 T60,24 T80,26 T100,25 V50 H0 Z',
  },
  {
    id: 'amperage',
    label: 'Amperage Draw',
    value: 124.5,
    unit: 'A',
    chartPath: 'M0,30 L10,25 L20,35 L30,20 L40,30 L50,15 L60,25 L70,20 L80,30 L90,10 L100,25',
    fillPath: 'M0,30 L10,25 L20,35 L30,20 L40,30 L50,15 L60,25 L70,20 L80,30 L90,10 L100,25 V50 H0 Z',
  },
  {
    id: 'rpm',
    label: 'Engine RPM',
    value: 1850,
    unit: 'RPM',
    chartPath: 'M0,20 H20 L25,18 L30,20 H60 L65,22 L70,20 H100',
    fillPath: 'M0,20 H20 L25,18 L30,20 H60 L65,22 L70,20 H100 V50 H0 Z',
  },
];

export const logEntries: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '14:42:01.05',
    date: 'Today, Oct 25',
    type: 'critical',
    title: 'Critical Fault',
    message: 'Hydraulic Pressure Failure: Pump B',
    icon: 'warning',
    details: {
      ERROR_CODE: '0x8042_HYD_LOSS',
      SENSOR_ID: 'HYD_PUMP_B_04',
      READING: '12.4 PSI',
      THRESHOLD: '> 45.0 PSI',
      DELTA: '-32.6 PSI',
      ACTION: 'AUTO_SHUTDOWN_INIT',
    },
  },
  {
    id: 'log-2',
    timestamp: '14:41:59.00',
    date: 'Today, Oct 25',
    type: 'info',
    title: 'Status Ping',
    message: 'Routine heartbeat check successful',
    icon: 'network_check',
    details: {
      STATUS: 'PING_OK: Latency 12ms | Packet_Loss 0%',
    },
  },
  {
    id: 'log-3',
    timestamp: '13:15:22.84',
    date: 'Today, Oct 25',
    type: 'system',
    title: 'Firmware Patch',
    message: 'Controller logic update v3.4.1 applied',
    icon: 'system_update',
    details: {
      VERSION: '3.4.1-stable',
      MODULE: 'CONTROLLER_MAIN_A',
      HASH: 'e4b8...9f2a',
      REBOOT: 'NOT_REQUIRED',
      LOG: '"Fixed rpm sensor noise filtering"',
    },
  },
  {
    id: 'log-4',
    timestamp: '13:00:00.00',
    date: 'Today, Oct 25',
    type: 'info',
    title: 'Telemetry Sync',
    message: 'Hourly aggregate telemetry package',
    icon: 'sensors',
    details: {
      STATUS: 'Payload size: 42KB. Sent to ANA-CLOUD-WEST.',
    },
  },
  {
    id: 'log-5',
    timestamp: '23:55:10.12',
    date: 'Yesterday, Oct 24',
    type: 'info',
    title: 'System Ready',
    message: 'Pre-shift diagnostic completed: All Green',
    icon: 'check_circle',
    details: {
      STATUS: 'DIAG_OK: 42/42 checks passed.',
    },
  },
];

export const configSections: ConfigSection[] = [
  {
    id: 'network',
    title: 'Network Uplink',
    icon: 'hub',
    settings: [
      {
        id: 'encryption',
        label: 'End-to-End Encryption',
        description: 'AES-256 GCM • ROTATING KEYS',
        type: 'toggle',
        value: true,
      },
      {
        id: 'low-latency',
        label: 'Low Latency Uplink',
        description: 'PRIORITY QUEUE • HIGH POWER',
        type: 'toggle',
        value: false,
      },
      {
        id: 'timeout',
        label: 'Packet Timeout',
        description: 'DISCARD AFTER (MS)',
        type: 'number',
        value: 150,
        unit: 'ms',
      },
    ],
  },
  {
    id: 'thresholds',
    title: 'Alert Thresholds',
    icon: 'tune',
    settings: [
      {
        id: 'hyd-low',
        label: 'Hydraulic Pressure Low',
        description: 'SENSOR ID: P-402',
        type: 'number',
        value: 25.0,
        unit: 'PSI',
      },
      {
        id: 'hyd-high',
        label: 'Hydraulic Pressure High',
        description: 'SENSOR ID: P-402',
        type: 'number',
        value: 85.0,
        unit: 'PSI',
      },
      {
        id: 'temp-low',
        label: 'Core Temperature Low',
        description: 'SENSOR ID: T-105',
        type: 'number',
        value: 10.0,
        unit: '°C',
      },
      {
        id: 'temp-high',
        label: 'Core Temperature High',
        description: 'SENSOR ID: T-105',
        type: 'number',
        value: 105.0,
        unit: '°C',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: 'admin_panel_settings',
    settings: [
      {
        id: 'auth-key',
        label: 'Authorization Key',
        description: 'READ ONLY',
        type: 'text',
        value: '8475-2938-4710-AKD9',
        readonly: true,
      },
      {
        id: 'remote-access',
        label: 'Remote Access',
        description: 'Allow remote start/stop commands',
        type: 'toggle',
        value: true,
      },
    ],
  },
];

export const currentAsset = assets[0]; // EBOSS-104 as default
