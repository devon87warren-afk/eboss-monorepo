import React from 'react';
import { Link } from 'react-router-dom';
import { ColumnConfig } from '../types/WorkflowConfig';
import { ComponentRegistry } from '../registry/ComponentRegistry';

// Render a cell value based on its configuration
export const renderCellValue = (
  value: unknown,
  row: Record<string, unknown>,
  config: ColumnConfig
): React.ReactNode => {
  // If custom render component is specified
  if (config.render) {
    const CustomRenderer = ComponentRegistry.getComponent(config.render);
    if (CustomRenderer) {
      return <CustomRenderer value={value} row={row} config={config} />;
    }
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  // Built-in renderers
  switch (config.type) {
    case 'link':
      return (
        <Link
          to={`/${config.key.replace('Id', '')}/${value}`}
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </Link>
      );

    case 'badge':
      return renderBadge(String(value), config.key);

    case 'status':
      return renderStatusBadge(String(value));

    case 'date':
      return renderDate(value as string, config.format?.type);

    case 'number':
      return renderNumber(value as number, config.format);

    default:
      return <span>{String(value)}</span>;
  }
};

// Render a generic badge
const renderBadge = (value: string, fieldKey: string): React.ReactNode => {
  // Color mapping based on value and field
  let colorClasses = '';

  if (fieldKey.toLowerCase().includes('priority')) {
    const priorityColors: Record<string, string> = {
      'Low': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
      'Medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'High': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    colorClasses = priorityColors[value] || 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300';
  } else {
    colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300';
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${colorClasses}`}>
      {value}
    </span>
  );
};

// Render a status badge with color coding
const renderStatusBadge = (status: string): React.ReactNode => {
  const statusColors: Record<string, string> = {
    // Ticket/Task statuses
    'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Resolved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Closed': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',

    // Unit statuses
    'In Service': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Maintenance': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Down': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',

    // Telemetry statuses
    'Online': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Offline': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
    'Warning': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  const colorClass = statusColors[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};

// Render a formatted date
const renderDate = (dateString: string, formatType?: string): React.ReactNode => {
  if (!dateString) return null;

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Show relative time for recent dates
  if (formatType === 'datetime' || !formatType) {
    if (diffMins < 60) {
      return <span className="text-slate-600 dark:text-slate-400">{diffMins}m ago</span>;
    }
    if (diffHours < 24) {
      return <span className="text-slate-600 dark:text-slate-400">{diffHours}h ago</span>;
    }
    if (diffDays < 7) {
      return <span className="text-slate-600 dark:text-slate-400">{diffDays}d ago</span>;
    }
  }

  // Show formatted date
  return (
    <span className="text-slate-600 dark:text-slate-400" title={date.toLocaleString()}>
      {date.toLocaleDateString()}
    </span>
  );
};

// Render a formatted number
const renderNumber = (value: number, format?: ColumnConfig['format']): React.ReactNode => {
  if (format?.type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: format.options?.currency || 'USD',
    }).format(value);
  }

  if (format?.type === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }

  return value.toLocaleString();
};
