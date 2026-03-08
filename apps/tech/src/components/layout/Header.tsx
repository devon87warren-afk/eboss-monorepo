'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Commissioning',
  '/map': 'Map',
  '/units': 'Units',
  '/contacts': 'Contacts',
  '/profile': 'Profile',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match dynamic segments (e.g. /map/123 → Map)
  const base = '/' + pathname.split('/')[1];
  return PAGE_TITLES[base] ?? 'EBOSS';
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#09090b]/95 px-4 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-3">
        <div className="relative h-7 w-7 flex-shrink-0">
          <Image
            src="/brand/logos-ana/logo-icon.png"
            alt="EBOSS"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          EBOSS <span className="text-orange-500">TECH</span>
        </span>
      </div>
      <span className="text-sm font-semibold text-white" data-testid="header-title">
        {title}
      </span>
    </header>
  );
}

export default Header;
