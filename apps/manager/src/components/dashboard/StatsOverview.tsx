/**
 * StatsOverview - Dashboard KPI cards with animations
 * Ported from EBOSS_Tech_App
 */

import { LucideIcon, Droplets, Gauge, Moon, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { staggerContainer, listItem } from '@/lib/animations';

export interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  change?: number;
  changeLabel?: string;
}

interface StatsOverviewProps {
  stats?: StatItem[];
  className?: string;
}

// Default stats - can be overridden with props
const DEFAULT_STATS: StatItem[] = [
  {
    label: "Fuel Saved",
    value: "1,240 Gal",
    icon: Droplets,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    change: 12,
    changeLabel: "vs last month"
  },
  {
    label: "CO2 Reduced",
    value: "4.2 Tons",
    icon: Gauge,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    change: 8,
    changeLabel: "vs last month"
  },
  {
    label: "Silent Hours",
    value: "88 Hrs",
    icon: Moon,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    change: 15,
    changeLabel: "vs last month"
  },
  {
    label: "Active Jobs",
    value: "3",
    icon: Wrench,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    change: 0,
    changeLabel: "no change"
  },
];

export default function StatsOverview({
  stats = DEFAULT_STATS,
  className
}: StatsOverviewProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={clsx(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={listItem}>
          <Card className="border border-slate-700 bg-slate-900 shadow-none transition-all duration-200 hover:border-orange-500/50 hover:bg-slate-800/80 group">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={clsx(
                "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
                stat.bgColor || "bg-slate-800",
                "group-hover:scale-110 transition-transform duration-200"
              )}>
                <stat.icon
                  size={24}
                  strokeWidth={1.5}
                  className={clsx(stat.color || "text-slate-400")}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">
                  {stat.label}
                </p>
                <h3 className="font-mono text-2xl font-bold tracking-tight text-white">
                  {stat.value}
                </h3>
                {stat.change !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    {stat.change > 0 ? (
                      <TrendingUp size={12} className="text-green-500" />
                    ) : stat.change < 0 ? (
                      <TrendingDown size={12} className="text-red-500" />
                    ) : null}
                    <span className={clsx(
                      "text-[10px]",
                      stat.change > 0 ? "text-green-500" :
                      stat.change < 0 ? "text-red-500" : "text-slate-500"
                    )}>
                      {stat.change > 0 && '+'}
                      {stat.change !== 0 ? `${stat.change}%` : stat.changeLabel}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Export preset stat configurations for common use cases
export const createUnitStats = (data: {
  fuelSaved: number;
  co2Reduced: number;
  silentHours: number;
  activeJobs: number;
}): StatItem[] => [
  {
    label: "Fuel Saved",
    value: `${data.fuelSaved.toLocaleString()} Gal`,
    icon: Droplets,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    label: "CO2 Reduced",
    value: `${data.co2Reduced.toFixed(1)} Tons`,
    icon: Gauge,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    label: "Silent Hours",
    value: `${data.silentHours} Hrs`,
    icon: Moon,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10"
  },
  {
    label: "Active Jobs",
    value: data.activeJobs.toString(),
    icon: Wrench,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
];
