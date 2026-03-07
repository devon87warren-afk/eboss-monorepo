"use client";

import { clsx } from "clsx";
import { User, Plane, MapPin, Navigation, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTechnicianLocations } from "@/hooks/queries/useTechnicianLocations";
import type { TechnicianLocationWithProfile } from "@/types/database";

/**
 * FleetMap Component
 *
 * Displays technician locations on a map visualization with real-time updates.
 * Uses Supabase data when available, falls back to mock data when not configured.
 */
export default function FleetMap() {
    const [selectedTech, setSelectedTech] = useState<string | null>(null);

    // Fetch technician locations with polling (30s interval)
    const {
        locations,
        isLoading,
        isError,
        error,
        isUsingMockData,
    } = useTechnicianLocations({
        pollInterval: 30000,
        enablePolling: true,
    });

    // Get selected technician data
    const selectedTechnician = selectedTech
        ? locations.find((t) => t.id === selectedTech)
        : null;

    return (
        <div className="relative h-[600px] w-full overflow-hidden rounded-none border-b border-r border-slate-800 bg-slate-950">
            {/* Map Placeholder - Industrial Dark */}
            <div className="absolute inset-0 opacity-20 bg-[url('/map-pattern.svg')] bg-cover grayscale" />

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />

            {/* Territory Zones Overlay (Mock) */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-slate-900 to-transparent pointer-events-none" />

            {/* Data Source Indicator */}
            {isUsingMockData && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-sm border border-orange-500/30 bg-orange-500/10 px-2 py-1">
                    <AlertCircle size={12} className="text-orange-500" />
                    <span className="font-mono text-[10px] uppercase text-orange-500">
                        Demo Mode
                    </span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-20">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-mono text-sm uppercase">Loading Fleet Data...</span>
                    </div>
                </div>
            )}

            {/* Error State (only show if not using mock data fallback) */}
            {isError && !isUsingMockData && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="font-mono text-xs text-red-400">
                        {error?.message || 'Failed to load locations'}
                    </span>
                </div>
            )}

            {/* Tech Pins */}
            {locations.map((tech) => (
                <TechnicianPin
                    key={tech.id}
                    technician={tech}
                    isSelected={selectedTech === tech.id}
                    onSelect={() => setSelectedTech(tech.id)}
                />
            ))}

            {/* Interactive Tech Card */}
            <AnimatePresence>
                {selectedTechnician && (
                    <TechnicianCard
                        technician={selectedTechnician}
                        onClose={() => setSelectedTech(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * TechnicianPin Component
 * Renders a single technician marker on the map
 */
interface TechnicianPinProps {
    technician: TechnicianLocationWithProfile;
    isSelected: boolean;
    onSelect: () => void;
}

function TechnicianPin({ technician, isSelected, onSelect }: TechnicianPinProps) {
    // Calculate position based on lat/lng
    // This is a simplified projection for demo purposes
    const lat = technician.latitude ?? 38;
    const lng = technician.longitude ?? -95;
    const top = `${50 - (lat - 38) * 10}%`;
    const left = `${50 + (lng + 95) * 5}%`;

    return (
        <div
            className="absolute"
            style={{ top, left }}
        >
            {/* Flight Path Vector */}
            {technician.flight && (
                <svg
                    className="absolute -left-20 -top-10 h-24 w-40 overflow-visible text-slate-600"
                    style={{ transform: 'rotate(15deg)' }}
                >
                    <path
                        d="M0,50 Q50,0 100,50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <path
                        d="M100,50 l-5,-5 l5,5 l-5,5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                    />
                </svg>
            )}

            <button
                onClick={onSelect}
                className={clsx(
                    "relative flex h-6 w-6 items-center justify-center rounded-none border border-slate-950 shadow-lg transition-transform hover:scale-110",
                    technician.status === "Traveling"
                        ? "bg-sky-500 text-white"
                        : technician.status === "On-Site"
                            ? "bg-orange-600 text-white"
                            : "bg-slate-700 text-slate-300",
                    isSelected && "ring-2 ring-orange-500 ring-offset-1 ring-offset-slate-950"
                )}
                style={{ transform: 'rotate(45deg)' }}
            >
                <div style={{ transform: 'rotate(-45deg)' }}>
                    {technician.status === "Traveling" ? (
                        <Plane size={12} />
                    ) : (
                        <User size={12} />
                    )}
                </div>
            </button>

            {/* Label */}
            <div className="absolute left-8 top-0 min-w-[100px] -translate-y-1/2">
                <span className="bg-black/80 px-1 py-0.5 font-mono text-[9px] font-bold uppercase text-white backdrop-blur-sm border border-slate-700">
                    {technician.name}
                </span>
            </div>
        </div>
    );
}

/**
 * TechnicianCard Component
 * Renders the detail card for a selected technician
 */
interface TechnicianCardProps {
    technician: TechnicianLocationWithProfile;
    onClose: () => void;
}

function TechnicianCard({ technician, onClose }: TechnicianCardProps) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-6 left-6 w-80 rounded-sm border border-orange-500/50 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-slate-800 rounded-sm border border-slate-700 text-slate-400">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase tracking-tight">
                            {technician.name}
                        </h3>
                        <p className="font-mono text-xs text-orange-400 uppercase">
                            {technician.status}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    ×
                </button>
            </div>

            <div className="mt-4 space-y-3">
                {technician.current_client && (
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                        <MapPin size={14} className="text-slate-500" />
                        <span>{technician.current_client}</span>
                    </div>
                )}
                {technician.current_task && (
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase">
                        <Navigation size={14} className="text-orange-500" />
                        <span>{technician.current_task}</span>
                    </div>
                )}
                {technician.flight && (
                    <div className="rounded-sm border border-sky-900/50 bg-sky-900/20 p-2 text-xs text-sky-400">
                        <div className="flex items-center gap-2 mb-1">
                            <Plane size={14} />
                            <span className="font-bold uppercase tracking-wider">In Transit</span>
                        </div>
                        <span className="font-mono">
                            {technician.flight.from} → {technician.flight.to} • {technician.flight.progress}% Complete
                        </span>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 w-full bg-sky-900/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sky-500 transition-all duration-300"
                                style={{ width: `${technician.flight.progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="font-mono text-[10px] text-slate-500 uppercase">
                    Updated: {new Date(technician.last_updated).toLocaleTimeString()}
                </p>
            </div>
        </motion.div>
    );
}
