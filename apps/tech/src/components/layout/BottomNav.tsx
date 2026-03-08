'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, Map, Zap, Users, User } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: Wrench, label: 'Commissioning' },
  { href: '/map', icon: Map, label: 'Map' },
  { href: '/units', icon: Zap, label: 'Units' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-start justify-around border-t border-white/10 bg-[#09090b]/95 px-2 pt-3 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === '/' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
              isActive
                ? 'text-orange-400'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Icon
              size={22}
              className={isActive ? 'text-orange-400' : 'text-white/40'}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
