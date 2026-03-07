import React, { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Menu,
  X,
  BookOpen,
  MessageSquare,
  Sun,
  Moon,
  RefreshCw,
  Users,
  Activity,
  Upload,
  MapPin,
  Receipt,
  LogOut,
  Shield,
  Settings,
  Gauge,
  Plane,
  Zap
} from 'lucide-react';
import { useTheme } from '../../App';
import { useAppContext } from '../../App';
import { useAuth, ROLE_LEVELS } from '../../contexts/AuthContext';
import RightPanel from './RightPanel';

const SidebarLink = ({ to, icon: Icon, label, onClick, badge }: { to: string, icon: any, label: string, onClick?: () => void, badge?: number }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1 group ${isActive
          ? 'bg-orange-500 text-white shadow-md'
          : 'text-navy-300 hover:bg-navy-800 hover:text-white'
        }`}
    >
      <Icon size={20} className={`${isActive ? 'text-white' : 'text-navy-400 group-hover:text-white'}`} />
      <span className="font-medium flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
          }`}>
          {badge}
        </span>
      )}
    </Link>
  );
};

const SidebarSection = ({ title, children }: { title: string, children: ReactNode }) => (
  <div className="mb-6">
    <p className="text-[10px] text-navy-500 font-semibold tracking-widest uppercase mb-2 px-4">{title}</p>
    {children}
  </div>
);

const Logo = () => {
  return (
    <div className="flex items-center gap-3 py-5 px-4">
      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
        <Activity size={24} className="text-white" />
      </div>
      <div>
        <h1 className="text-lg font-bold font-heading text-white">EnergyBoss</h1>
        <p className="text-[10px] text-navy-400">Support Command</p>
      </div>
    </div>
  );
};

const MobileLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
        <Activity size={18} className="text-white" />
      </div>
      <span className="font-bold font-heading text-white">EnergyBoss</span>
    </div>
  );
};

interface MainLayoutProps {
  children: ReactNode;
  rightPanelContent?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, rightPanelContent }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { syncSalesforce, isSyncing, currentUser } = useAppContext();
  const { signOut, profile, roleLevel } = useAuth();

  // Resolved display name/role — prefer live auth profile over mock currentUser
  const displayName = profile?.name ?? currentUser.name ?? 'Unknown User';
  const displayRole = profile?.role ?? currentUser.role;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const canAccess = (minLevel: number) => roleLevel >= minLevel;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-soft dark:bg-navy-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-900 text-white shadow-xl z-20 border-r border-navy-800">
        <div className="border-b border-navy-800">
          <Logo />
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <SidebarSection title="Fleet Intelligence">
            <SidebarLink to="/operations" icon={Zap} label="Operations Hub" />
            <SidebarLink to="/travel" icon={Plane} label="Travel.AI" />
          </SidebarSection>

          <SidebarSection title="Support Operations">
            <SidebarLink to="/tickets" icon={ClipboardList} label="Support Tickets" badge={47} />
            {canAccess(ROLE_LEVELS.Manager) && (
              <SidebarLink to="/customers" icon={Users} label="Customers" />
            )}
            <SidebarLink to="/units" icon={Package} label="Units" />
          </SidebarSection>

          <SidebarSection title="Platform">
            <SidebarLink to="/workflow" icon={Upload} label="Import Manager" badge={23} />
            <SidebarLink to="/expenses" icon={Receipt} label="Expenses" badge={5} />
          </SidebarSection>

          <SidebarSection title="Finance">
            <SidebarLink to="/expenses" icon={Receipt} label="Expenses" badge={5} />
          </SidebarSection>

          <SidebarSection title="Resources">
            <SidebarLink to="/tech-lounge" icon={MessageSquare} label="Team Hub" />
            <SidebarLink to="/resources" icon={BookOpen} label="Knowledge Base" />
          </SidebarSection>

          {canAccess(ROLE_LEVELS.Admin) && (
            <SidebarSection title="Administration">
              <SidebarLink to="/admin" icon={Shield} label="Admin Dashboard" />
            </SidebarSection>
          )}
        </nav>

        <div className="p-4 bg-navy-800 border-t border-navy-700">
          <div className="flex flex-col gap-4">
            {canAccess(ROLE_LEVELS.Manager) && (
              <button
                onClick={syncSalesforce}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Salesforce"}
              </button>
            )}

            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-navy-400 font-medium uppercase tracking-wider">Theme</span>
              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-full bg-navy-700 text-navy-300 hover:text-white hover:bg-navy-600 transition-colors"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <div className="pt-3 border-t border-navy-700">
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold shadow-lg text-white">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-navy-400 truncate">{displayRole}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-600 text-navy-300 hover:text-white text-xs font-bold py-2 rounded-lg transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-navy-900 text-white p-4 flex justify-between items-center shadow-md z-30 border-b border-navy-800">
          <MobileLogo />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-navy-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full h-[calc(100%-4rem)] bg-navy-900/98 backdrop-blur-md z-40 p-4 flex flex-col md:hidden">
            <nav className="flex-1 space-y-1">
              <SidebarLink to="/operations" icon={Zap} label="Operations Hub" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/travel" icon={Plane} label="Travel.AI" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="h-px bg-navy-700 my-3" />
              <div className="h-px bg-navy-700 my-3" />
              <SidebarLink to="/tickets" icon={ClipboardList} label="Support Tickets" badge={47} onClick={() => setIsMobileMenuOpen(false)} />
              {canAccess(ROLE_LEVELS.Manager) && (
                <SidebarLink to="/customers" icon={Users} label="Customers" onClick={() => setIsMobileMenuOpen(false)} />
              )}
              <SidebarLink to="/units" icon={Package} label="Units" onClick={() => setIsMobileMenuOpen(false)} />
              {canAccess(ROLE_LEVELS.Manager) && (
                <>
                  <div className="h-px bg-navy-700 my-3" />
                  <SidebarLink to="/workflow" icon={Upload} label="Import Manager" badge={23} onClick={() => setIsMobileMenuOpen(false)} />
                  <SidebarLink to="/analytics" icon={MapPin} label="Territory Analytics" onClick={() => setIsMobileMenuOpen(false)} />
                </>
              )}
              <div className="h-px bg-navy-700 my-3" />
              <SidebarLink to="/workflow" icon={Upload} label="Import Manager" badge={23} onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/expenses" icon={Receipt} label="Expenses" badge={5} onClick={() => setIsMobileMenuOpen(false)} />
              <div className="h-px bg-navy-700 my-3" />
              <SidebarLink to="/tech-lounge" icon={MessageSquare} label="Team Hub" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/admin" icon={Shield} label="Admin Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
            </nav>

            {canAccess(ROLE_LEVELS.Manager) && (
              <div className="pt-4 border-t border-navy-700">
                <button
                  onClick={() => { syncSalesforce(); setIsMobileMenuOpen(false); }}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Salesforce"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-soft dark:bg-navy-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Right Panel */}
      <RightPanel>
        {rightPanelContent}
      </RightPanel>
    </div>
  );
};

export default MainLayout;
