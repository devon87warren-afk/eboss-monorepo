import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — mobile-first navigation wrapper.
 *
 * Mobile  (<768px): sticky Header + fixed BottomNav, no Sidebar
 * Desktop (≥768px): Sidebar (expandable), no Header / BottomNav
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Desktop sidebar — hidden on mobile via CSS in Sidebar component */}
      <Sidebar />

      {/* Page content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only top header */}
        <Header />

        {/* Main content — pb-20 matches BottomNav h-20 to avoid content hidden under it */}
        <main className="flex-1 overflow-hidden pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile-only bottom nav */}
      <BottomNav />
    </div>
  );
}

export default AppShell;
