/**
 * SavingsCalculator - OPEX and CO2 impact projections
 * Ported from EBOSS_Tech_App
 * Based on ANA EBOSS hybrid generator specifications
 */

import { useState, useMemo } from 'react';
import { DollarSign, Leaf, TreeDeciduous, Factory, Fuel, Clock, Calculator } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, listItem } from '@/lib/animations';

interface SavingsCalculatorProps {
  /** Initial runtime hours per day */
  initialRuntime?: number;
  /** Initial fuel price per gallon */
  initialFuelPrice?: number;
  /** Initial project duration in days */
  initialDays?: number;
  /** Unit serial number for linking to specific equipment */
  unitSerialNumber?: string;
  /** Callback when calculations change */
  onCalculationChange?: (data: SavingsData) => void;
  className?: string;
}

export interface SavingsData {
  runtime: number;
  fuelPrice: number;
  days: number;
  totalStandardFuel: number;
  totalHybridFuel: number;
  fuelSaved: number;
  costSaved: number;
  co2SavedLbs: number;
  co2SavedTons: number;
  treesEquivalent: number;
}

// Constants based on ANA EBOSS specifications and EPA standards
const STANDARD_BURN_RATE = 1.5;    // gal/hr for standard 25kVA diesel generator
const HYBRID_BURN_RATE = 0.375;   // gal/hr for EBOSS hybrid (~75% reduction)
const CO2_PER_GALLON = 22.4;      // lbs of CO2 per gallon of diesel (EPA)
const CO2_PER_TREE_YEAR = 48;     // lbs CO2 absorbed per tree per year

export default function SavingsCalculator({
  initialRuntime = 24,
  initialFuelPrice = 4.50,
  initialDays = 30,
  unitSerialNumber,
  onCalculationChange,
  className
}: SavingsCalculatorProps) {
  const [runtime, setRuntime] = useState(initialRuntime);
  const [fuelPrice, setFuelPrice] = useState(initialFuelPrice);
  const [days, setDays] = useState(initialDays);

  // Calculate all savings metrics
  const calculations = useMemo<SavingsData>(() => {
    const totalStandardFuel = runtime * days * STANDARD_BURN_RATE;
    const totalHybridFuel = runtime * days * HYBRID_BURN_RATE;
    const fuelSaved = totalStandardFuel - totalHybridFuel;
    const costSaved = fuelSaved * fuelPrice;
    const co2SavedLbs = fuelSaved * CO2_PER_GALLON;
    const co2SavedTons = co2SavedLbs / 2000;
    const treesEquivalent = Math.floor(co2SavedLbs / CO2_PER_TREE_YEAR);

    const data: SavingsData = {
      runtime,
      fuelPrice,
      days,
      totalStandardFuel,
      totalHybridFuel,
      fuelSaved,
      costSaved,
      co2SavedLbs,
      co2SavedTons,
      treesEquivalent,
    };

    onCalculationChange?.(data);
    return data;
  }, [runtime, fuelPrice, days, onCalculationChange]);

  return (
    <Card className={clsx("border-slate-700 bg-slate-900/90 backdrop-blur", className)}>
      <CardHeader className="border-b border-slate-700 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-white">
            <Calculator size={16} className="text-orange-500" />
            Impact_Projections
          </CardTitle>
          <div className="flex gap-2">
            {unitSerialNumber && (
              <span className="rounded-sm bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                {unitSerialNumber}
              </span>
            )}
            <span className="rounded-sm bg-green-900/50 px-2 py-0.5 font-mono text-[10px] text-green-400">
              LTO_ACTIVE
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Big Numbers */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-4"
        >
          <motion.div
            variants={listItem}
            className="space-y-1 rounded-lg border border-slate-700 bg-slate-950/50 p-4"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase text-slate-500">
              <DollarSign size={12} className="text-green-500" />
              OPEX Savings
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              ${calculations.costSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-green-500">
              Over {days} days
            </div>
          </motion.div>

          <motion.div
            variants={listItem}
            className="space-y-1 rounded-lg border border-slate-700 bg-slate-950/50 p-4"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase text-slate-500">
              <Factory size={12} className="text-blue-500" />
              CO2 Eliminated
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              {calculations.co2SavedTons.toFixed(1)}
              <span className="text-sm text-slate-500 ml-1">tons</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-500">
              <TreeDeciduous size={12} />
              {calculations.treesEquivalent.toLocaleString()} trees planted
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
            <Fuel size={20} className="text-orange-500" />
            <div>
              <div className="text-[10px] uppercase text-slate-500">Fuel Saved</div>
              <div className="font-mono text-lg font-bold text-white">
                {calculations.fuelSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })} gal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
            <Leaf size={20} className="text-green-500" />
            <div>
              <div className="text-[10px] uppercase text-slate-500">Efficiency</div>
              <div className="font-mono text-lg font-bold text-green-400">75% Reduction</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 rounded-lg bg-slate-800/30 p-4">
          {/* Runtime Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs uppercase text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Daily Runtime
              </span>
              <span className="text-orange-500 font-bold">{runtime} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={runtime}
              onChange={(e) => setRuntime(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-full bg-slate-700 accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>1 hr</span>
              <span>24 hr</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs uppercase text-slate-400">
              <span>Project Duration</span>
              <span className="text-orange-500 font-bold">{days} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-full bg-slate-700 accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>1 day</span>
              <span>90 days</span>
            </div>
          </div>

          {/* Fuel Price Input */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs uppercase text-slate-400">
              <span>Fuel Price</span>
              <span className="text-orange-500 font-bold">${fuelPrice.toFixed(2)}/gal</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="0.10"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-full bg-slate-700 accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>$2.00</span>
              <span>$8.00</span>
            </div>
          </div>
        </div>

        {/* Comparison Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] uppercase text-slate-500">
            <span>Standard Diesel ({calculations.totalStandardFuel.toFixed(0)} gal)</span>
            <span>EBOSS Hybrid ({calculations.totalHybridFuel.toFixed(0)} gal)</span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
            {/* Standard diesel portion */}
            <div className="absolute inset-0 bg-slate-600" />
            {/* Hybrid portion (25% of standard) */}
            <motion.div
              className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-600 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: '25%' }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(255,255,255,0.2)'
              }}
            />
          </div>
          <p className="text-center text-xs text-green-500 font-bold uppercase tracking-wider">
            75% Emissions Reduction
          </p>
        </div>

        {/* Calculation Notes */}
        <div className="text-[10px] text-slate-600 space-y-1 border-t border-slate-800 pt-3">
          <p>* Standard 25kVA diesel: {STANDARD_BURN_RATE} gal/hr at variable load</p>
          <p>* EBOSS Hybrid: {HYBRID_BURN_RATE} gal/hr (75% reduction per ANA spec)</p>
          <p>* CO2 calculation: {CO2_PER_GALLON} lbs/gallon (EPA standard)</p>
        </div>
      </CardContent>
    </Card>
  );
}
