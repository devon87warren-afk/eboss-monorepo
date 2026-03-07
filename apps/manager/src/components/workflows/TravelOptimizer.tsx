/**
 * TravelOptimizer - Intelligent flight booking with loyalty optimization
 * Ported from EBOSS_Tech_App with enhanced TypeScript support
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Info, Plane, Calendar, MapPin, DollarSign, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { fadeInUp, staggerContainer, listItem } from '@/lib/animations';

export interface FlightOption {
  id: string;
  airline: string;
  price: number;
  departureTime?: string;
  arrivalTime?: string;
  perks: string[];
  isPreferred?: boolean;
  isDeal?: boolean;
}

export interface TripProposal {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  client?: string;
  purpose?: string;
  flightOptions: FlightOption[];
}

interface TravelOptimizerProps {
  trip?: TripProposal;
  onBookFlight?: (tripId: string, flightOptionId: string) => void;
  onCancel?: () => void;
  className?: string;
}

// Default mock trip for demo
const DEFAULT_TRIP: TripProposal = {
  id: 'trip-001',
  destination: 'Washington DC',
  startDate: 'Feb 12',
  endDate: 'Feb 14',
  client: 'Sunbelt Rentals',
  purpose: 'Installation & Training',
  flightOptions: [
    {
      id: 'loyalty-1',
      airline: 'Delta',
      price: 450,
      departureTime: '6:00 AM',
      arrivalTime: '2:30 PM',
      perks: ['Upgrade Eligible', '9x Points', 'Preferred Seat', 'Priority Boarding'],
      isPreferred: true,
    },
    {
      id: 'deal-1',
      airline: 'Southwest',
      price: 320,
      departureTime: '8:15 AM',
      arrivalTime: '4:45 PM',
      perks: ['No Change Fees', '2 Bags Free', 'Open Seating'],
      isDeal: true,
    },
  ],
};

export default function TravelOptimizer({
  trip = DEFAULT_TRIP,
  onBookFlight,
  onCancel,
  className,
}: TravelOptimizerProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    trip.flightOptions.find(o => o.isPreferred)?.id || trip.flightOptions[0]?.id || ''
  );
  const [isBooking, setIsBooking] = useState(false);

  const selectedFlight = trip.flightOptions.find(o => o.id === selectedOption);

  const handleBook = async () => {
    if (!selectedOption) return;
    setIsBooking(true);

    // Simulate booking delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    onBookFlight?.(trip.id, selectedOption);
    setIsBooking(false);
  };

  return (
    <Card className={clsx("border-slate-700 bg-slate-900/90 backdrop-blur", className)}>
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-white">
            <Plane size={16} className="text-orange-500" />
            Travel.AI
          </CardTitle>
          <span className="rounded-sm bg-sky-900/50 px-2 py-0.5 font-mono text-[10px] text-sky-400">
            SMART_BOOKING
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Trip Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Trip to {trip.destination}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 font-mono text-xs text-orange-500">
                <Calendar size={12} />
                {trip.startDate} - {trip.endDate}
              </span>
              {trip.client && (
                <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
                  <MapPin size={12} />
                  {trip.client}
                </span>
              )}
            </div>
            {trip.purpose && (
              <p className="text-sm text-slate-500 mt-1">{trip.purpose}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <Plane size={24} className="text-slate-400" />
          </div>
        </div>

        {/* Timeline Visual */}
        <div className="relative py-4">
          <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500 mb-3">
            <span>Fly In</span>
            <span>On-Site Work</span>
            <span>Fly Out</span>
          </div>
          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-600 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1 }}
            />
            {/* Timeline markers */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-orange-500 border-2 border-slate-900" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-orange-500 border-2 border-slate-900" />
          </div>
          <p className="mt-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            <Info size={12} className="text-orange-500" />
            Optimized based on your travel preferences & loyalty programs
          </p>
        </div>

        {/* Flight Options */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Recommended Flight Options
          </h3>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-3 sm:grid-cols-2"
          >
            {trip.flightOptions.map((option) => (
              <motion.button
                key={option.id}
                variants={listItem}
                onClick={() => setSelectedOption(option.id)}
                className={clsx(
                  "relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200",
                  selectedOption === option.id
                    ? "border-orange-500 bg-slate-800/80 ring-2 ring-orange-500/50"
                    : "border-slate-700 bg-slate-950 hover:bg-slate-900 hover:border-slate-600"
                )}
              >
                {/* Airline & Price */}
                <div className="flex w-full items-center justify-between">
                  <span className={clsx(
                    "text-lg font-bold uppercase tracking-tight",
                    selectedOption === option.id ? "text-white" : "text-slate-400"
                  )}>
                    {option.airline}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xl font-bold text-white">
                    <DollarSign size={16} className="text-green-500" />
                    {option.price}
                  </span>
                </div>

                {/* Times */}
                {option.departureTime && option.arrivalTime && (
                  <div className="text-xs text-slate-500">
                    {option.departureTime} → {option.arrivalTime}
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {option.isPreferred && (
                    <span className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] uppercase font-bold text-amber-400">
                      <Award size={10} />
                      Loyalty Choice
                    </span>
                  )}
                  {option.isDeal && (
                    <span className="rounded-md bg-green-900/30 border border-green-500/30 text-green-400 px-2 py-1 text-[10px] uppercase font-bold">
                      Value Deal
                    </span>
                  )}
                </div>

                {/* Perks */}
                <ul className="space-y-1.5 w-full">
                  {option.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2 text-xs text-slate-400"
                    >
                      <Check size={12} className="text-orange-500 flex-shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* Selected indicator */}
                <AnimatePresence>
                  {selectedOption === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-2 -top-2 rounded-full bg-orange-500 p-1.5 shadow-lg"
                    >
                      <Check size={12} strokeWidth={3} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Savings Callout */}
        {selectedFlight && trip.flightOptions.length > 1 && (
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            {selectedFlight.isDeal ? (
              <p className="text-sm text-green-400">
                Saving <span className="font-bold">${Math.max(...trip.flightOptions.map(o => o.price)) - selectedFlight.price}</span> with this option
              </p>
            ) : selectedFlight.isPreferred ? (
              <p className="text-sm text-amber-400">
                Earning <span className="font-bold">bonus points</span> with your loyalty program
              </p>
            ) : null}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-bold uppercase tracking-wider text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleBook}
            disabled={!selectedOption || isBooking}
            className={clsx(
              "flex-1 rounded-lg py-3 text-sm font-bold uppercase tracking-wider transition-all",
              "bg-orange-600 text-white hover:bg-orange-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isBooking && "animate-pulse"
            )}
          >
            {isBooking ? 'Booking...' : `Confirm & Book ($${selectedFlight?.price || 0})`}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
