"use client";

import { clsx } from "clsx";
import { Check, Info, Plane, AlertCircle, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useCurrentTripProposal } from "@/hooks/queries/useTripProposals";
import { useBookTrip } from "@/hooks/mutations/useBookTrip";
import type { FlightOption } from "@/types/database";

/**
 * TravelOptimizer Component
 *
 * Displays trip proposals with flight options for booking.
 * Uses Supabase data when available, falls back to mock data when not configured.
 */
export default function TravelOptimizer() {
    const { trip, flightOptions, isLoading, isUsingMockData } = useCurrentTripProposal();
    const bookTrip = useBookTrip();

    // Local state for selected flight (before booking)
    const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

    // Compute initial/default selected flight ID from data
    const defaultFlightId = useMemo(() => {
        if (flightOptions.length === 0) return null;
        const selected = flightOptions.find((f) => f.is_selected);
        const preferred = flightOptions.find((f) => f.is_preferred);
        return selected?.id ?? preferred?.id ?? flightOptions[0]?.id ?? null;
    }, [flightOptions]);

    // Use selected flight ID or fall back to default
    const effectiveSelectedId = selectedFlightId ?? defaultFlightId;

    // Get selected flight details
    const selectedFlight = flightOptions.find((f) => f.id === effectiveSelectedId);

    // Handle booking
    const handleBook = () => {
        if (!trip || !effectiveSelectedId) return;

        bookTrip.mutate(
            { trip_id: trip.id, flight_id: effectiveSelectedId },
            {
                onSuccess: () => {
                    console.log('Flight booked successfully!');
                },
            }
        );
    };

    // Format dates for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-sm border border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-mono text-sm uppercase">Loading Trip Data...</span>
                </div>
            </div>
        );
    }

    // No trip available
    if (!trip) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-sm border border-slate-800 bg-slate-900/50">
                <Plane size={32} className="text-slate-600" />
                <p className="font-mono text-sm text-slate-500 uppercase">No Pending Trip Proposals</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 rounded-sm border border-slate-800 bg-slate-900/50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                        Trip to {trip.destination}
                    </h2>
                    <p className="font-mono text-xs text-orange-500 uppercase tracking-wider">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        {trip.client_name && ` • ${trip.client_name}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isUsingMockData && (
                        <div className="flex items-center gap-1 rounded-sm border border-orange-500/30 bg-orange-500/10 px-2 py-1">
                            <AlertCircle size={10} className="text-orange-500" />
                            <span className="font-mono text-[10px] uppercase text-orange-500">Demo</span>
                        </div>
                    )}
                    <div className="rounded-sm border border-slate-700 bg-slate-800 p-2 text-slate-400">
                        <Plane size={20} />
                    </div>
                </div>
            </div>

            {/* Date Slider Visual (Simplified) */}
            <DateSlider
                startDate={trip.start_date}
                endDate={trip.end_date}
                purpose={trip.purpose}
            />

            {/* Flight Options */}
            <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span className="h-1.5 w-1.5 bg-orange-500"></span>
                    Recommended Flight Options
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {flightOptions.map((option) => (
                        <FlightOptionCard
                            key={option.id}
                            option={option}
                            isSelected={effectiveSelectedId === option.id}
                            onSelect={() => setSelectedFlightId(option.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Book Button */}
            <button
                onClick={handleBook}
                disabled={!selectedFlight || bookTrip.isPending || trip.status === 'booked'}
                className={clsx(
                    "w-full rounded-sm py-3 text-sm font-bold uppercase tracking-wider transition-all",
                    trip.status === 'booked'
                        ? "bg-green-600 text-white cursor-default"
                        : bookTrip.isPending
                            ? "bg-slate-700 text-slate-400 cursor-wait"
                            : "bg-orange-600 text-white hover:bg-orange-500"
                )}
            >
                {trip.status === 'booked' ? (
                    <span className="flex items-center justify-center gap-2">
                        <Check size={16} /> Booked
                    </span>
                ) : bookTrip.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Processing...
                    </span>
                ) : (
                    `Confirm & Book (${selectedFlight ? `$${selectedFlight.price}` : '...'})`
                )}
            </button>
        </div>
    );
}

/**
 * DateSlider Component
 * Visual representation of trip dates
 */
interface DateSliderProps {
    startDate: string;
    endDate: string;
    purpose?: string | null;
}

function DateSlider({ startDate, endDate, purpose }: DateSliderProps) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Generate day labels
    const dayLabels = Array.from({ length: Math.min(days, 4) }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (i === 0) return `${dayName} (Fly In)`;
        if (i === days - 1) return `${dayName} (Fly Out)`;
        return dayName;
    });

    return (
        <div className="relative pt-6 pb-2">
            <div className="flex justify-between font-mono text-[10px] font-bold uppercase text-slate-500">
                {dayLabels.map((label, i) => (
                    <span key={i}>{label}</span>
                ))}
            </div>
            <div className="relative mt-2 h-1 w-full bg-slate-800">
                <div className="absolute left-0 top-0 h-full w-full bg-orange-600/20"></div>
                {/* Draggable Knobs Mockup */}
                <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-none bg-orange-500 ring-1 ring-black"></div>
                <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-none bg-orange-500 ring-1 ring-black"></div>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
                <Info size={12} className="inline mr-1 text-orange-500" />
                {purpose || 'Smart Logic: based off of your travel preferences'}
            </p>
        </div>
    );
}

/**
 * FlightOptionCard Component
 * Renders a single flight option for selection
 */
interface FlightOptionCardProps {
    option: FlightOption;
    isSelected: boolean;
    onSelect: () => void;
}

function FlightOptionCard({ option, isSelected, onSelect }: FlightOptionCardProps) {
    return (
        <button
            onClick={onSelect}
            className={clsx(
                "relative flex flex-col items-start gap-2 rounded-sm border p-4 text-left transition-all",
                isSelected
                    ? "border-orange-500 bg-slate-800/80 ring-1 ring-orange-500"
                    : "border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-orange-500/50"
            )}
        >
            <div className="flex w-full items-center justify-between">
                <span
                    className={clsx(
                        "font-bold uppercase tracking-tight",
                        isSelected ? "text-white" : "text-slate-400"
                    )}
                >
                    {option.airline}
                </span>
                <span className="font-mono font-bold text-white">${option.price}</span>
            </div>

            <div className="flex items-center gap-2">
                {option.is_preferred && (
                    <span className="rounded-none border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-300">
                        Loyalty Choice
                    </span>
                )}
                {option.is_deal && (
                    <span className="rounded-sm bg-green-900/20 text-green-400 px-2 py-0.5 text-[10px] uppercase font-bold">
                        Value Deal
                    </span>
                )}
            </div>

            <ul className="mt-1 space-y-1">
                {option.perks.map((perk) => (
                    <li
                        key={perk}
                        className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-500"
                    >
                        <Check size={10} className="text-orange-500" />
                        {perk}
                    </li>
                ))}
            </ul>

            {isSelected && (
                <div className="absolute -right-1 -top-1 bg-orange-500 p-0.5 text-black">
                    <Check size={10} strokeWidth={4} />
                </div>
            )}
        </button>
    );
}
