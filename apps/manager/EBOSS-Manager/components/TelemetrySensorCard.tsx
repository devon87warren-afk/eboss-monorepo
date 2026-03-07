import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TelemetrySensorCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  status?: 'normal' | 'warning' | 'critical';
  colorScheme?: 'brand' | 'accent' | 'blue' | 'emerald' | 'amber' | 'red';
}

const TelemetrySensorCard: React.FC<TelemetrySensorCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  status = 'normal',
  colorScheme = 'brand'
}) => {
  const getColorClasses = () => {
    const colors = {
      brand: {
        bg: 'bg-brand-50 dark:bg-brand-900/10',
        border: 'border-brand-100 dark:border-brand-800/20',
        icon: 'text-brand-600 dark:text-brand-400',
        value: 'text-slate-900 dark:text-white'
      },
      accent: {
        bg: 'bg-accent-50 dark:bg-accent-900/10',
        border: 'border-accent-100 dark:border-accent-800/20',
        icon: 'text-accent-600 dark:text-accent-400',
        value: 'text-slate-900 dark:text-white'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-100 dark:border-blue-800/20',
        icon: 'text-blue-600 dark:text-blue-400',
        value: 'text-slate-900 dark:text-white'
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/10',
        border: 'border-emerald-100 dark:border-emerald-800/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        value: 'text-slate-900 dark:text-white'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/10',
        border: 'border-amber-100 dark:border-amber-800/20',
        icon: 'text-amber-600 dark:text-amber-400',
        value: 'text-slate-900 dark:text-white'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/10',
        border: 'border-red-100 dark:border-red-800/20',
        icon: 'text-red-600 dark:text-red-400',
        value: 'text-slate-900 dark:text-white'
      }
    };

    return colors[colorScheme];
  };

  const getStatusBadge = () => {
    if (status === 'warning') {
      return <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>;
    }
    if (status === 'critical') {
      return <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>;
    }
    return null;
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.direction === 'up') {
      return <TrendingUp size={12} className="text-emerald-500" />;
    }
    if (trend.direction === 'down') {
      return <TrendingDown size={12} className="text-red-500" />;
    }
    return <Minus size={12} className="text-slate-400" />;
  };

  const colors = getColorClasses();

  return (
    <div className={`relative p-4 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:shadow-md group`}>
      {getStatusBadge()}

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 bg-white dark:bg-dark-800 rounded-lg ${colors.icon} shadow-sm border border-slate-100 dark:border-dark-700 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400">
            {getTrendIcon()}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className={`text-2xl font-black ${colors.value}`}>
            {value}
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelemetrySensorCard;
