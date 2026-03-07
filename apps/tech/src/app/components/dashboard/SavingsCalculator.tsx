"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Leaf, TreeDeciduous, Factory, Save, AlertCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useSavingsCalculator, useCreateSavingsProjection } from "@/hooks/queries/useSavingsProjections";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * SavingsCalculator Component
 *
 * Interactive calculator showing fuel and emissions savings for EBOSS units.
 * Calculates client-side for instant feedback, optionally persists to database.
 */
export default function SavingsCalculator() {
    // Input state
    const [runtime, setRuntime] = useState(24); // Hours per day
    const [fuelPrice, setFuelPrice] = useState(4.50); // $ per gallon
    const [days, setDays] = useState(30); // Project duration

    // Hooks
    const { calculate } = useSavingsCalculator();
    const createProjection = useCreateSavingsProjection();

    // Check if Supabase is configured
    const canSave = isSupabaseConfigured();

    // Calculate savings (memoized for performance)
    const savings = useMemo(
        () => calculate(runtime, fuelPrice, days),
        [runtime, fuelPrice, days, calculate]
    );

    // Handle save to database
    const handleSave = () => {
        if (!canSave) return;

        createProjection.mutate({
            runtime_hours: runtime,
            fuel_price: fuelPrice,
            project_days: days,
            fuel_saved: savings.fuelSaved,
            cost_saved: savings.costSaved,
            co2_saved_tons: savings.co2SavedTons,
        });
    };

    return (
        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur">
            <CardHeader className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-white">
                        <Leaf size={16} className="text-green-500" /> Impact_Projections
                    </CardTitle>
                    <div className="flex gap-1">
                        {!canSave && (
                            <div className="flex items-center gap-1 rounded-sm bg-orange-500/10 px-2 py-0.5 border border-orange-500/30">
                                <AlertCircle size={10} className="text-orange-500" />
                                <span className="font-mono text-[10px] text-orange-500">Demo</span>
                            </div>
                        )}
                        <span className="rounded-sm bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                            LTO_ACTIVE
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">

                {/* TOP ROW: The Big Numbers */}
                <div className="grid grid-cols-2 gap-4">
                    <SavingsCard
                        icon={<DollarSign size={12} />}
                        label="OPEX Savings"
                        value={`$${savings.costSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        subtext={`Over ${days} days`}
                    />
                    <SavingsCard
                        icon={<Factory size={12} />}
                        label="CO2 Eliminated"
                        value={
                            <>
                                {savings.co2SavedTons.toFixed(1)}{" "}
                                <span className="text-sm text-slate-500">tons</span>
                            </>
                        }
                        subtext={
                            <span className="flex items-center gap-1">
                                <TreeDeciduous size={10} /> {savings.treesEquivalent.toLocaleString()} trees planted
                            </span>
                        }
                    />
                </div>

                {/* Fuel Saved Card */}
                <div className="rounded-sm border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] uppercase text-slate-500">
                            <Leaf size={12} /> Fuel Saved
                        </div>
                        <span className="font-mono text-lg font-bold text-green-500">
                            {savings.fuelSaved.toLocaleString()} gal
                        </span>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="space-y-4 rounded-sm bg-slate-800/20 p-4">

                    {/* Runtime Slider */}
                    <SliderControl
                        label="Daily Runtime"
                        value={runtime}
                        unit="Hrs"
                        min={1}
                        max={24}
                        onChange={setRuntime}
                    />

                    {/* Duration Slider */}
                    <SliderControl
                        label="Project Duration"
                        value={days}
                        unit="Days"
                        min={1}
                        max={90}
                        onChange={setDays}
                    />

                    {/* Fuel Price Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-[10px] uppercase text-slate-400">
                            <span>Fuel Price</span>
                            <span className="text-orange-500">${fuelPrice.toFixed(2)}/gal</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            step="0.05"
                            value={fuelPrice}
                            onChange={(e) => setFuelPrice(Number(e.target.value))}
                            className="h-1 w-full appearance-none rounded-full bg-slate-700 accent-orange-500"
                        />
                    </div>
                </div>

                {/* COMPARISON BAR */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase text-slate-500">
                        <span>Standard Diesel</span>
                        <span>EBOSS Hybrid</span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        {/* Visualizing the 75% reduction */}
                        <div className="h-full w-full bg-slate-600" />
                        <div className="h-full w-[25%] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                    <p className="text-right text-[10px] text-green-500 font-bold">
                        75% EMISSIONS REDUCTION
                    </p>
                </div>

                {/* Save Button (only shown when Supabase is configured) */}
                {canSave && (
                    <button
                        onClick={handleSave}
                        disabled={createProjection.isPending}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 rounded-sm py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                            createProjection.isPending
                                ? "bg-slate-700 text-slate-400 cursor-wait"
                                : createProjection.isSuccess
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                        )}
                    >
                        {createProjection.isPending ? (
                            <>
                                <Loader2 size={14} className="animate-spin" /> Saving...
                            </>
                        ) : createProjection.isSuccess ? (
                            <>
                                <Save size={14} /> Saved!
                            </>
                        ) : (
                            <>
                                <Save size={14} /> Save Projection
                            </>
                        )}
                    </button>
                )}

            </CardContent>
        </Card>
    );
}

/**
 * SavingsCard Component
 * Displays a savings metric with icon and subtext
 */
interface SavingsCardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    subtext: React.ReactNode;
}

function SavingsCard({ icon, label, value, subtext }: SavingsCardProps) {
    return (
        <div className="space-y-1 rounded-sm border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase text-slate-500">
                {icon} {label}
            </div>
            <div className="font-mono text-2xl font-bold text-white">{value}</div>
            <div className="text-[10px] text-green-500">{subtext}</div>
        </div>
    );
}

/**
 * SliderControl Component
 * Reusable slider input with label and value display
 */
interface SliderControlProps {
    label: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

function SliderControl({ label, value, unit, min, max, onChange }: SliderControlProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between font-mono text-[10px] uppercase text-slate-400">
                <span>{label}</span>
                <span className="text-orange-500">
                    {value} {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-1 w-full appearance-none rounded-full bg-slate-700 accent-orange-500"
            />
        </div>
    );
}
