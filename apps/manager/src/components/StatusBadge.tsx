import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Wrench, Clock, Radio } from 'lucide-react';
import { UnitStatus, TicketStatus, TicketPriority, TelemetryStatus } from '../types';

interface StatusBadgeProps {
  status: UnitStatus | TicketStatus | TicketPriority | TelemetryStatus | string;
  type?: 'unit' | 'ticket' | 'priority' | 'telemetry';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'unit',
  size = 'md',
  showIcon = true
}) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: 'text-[10px] px-2 py-0.5',
      md: 'text-xs px-3 py-1',
      lg: 'text-sm px-4 py-1.5'
    };
    return sizes[size];
  };

  const getUnitStatusConfig = () => {
    const configs: Record<string, { label: string; classes: string; icon: any }> = {
      [UnitStatus.ACTIVE]: {
        label: 'In Service',
        classes: 'bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300 border border-accent-200 dark:border-accent-800/40',
        icon: CheckCircle
      },
      [UnitStatus.DOWN]: {
        label: 'Down',
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40',
        icon: XCircle
      },
      [UnitStatus.MAINTENANCE]: {
        label: 'Maintenance',
        classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40',
        icon: Wrench
      }
    };
    return configs[status] || configs[UnitStatus.ACTIVE];
  };

  const getTicketStatusConfig = () => {
    const configs: Record<string, { label: string; classes: string; icon: any }> = {
      [TicketStatus.OPEN]: {
        label: 'Open',
        classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40',
        icon: AlertTriangle
      },
      [TicketStatus.IN_PROGRESS]: {
        label: 'In Progress',
        classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40',
        icon: Clock
      },
      [TicketStatus.RESOLVED]: {
        label: 'Resolved',
        classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40',
        icon: CheckCircle
      },
      [TicketStatus.CLOSED]: {
        label: 'Closed',
        classes: 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40',
        icon: CheckCircle
      }
    };
    return configs[status] || configs[TicketStatus.OPEN];
  };

  const getPriorityConfig = () => {
    const configs: Record<string, { label: string; classes: string; icon: any }> = {
      [TicketPriority.LOW]: {
        label: 'Low',
        classes: 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40',
        icon: null
      },
      [TicketPriority.MEDIUM]: {
        label: 'Medium',
        classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40',
        icon: null
      },
      [TicketPriority.HIGH]: {
        label: 'High',
        classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40',
        icon: AlertTriangle
      },
      [TicketPriority.CRITICAL]: {
        label: 'Critical',
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40',
        icon: AlertTriangle
      }
    };
    return configs[status] || configs[TicketPriority.MEDIUM];
  };

  const getTelemetryStatusConfig = () => {
    const configs: Record<string, { label: string; classes: string; icon: any }> = {
      [TelemetryStatus.ONLINE]: {
        label: 'Online',
        classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40',
        icon: Radio
      },
      [TelemetryStatus.WARNING]: {
        label: 'Warning',
        classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40',
        icon: AlertTriangle
      },
      [TelemetryStatus.CRITICAL]: {
        label: 'Critical',
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/40',
        icon: XCircle
      },
      [TelemetryStatus.OFFLINE]: {
        label: 'Offline',
        classes: 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40',
        icon: Radio
      }
    };
    return configs[status] || configs[TelemetryStatus.OFFLINE];
  };

  const getConfig = () => {
    if (type === 'unit') return getUnitStatusConfig();
    if (type === 'ticket') return getTicketStatusConfig();
    if (type === 'priority') return getPriorityConfig();
    if (type === 'telemetry') return getTelemetryStatusConfig();
    return getUnitStatusConfig();
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${getSizeClasses()} ${config.classes}`}
    >
      {showIcon && Icon && <Icon size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
