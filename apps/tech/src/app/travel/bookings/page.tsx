'use client';

import { ExternalConnector } from '@/components/travel/ExternalConnector';

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <ExternalConnector
                    name="Google Flights"
                    url="https://www.google.com/flights"
                    status="online"
                    desc="Real-time flight data for optimization."
                    icon="flight_takeoff"
                />
                <ExternalConnector
                    name="Hilton Honors"
                    url="#"
                    status="pending"
                    desc="Preferred rates for tech deployment."
                    icon="hotel"
                />
                <ExternalConnector
                    name="Rental Connect"
                    url="#"
                    status="online"
                    desc="Hertz/Enterprise fleet reservations."
                    icon="directions_car"
                />
            </div>

            <section className="bg-[#121214] border border-white/10 rounded-xl p-8 text-center opacity-50">
                <span className="material-symbols-outlined text-white/20 text-5xl mb-4">luggage</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">No Active Bookings</h4>
                <p className="text-[10px] text-white/20 font-mono mt-1">Scan itinerary to auto-sync travel assets.</p>
            </section>
        </div>
    );
}
