
import React, { useState, useEffect } from 'react';
import { GeminiTravelOrchestrator } from '../lib/gemini-travel/services/orchestrator';
import { TripProposal, TravelProfile } from '../lib/gemini-travel/types';
import { Plane, Hotel, Calendar, MapPin, CheckCircle, Loader2, Star, Shield, ArrowRight } from 'lucide-react';

const MOCK_PROFILE: TravelProfile = {
    homeAirport: 'LAX',
    seatingPreference: 'window',
    loyaltyPrograms: [
        { id: '1', providerType: 'airline', providerName: 'Delta', memberNumber: 'DL123456', statusLevel: 'Gold' },
        { id: '2', providerType: 'hotel', providerName: 'Marriott', memberNumber: 'MB987654', statusLevel: 'Platinum' }
    ]
};

const MOCK_CALENDAR_EVENT = {
    title: 'Site Commissioning - SolarFields Alpha',
    location: 'Austin, TX',
    startDate: '2025-04-15T09:00:00',
    endDate: '2025-04-17T17:00:00'
};

const GeminiTravelConcierge: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [proposal, setProposal] = useState<TripProposal | null>(null);
    const [selectedOutbound, setSelectedOutbound] = useState<string | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<string | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'confirmed'>('idle');

    useEffect(() => {
        // Simulate AI Generation Latency
        setTimeout(async () => {
            const trip = await GeminiTravelOrchestrator.generateTripProposal(MOCK_CALENDAR_EVENT, MOCK_PROFILE);
            setProposal(trip);
            // Auto-select first options as "AI Recommendations"
            if (trip.flightOptions.outbound.length > 0) setSelectedOutbound(trip.flightOptions.outbound[0].id);
            if (trip.flightOptions.return.length > 0) setSelectedReturn(trip.flightOptions.return[0].id);
            if (trip.hotelOptions.length > 0) setSelectedHotel(trip.hotelOptions[0].id);
            setLoading(false);
        }, 1500);
    }, []);

    const handleBook = () => {
        setBookingStatus('booking');
        setTimeout(() => {
            setBookingStatus('confirmed');
        }, 2000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Plane className="text-brand-500 animate-pulse" size={20} />
                    </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-800 dark:text-white">Gemini Travel Agent</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mt-2">
                    Analyzing calendar for "{MOCK_CALENDAR_EVENT.title}"...<br />
                    Checking loyalty status (Delta Gold, Marriott Platinum)...<br />
                    Finding flights D-1 / D+1...
                </p>
            </div>
        );
    }

    if (bookingStatus === 'confirmed') {
        return (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-emerald-500/20 p-8 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Trip Confirmed!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Your itinerary for <strong>{MOCK_CALENDAR_EVENT.title}</strong> has been booked.
                </p>
                <div className="flex flex-col gap-2 max-w-sm mx-auto text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-900 p-4 rounded-lg">
                    <div className="flex justify-between"><span>Confirmation:</span> <span className="font-mono font-bold">XC-9921</span></div>
                    <div className="flex justify-between"><span>E-Ticket sent to:</span> <span className="font-medium">user@ana.com</span></div>
                    <div className="flex justify-between"><span>Calendar:</span> <span className="text-emerald-600">Updated</span></div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">

            {/* Left Panel: Proposal Overview */}
            <div className="lg:col-span-2 space-y-6">

                {/* Context Card */}
                <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <Calendar size={16} />
                            <span className="text-sm font-medium">Detected Calendar Event</span>
                        </div>
                        <h2 className="text-2xl font-bold">{MOCK_CALENDAR_EVENT.title}</h2>
                        <div className="flex items-center gap-2 mt-1 opacity-90 text-sm">
                            <MapPin size={14} /> {MOCK_CALENDAR_EVENT.location}
                            <span className="mx-1">•</span>
                            {new Date(MOCK_CALENDAR_EVENT.startDate).toLocaleDateString()} - {new Date(MOCK_CALENDAR_EVENT.endDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 text-sm font-medium">
                        Gemini Concierge
                    </div>
                </div>

                {/* Flight Selection */}
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-dark-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50">
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Plane className="text-brand-500" size={18} /> Recommended Flights
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Delta Gold Applied
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-dark-700">
                        {/* Outbound */}
                        <div className="p-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Outbound • D-1 (Arrival Day Before)</div>
                            <div className="space-y-3">
                                {proposal?.flightOptions.outbound.map(flight => (
                                    <div
                                        key={flight.id}
                                        onClick={() => setSelectedOutbound(flight.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedOutbound === flight.id
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                                                : 'border-slate-200 dark:border-dark-600 hover:border-brand-300 dark:hover:border-brand-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold font-mono">
                                                {flight.airline.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white">{new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-xs text-slate-500">{flight.airline} • {flight.duration} • Non-stop</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-800 dark:text-white">${flight.price}</div>
                                            <div className="text-xs text-slate-400 capitalize">{flight.cabin}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Return */}
                        <div className="p-4 bg-slate-50/50 dark:bg-dark-900/20">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Return • D+1 (Departure Day After)</div>
                            <div className="space-y-3">
                                {proposal?.flightOptions.return.map(flight => (
                                    <div
                                        key={flight.id}
                                        onClick={() => setSelectedReturn(flight.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedReturn === flight.id
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                                                : 'border-slate-200 dark:border-dark-600 hover:border-brand-300 dark:hover:border-brand-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold font-mono">
                                                {flight.airline.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white">{new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-xs text-slate-500">{flight.airline} • {flight.duration} • Non-stop</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-800 dark:text-white">${flight.price}</div>
                                            <div className="text-xs text-slate-400 capitalize">{flight.cabin}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hotel Selection */}
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-dark-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50">
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Hotel className="text-purple-500" size={18} /> Recommended Hotels
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full flex items-center gap-1">
                            <Shield size={10} /> 10 Mile Rule Applied
                        </span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proposal?.hotelOptions.map(hotel => (
                            <div
                                key={hotel.id}
                                onClick={() => setSelectedHotel(hotel.id)}
                                className={`block rounded-lg border overflow-hidden cursor-pointer transition-all ${selectedHotel === hotel.id
                                        ? 'border-purple-500 ring-1 ring-purple-500'
                                        : 'border-slate-200 dark:border-dark-600 hover:border-purple-300'
                                    }`}
                            >
                                <div className="h-24 bg-slate-200 w-full relative">
                                    {hotel.imageUrl && <img src={hotel.imageUrl} className="w-full h-full object-cover" alt={hotel.name} />}
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                                        <Star size={8} className="mr-1 text-yellow-400 fill-yellow-400" /> {hotel.rating.toFixed(1)}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{hotel.name}</h4>
                                    <p className="text-xs text-slate-500 mb-2 truncate">{hotel.address}</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                {hotel.distanceFromWork <= 2 ? 'Next to Job Site' : `${hotel.distanceFromWork.toFixed(1)}mi from Job`}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {hotel.distanceFromAirport.toFixed(1)}mi from Airport
                                            </div>
                                        </div>
                                        <div className="text-right font-bold text-slate-800 dark:text-white">
                                            ${hotel.pricePerNight}<span className="text-xs font-normal text-slate-400">/nt</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Itinerary Summary */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-slate-200 dark:border-dark-700 p-6 sticky top-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Trip Summary</h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Dates</span>
                            <span className="font-medium text-slate-800 dark:text-white">Apr 14 - Apr 18</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Destination</span>
                            <span className="font-medium text-slate-800 dark:text-white">Austin, TX</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Traveler</span>
                            <span className="font-medium text-slate-800 dark:text-white">Devon Warren</span>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-dark-700 my-2"></div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Flight (Out)</span>
                            <span className="font-medium text-slate-800 dark:text-white">$325.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Flight (Ret)</span>
                            <span className="font-medium text-slate-800 dark:text-white">$289.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Hotel (3 nts)</span>
                            <span className="font-medium text-slate-800 dark:text-white">$435.00</span>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-dark-700 my-2"></div>
                        <div className="flex justify-between text-lg font-bold">
                            <span className="text-slate-800 dark:text-white">Total</span>
                            <span className="text-brand-600 dark:text-brand-400">$1,049.00</span>
                        </div>
                    </div>

                    <button
                        onClick={handleBook}
                        disabled={bookingStatus === 'booking'}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {bookingStatus === 'booking' ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                        Confirm Booking
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-3">
                        Includes corporate travel insurance. <br />
                        Expenses will be auto-generated.
                    </p>
                </div>

                {/* Profile Status */}
                <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Loyalty Applied</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Delta SkyMiles</span>
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/50">Gold</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Marriott Bonvoy</span>
                            <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded border border-slate-500/50">Platinum</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Hertz Gold</span>
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/50">President</span>
                        </div>
                    </div>
                    <button className="w-full mt-4 py-2 border border-white/20 hover:bg-white/10 rounded-lg text-sm transition-colors">
                        Manage Programs
                    </button>
                </div>
            </div>

        </div>
    );
};

export default GeminiTravelConcierge;
