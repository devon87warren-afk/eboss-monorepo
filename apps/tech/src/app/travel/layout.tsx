'use client';

import { TravelSubNav } from '@/components/navigation/TravelSubNav';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function TravelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans">
            <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 p-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-widest text-white uppercase leading-none">
                            Travel.ai
                        </h1>
                        <span className="text-[10px] text-white/40 font-mono tracking-wider">
                            LOGISTICS MGMT
                        </span>
                    </div>
                </div>
                <TravelSubNav />
            </header>

            <main className="pb-32 px-4 pt-6">
                {children}
            </main>

            <BottomNav />
        </div>
    );
}
