'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Wrench,
  Map,
  Zap,
  Users,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'sticky top-0 z-50 hidden h-screen flex-col border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 md:flex',
        collapsed ? 'w-20' : 'w-64'
      )}
      aria-label="Desktop navigation"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-orange-500/20 bg-orange-600/10 px-4">
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image
            src="/brand/logos-ana/logo-icon.png"
            alt="EBOSS"
            fill
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <span className="ml-3 text-lg font-bold tracking-tighter text-white">
            EBOSS<span className="text-orange-500"> TECH</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto rounded p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {!collapsed && (
          <p className="px-3 pb-2 pt-4 font-mono text-xs font-medium uppercase tracking-widest text-slate-500">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? label : undefined}
              className={clsx(
                'group relative flex items-center rounded-sm px-3 py-2.5 text-sm font-medium transition-all hover:bg-white/5',
                isActive
                  ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Icon
                size={20}
                className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}
              />
              {!collapsed && <span className="ml-3">{label}</span>}
              {isActive && (
                <div className="absolute left-0 h-6 w-1 bg-orange-400 shadow-[0_0_10px_#f97316]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
            <span className="text-xs font-bold">JD</span>
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">John Doe</p>
                <p className="font-mono text-xs text-orange-500">FIELD_LEVEL_3</p>
              </div>
              <button
                className="ml-auto text-slate-500 hover:text-white"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
