'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATEGORIES = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', href: '/travel' },
    { id: 'ai', label: 'Gemini AI', icon: 'auto_awesome', href: '/travel/ai' },
    { id: 'comms', label: 'Comms', icon: 'chat_bubble', href: '/travel/comms' },
    { id: 'bookings', label: 'Bookings', icon: 'hotel', href: '/travel/bookings' },
    { id: 'concur', label: 'Concur', icon: 'receipt_long', href: '/travel/concur' },
    { id: 'logistics', label: 'Tickets', icon: 'local_shipping', href: '/travel/logistics' },
];

export function TravelSubNav() {
    const pathname = usePathname();

    return (
        <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-none snap-x">
            {CATEGORIES.map((cat) => {
                const isActive = pathname === cat.href;
                return (
                    <Link
                        key={cat.id}
                        href={cat.href}
                        className={`flex flex-col items-center justify-center min-w-[80px] h-[72px] rounded-xl border transition-all snap-start ${isActive
                                ? 'bg-red-500/10 border-red-500/50 text-red-500'
                                : 'bg-[#121214] border-white/5 text-white/40 hover:text-white/60'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl mb-1">{cat.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
