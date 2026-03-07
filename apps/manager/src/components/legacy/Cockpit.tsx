/**
 * Cockpit - Unified Operations Dashboard
 * Combines real-time fleet tracking, stats, and impact projections
 */

import React from 'react';
import { motion } from 'framer-motion';
import FleetMap from '../dashboard/FleetMap';
import StatsOverview from '../dashboard/StatsOverview';
import SavingsCalculator from '../dashboard/SavingsCalculator';
import { pageTransition } from '@/lib/animations';

export default function Cockpit() {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Operations Cockpit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time fleet tracking and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-mono uppercase text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fleet Map - Takes 2 columns */}
        <div className="lg:col-span-2">
          <FleetMap />
        </div>

        {/* Savings Calculator */}
        <div className="lg:col-span-1">
          <SavingsCalculator />
        </div>
      </div>

      {/* Info Footer */}
      <div className="rounded-sm border border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Cockpit Mode:</strong> All data refreshes automatically.
          Fleet positions update every 30 seconds. Click any technician marker for detailed information.
        </p>
      </div>
    </motion.div>
  );
}
