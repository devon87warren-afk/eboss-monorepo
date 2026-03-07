'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: 'grid_view', label: 'Fleet' },
  { href: '/monitor', icon: 'wysiwyg', label: 'Monitor' },
  { href: '/logs', icon: 'history', label: 'Logs' },
  { href: '/config', icon: 'settings', label: 'Config' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#09090b]/95 backdrop-blur-xl border-t border-white/10 px-6 flex items-start pt-3 justify-between z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
          >
            <span
              className={`material-symbols-outlined ${isActive ? 'fill-current' : ''}`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
